import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getDataWithToken } from '../apis/ApiCallFun';
import type { RootState } from './store';

// ── Types ──────────────────────────────────────────────────────────────────
export interface StatusBreakdown {
  active: number;
  inactive: number;
  suspended: number;
  total: number;
}

export interface CityItem {
  city: string;
  count: number;
  percentage: number;
}

export interface StatPoint {
  label: string;
  devices: number;
  users?: number;
}

export interface MonthlyPoint {
  month: string;
  count: number;
}

export interface AdminInfo {
  adminId: string;
  name: string;
  email: string;
  status: string;
}

export interface Summary {
  totalCustomers?: number;
  totalOrders?: number;
  totalDevices?: number;
  totalAdmins?: number;
  userStatus?: StatusBreakdown;
  adminStatus?: StatusBreakdown;
  accountStatus?: string;
  activeDevices?: number;
  inactiveDevices?: number;
  admin?: AdminInfo | null;
}

export interface SubscriptionDevice {
  _id: string;
  deviceName: string;
  serialNo: string;
  companyName: string;
  city?: string;
  deviceModel?: string;
  currentStatus?: string;
  adminFirstName?: string;
  adminlastName?: string;
  subscription: {
    status: string;
    subStartDate?: string;
    subEndDate?: string;
    note?: string;
    disabledReason?: string;
  };
}

export interface SubscriptionCounts {
  total: number;
  active: number;
  trial: number;
  expired: number;
  disabled: number;
  free: number;
  expiringSoon7: number;
  expiringThisMonth: number;
}

export interface SubscriptionAnalytics {
  counts: SubscriptionCounts;
  expiringSoon: SubscriptionDevice[];
  expiringThisMonth: SubscriptionDevice[];
  expired: SubscriptionDevice[];
  recentlyActivated: SubscriptionDevice[];
  disabled: SubscriptionDevice[];
}

export interface AnalyticsState {
  summary: Summary | null;
  monthlyUsers: MonthlyPoint[];
  statistics: StatPoint[];
  customerDemographic: CityItem[];
  devicesByCity: CityItem[];
  subscriptionAnalytics: SubscriptionAnalytics | null;
  period: 'monthly' | 'quarterly' | 'annually';
  loading: boolean;
  error: string | null;
}

// ── Initial state ──────────────────────────────────────────────────────────
const initialState: AnalyticsState = {
  summary: null,
  monthlyUsers: [],
  statistics: [],
  customerDemographic: [],
  devicesByCity: [],
  subscriptionAnalytics: null,
  period: 'annually',
  loading: false,
  error: null,
};

// ── Thunk ──────────────────────────────────────────────────────────────────
export const fetchAnalytics = createAsyncThunk<
  Partial<AnalyticsState>,
  'monthly' | 'quarterly' | 'annually',
  { state: RootState; rejectValue: string }
>(
  'analytics/fetch',
  async (period, { getState, rejectWithValue }) => {
    try {
      const role = getState().auth.user?.role ?? 'user';

      const endpoint =
        role === 'superAdmin' ? `/analytics/superadmin?period=${period}` :
        role === 'admin'      ? `/analytics/admin?period=${period}`      :
                                `/analytics/user?period=${period}`;

      const res = await getDataWithToken<any>(endpoint);
      const payload = res?.data?.data ?? res?.data ?? res;

      return {
        summary:               payload.summary               ?? null,
        monthlyUsers:          payload.monthlyUsers          ?? payload.deviceTimeline ?? [],
        statistics:            payload.statistics            ?? [],
        customerDemographic:   payload.customerDemographic   ?? [],
        devicesByCity:         payload.devicesByCity         ?? [],
        subscriptionAnalytics: payload.subscriptionAnalytics ?? null,
      };
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to fetch analytics');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setPeriod(state, action: PayloadAction<'monthly' | 'quarterly' | 'annually'>) {
      state.period = action.payload;
    },
    resetAnalytics(): AnalyticsState {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, { payload }) => {
        state.loading                = false;
        state.summary                = payload.summary                ?? null;
        state.monthlyUsers           = payload.monthlyUsers           ?? [];
        state.statistics             = payload.statistics             ?? [];
        state.customerDemographic    = payload.customerDemographic    ?? [];
        state.devicesByCity          = payload.devicesByCity          ?? [];
        state.subscriptionAnalytics  = payload.subscriptionAnalytics  ?? null;
      })
      .addCase(fetchAnalytics.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload ?? 'Something went wrong';
      });
  },
});

export const { setPeriod, resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;