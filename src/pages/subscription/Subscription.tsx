import { useEffect, useState, useCallback, JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronLeft, ChevronRight, RefreshCw, Calendar,
  CheckCircle2, XCircle, Clock, AlertTriangle, Zap, Shield,
  Crown, Cpu, Edit3, Activity, Filter, ChevronDown, Bell
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from '../../store/hooks';
import {
  getSubscriptionStats,
  getAdminSubscriptionDevices,
  getAllSubscriptionDevices,
  updateSubscription,
  bulkUpdateSubscription,
} from '../../apis/subscriptionApi';

// ── Types ─────────────────────────────────────────────────────────────────
interface Subscription {
  status: 'free' | 'active' | 'expired' | 'disabled' | 'trial';
  subStartDate?: string;
  subEndDate?: string;
  lastRenewedAt?: string;
  nextRenewalDate?: string;
  note?: string;
  disabledReason?: string;
}
interface DeviceSub {
  _id: string;
  deviceName: string;
  serialNo: string;
  companyName: string;
  adminFirstName?: string;
  adminlastName?: string;
  make?: string;
  deviceModel?: string;
  city?: string;
  address?: string;
  lat?: string;
  long?: string;
  installationData?: string;
  mapShow?: boolean;
  emailNoti?: boolean;
  timeIntervelSet?: string;
  decimalPoints?: string;
  dataYmax?: string;
  dataWithPlatform?: string;
  consumptionShow?: boolean;
  consumptionValue?: string;
  dataParameter?: string;
  dataParameterTitle?: string;
  subscription: Subscription;
  currentStatus?: string;
  createdAt?: string;
}
interface Stats {
  total: number;
  expiringSoon: number;
  expiringThisMonth: number;
  expiringSoonDevices: DeviceSub[];
  byStatus: { _id: string; count: number }[];
}

// ── Config ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; tw: string; dot: string; icon: JSX.Element }> = {
  active:   { label: 'Active',   dot: 'bg-green-500',  icon: <CheckCircle2 size={12}/>, tw: 'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400  border-green-200  dark:border-green-800/40'  },
  trial:    { label: 'Trial',    dot: 'bg-amber-500',  icon: <Clock size={12}/>,        tw: 'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-800/40'  },
  free:     { label: 'Free',     dot: 'bg-indigo-500', icon: <Zap size={12}/>,          tw: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40' },
  expired:  { label: 'Expired',  dot: 'bg-red-500',    icon: <XCircle size={12}/>,      tw: 'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400    border-red-200    dark:border-red-800/40'    },
  disabled: { label: 'Disabled', dot: 'bg-slate-400',  icon: <Shield size={12}/>,       tw: 'bg-slate-100  dark:bg-slate-800/60  text-slate-600  dark:text-slate-400  border-slate-200  dark:border-slate-700'     },
};
const STATUS_OPTIONS = ['free', 'active', 'expired', 'disabled', 'trial'] as const;
const LIMIT = 15;

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysUntil = (d?: string): number | null => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

const isExpiringSoon = (sub: Subscription) => {
  if (!sub?.subEndDate || sub.status !== 'active') return false;
  const diff = new Date(sub.subEndDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
};

const currentMonthLabel = () =>
  new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

// ─────────────────────────────────────────────────────────────────────────
const SubscriptionManager = (): JSX.Element => {
  const authUser     = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = authUser?.role === 'superAdmin';
  // ✅ Both admin and superAdmin can edit
  const canEdit      =  authUser?.role === 'superAdmin';
//   const canEdit      = authUser?.role === 'admin' || authUser?.role === 'superAdmin';

  const [devices, setDevices]                 = useState<DeviceSub[]>([]);
  const [stats, setStats]                     = useState<Stats | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [statsLoading, setStatsLoading]       = useState(true);
  const [search, setSearch]                   = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [total, setTotal]                     = useState(0);
  const [editDevice, setEditDevice]           = useState<DeviceSub | null>(null);
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus]           = useState('');
  const [showBulkMenu, setShowBulkMenu]       = useState(false);
  const [showExpiringPanel, setShowExpiringPanel] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: statusFilter, search, page, limit: LIMIT };
      const res = isSuperAdmin
        ? await getAllSubscriptionDevices(params)
        : await getAdminSubscriptionDevices(params);
      if (res.success) {
        setDevices(res.data.devices ?? []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
        setTotal(res.data.pagination?.total ?? 0);
      } else {
        toast.error(res.message || 'Failed to fetch devices');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, statusFilter, search, page]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getSubscriptionStats();
      if (res.success) setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);
  useEffect(() => { fetchStats(); },  [fetchStats]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSaveEdit = async (subForm: Partial<Subscription>, deviceForm: Partial<DeviceSub>) => {
    if (!editDevice) return;
    try {
      const res = await updateSubscription(editDevice._id, { subscription: subForm, ...deviceForm });
      if (res.success) {
        toast.success('Subscription updated successfully');
        setEditDevice(null); fetchDevices(); fetchStats();
      } else { toast.error(res.message || 'Failed to update'); }
    } catch { toast.error('Failed to update subscription'); }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    try {
      const res = await bulkUpdateSubscription([...selectedIds], bulkStatus);
      if (res.success) {
        toast.success(`${selectedIds.size} device(s) updated to "${bulkStatus}"`);
        setSelectedIds(new Set()); setBulkStatus(''); setShowBulkMenu(false);
        fetchDevices(); fetchStats();
      } else { toast.error(res.message || 'Bulk update failed'); }
    } catch { toast.error('Bulk update failed'); }
  };

  const toggleSelect    = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
   
  const statCount       = (key: string) => stats?.byStatus.find(s => s._id === key)?.count ?? 0;

  // ── Filter buttons config (includes Expiring This Month) ──────────────
  const filterButtons = [
    { key: 'all',            label: 'All' },
    { key: 'active',         label: STATUS_CONFIG.active.label },
    { key: 'trial',          label: STATUS_CONFIG.trial.label },
    { key: 'expired',        label: STATUS_CONFIG.expired.label },
    { key: 'disabled',       label: STATUS_CONFIG.disabled.label },
    { key: 'free',           label: STATUS_CONFIG.free.label },
    { key: 'expiring_month', label: `⏳ Expiring in ${currentMonthLabel()}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="text-indigo-600 dark:text-indigo-400" size={30} />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Subscription Manager
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isSuperAdmin ? `All devices across all admins` : `Your devices only`} · {total} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bell: expiring soon within 7 days */}
            {!statsLoading && (stats?.expiringSoon ?? 0) > 0 && (
              <button onClick={() => setShowExpiringPanel(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 rounded-xl font-semibold text-sm hover:bg-orange-100 transition-all shadow">
                <Bell size={15} className="animate-bounce" />
                {stats?.expiringSoon} expiring soon
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {stats?.expiringSoon}
                </span>
              </button>
            )}
            <button onClick={() => { fetchDevices(); fetchStats(); }}
              className="group px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium shadow hover:shadow-md transition-all flex items-center gap-2 hover:border-indigo-300">
              <RefreshCw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────── */}
        {!statsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total',              value: stats?.total ?? 0,              gradient: 'from-blue-500 to-indigo-600',  icon: <Cpu size={20}/>,            clickFilter: 'all' },
              { label: 'Active',             value: statCount('active'),            gradient: 'from-green-500 to-teal-600',   icon: <CheckCircle2 size={20}/>,   clickFilter: 'active' },
              { label: 'Trial',              value: statCount('trial'),             gradient: 'from-amber-500 to-orange-500', icon: <Clock size={20}/>,          clickFilter: 'trial' },
              { label: 'Expired',            value: statCount('expired'),           gradient: 'from-red-500 to-rose-600',     icon: <XCircle size={20}/>,        clickFilter: 'expired' },
              { label: 'Expiring This Month',value: stats?.expiringThisMonth ?? 0, gradient: 'from-orange-500 to-amber-500', icon: <AlertTriangle size={20}/>,  clickFilter: 'expiring_month' },
              { label: 'Disabled',           value: statCount('disabled'),          gradient: 'from-slate-500 to-gray-600',   icon: <Shield size={20}/>,         clickFilter: 'disabled' },
            ].map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => { setStatusFilter(s.clickFilter); setPage(1); }}
                className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border rounded-2xl p-4 flex items-center gap-3 shadow hover:shadow-md transition-all cursor-pointer ${
                  statusFilter === s.clickFilter
                    ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                }`}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{s.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Main Panel ─────────────────────────────────────────────── */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">

          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-3 items-center justify-between">

              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, serial, company, device ID…"
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>
                )}
              </div>

              {/* Filter pills — includes Expiring This Month */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter size={13} className="text-gray-400 flex-shrink-0" />
                {filterButtons.map(f => (
                  <button key={f.key} onClick={() => { setStatusFilter(f.key); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                      statusFilter === f.key
                        ? f.key === 'expiring_month'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Bulk action */}
              {selectedIds.size > 0 && canEdit && (
                <div className="relative">
                  <button onClick={() => setShowBulkMenu(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl text-indigo-700 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-100 transition-all">
                    <Activity size={13} /> Bulk ({selectedIds.size}) <ChevronDown size={12} />
                  </button>
                  <AnimatePresence>
                    {showBulkMenu && (
                      <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className="absolute right-0 top-10 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Set Status</p>
                        </div>
                        {STATUS_OPTIONS.map(s => (
                          <button key={s} onClick={() => setBulkStatus(s)}
                            className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors ${bulkStatus === s ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                          <button onClick={handleBulkUpdate} disabled={!bulkStatus}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md transition-all">
                            Apply to {selectedIds.size} device{selectedIds.size > 1 ? 's' : ''}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Active filter indicator */}
            {statusFilter === 'expiring_month' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40 rounded-lg px-3 py-2">
                <AlertTriangle size={14} />
                Showing {total} device{total !== 1 ? 's' : ''} with subscriptions expiring in {currentMonthLabel()}
                <button onClick={() => setStatusFilter('all')} className="ml-auto text-orange-400 hover:text-orange-600"><X size={13} /></button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">Loading...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-3">{statusFilter === 'expiring_month' ? '✅' : '📭'}</div>
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                  {statusFilter === 'expiring_month' ? `No devices expiring in ${currentMonthLabel()}` : 'No devices found'}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    
                    {['Device', 'Company', 'Status', 'Start Date', 'End Date', 'Next Renewal', 'Days Left', 'Note', 'Edit'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <AnimatePresence>
                    {devices.map((dev, i) => {
                      const sub        = dev.subscription ?? {} as Subscription;
                      const sc         = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG['trial'];
                      const warning    = isExpiringSoon(sub);
                      const days       = daysUntil(sub.subEndDate);
                      const isSelected = selectedIds.has(dev._id);

                      return (
                        <motion.tr key={dev._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 ${isSelected ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''} ${warning ? 'border-l-2 border-l-orange-400' : ''}`}>

                          <td className="px-4 py-3.5">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(dev._id)}
                              className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                          </td>

                          {/* Device */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800/40">
                                <Cpu size={15} className="text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                                  {dev.deviceName}
                                  {warning && <span title="Expiring within 7 days"><AlertTriangle size={12} className="text-orange-500" /></span>}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{dev.serialNo}</p>
                              </div>
                            </div>
                          </td>

                          {/* Company */}
                          <td className="px-4 py-3.5">
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{dev.companyName}</p>
                            {dev.adminFirstName && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">{dev.adminFirstName} {dev.adminlastName}</p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.tw}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </td>

                          {/* Dates */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar size={10} />{fmt(sub.subStartDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`flex items-center gap-1 text-xs ${warning ? 'text-orange-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                              <Calendar size={10} />{fmt(sub.subEndDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                            {fmt(sub.nextRenewalDate)}
                          </td>

                          {/* Days Left */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {days !== null && sub.status === 'active' ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                days <= 3  ? 'bg-red-100    dark:bg-red-900/30    text-red-600    dark:text-red-400' :
                                days <= 7  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                days <= 30 ? 'bg-amber-100  dark:bg-amber-900/30  text-amber-600  dark:text-amber-400' :
                                             'bg-green-100  dark:bg-green-900/30  text-green-600  dark:text-green-400'
                              }`}>
                                {days > 0 ? `${days}d` : 'Today'}
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                            )}
                          </td>

                          {/* Note */}
                          <td className="px-4 py-3.5 max-w-[120px]">
                            {sub.note ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded-md inline-block truncate max-w-full border border-gray-200 dark:border-gray-600">
                                {sub.note}
                              </span>
                            ) : null}
                          </td>

                          {/* Edit — both admin and superAdmin */}
                          <td className="px-4 py-3.5 text-right">
                            {canEdit ? (
                              <button onClick={() => setEditDevice(dev)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 rounded-lg text-xs font-semibold hover:bg-indigo-100 hover:shadow-sm transition-all">
                                <Edit3 size={11} /> Edit
                              </button>
                            ) : null}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page <span className="font-semibold text-gray-700 dark:text-gray-300">{page}</span> of {totalPages} · {total} devices
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-300 transition-all">
                  <ChevronLeft size={14} /> Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-300 transition-all">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Expiring Soon Side Panel (within 7 days) ──────────────────── */}
      <AnimatePresence>
        {showExpiringPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowExpiringPanel(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col">

              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <AlertTriangle size={20} /> Expiring Within 7 Days
                    </h3>
                    <p className="text-orange-100 text-sm mt-0.5">
                      {stats?.expiringSoon} device{(stats?.expiringSoon ?? 0) > 1 ? 's' : ''} need attention
                    </p>
                  </div>
                  <button onClick={() => setShowExpiringPanel(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(stats?.expiringSoonDevices ?? []).length === 0 ? (
                  <div className="text-center py-12 text-gray-400">No expiring devices</div>
                ) : (
                  (stats?.expiringSoonDevices ?? []).map(dev => {
                    const days = daysUntil(dev.subscription?.subEndDate);
                    return (
                      <div key={dev._id}
                        className={`p-4 rounded-xl border ${days !== null && days <= 3 ? 'border-red-200 dark:border-red-800/40 bg-red-50/60 dark:bg-red-900/10' : 'border-orange-200 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-900/10'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center flex-shrink-0 border border-orange-200 dark:border-orange-700/40">
                              <Cpu size={15} className="text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{dev.deviceName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{dev.serialNo}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{dev.companyName}</p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${days !== null && days <= 3 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                              {days !== null && days > 0 ? `${days}d left` : 'Today'}
                            </span>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{fmt(dev.subscription?.subEndDate)}</p>
                          </div>
                        </div>
                        {/* Quick edit for both admin and superAdmin */}
                        {canEdit && (
                          <button onClick={() => { setEditDevice(dev); setShowExpiringPanel(false); }}
                            className="mt-3 w-full py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-lg hover:bg-indigo-100 transition-all flex items-center justify-center gap-1">
                            <Edit3 size={11} /> Renew / Edit Subscription
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Modal — both admin and superAdmin */}
      <AnimatePresence>
        {editDevice && canEdit && (
          <EditSubscriptionModal device={editDevice} onClose={() => setEditDevice(null)} onSave={handleSaveEdit} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionManager;

// ─────────────────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────
interface EditModalProps {
  device: DeviceSub;
  onClose: () => void;
  onSave: (subForm: Partial<Subscription>, deviceForm: Partial<DeviceSub>) => Promise<void>;
}

const EditSubscriptionModal = ({ device, onClose, onSave }: EditModalProps): JSX.Element => {
  const sub     = device.subscription ?? {} as Subscription;
  const toInput = (d?: string) => d ? new Date(d).toISOString().split('T')[0] : '';

  const [subForm, setSubForm] = useState<Partial<Subscription>>({
    status:          sub.status,
    subStartDate:    toInput(sub.subStartDate),
    subEndDate:      toInput(sub.subEndDate),
    lastRenewedAt:   toInput(sub.lastRenewedAt),
    nextRenewalDate: toInput(sub.nextRenewalDate),
    note:            sub.note ?? '',
    disabledReason:  sub.disabledReason ?? '',
  });
  const [devForm, setDevForm] = useState<Partial<DeviceSub>>({
    deviceName:      device.deviceName ?? '',
    serialNo:        device.serialNo ?? '',
    companyName:     device.companyName ?? '',
    make:            device.make ?? '',
    deviceModel:     device.deviceModel ?? '',
    city:            device.city ?? '',
    address:         device.address ?? '',
    installationData: device.installationData ?? '',
    dataYmax:        device.dataYmax ?? '',
    dataWithPlatform: device.dataWithPlatform ?? 'none',
    consumptionValue: device.consumptionValue ?? '',
    dataParameter:   device.dataParameter ?? '',
    dataParameterTitle: device.dataParameterTitle ?? '',
    mapShow:         device.mapShow ?? true,
    emailNoti:       device.emailNoti ?? true,
    consumptionShow: device.consumptionShow ?? false,
  });
  const [activeTab, setActiveTab] = useState<'subscription' | 'device'>('subscription');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => { setSaving(true); await onSave(subForm, devForm); setSaving(false); };

  const dateField = (label: string, key: keyof Subscription) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <input type="date" value={(subForm[key] as string) ?? ''}
        onChange={e => setSubForm(p => ({ ...p, [key]: e.target.value }))}
        className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
    </div>
  );

  const subTextField = (label: string, key: keyof Subscription) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <input type="text" value={(subForm[key] as string) ?? ''}
        onChange={e => setSubForm(p => ({ ...p, [key]: e.target.value }))}
        className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
    </div>
  );

  const devTextField = (label: string, key: keyof DeviceSub) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <input type="text" value={(devForm[key] as string) ?? ''}
        onChange={e => setDevForm(p => ({ ...p, [key]: e.target.value }))}
        className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
    </div>
  );

  const devToggle = (label: string, key: keyof DeviceSub) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-600">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <button type="button" onClick={() => setDevForm(p => ({ ...p, [key]: !p[key] }))}
        className={`relative w-11 h-6 rounded-full transition-colors ${devForm[key] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${devForm[key] ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl bg-white dark:bg-gray-900"
        onClick={e => e.stopPropagation()}>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Edit3 size={18} /> Edit Subscription</h3>
              <p className="text-blue-100 text-sm mt-0.5">{device.deviceName} · {device.serialNo}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-5 pt-4 gap-1">
          {(['subscription', 'device'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-700 -mb-px'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {tab === 'subscription' ? '📋 Subscription' : '📡 Device Details'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-230px)] p-5 flex flex-col gap-5">

          {/* ── Subscription Tab ─────────────────────────────── */}
          {activeTab === 'subscription' && (<>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(s => {
                  const sc = STATUS_CONFIG[s]; const active = subForm.status === s;
                  return (
                    <button key={s} onClick={() => setSubForm(p => ({ ...p, status: s as Subscription['status'] }))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active ? sc.tw + ' shadow-sm scale-105' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:border-indigo-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? sc.dot : 'bg-gray-300 dark:bg-gray-600'}`} />
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dateField('Start Date',   'subStartDate')}
              {dateField('End Date',     'subEndDate')}
              {dateField('Last Renewed', 'lastRenewedAt')}
              {dateField('Next Renewal', 'nextRenewalDate')}
            </div>
            {subTextField('Note', 'note')}
            {subForm.status === 'disabled' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                {subTextField('Disabled Reason', 'disabledReason')}
              </motion.div>
            )}
          </>)}

          {/* ── Device Details Tab ───────────────────────────── */}
          {activeTab === 'device' && (<>
            <div className="grid grid-cols-2 gap-3">
              {devTextField('Device Name',   'deviceName')}
              {devTextField('Serial No',     'serialNo')}
              {devTextField('Make',          'make')}
              {devTextField('Device Model',  'deviceModel')}
              {devTextField('Company Name',  'companyName')}
              {devTextField('City',          'city')}
            </div>
            {devTextField('Address', 'address')}
            <div className="grid grid-cols-2 gap-3">
              {devTextField('Installation Date', 'installationData')}
              {devTextField('Data Ymax',         'dataYmax')}
              {devTextField('Data Parameter',    'dataParameter')}
              {devTextField('Parameter Title',   'dataParameterTitle')}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data With Platform</label>
              <select value={devForm.dataWithPlatform ?? 'none'}
                onChange={e => setDevForm(p => ({ ...p, dataWithPlatform: e.target.value }))}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all">
                <option value="none">None</option>
                <option value="send">Send</option>
                <option value="receive">Receive</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {devToggle('Show on Map',       'mapShow')}
              {devToggle('Email Notification','emailNoti')}
              {devToggle('Show Consumption',  'consumptionShow')}
            </div>
            {devForm.consumptionShow && devTextField('Consumption Value', 'consumptionValue')}
          </>)}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-[2] py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <>✅ Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};