import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Cpu, Database, List, CheckCircle, XCircle,
  ExternalLink, User, Lock, Calendar, Clock, Activity,
  Link2, HardDrive, RefreshCw, Globe
} from "lucide-react";

interface SentData {
  FlowMeterReading?: number;
  [key: string]: string | number | undefined;
}

interface DeviceLog {
  timestamp?: string;
  message?: string;
  success?: boolean;
  FlowMeterReading?: string | number;
  nextScheduledTime?: string;
  responseData?: string | Record<string, unknown>;
  sentData?: SentData;
  error?: string;
  statusCode?: number | null;
  retryAttempt?: number;
  retriesAttempted?: number;
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

// ── small helpers ────────────────────────────────────────────────────────────
const InfoCard = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm break-all">
      {value || <span className="text-gray-400 font-normal">N/A</span>}
    </p>
  </div>
);

const SectionHeader = ({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-blue-600 dark:text-blue-400">{icon}</span>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
    {badge && <span className="ml-auto">{badge}</span>}
  </div>
);

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-IN", { hour12: true, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const getTypeIcon = (type?: string) => {
  if (type === "api")     return <Globe     size={14} className="inline mr-1" />;
  if (type === "ftp")     return <HardDrive size={14} className="inline mr-1" />;
  if (type === "receive") return <RefreshCw size={14} className="inline mr-1" />;
  return <Link2 size={14} className="inline mr-1" />;
};

// ────────────────────────────────────────────────────────────────────────────

