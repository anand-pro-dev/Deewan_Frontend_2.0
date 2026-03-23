import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from '../../store/hooks';
import wifiIcon from '../../../public/images/icons/wifiConnected.gif';
import wifiIconDisConnect from '../../../public/images/icons/wired-lineal-64-wifi-hover-flicker (1).gif';
import {
  adminGetDeviceDataApi,
  adminGetParameterDetailsApi,
  getDeviceLogDataApi,
  getDeviceDataWithTimeDateApi,
  deleteDeviceDataLog,
  uploadExcelApi,
} from "../../apis/adminApi";
import {
  AreaChart, Area,
  BarChart, Bar,
  CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import DeviceLogListTableConsumption from "./widgets/DeviceLogListCons";
import TableDataDetailsConsuption from "./widgets/DeviceLogTableCons";
import { useAlertBox } from "../../context/AlertContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type DeviceData = {
  _id?: string;
  dataParameter?: string;
  createdAt?: string;
  lat?: string;
  long?: string;
  deviceImage?: string;
  city?: string;
  address?: string;
  currentStatus?: "active" | "inactive" | "off" | string;
  deviceActiveData?: any;
  deviceNextLogTime?: any;
  consumptionShow?: boolean;
  consumptionValue?: string;
  decimalPoints?: any;
  companyName?: any;
  deviceName?: any;
  mapShow?: boolean;
  serialNo?: string;
  make?: string;
  installationData?: string;
  deviceModel?: string;
};
type LogEntry = { timestamp: string; [key: string]: any };
type ParameterMap = { [key: string]: string };

