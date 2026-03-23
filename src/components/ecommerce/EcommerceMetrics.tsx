import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../store/hooks';
import {
  Users, Cpu, ShieldCheck, TrendingDown,
  AlertTriangle, X, Mail
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type Role = 'user' | 'admin' | 'superadmin';

// ── Inactive account modal ─────────────────────────────────────────────────
function InactiveAccountModal({ role }: { role: Role }) {
  if (role !== 'user' && role !== 'admin') return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden"
      >
        {/* Red top bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-400 via-rose-500 to-red-400" />

        <div className="p-8 text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Account Deactivated
          </h2>
          <p className="mt-1.5 text-sm text-gray-400 dark:text-gray-500">
            Your access has been temporarily suspended
          </p>

          <div className="my-6 h-px bg-gray-100 dark:bg-gray-800" />

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {role === 'user' ? (
              <>Contact your <span className="font-semibold text-gray-900 dark:text-white">Admin</span> to restore access.</>
            ) : (
              <>Contact <span className="font-semibold text-gray-900 dark:text-white">Super Admin</span> or{' '}
                <a href="mailto:support@deween.com" className="text-blue-500 hover:underline font-medium">
                  Deween Support
                </a>{' '}to reactivate.
              </>
            )}
          </p>

          <div className="mt-5 flex items-center gap-2 justify-center px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Access restricted until reactivated
            </p>
          </div>

          {role === 'admin' && (
            <a href="mailto:support@deween.com"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
              <Mail className="w-4 h-4" />
              Email Support
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Metric card ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  '👥': <Users className="w-5 h-5" />,
  '📱': <Cpu className="w-5 h-5" />,
  '🛡️': <ShieldCheck className="w-5 h-5" />,
  '🚫': <TrendingDown className="w-5 h-5" />,
};

const COLOR_MAP: Record<string, string> = {
  '👥': 'from-blue-500 to-indigo-600',
  '📱': 'from-violet-500 to-purple-600',
  '🛡️': 'from-emerald-500 to-teal-600',
  '🚫': 'from-rose-500 to-red-600',
};

const METRICS_BY_ROLE: Record<Role, { label: string; key: string; icon: string; nested?: string }[]> = {
  user: [
    { label: 'Total Devices',  key: 'totalDevices',  icon: '📱' },
    { label: 'Active Devices', key: 'activeDevices', icon: '👥' },
  ],
  admin: [
    { label: 'Total Customers', key: 'totalCustomers', icon: '👥' },
    { label: 'Total Devices',   key: 'totalDevices',   icon: '📱' },
    { label: 'Inactive Users',  key: 'userStatus',     icon: '🚫', nested: 'inactive' },
  ],
  superadmin: [
    { label: 'Total Customers',    key: 'totalCustomers', icon: '👥' },
    { label: 'Total Devices',      key: 'totalDevices',   icon: '📱' },
    { label: 'Total Admins',       key: 'totalAdmins',    icon: '🛡️' },
    { label: 'Inactive Customers', key: 'userStatus',     icon: '🚫', nested: 'inactive' },
  ],
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
      <div className="mt-4 h-8 w-20 rounded-lg bg-gray-100 dark:bg-gray-800" />
      <div className="mt-2 h-4 w-28 rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function EcommerceMetrics() {
  const summary = useAppSelector((s) => s.analytics.summary);
  const loading = useAppSelector((s) => s.analytics.loading);
  const subAnalytics = useAppSelector((s) => s.analytics.subscriptionAnalytics);
  const role    = (useAppSelector((s) => s.auth.user?.role)?.toLowerCase() ?? 'user') as Role;
  const status  = useAppSelector((s) => s.auth.user?.status)?.toLowerCase() ?? '';

  const isInactive = status === 'inactive' && (role === 'user' || role === 'admin');
  const metrics    = METRICS_BY_ROLE[role] ?? METRICS_BY_ROLE.user;

  const getValue = (m: typeof metrics[number]): number => {
    const base = summary?.[m.key as keyof typeof summary];
    if (m.nested && base && typeof base === 'object') {
      return ((base as unknown) as Record<string, number>)[m.nested] ?? 0;
    }
    return (base as number) ?? 0;
  };

  const subCounts = subAnalytics?.counts;

  return (
    <>
      <AnimatePresence>
        {isInactive && <InactiveAccountModal role={role} />}
      </AnimatePresence>

      {/* ── Main metric cards ──────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {metrics.map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="group relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Subtle gradient glow on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${COLOR_MAP[m.icon]}`} />

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[m.icon]} flex items-center justify-center text-white shadow-md`}>
                {ICON_MAP[m.icon]}
              </div>

              <h4 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white/90 tabular-nums">
                {getValue(m).toLocaleString()}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{m.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Subscription status strip ──────────────────────────────────── */}
      {!loading && subCounts && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {[
            { label: 'Active Subs',       value: subCounts.active,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30' },
            { label: 'Trial',             value: subCounts.trial,    color: 'text-amber-600   dark:text-amber-400',   bg: 'bg-amber-50   dark:bg-amber-900/20   border-amber-100   dark:border-amber-800/30'   },
            { label: 'Expired',           value: subCounts.expired,  color: 'text-red-600     dark:text-red-400',     bg: 'bg-red-50     dark:bg-red-900/20     border-red-100     dark:border-red-800/30'     },
            { label: 'Disabled',          value: subCounts.disabled, color: 'text-slate-500   dark:text-slate-400',   bg: 'bg-slate-50   dark:bg-slate-800/40   border-slate-100   dark:border-slate-700'      },
            { label: 'Expiring ≤7 days',  value: subCounts.expiringSoon7,      color: 'text-orange-600  dark:text-orange-400',  bg: 'bg-orange-50  dark:bg-orange-900/20  border-orange-100  dark:border-orange-800/30', urgent: subCounts.expiringSoon7 > 0 },
            { label: 'Expiring This Month', value: subCounts.expiringThisMonth, color: 'text-violet-600  dark:text-violet-400',  bg: 'bg-violet-50  dark:bg-violet-900/20  border-violet-100  dark:border-violet-800/30' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className={`relative rounded-xl border px-3 py-3 ${s.bg} ${s.urgent ? 'ring-1 ring-orange-300 dark:ring-orange-700' : ''}`}
            >
              {s.urgent && s.value > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{s.value}</span>
                </span>
              )}
              <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-tight">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Expiring / Expired device alerts ──────────────────────────── */}
      {!loading && subAnalytics && (subAnalytics.expiringSoon.length > 0 || subAnalytics.expired.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Expiring soon panel */}
          {subAnalytics.expiringSoon.length > 0 && (
            <div className="rounded-2xl border border-orange-100 dark:border-orange-800/30 bg-orange-50/60 dark:bg-orange-900/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-orange-100 dark:border-orange-800/30">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  ⚠️ Expiring within 7 days — {subAnalytics.expiringSoon.length} device{subAnalytics.expiringSoon.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-orange-100 dark:divide-orange-900/30 max-h-48 overflow-y-auto">
                {subAnalytics.expiringSoon.map((dev) => {
                  const days = dev.subscription.subEndDate
                    ? Math.ceil((new Date(dev.subscription.subEndDate).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <div key={dev._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-orange-100/40 dark:hover:bg-orange-900/20 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{dev.deviceName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{dev.serialNo} · {dev.companyName}</p>
                      </div>
                      <span className={`ml-3 flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                        days !== null && days <= 3
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      }`}>
                        {days !== null && days >= 0 ? `${days}d` : 'Today'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expired devices panel */}
          {subAnalytics.expired.length > 0 && (
            <div className="rounded-2xl border border-red-100 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-100 dark:border-red-800/30">
                <X className="w-3.5 h-3.5 text-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Expired subscriptions — {subAnalytics.expired.length} device{subAnalytics.expired.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-red-100 dark:divide-red-900/30 max-h-48 overflow-y-auto">
                {subAnalytics.expired.map((dev) => (
                  <div key={dev._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-red-100/40 dark:hover:bg-red-900/20 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{dev.deviceName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{dev.serialNo} · {dev.companyName}</p>
                    </div>
                    <span className="ml-3 flex-shrink-0 text-xs font-medium text-red-400 dark:text-red-500">
                      {dev.subscription.subEndDate
                        ? new Date(dev.subscription.subEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}