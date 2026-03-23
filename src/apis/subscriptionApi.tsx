import { getDataWithToken, postDataWithToken } from "./ApiCallFun";
import { store } from '../store/store';

const getAuthInfo = () => {
  const state = store.getState();
  return { id: state.auth.user?._id, role: state.auth.user?.role };
};

// Stats — admin scoped to their devices, superAdmin global
const getSubscriptionStats = async (): Promise<any> => {
  const { id, role } = getAuthInfo();
  const query = new URLSearchParams();
  if (role === 'admin' && id) query.set('adminId', id);
  return getDataWithToken<any>(`/subscription/stats?${query.toString()}`);
};

// Admin: their own devices only
const getAdminSubscriptionDevices = async (params?: {
  status?: string; search?: string; page?: number; limit?: number;
}): Promise<any> => {
  const { id } = getAuthInfo();
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page)   query.set('page',   String(params.page));
  if (params?.limit)  query.set('limit',  String(params.limit));
  return getDataWithToken<any>(`/subscription/admin/devices/${id}?${query.toString()}`);
};

// SuperAdmin: all devices
const getAllSubscriptionDevices = async (params?: {
  status?: string; search?: string; page?: number; limit?: number;
}): Promise<any> => {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page)   query.set('page',   String(params.page));
  if (params?.limit)  query.set('limit',  String(params.limit));
  return getDataWithToken<any>(`/subscription/all?${query.toString()}`);
};

// Update single device — both admin and superAdmin can call this
const updateSubscription = async (deviceId: string, formData: any): Promise<any> => {
  const { id, role } = getAuthInfo();
  return postDataWithToken<any>(`/subscription/device/update/${deviceId}`, {
    ...formData, role,
    ...(role === 'admin' ? { adminId: id } : {}),
  });
};

// Bulk update — admin scoped, superAdmin global
const bulkUpdateSubscription = async (
  deviceIds: string[], status: string, note?: string
): Promise<any> => {
  const { id, role } = getAuthInfo();
  return postDataWithToken<any>('/subscription/bulk-update', {
    deviceIds, status, role,
    ...(role === 'admin' ? { adminId: id } : {}),
    ...(note ? { note } : {}),
  });
};

export {
  getSubscriptionStats,
  getAdminSubscriptionDevices,
  getAllSubscriptionDevices,
  updateSubscription,
  bulkUpdateSubscription,
};