// ── Consumption log shape returned by the new API ─────────────────────────────
type ConsumptionLogs = {
  today: LogEntry | null;
  week:  LogEntry | null;
  month: LogEntry | null;
  monthLabel?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const trackChange =
  (setter: (v: string) => void, flag: (v: boolean) => void) =>
  (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    flag(true);
  };

const computeDecimalPlaces = (dp: any): number => {
  if (dp === "none") return 0;
  if (typeof dp === "string" && dp.startsWith(".")) return Math.min(dp.length - 1, 9);
  return 2;
};

const makeFormatDecimal = (places: number) => (val: number | string) => {
  const num = Number(val);
  if (isNaN(num)) return "--";
  const rounded = Math.round((num + Number.EPSILON) * Math.pow(10, places)) / Math.pow(10, places);
  if (places === 0) return String(Math.round(rounded)).padStart(2, "0");
  const [i, d = ""] = rounded.toFixed(places).split(".");
  return `${i.padStart(2, "0")}.${d.padEnd(places, "0")}`;
};

const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#ef4444", "#10b981",
  "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#64748b",
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-right max-w-[62%] leading-relaxed">{value}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    active:   { dot: "bg-emerald-400 animate-pulse", bg: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-400", label: "Active" },
    inactive: { dot: "bg-amber-400",                  bg: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700",       text: "text-amber-700 dark:text-amber-400",   label: "Inactive" },
    off:      { dot: "bg-red-400",                    bg: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700",               text: "text-red-700 dark:text-red-400",       label: "Offline" },
  };
  const c = map[status] ?? { dot: "bg-gray-400", bg: "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600", text: "text-gray-600 dark:text-gray-300", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-3 min-w-[150px]">
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2 font-semibold uppercase tracking-wide">
        {new Date(label).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
      </p>
      {payload.map((e: any) => (
        <div key={e.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
          <span className="text-xs text-gray-500 dark:text-gray-400">{e.name}:</span>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-100 ml-auto pl-2">{e.value}</span>
        </div>
      ))}
    </div>
  );
};

const LiveStatCard = ({ label, value, unit, index }: { label: string; value: string; unit: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
  >
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 opacity-60" />
    <p className="text-[14px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-2 relative z-10">{label}</p>
    <div className="flex items-end gap-1.5 relative z-10">
      <motion.span
        key={value}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none"
      >
        {value}
      </motion.span>
      {unit && <span className="text-xs font-semibold text-indigo-400 mb-0.5 leading-none">{unit}</span>}
    </div>
  </motion.div>
);

const PickerInput = ({
  type, value, onChange, min, max,
}: { type: "date" | "time"; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min?: string; max?: string }) => {
  const ref = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    if (!ref.current) return;
    ref.current.focus();
    try { (ref.current as any).showPicker?.(); } catch (_) {}
  };
  return (
    <div className="relative flex-1 group cursor-pointer" onClick={openPicker}>
      <input
        ref={ref} type={type} value={value} onChange={onChange} min={min} max={max}
        className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2.5 pr-8 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors">
        {type === "date" ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )}
      </span>
    </div>
  );
};

// ─── Consumption Summary Card ─────────────────────────────────────────────────
const ConsumptionCard = ({
  label, current, base, unit, decimalPlaces, icon,
  baseLog, currentLog, consumptionField,
}: {
  label: string;
  current: number | null;
  base: number | null;
  unit: string;
  decimalPlaces: number;
  icon: string;
  baseLog?: LogEntry | null;
  currentLog?: LogEntry | null;
  consumptionField?: string;
}) => {
  const fmt = makeFormatDecimal(decimalPlaces);
  const consumption = current !== null && base !== null ? Math.max(0, current - base) : null;

  const handleDownload = () => {
    if (!baseLog || !currentLog || consumption === null) return;
    const startTime = new Date(baseLog.timestamp).toLocaleString("en-GB", { hour12: true });
    const endTime   = new Date(currentLog.timestamp).toLocaleString("en-GB", { hour12: true });
    const field     = consumptionField ?? "";
    const rows = [{
      Period:           label,
      "Start Time":     startTime,
      "End Time":       endTime,
      [`Start ${field}${unit ? " (" + unit + ")" : ""}`]: base  !== null ? fmt(base)    : "--",
      [`End ${field}${unit ? " (" + unit + ")" : ""}`]:   current !== null ? fmt(current) : "--",
      [`Total Consumption${unit ? " (" + unit + ")" : ""}`]: fmt(consumption),
    }];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length + 2, 18) }));
    XLSX.utils.book_append_sheet(wb, ws, label.replace(/\s+/g, "_"));
    XLSX.writeFile(wb, `consumption_${label.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</span>
        </div>
        {consumption !== null && baseLog && currentLog && (
          <button
            onClick={handleDownload}
            title={`Download ${label} consumption`}
            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
        {consumption !== null ? fmt(consumption) : "—"}
        {unit && <span className="text-xs font-semibold text-gray-400 ml-1">{unit}</span>}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
        {base !== null ? `Base: ${fmt(base)}` : "No base log found"}
      </p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DeviceDataDetails = () => {
  const location = useLocation();
  const deviceId = location.state?.deviceId;

  const authUser    = useAppSelector((state) => state.auth.user);
  const role        = authUser?.role?.toLowerCase() ?? "";
  const isSuperAdmin = role === "superadmin";
  const isUser       = role === "user";

  const [deviceData, setDeviceData]       = useState<DeviceData | null>(null);
  const [logs, setLogs]                   = useState<LogEntry[]>([]);
  // ✅ Separate state for today/week/month opening readings
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLogs | null>(null);
  const [parameterLabels, setParameterLabels] = useState<ParameterMap>({});
  const [parameterUnits, setParameterUnits]   = useState<ParameterMap>({});
  const [isDateTimeChanged, setIsDateTimeChanged] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate]   = useState("");
  const [startTime, setStartTime]   = useState("17:00");
  const [endDate, setEndDate]       = useState(today);
  const [endTime, setEndTime]       = useState("23:01");
  const [selectedParam, setSelectedParam] = useState("all");
  const [chartPeriod, setChartPeriod]     = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading]       = useState(false);
  const [fromCalander, setfromCalander] = useState(false);
  const [file, setFile]             = useState<File | null>(null);
  const [uploading, setUploading]   = useState(false);
  const shouldFetchLogsRef          = useRef(true);

  const { showAlert } = useAlertBox();

  const decimalPlaces = deviceData ? computeDecimalPlaces(deviceData.decimalPoints) : 2;
  const formatDecimal = useCallback(makeFormatDecimal(decimalPlaces), [decimalPlaces]);
  const formatValue   = (val: any) =>
    val === null || val === undefined || val === "" || val === "N/A"
      ? "N/A"
      : !isNaN(Number(val)) ? formatDecimal(val) : val;

  // ── Parse the API response — handles both old (plain array) and new shape ──
  const parseLogResponse = (resData: any): { logs: LogEntry[]; consumptionLogs: ConsumptionLogs | null } => {
    // New API: { data: [...], today, week, month }
    if (resData && !Array.isArray(resData) && Array.isArray(resData.data)) {
      return {
        logs: resData.data,
        consumptionLogs: {
          today:      resData.today      ?? null,
          week:       resData.week       ?? null,
          month:      resData.month      ?? null,
          monthLabel: resData.month?.monthLabel,
        },
      };
    }
    // Old API: plain array
    if (Array.isArray(resData)) {
      return { logs: resData, consumptionLogs: null };
    }
    return { logs: [], consumptionLogs: null };
  };

  const fetchLogs = useCallback(async (id: string) => {
    try {
      const res = await getDeviceLogDataApi(id);
      if (res.success) {
        const { logs: newLogs, consumptionLogs: newConsumption } = parseLogResponse(res.data);
        setLogs(newLogs);
        if (newConsumption) setConsumptionLogs(newConsumption);
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchParameterDetails = useCallback(async (paramId: string) => {
    try {
      const res = await adminGetParameterDetailsApi(paramId);
      if (res.success) {
        setParameterLabels(res.data?.parameterKey?.[0]?.key || {});
        setParameterUnits(res.data?.parameterValue?.[0]?.value || {});
      }
    } catch (e) { toast.error("Failed to fetch parameter details"); }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const id = deviceId;
      if (!id) { toast.error("No device ID found"); return; }
      try {
        const resDeviceData = await adminGetDeviceDataApi(id);
        if (!resDeviceData.success) { toast.error("Failed to fetch device info"); return; }
        const fd = resDeviceData.data;
        setDeviceData(fd);
        if (fd.dataParameter) fetchParameterDetails(fd.dataParameter);

        const logRes = await getDeviceLogDataApi(id);
        if (logRes.success) {
          const { logs: all, consumptionLogs: cLogs } = parseLogResponse(logRes.data);
          setLogs(all);
          if (cLogs) setConsumptionLogs(cLogs);

          if (all.length > 0) {
            const s = new Date(all[all.length - 1].timestamp);
            const e = new Date(all[0].timestamp);
            setStartDate(s.toISOString().split("T")[0]);
            setStartTime(s.toTimeString().slice(0, 5));
            setEndDate(e.toISOString().split("T")[0]);
            setEndTime(e.toTimeString().slice(0, 5));
          }
        }
        if (!fromCalander) {
          const iv = setInterval(() => { if (shouldFetchLogsRef.current) fetchLogs(id); }, 30000);
          return () => clearInterval(iv);
        }
      } catch (e) { toast.error("Something went wrong while loading device"); }
    };
    fetchData();
  }, []);

  const deletefetchLogs = async (id: string) => {
    try {
      const res = await deleteDeviceDataLog(id);
      if (res.success) { toast.success(res?.message || "Logs cleared."); fetchLogs(id); }
    } catch (e) { toast.error("Something went wrong"); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) {
      showAlert({ title: "Information", message: "Only authorized admins can upload files.", onConfirm: () => {} });
      e.target.value = "";
      return;
    }
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.startsWith(deviceId)) {
      toast.error(`File name must start with "${deviceId}"`);
      e.target.value = "";
      return;
    }
    setFile(f);
    toast.success("File selected.");
  };

  const handleUpload = async () => {
    if (!file) { toast.error("Please choose a file first."); return; }
    showAlert({
      title: "⚠️ Confirm Upload",
      message: "Uploading will erase all previous data. A backup will be downloaded first.",
      onConfirm: async () => {
        try {
          const startISO = new Date(`${startDate}T${startTime}`).toISOString();
          const endISO   = new Date(`${endDate}T${endTime}`).toISOString();
          const res      = await getDeviceDataWithTimeDateApi(deviceData?._id ?? "", startISO, endISO);
          const apiLogs  = res?.data || [];
          if (apiLogs.length === 0 && logs.length === 0) { toast.error("No logs to backup. Upload cancelled."); return; }
          const startData = { Timestamp: new Date(deviceData!.deviceActiveData).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour12: true }), FLOW: "-", "TOTAL FLOW": "-" };
          const dataToDownload = [startData, ...logs, ...apiLogs].map((item: any) => {
            const d = new Date(item.timestamp || item.Timestamp);
            return {
              Timestamp: isNaN(d.getTime()) ? item.Timestamp : d.toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }).replace(",", ""),
              FLOW: item.FLOW ?? item.flow ?? 0,
              "TOTAL FLOW": item["TOTAL FLOW"] ?? item.totalFlow ?? 0,
            };
          });
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataToDownload), "Logs");
          XLSX.writeFile(wb, `${deviceData!.deviceName || "device"}_backup.xlsx`);
          toast.success("Backup saved.");
          setUploading(true);
          const uploadRes = await uploadExcelApi(deviceId, file);
          toast.success(uploadRes?.message || "Uploaded successfully.");
          setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Upload failed.");
        } finally { setUploading(false); }
      },
      onCancel: () => toast("Upload cancelled."),
    });
  };

  const handleApplyDateFilter = async () => {
    if (!deviceData?._id) return toast.error("Device ID missing");
    setLoading(true);
    shouldFetchLogsRef.current = false;
    try {
      const res = await getDeviceDataWithTimeDateApi(
        deviceData._id,
        new Date(`${startDate}T${startTime}`).toISOString(),
        new Date(`${endDate}T${endTime}`).toISOString()
      );
      if (res.success && res.data) {
        // Date filter returns a plain array — consumption logs stay from the initial fetch
        const filtered = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data ?? [];
        setLogs(filtered);
        setIsDateTimeChanged(false);
        setfromCalander(true);
        toast.success("Filtered logs loaded");
      } else toast.error("No logs in selected range");
    } catch (e) { toast.error("Failed to load filtered data"); }
    finally { setLoading(false); }
  };

  const getFilteredLogsForSelectedParam = () => {
    if (!selectedParam || selectedParam.toLowerCase() === "all") { toast.error("Please select a parameter"); return null; }
    const matchedParamKey = Object.keys(parameterLabels).find(k => parameterLabels[k].toLowerCase() === selectedParam.toLowerCase());
    if (!matchedParamKey) { toast.error("Parameter not found"); return null; }
    const sampleLog = logs[0] || {};
    const actualLogKey = Object.keys(sampleLog).find(k => k.toLowerCase() === matchedParamKey.toLowerCase() || k.toLowerCase() === selectedParam.toLowerCase());
    if (!actualLogKey) { toast.error("Parameter not found in logs"); return null; }
    const filtered = logs.filter(log => { const v = log[actualLogKey]; return v !== undefined && v !== null && !isNaN(parseFloat(v)); });
    return { filtered, actualLogKey, matchedParamKey };
  };

  const handleExportToExcel = () => {
    if (!logs.length) { toast.error("No logs to export"); return; }
    const id = deviceData?._id || "Device";
    const deduped = Array.from(new Map(logs.map(l => [JSON.stringify({ t: l.timestamp, f: l.flow || l.FLOW }), l])).values());
    if (!selectedParam || selectedParam.toLowerCase() === "all") {
      const data = deduped.map(log => {
        const row: any = { DeviceID: id, Timestamp: new Date(log.timestamp).toLocaleString() };
        Object.keys(log).forEach(k => {
          if (["timestamp", "_id"].includes(k.toLowerCase())) return;
          const pk = Object.keys(parameterLabels).find(p => p.toLowerCase() === k.toLowerCase() || parameterLabels[p]?.toLowerCase() === k.toLowerCase());
          const label = pk ? parameterLabels[pk] : k;
          const unit  = pk ? (parameterUnits[pk] || "-") : "-";
          row[`${label} (${unit})`] = formatValue(typeof log[k] === "string" ? log[k].trim() : log[k]);
        });
        return row;
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "All_Data");
      XLSX.writeFile(wb, `${id}_All_Parameters.xlsx`);
      toast.success(`Exported ${data.length} records`);
      return;
    }
    const result = getFilteredLogsForSelectedParam();
    if (!result) return;
    const { filtered, actualLogKey, matchedParamKey } = result;
    const dd    = Array.from(new Map(filtered.map(l => [JSON.stringify({ t: l.timestamp, v: l[actualLogKey] }), l])).values());
    const label = parameterLabels[matchedParamKey];
    const unit  = parameterUnits[matchedParamKey] || "-";
    const data  = dd.map(l => ({ DeviceID: id, Timestamp: new Date(l.timestamp).toLocaleString(), [`${label} (${unit})`]: formatValue(l[actualLogKey]) }));
    const wb    = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), label.replace(/[\\/:*?"<>|]/g, "_"));
    XLSX.writeFile(wb, `${id}_${label}.xlsx`);
    toast.success(`Exported ${data.length} records`);
  };

  const sanitizeNum = (raw: any): number => {
    if (raw == null) return NaN;
    if (typeof raw === "number") return raw;
    const n = parseFloat(String(raw).replace(/[^0-9.\-eE+]/g, ""));
    return Number.isFinite(n) ? n : NaN;
  };

  const getLocalDateTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) { const n = new Date(); return { date: n.toISOString().split("T")[0], time: n.toTimeString().slice(0, 8) }; }
    return {
      date: `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`,
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
    };
  };

  const handleStatValue = async (type: "Min" | "Max" | "Avg") => {
    const result = getFilteredLogsForSelectedParam();
    if (!result) return;
    const { filtered, actualLogKey, matchedParamKey } = result;
    const values = filtered.map((l: any) => ({ value: sanitizeNum(l[actualLogKey]), timestamp: l.timestamp })).filter(e => !isNaN(e.value));
    if (!values.length) { toast.error("No valid data"); return; }
    const grouped = values.reduce((acc, e) => {
      const { date } = getLocalDateTime(e.timestamp);
      if (!acc[date]) acc[date] = [];
      acc[date].push(e);
      return acc;
    }, {} as Record<string, { value: number; timestamp: string }[]>);
    const stats = Object.entries(grouped).map(([date, entries]) => {
      let stat: { value: number; timestamp: string };
      if (type === "Min")      stat = entries.reduce((m, c) => c.value < m.value ? c : m);
      else if (type === "Max") stat = entries.reduce((m, c) => c.value > m.value ? c : m);
      else { const avg = entries.reduce((s, c) => s + c.value, 0) / entries.length; stat = { value: avg, timestamp: entries[Math.floor(entries.length / 2)]?.timestamp || entries[0].timestamp }; }
      return { date, ...stat };
    });
    if (!stats.length) { toast.error("No stats computed"); return; }
    toast.success(`${type} ${parameterLabels[matchedParamKey]}:\n${stats.map(s => `${s.date}: ${formatDecimal(s.value)} ${parameterUnits[matchedParamKey] || ""}`).join("\n")}`);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.map(s => {
      const { time } = getLocalDateTime(s.timestamp);
      return { Type: type, Parameter: parameterLabels[matchedParamKey], Date: s.date, Time: time, Value: formatDecimal(s.value), Unit: parameterUnits[matchedParamKey] || "" };
    })), `${type}_${matchedParamKey}`);
    XLSX.writeFile(wb, `${matchedParamKey}_${type}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const getChartInfo = () => {
    if (!Array.isArray(logs)) return { data: [], keys: [] };

    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const weekStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const periodLogs = logs.filter(l => {
      const t = new Date(l.timestamp);
      if (chartPeriod === 'day')   return t >= todayStart;
      if (chartPeriod === 'week')  return t >= weekStart;
      if (chartPeriod === 'month') return t >= monthStart;
      return true;
    });

    const labels = (!selectedParam || selectedParam === "all")
      ? Object.values(parameterLabels)
      : Object.values(parameterLabels).filter(l => l.toLowerCase().trim() === selectedParam.toLowerCase().trim());

    // oldest→newest for chart, up to 60 points
    const recent = [...periodLogs].reverse().slice(0, 60);

    const valid = recent.filter(log =>
      labels.some(label => {
        const k = Object.keys(log).find(lk => lk.toLowerCase().trim() === label.toLowerCase().trim());
        const v = k ? log[k] : undefined;
        return v !== undefined && !isNaN(parseFloat(v)) && isFinite(Number(v));
      })
    );
    if (valid.length < 2) return { data: [], keys: [] };
    const keys = labels
      .map(label => ({ key: Object.keys(valid[0] || {}).find(lk => lk.toLowerCase().trim() === label.toLowerCase().trim()), label }))
      .filter(i => i.key);
    return { data: valid, keys };
  };

  const getYDomain = (data: any[], keys: { key: string; label: string }[]) => {
    if (!data.length || !keys.length) return [0, 100];
    let min = Infinity, max = -Infinity;
    data.forEach(row => {
      keys.forEach(({ key }) => {
        const v = parseFloat(row[key]);
        if (!isNaN(v)) { if (v < min) min = v; if (v > max) max = v; }
      });
    });
    if (!isFinite(min) || !isFinite(max)) return [0, 100];
    const padding = (max - min) * 0.1 || 5;
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  };

  if (!deviceData) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 font-medium">Loading device…</p>
      </div>
    </div>
  );

  const { data: chartData, keys: chartKeys } = getChartInfo() as { data: any[]; keys: { key: string; label: string }[] };
  const yDomain        = getYDomain(chartData, chartKeys);
  const paramKeys      = Object.keys(parameterLabels);
  const latestLog      = Array.isArray(logs) ? logs[0] : null;
  const isActive       = deviceData.currentStatus === "active";
  const activationDate = deviceData.deviceActiveData ? new Date(deviceData.deviceActiveData).toISOString().split("T")[0] : "";

  // ── Resolve consumption field key for ConsumptionCard ─────────────────────
  const consumptionFieldKey = deviceData.consumptionValue
    ? Object.keys(latestLog || {}).find(k => k.toLowerCase() === deviceData.consumptionValue?.toLowerCase())
    : null;
  const currentConsumptionValue = consumptionFieldKey && latestLog ? Number(latestLog[consumptionFieldKey]) : null;
  const consumptionUnit = (() => {
    if (!deviceData.consumptionValue) return "";
    const k = Object.keys(parameterLabels).find(p => parameterLabels[p].toLowerCase() === deviceData.consumptionValue?.toLowerCase());
    return k ? parameterUnits[k] ?? "" : "";
  })();

  const getBaseValue = (log: LogEntry | null): number | null => {
    if (!log || !deviceData.consumptionValue) return null;
    const k = Object.keys(log).find(key => key.toLowerCase() === deviceData.consumptionValue?.toLowerCase());
    return k ? Number(log[k]) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 font-sans transition-colors duration-300">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-400 text-white p-5 rounded-xl shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-[25px] font-bold text-white leading-none">
              {deviceData.companyName ? `Company Name: ${deviceData.companyName}` : `Device Name: ${deviceData.deviceName}`}
            </h1>
            <p className="text-[12px] text-blue-100 font-mono mt-3">
              Device Name: {deviceData.deviceName} &nbsp;·&nbsp; ID: {deviceData._id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={deviceData.currentStatus || "unknown"} />
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 space-y-7">

        {/* Device + Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="relative">
              {deviceData.deviceImage ? (
                <div className="relative w-full h-60 overflow-hidden">
                  <img src={deviceData.deviceImage} alt="Device" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className={`absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md border ${isActive ? "bg-white/90 border-white/50" : "bg-gray-900/80 border-white/10"}`}>
                    <img src={isActive ? wifiIcon : wifiIconDisConnect} alt="wifi" className="w-5 h-5" />
                    <span className={`text-xs font-bold ${isActive ? "text-emerald-700" : "text-red-400"}`}>{isActive ? "Live" : "Offline"}</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-white font-bold text-lg drop-shadow leading-tight">{deviceData.deviceName}</p>
                    {deviceData.city && <p className="text-white/70 text-xs mt-0.5">{deviceData.city}</p>}
                  </div>
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-white dark:bg-gray-600 rounded-2xl shadow flex items-center justify-center mx-auto mb-2">
                      <svg className="w-7 h-7 text-gray-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
                    </div>
                    <p className="text-xs text-gray-400">No image available</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-4">
              <InfoRow label="Status" value={deviceData.currentStatus ? deviceData.currentStatus.charAt(0).toUpperCase() + deviceData.currentStatus.slice(1) : "Unknown"} />
              <InfoRow label="Device Created" value={deviceData.deviceActiveData ? new Date(deviceData.deviceActiveData).toLocaleString("en-GB", { hour12: true }) : deviceData.createdAt ? new Date(deviceData.createdAt).toLocaleString("en-GB", { hour12: true }) : "Unknown"} />
              <InfoRow label="Device Activation" value={deviceData.deviceActiveData ? new Date(deviceData.deviceActiveData).toLocaleString("en-GB", { hour12: true }) : "—"} />
              <InfoRow label="Last Updated Data" value={latestLog ? new Date(latestLog.timestamp).toLocaleString("en-GB", { hour12: true }) : "No logs"} />
              <InfoRow label="Approx Update" value={deviceData.deviceNextLogTime ? new Date(deviceData.deviceNextLogTime).toLocaleString("en-GB", { hour12: true }) : "—"} />
              {deviceData.serialNo         && deviceData.serialNo.trim()         !== "" && <InfoRow label="Serial No"          value={deviceData.serialNo} />}
              {deviceData.make             && deviceData.make.trim()             !== "" && <InfoRow label="Make"               value={deviceData.make} />}
              {deviceData.installationData && deviceData.installationData.trim() !== "" && <InfoRow label="Installation Date" value={deviceData.installationData} />}
              {deviceData.deviceModel      && deviceData.deviceModel.trim()      !== "" && <InfoRow label="Device Model"       value={deviceData.deviceModel} />}
            </div>
          </motion.div>

          {deviceData.mapShow && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="px-5 pt-5 pb-3 border-b border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Device Location</h3>
                </div>
              </div>
              <div className="flex-1 min-h-[240px] overflow-hidden">
                {deviceData.lat && deviceData.long ? (
                  <iframe title="OpenStreetMap" width="100%" height="100%" style={{ border: 0, display: "block" }} loading="lazy" allowFullScreen
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(deviceData.long) - 0.01},${parseFloat(deviceData.lat) - 0.01},${parseFloat(deviceData.long) + 0.01},${parseFloat(deviceData.lat) + 0.01}&layer=mapnik&marker=${deviceData.lat},${deviceData.long}`}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 dark:bg-gray-700">Location data not available</div>
                )}
              </div>
              <div className="px-5 py-4 border-t border-gray-50 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Address</p>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{deviceData.address || "No address provided"}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Live Readings */}
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center gap-3 mb-4">
            <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="text-xl">⚡</motion.span>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Live Readings</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 dark:from-indigo-700 to-transparent" />
            <AnimatePresence>
              {isActive && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-700/50 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Live
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="relative group rounded-2xl shadow overflow-hidden transition duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-400 opacity-40 group-hover:opacity-100 transition-all duration-500 z-0" />
            <div className="relative z-10 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Object.entries(parameterLabels).map(([key, label], idx) => {
                  const matchedKey = Object.keys(latestLog || {}).find(k => k.toLowerCase() === label.toLowerCase());
                  const rawValue   = matchedKey ? latestLog?.[matchedKey] : null;
                  const parsed     = parseFloat(rawValue ?? "");
                  const isNum      = !isNaN(parsed) && isFinite(parsed);
                  const dp         = computeDecimalPlaces(deviceData?.decimalPoints);
                  const value      = isNum ? parsed.toFixed(dp) : "-";
                  return <LiveStatCard key={label} label={label} value={value} unit={parameterUnits?.[key] || ""} index={idx} />;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Consumption Summary (today / week / month) ─────────────────────── */}
        {deviceData.consumptionShow === true && consumptionLogs && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">💧</span>
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Consumption Summary</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 dark:from-indigo-700 to-transparent" />
              {consumptionLogs.monthLabel && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                  {consumptionLogs.monthLabel}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ConsumptionCard
                label="Today"
                current={currentConsumptionValue}
                base={getBaseValue(consumptionLogs.today)}
                unit={consumptionUnit}
                decimalPlaces={decimalPlaces}
                icon="🌅"
                baseLog={consumptionLogs.today}
                currentLog={latestLog ?? null}
                consumptionField={deviceData.consumptionValue ?? ""}
              />
              <ConsumptionCard
                label="This Week"
                current={currentConsumptionValue}
                base={getBaseValue(consumptionLogs.week)}
                unit={consumptionUnit}
                decimalPlaces={decimalPlaces}
                icon="📅"
                baseLog={consumptionLogs.week}
                currentLog={latestLog ?? null}
                consumptionField={deviceData.consumptionValue ?? ""}
              />
              <ConsumptionCard
                label={consumptionLogs.monthLabel ?? "This Month"}
                current={currentConsumptionValue}
                base={getBaseValue(consumptionLogs.month)}
                unit={consumptionUnit}
                decimalPlaces={decimalPlaces}
                icon="🗓️"
                baseLog={consumptionLogs.month}
                currentLog={latestLog ?? null}
                consumptionField={deviceData.consumptionValue ?? ""}
              />
            </div>
          </motion.div>
        )}

        {/* Filter & Export */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base">🔍</span>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Filter & Export</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-indigo-100 dark:from-indigo-700 to-transparent" />
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Start Date & Time</label>
              <div className="flex gap-2">
                <PickerInput type="date" value={startDate} onChange={trackChange(setStartDate, setIsDateTimeChanged)} max={endDate} min={activationDate || "2025-01-01"} />
                <PickerInput type="time" value={startTime} onChange={trackChange(setStartTime, setIsDateTimeChanged)} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">End Date & Time</label>
              <div className="flex gap-2">
                <PickerInput type="date" value={endDate} onChange={trackChange(setEndDate, setIsDateTimeChanged)} min={activationDate || "2025-01-01"} max={today} />
                <PickerInput type="time" value={endTime} onChange={trackChange(setEndTime, setIsDateTimeChanged)} />
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Loading logs…</span>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Parameter</label>
                <select value={selectedParam} onChange={e => setSelectedParam(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer transition">
                  <option value="all">All Parameters</option>
                  {Object.entries(parameterLabels).map(([key, label]) => (
                    <option key={key} value={label}>{label} ({parameterUnits[key] || "—"})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {isDateTimeChanged && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleApplyDateFilter}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h18M7 8h10M11 12h6M15 16h2" /></svg>
                    Apply Filter
                  </motion.button>
                )}
                {[
                  { label: "Export Excel", color: "bg-emerald-600 hover:bg-emerald-700", fn: handleExportToExcel, icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                  { label: "Min",          color: "bg-amber-500 hover:bg-amber-600",    fn: () => handleStatValue("Min"), icon: "M19 14l-7 7m0 0l-7-7m7 7V3" },
                  { label: "Max",          color: "bg-orange-600 hover:bg-orange-700",  fn: () => handleStatValue("Max"), icon: "M5 10l7-7m0 0l7 7m-7-7v18" },
                  { label: "Average",      color: "bg-blue-600 hover:bg-blue-700",      fn: () => handleStatValue("Avg"), icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                ].map(({ label, color, fn, icon }) => (
                  <motion.button key={label} whileTap={{ scale: 0.95 }} onClick={fn}
                    className={`flex items-center gap-1.5 ${color} text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-md`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} /></svg>
                    {label}
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-50 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Data Logs</h3>
            </div>
          </div>
          <DeviceLogListTableConsumption
            logs={Array.isArray(logs) ? logs : []}
            consumptionValue={deviceData.consumptionValue}
            consumptionShow={deviceData.consumptionShow}
            selectedParam={selectedParam}
            paramKeys={paramKeys}
            decimalPoints={deviceData.decimalPoints}
            parameterLabels={parameterLabels}
            parameterUnits={parameterUnits}
          />
        </div>

        {/* Consumption Table */}
        {deviceData.consumptionShow === true && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-50 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-base">💧</span>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Consumption Analysis</h3>
              </div>
            </div>
            <TableDataDetailsConsuption
              logs={Array.isArray(logs) ? logs : []}
              consumptionValue={deviceData.consumptionValue ?? ""}
              consumptionShow={deviceData.consumptionShow}
              decimalPoints={deviceData.decimalPoints}
              parameterLabels={parameterLabels}
              parameterUnits={parameterUnits}
            />
          </div>
        )}

        {/* Charts */}
        {chartData.length >= 2 ? (
          <>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">📈</span>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                    Area Chart — {selectedParam === "all" || !selectedParam ? "All Parameters" : selectedParam}
                  </h3>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03]">
                  {(['day','week','month'] as const).map(p => (
                    <button key={p} onClick={() => setChartPeriod(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-semibold capitalize transition-all ${chartPeriod === p ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm ring-1 ring-gray-100 dark:ring-gray-700' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                      {p === 'day' ? 'Day' : p === 'week' ? 'Week' : 'Month'}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                  {chartData.length} pts
                </span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-5">
                {chartPeriod === 'day' ? "Today's" : chartPeriod === 'week' ? "Last 7 days" : "This month's"} readings — auto-scaled axis
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    {chartKeys.map(({ label }, i) => (
                      <linearGradient key={label} id={`ag-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid, #f1f5f9)" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={yDomain} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
                  {chartKeys.map(({ key, label }, i) => (
                    <Area key={key} type="monotone" dataKey={key ?? ""} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={`url(#ag-${i})`} name={label} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                    Bar Chart — {selectedParam === "all" || !selectedParam ? "All Parameters" : selectedParam}
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                  {chartData.length} pts
                </span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-5">
                {chartPeriod === 'day' ? "Today's" : chartPeriod === 'week' ? "Last 7 days" : "This month's"} readings — auto-scaled
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid, #f1f5f9)" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={yDomain} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
                  {chartKeys.map(({ key, label }, i) => (
                    <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} name={label} radius={[5, 5, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-14 text-center">
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" /></svg>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Not enough data to render charts</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Minimum 4 valid numeric readings required</p>
          </div>
        )}

        {/* Upload */}
        {!isUser && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📤</span>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Upload Data File</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-100 dark:from-indigo-700 to-transparent" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 whitespace-nowrap">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                Choose File
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
              </label>
              <div className="flex-1 w-full text-xs font-medium truncate border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {file ? (
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {file.name}
                  </span>
                ) : "No file selected — upload Excel / CSV"}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleUpload} disabled={!file || uploading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 whitespace-nowrap">
                {uploading
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading…</>
                  : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Upload</>}
              </motion.button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        {isSuperAdmin && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">⚠️</span>
              <h3 className="text-sm font-bold text-red-600 dark:text-red-500 uppercase tracking-widest">Danger Zone</h3>
            </div>
            <p className="text-xs text-red-400 dark:text-red-400/70 mb-4">This action is irreversible. All log data will be permanently deleted.</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => deletefetchLogs(deviceId)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-red-200 dark:shadow-red-900/30">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Erase Complete Log
            </motion.button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DeviceDataDetails;