const ViewOtherSiteDetailsAdmin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const device = location.state?.device as Device | undefined;

  if (!device) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-400 text-lg">
        No device data found.
      </div>
    );
  }

  const allLogs = device.otherDataLogs ? [...device.otherDataLogs].reverse() : [];
  const hasOtherData = device.otherData && Object.values(device.otherData).some(v => v?.trim?.());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-7xl bg-white dark:bg-gray-800 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-6 sm:p-10 transition-all duration-300 hover:shadow-[0_12px_50px_rgba(0,0,0,0.08)]">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border-b pb-5 gap-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {device.deviceName || "Unnamed Device"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Device ID:{" "}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {device.deviceId || "N/A"}
              </span>
            </p>
            {/* Created / Updated timestamps */}
            <div className="flex flex-wrap gap-4 pt-1">
              {device.createdAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Calendar size={12} /> Created: {formatDate(device.createdAt)}
                </p>
              )}
              {device.updatedAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> Last Updated: {formatDate(device.updatedAt)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition flex-shrink-0"
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        {/* ── Device Overview ── */}
        <div className="mb-10">
          <SectionHeader icon={<Cpu size={22} />} title="Device Overview" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            <InfoCard label="Sending Place" value={device.sendingPlace} />
            <InfoCard label="Interval" value={device.timeIntervelSet} />
            <InfoCard
              label="Connection Type"
              value={
                <span>
                  {getTypeIcon(device.typeToConnect)}
                  {device.typeToConnect?.toUpperCase() || "N/A"}
                </span>
              }
            />
            <InfoCard
              label="Status"
              value={
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${device.shareToOtherPlateform === "start"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                  <Activity size={11} />
                  {device.shareToOtherPlateform === "start" ? "Running" : "Stopped"}
                </span>
              }
            />

            {/* API fields */}
            {device.typeToConnect === "api" && device.url && (
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">API URL</p>
                <a href={device.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                  {device.url}
                </a>
              </div>
            )}

            {/* Receive URL */}
            {device.typeToConnect === "receive" && device.url && (
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Receive URL</p>
                <a href={device.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                  {device.url}
                </a>
              </div>
            )}

            {/* FTP fields */}
            {device.typeToConnect === "ftp" && (
              <>
                <InfoCard label="FTP Host" value={device.ftpHost} />
                <InfoCard label="FTP Port" value={device.ftpPort} />
                <InfoCard label="FTP User" value={device.ftpUser} />
                <InfoCard label="FTP Path" value={device.ftpPath} />
              </>
            )}
          </div>
        </div>

        {/* ── Other Reference Info ── */}
        {hasOtherData && (
          <div className="mb-10">
            <SectionHeader icon={<ExternalLink size={22} />} title="Other Reference Info" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {device.otherData?.otherLink && (
                <div className="sm:col-span-2 md:col-span-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-500 dark:text-blue-400 mb-0.5 flex items-center gap-1">
                    <ExternalLink size={11} /> Platform / Destination Link
                  </p>
                  <a href={device.otherData.otherLink} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                    {device.otherData.otherLink}
                  </a>
                </div>
              )}
              {device.otherData?.userId && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                    <User size={11} /> User ID
                  </p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {device.otherData.userId}
                  </p>
                </div>
              )}
              {device.otherData?.password && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                    <Lock size={11} /> Password
                  </p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm tracking-widest">
                    { device.otherData.password}
                  </p>
                </div>
              )}
              {device.otherData?.activeDate && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                    <Calendar size={11} /> Active Date
                  </p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {device.otherData.activeDate}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Device Parameters ── */}
        <div className="mb-10">
          <SectionHeader icon={<Database size={22} />} title="Device Parameters" />
          {device.keys && Object.keys(device.keys).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(device.keys).map(([key, label]) => (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 transition"
                >
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    {typeof label === "string" || typeof label === "number" ? label : key}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {device.values?.[key] ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No parameters found.</p>
          )}
        </div>

        {/* ── Logs ── */}
        <div>
          <SectionHeader
            icon={<List size={22} />}
            title="All Logs"
            badge={
              allLogs.length > 0 ? (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="text-green-600 dark:text-green-400 font-medium">{allLogs.filter(l => l.success).length} success</span>
                  {" / "}
                  <span className="text-red-500 dark:text-red-400 font-medium">{allLogs.filter(l => !l.success).length} failed</span>
                  {" out of "}{allLogs.length}
                </span>
              ) : undefined
            }
          />

          {allLogs.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Timestamp</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Message</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Sent Data</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Server Response</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Retries</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Next Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {allLogs.map((log, index) => (
                    <tr
                      key={index}
                      className={`border-t border-gray-200 dark:border-gray-700 ${
                        index % 2 === 0
                          ? "bg-gray-50 dark:bg-gray-900/40"
                          : "bg-white dark:bg-gray-800"
                      } hover:bg-blue-50 dark:hover:bg-gray-700 transition`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN", { hour12: true }) : "—"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.success ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium">
                            <CheckCircle size={13} /> Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-medium">
                            <XCircle size={13} /> Failed
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[200px]">
                        <span className="block truncate" title={log.message || log.error || "—"}>
                          {log.message || "—"}
                        </span>
                        {!log.success && log.error && (
                          <span className="block text-xs text-red-500 dark:text-red-400 truncate mt-0.5" title={log.error}>
                            {log.error}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 min-w-[180px] max-w-[260px]">
                        {log.sentData && Object.keys(log.sentData).length > 0 ? (
                          <div className="space-y-0.5">
                            {Object.entries(log.sentData)
                              .filter(([key]) =>
                                !["NOCNumber","Userkey","CompanyName","VendorFirmsName",
                                  "AbstructionStructureNumber","Latitude","Longitude",
                                  "FlowMeterReadingDatetime","Token"].includes(key)
                              )
                              .map(([key, val]) => (
                                <div key={key} className="flex items-center gap-1">
                                  <span className="text-gray-400 dark:text-gray-500 shrink-0">{key}:</span>
                                  <span className="font-semibold font-mono text-blue-700 dark:text-blue-300 truncate" title={String(val)}>
                                    {val !== undefined && val !== null ? String(val) : "—"}
                                  </span>
                                </div>
                              ))}
                          </div>
                        ) : "—"}
                      </td>

                      <td className="px-4 py-3 max-w-[220px]">
                        {log.success && log.responseData ? (
                          (() => {
                            const raw = log.responseData;
                            const str = typeof raw === "object" && raw !== null
                              ? JSON.stringify(raw)
                              : String(raw);
                            const isSuccess = str === "Flowmeter data added successfully";
                            return (
                              <span
                                className={`block text-xs truncate ${
                                  isSuccess
                                    ? "text-green-600 dark:text-green-400 font-semibold"
                                    : "text-amber-600 dark:text-amber-400"
                                }`}
                                title={str}
                              >
                                {str}
                              </span>
                            );
                          })()
                        ) : !log.success ? (
                          <span className="text-xs text-gray-400 italic">No response</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {log.success
                          ? (log.retryAttempt !== undefined
                              ? <span className={`text-xs font-medium ${log.retryAttempt === 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                                  {log.retryAttempt === 0 ? "0 (direct)" : `${log.retryAttempt} retries`}
                                </span>
                              : "—")
                          : (log.retriesAttempted !== undefined
                              ? <span className="text-xs text-red-500 dark:text-red-400">{log.retriesAttempted} retries</span>
                              : "—")
                        }
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400 text-xs">
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
            <p className="text-gray-500 dark:text-gray-400 mt-3">No logs available for this device.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default ViewOtherSiteDetailsAdmin;