import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Cpu, Database, List, CheckCircle,
  ExternalLink, User, Lock, Calendar, Clock,
  Activity, Link2, HardDrive, RefreshCw, Globe
} from "lucide-react";

interface DeviceLog {
  timestamp?: string;
  message?: string;
  success?: boolean;
  FlowMeterReading?: string | number;
  nextScheduledTime?: string;
  sentData?: Record<string, string | number | undefined>;
  responseData?: string | Record<string, unknown>;
  error?: string;
}

interface OtherData {
  otherLink?: string;
  userId?: string;
  password?: string;
  activeDate?: string;
}

interface Device {
  deviceName?: string;
  deviceId?: string;
  sendingPlace?: string;
  timeIntervelSet?: string;
  typeToConnect?: string;
  shareToOtherPlateform?: string;
  url?: string;
  ftpHost?: string;
  ftpPort?: number;
  ftpUser?: string;
  ftpPath?: string;
  keys?: Record<string, string | React.ReactNode>;
  values?: Record<string, string | number>;
  otherDataLogs?: DeviceLog[];
  otherData?: OtherData;
  createdAt?: string;
  updatedAt?: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        hour12: true, day: "2-digit", month: "short",
        year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

const InfoCard = ({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/60 border border-gray-100 dark:border-gray-600/50 hover:border-blue-200 dark:hover:border-blue-700/50 transition-all duration-200">
    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
      {icon}{label}
    </p>
    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm break-all leading-snug">
      {value ?? <span className="text-gray-300 dark:text-gray-600 font-normal">N/A</span>}
    </p>
  </div>
);

const SectionWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-10">{children}</div>
);

const SectionTitle = ({
  icon, title, right,
}: { icon: React.ReactNode; title: string; right?: React.ReactNode }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
      {icon}
    </span>
    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
    {right && <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{right}</span>}
  </div>
);

const getTypeIcon = (type?: string) => {
  if (type === "api")     return <Globe     size={13} />;
  if (type === "ftp")     return <HardDrive size={13} />;
  if (type === "receive") return <RefreshCw size={13} />;
  return <Link2 size={13} />;
};
// ─────────────────────────────────────────────────────────────────────────────

const ViewOtherSiteDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const device = location.state?.device as Device | undefined;

  // countdown state for auto-refresh
  const [countdown, setCountdown] = React.useState(30);

  React.useEffect(() => {
    const tick = setInterval(() => setCountdown(c => c - 1), 1000);
    const refresh = setInterval(() => navigate(0), 30000);
    return () => { clearInterval(tick); clearInterval(refresh); };
  }, [navigate]);

  if (!device) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400 text-base">
        No device data found.
      </div>
    );
  }

  const successLogs = device.otherDataLogs
    ? [...device.otherDataLogs].filter(l => l.success === true).reverse()
    : [];

  const hasOtherData = device.otherData &&
    Object.values(device.otherData).some(v => (v ?? "").trim() !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-start justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl">

        {/* ── Card ── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.07)] dark:shadow-[0_8px_48px_rgba(0,0,0,0.3)] overflow-hidden">

          {/* ── Top gradient bar ── */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400" />

          <div className="p-6 sm:p-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-700/60 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {device.deviceName || "Unnamed Device"}
                  </h2>
                  {/* Running / Stopped pill */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                    ${device.shareToOtherPlateform === "start"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${device.shareToOtherPlateform === "start" ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
                    {device.shareToOtherPlateform === "start" ? "Running" : "Stopped"}
                  </span>
                </div>

                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Device ID: <span className="font-medium text-gray-600 dark:text-gray-300">{device.deviceId || "N/A"}</span>
                </p>

                {/* Timestamps */}
                <div className="flex flex-wrap gap-4 pt-0.5">
                  {device.createdAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Calendar size={11} /> Created: {formatDate(device.createdAt)}
                    </p>
                  )}
                  {device.updatedAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Clock size={11} /> Updated: {formatDate(device.updatedAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Auto-refresh countdown pill */}
                <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  <RefreshCw size={11} className="animate-spin" style={{ animationDuration: "3s" }} />
                  Refresh in {countdown}s
                </span>
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-full transition"
                >
                  <ArrowLeft size={15} /> Back
                </button>
              </div>
            </div>

            {/* ── Device Overview ── */}
            <SectionWrap>
              <SectionTitle icon={<Cpu size={16} />} title="Device Overview" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <InfoCard label="Sending Place" value={device.sendingPlace} icon={<Activity size={11} />} />
                <InfoCard label="Interval"      value={device.timeIntervelSet} icon={<Clock size={11} />} />
                <InfoCard
                  label="Connection Type"
                  icon={getTypeIcon(device.typeToConnect)}
                  value={
                    <span className="uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {device.typeToConnect || "N/A"}
                    </span>
                  }
                />

                {/* API / Receive URL */}
                {(device.typeToConnect === "api" || device.typeToConnect === "receive") && device.url && (
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                    <p className="text-xs text-blue-400 dark:text-blue-500 mb-1 flex items-center gap-1">
                      <Globe size={11} />
                      {device.typeToConnect === "receive" ? "Receive URL" : "API URL"}
                    </p>
                    <a href={device.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                      {device.url}
                    </a>
                  </div>
                )}

                {/* FTP fields */}
                {device.typeToConnect === "ftp" && (
                  <>
                    <InfoCard label="FTP Host" value={device.ftpHost} icon={<HardDrive size={11} />} />
                    <InfoCard label="FTP Port" value={device.ftpPort} />
                    <InfoCard label="FTP User" value={device.ftpUser} icon={<User size={11} />} />
                    <InfoCard label="FTP Path" value={device.ftpPath} />
                  </>
                )}
              </div>
            </SectionWrap>

            {/* ── Other Reference Info ── */}
            {hasOtherData && (
              <SectionWrap>
                <SectionTitle icon={<ExternalLink size={16} />} title="Other Reference Info" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {device.otherData?.otherLink && (
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                      <p className="text-xs text-indigo-400 dark:text-indigo-500 mb-1 flex items-center gap-1">
                        <ExternalLink size={11} /> Platform / Destination Link
                      </p>
                      <a href={device.otherData.otherLink} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                        {device.otherData.otherLink}
                      </a>
                    </div>
                  )}
                  {device.otherData?.userId && (
                    <InfoCard label="User ID" value={device.otherData.userId} icon={<User size={11} />} />
                  )}
                  {device.otherData?.password && (
                    <InfoCard
                      label="Password"
                      icon={<Lock size={11} />}
                      value={<span className="tracking-widest text-gray-400">{ device.otherData.password }</span>}
                    />
                  )}
                  {device.otherData?.activeDate && (
                    <InfoCard label="Active Date" value={device.otherData.activeDate} icon={<Calendar size={11} />} />
                  )}
                </div>
              </SectionWrap>
            )}

            {/* ── Device Parameters ── */}
            <SectionWrap>
              <SectionTitle icon={<Database size={16} />} title="Device Parameters" />
              {device.keys && Object.keys(device.keys).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {Object.entries(device.keys).map(([key, label]) => (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/60 border border-gray-100 dark:border-gray-600/50 hover:border-blue-200 dark:hover:border-blue-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                        {typeof label === "string" || typeof label === "number" ? label : key}
                      </p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400 font-mono text-sm">
                        {device.values?.[key] ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm">No parameters found.</p>
              )}
            </SectionWrap>

            {/* ── Recent Logs (Success Only) ── */}
            <div>
              <SectionTitle
                icon={<List size={16} />}
                title="Recent Logs (Success Only)"
                right={
                  successLogs.length > 0
                    ? <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {successLogs.length} entries
                      </span>
                    : undefined
                }
              />

              {successLogs.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Message</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Next Schedule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {successLogs.map((log, index) => (
                        <tr
                          key={index}
                          className="bg-white dark:bg-gray-800 hover:bg-blue-50/60 dark:hover:bg-gray-700/40 transition-colors duration-150"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300 text-xs">
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleString("en-IN", { hour12: true })
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[220px]">
                            <span className="block truncate text-xs" title={log.message || "—"}>
                              {log.message || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                              <CheckCircle size={11} /> Success
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">
                            {log.nextScheduledTime
                              ? new Date(log.nextScheduledTime).toLocaleString("en-IN", { hour12: true })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-dashed border-gray-200 dark:border-gray-600">
                  <CheckCircle size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">No successful logs yet.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOtherSiteDetails;