import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  X, MapPin, Wifi, WifiOff, Activity, Clock, Plus, Trash2,
  Calendar, ChevronDown, ChevronUp, Zap, TrendingUp, RefreshCw, Database,
  BarChart2
} from "lucide-react";
import { getMqttDeviceDetails, controlDigitalPin, addMqttSchedule, deteteMqttSchedule , getChannelHistory, getSensorHistory} from "../../apis/mqtt_api";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import * as XLSX from "xlsx";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
type TriggerType = "time" | "sensor" | "both";

interface ScheduleTime   { startTime: string; endTime: string; lastRun?: { start: string | null; end: string | null }; }
interface ScheduleSensor { sensorName: string; triggerAbove: number | null; triggerBelow: number | null; turnOffAbove: number | null; turnOffBelow: number | null; }

interface Schedule {
  label:         string;
  isActive:      boolean;
  triggerType:   TriggerType;
  time:          ScheduleTime;
  sensor:        ScheduleSensor;
  lastTriggered: string | null;
  lastAction:    string | null;
}

interface Sensor {
  name:                string;
  unit:                string;
  minValue:            number;
  maxValue:            number;
  lastValue:           number;
  updatedAt:           string | null;
  dataParameterFilter: string[];
}

interface Channel {
  name:          string;
  pin:           number;
  state:         boolean;
  successMsg?:   string;
  successCode?:  number;
  lastTimestamp: string | null;
  schedules:     Schedule[];
  sensors:       Sensor[];
}

interface HistoryLog {
  timestamp: string;
  sensors:   Array<{ name: string; unit: string; value: number }>;
  channels:  Array<{ name: string; state: boolean }>;
}

interface DeviceData {
  deviceId:         string;
  deviceName:       string;
  companyName:      string;
  city:             string;
  address:          string;
  lat:              string;
  long:             string;
  isOnline:         boolean;
  lastSeen:         string | null;
  mapShow:          boolean;
  emailNoti:        boolean;
  deviceImage:      string | null;
  deviceActiveData: string;
  sensors:          Sensor[];
  channels:         Channel[];
  historyLogs:      HistoryLog[];
  createdAt:        string;
  updatedAt:        string;
}

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#ef4444", "#10b981",
  "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6",
];

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never";

const formatTime = (d: string | null) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "N/A";

/* ═══════════════════════════════════════════════
   INFO ROW
═══════════════════════════════════════════════ */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-right max-w-[62%] leading-relaxed">{value}</span>
  </div>
);

/* ═══════════════════════════════════════════════
   CUSTOM TOOLTIP
═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   LIVE STAT CARD
═══════════════════════════════════════════════ */
const LiveStatCard = ({ label, value, unit, index }: { label: string; value: string | number; unit: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
  >
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 opacity-60" />
    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 relative z-10">{label}</p>
    <div className="flex items-end gap-1.5 relative z-10">
      <motion.span
        key={String(value)}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none"
      >
        {value}
      </motion.span>
      {unit && <span className="text-xs font-semibold text-indigo-400 mb-0.5">{unit}</span>}
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════
   SENSOR SPARKLINE GRAPH (device-level)
═══════════════════════════════════════════════ */
const SensorGraph = ({ sensor, historyLogs }: { sensor: Sensor; historyLogs: HistoryLog[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dataPoints = useMemo(() => {
    const points: { value: number; timestamp: string }[] = [];
    historyLogs.forEach(log => {
      const match = log.sensors.find(s => s.name === sensor.name);
      if (match) points.push({ value: match.value, timestamp: log.timestamp });
    });
    return points.slice(-20).reverse();
  }, [historyLogs, sensor.name]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dataPoints.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const PAD = { top: 12, right: 8, bottom: 28, left: 36 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    ctx.clearRect(0, 0, W, H);

    const values = dataPoints.map(d => d.value);
    const minV   = Math.min(...values, sensor.minValue);
    const maxV   = Math.max(...values, sensor.maxValue);
    const range  = maxV - minV || 1;
    const xOf    = (i: number) => PAD.left + (i / (dataPoints.length - 1)) * chartW;
    const yOf    = (v: number) => PAD.top + chartH - ((v - minV) / range) * chartH;

    const isDark      = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const gridColor   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const labelColor  = isDark ? "#9ca3af" : "#6b7280";

    ctx.font = "10px system-ui, sans-serif";
    ctx.fillStyle = labelColor;
    ctx.textAlign = "right";
    for (let i = 0; i <= 2; i++) {
      const y = PAD.top + (i / 2) * chartH;
      const val = maxV - (i / 2) * range;
      ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      ctx.fillText(val.toFixed(1), PAD.left - 4, y + 3.5);
    }

    ctx.textAlign = "center"; ctx.fillStyle = labelColor;
    const fmt = (ts: string) => new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    ctx.fillText(fmt(dataPoints[0].timestamp), xOf(0), H - 6);
    ctx.fillText(fmt(dataPoints[dataPoints.length - 1].timestamp), xOf(dataPoints.length - 1), H - 6);

    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
    grad.addColorStop(0, isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.12)");
    grad.addColorStop(1, "rgba(99,102,241,0)");

    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < dataPoints.length; i++) {
      const cx = (xOf(i - 1) + xOf(i)) / 2;
      ctx.bezierCurveTo(cx, yOf(values[i - 1]), cx, yOf(values[i]), xOf(i), yOf(values[i]));
    }
    ctx.lineTo(xOf(dataPoints.length - 1), PAD.top + chartH);
    ctx.lineTo(xOf(0), PAD.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < dataPoints.length; i++) {
      const cx = (xOf(i - 1) + xOf(i)) / 2;
      ctx.bezierCurveTo(cx, yOf(values[i - 1]), cx, yOf(values[i]), xOf(i), yOf(values[i]));
    }
    ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 2.5; ctx.stroke();

    for (let i = 0; i < dataPoints.length; i++) {
      const isLast = i === dataPoints.length - 1;
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(values[i]), isLast ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle   = isLast ? (isDark ? "#1e1b4b" : "#eef2ff") : "#6366f1";
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth   = isLast ? 2.5 : 1.5;
      ctx.fill(); ctx.stroke();
    }
  }, [dataPoints, sensor]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/50 shadow-sm hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h5 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{sensor.name}</h5>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Range: {sensor.minValue} – {sensor.maxValue} {sensor.unit}
          </p>
          {sensor.updatedAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Updated: {new Date(sensor.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{sensor.lastValue}</p>
          <p className="text-xs text-gray-400">{sensor.unit}</p>
        </div>
      </div>

      {dataPoints.length >= 2 ? (
        <>
          <canvas ref={canvasRef} width={880} height={130} className="w-full" style={{ height: 130 }} />
          <div className="mt-4 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="max-h-44 overflow-y-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">Time</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">Value</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {[...dataPoints].reverse().map((pt, idx) => (
                    <tr key={idx} className={`border-t border-gray-50 dark:border-gray-700/50 transition-colors ${idx === 0 ? "bg-indigo-50 dark:bg-indigo-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                      <td className="px-4 py-2 text-gray-400 font-mono">
                        {idx === 0
                          ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">LATEST</span>
                          : dataPoints.length - idx}
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400 font-mono">
                        {new Date(pt.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`font-bold font-mono ${idx === 0 ? "text-indigo-600 dark:text-indigo-400 text-sm" : "text-gray-700 dark:text-gray-300"}`}>
                          {pt.value}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-400">{sensor.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-24 rounded-xl bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-400">
            <BarChart2 className="w-4 h-4" />
            <span className="text-xs">Not enough history data</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   SENSOR MINI CARD (channel-level)
═══════════════════════════════════════════════ */
const SensorMiniCard = ({ sensor }: { sensor: Sensor }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/40 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <h5 className="font-bold text-gray-800 dark:text-gray-100">{sensor.name}</h5>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Range: {sensor.minValue} – {sensor.maxValue} {sensor.unit}
        </p>
        {sensor.updatedAt && (
          <p className="text-xs text-gray-400 mt-0.5">
            Updated: {new Date(sensor.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{sensor.lastValue}</p>
        <p className="text-xs text-gray-400">{sensor.unit}</p>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   DATA LOGS TABLE
═══════════════════════════════════════════════ */
const MqttDataTable = ({ historyLogs, sensors }: { historyLogs: HistoryLog[]; sensors: Sensor[] }) => {
  const [visible, setVisible] = useState(20);
  const sorted = useMemo(() =>
    [...historyLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  [historyLogs]);
  const rows = sorted.slice(0, visible);

  const exportExcel = () => {
    const data = sorted.map(log => {
      const row: any = { Timestamp: new Date(log.timestamp).toLocaleString("en-IN") };
      sensors.forEach(s => {
        const match = log.sensors.find(ls => ls.name === s.name);
        row[`${s.name}${s.unit ? ` (${s.unit})` : ""}`] = match ? match.value : "--";
      });
      return row;
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "MQTT Logs");
    XLSX.writeFile(wb, `mqtt_logs_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (!historyLogs.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BarChart2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm text-gray-400 font-semibold">No history logs yet</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-gray-700">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing</p>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
            {rows.length} of {sorted.length} records
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={exportExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition shadow-md">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel
        </motion.button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-y border-gray-100 dark:border-gray-700">
              <th className="py-3 px-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Timestamp</th>
              {sensors.map(s => (
                <th key={s.name} className="py-3 px-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                  {s.name} {s.unit && <span className="text-gray-300 dark:text-gray-600 normal-case font-normal">({s.unit})</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {rows.map((log, idx) => (
              <motion.tr key={idx}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }}
                className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors">
                <td className="py-2.5 px-5 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString("en-IN", { hour12: true })}
                </td>
                {sensors.map(s => {
                  const match = log.sensors.find(ls => ls.name === s.name);
                  return (
                    <td key={s.name} className="py-2.5 px-5 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {match !== undefined ? match.value : "--"}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible < sorted.length && (
        <div className="flex justify-center py-5">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setVisible(v => v + 20)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold py-2.5 px-6 rounded-xl border border-gray-200 dark:border-gray-600 transition shadow-sm">
            <ChevronDown className="w-3.5 h-3.5" />
            Load 20 More
            <span className="text-gray-400 font-normal">({sorted.length - visible} remaining)</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   RECHARTS AREA + BAR
═══════════════════════════════════════════════ */
const MqttCharts = ({ historyLogs, sensors, chartPeriod, setChartPeriod }: {
  historyLogs: HistoryLog[];
  sensors:     Sensor[];
  chartPeriod: "day" | "week" | "month";
  setChartPeriod: (p: "day" | "week" | "month") => void;
}) => {
  const chartData = useMemo(() => {
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return [...historyLogs]
      .filter(l => {
        const t = new Date(l.timestamp);
        if (chartPeriod === "day")   return t >= todayStart;
        if (chartPeriod === "week")  return t >= weekStart;
        if (chartPeriod === "month") return t >= monthStart;
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-60)
      .map(log => {
        const row: any = { timestamp: log.timestamp };
        sensors.forEach(s => {
          const match = log.sensors.find(ls => ls.name === s.name);
          if (match) row[s.name] = match.value;
        });
        return row;
      });
  }, [historyLogs, sensors, chartPeriod]);

  const yDomain = useMemo(() => {
    if (!chartData.length || !sensors.length) return [0, 100];
    let min = Infinity, max = -Infinity;
    chartData.forEach(row => {
      sensors.forEach(s => {
        const v = parseFloat(row[s.name]);
        if (!isNaN(v)) { if (v < min) min = v; if (v > max) max = v; }
      });
    });
    if (!isFinite(min)) return [0, 100];
    const pad = (max - min) * 0.1 || 5;
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [chartData, sensors]);

  if (chartData.length < 2) return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-14 text-center">
      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <BarChart2 className="w-6 h-6 text-gray-300 dark:text-gray-500" />
      </div>
      <p className="text-sm text-gray-400 font-semibold">Not enough data for charts</p>
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Minimum 2 readings required</p>
    </div>
  );

  const periodToggle = (
    <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03]">
      {(["day", "week", "month"] as const).map(p => (
        <button key={p} onClick={() => setChartPeriod(p)}
          className={`px-3 py-1.5 text-xs rounded-lg font-semibold capitalize transition-all ${
            chartPeriod === p
              ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}>
          {p === "day" ? "Today" : p === "week" ? "Week" : "Month"}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Area Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Area Chart — Sensor Readings</h3>
          </div>
          {periodToggle}
          <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
            {chartData.length} pts
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mb-5">
          {chartPeriod === "day" ? "Today's" : chartPeriod === "week" ? "Last 7 days" : "This month's"} readings
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <defs>
              {sensors.map((s, i) => (
                <linearGradient key={s.name} id={`ag-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="timestamp"
              tickFormatter={t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
              tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis domain={yDomain} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
            {sensors.map((s, i) => (
              <Area key={s.name} type="monotone" dataKey={s.name}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={`url(#ag-${i})`}
                name={`${s.name}${s.unit ? ` (${s.unit})` : ""}`}
                strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Bar Chart — Sensor Readings</h3>
          </div>
          <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
            {chartData.length} pts
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mb-5">
          {chartPeriod === "day" ? "Today's" : chartPeriod === "week" ? "Last 7 days" : "This month's"} readings
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="timestamp"
              tickFormatter={t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
              tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis domain={yDomain} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
            {sensors.map((s, i) => (
              <Bar key={s.name} dataKey={s.name}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                name={`${s.name}${s.unit ? ` (${s.unit})` : ""}`}
                radius={[5, 5, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </>
  );
};

/* ═══════════════════════════════════════════════
   TIME INPUT
═══════════════════════════════════════════════ */
const TimeInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div onClick={() => { try { (ref.current as any)?.showPicker?.(); } catch { ref.current?.focus(); } }}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-900 transition-all cursor-pointer">
        <Clock className="w-4 h-4 text-gray-400 shrink-0 pointer-events-none" />
        <input ref={ref} type="time" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
          style={{ colorScheme: "auto" }} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   TRIGGER BADGE
═══════════════════════════════════════════════ */
const TriggerBadge = ({ type }: { type: TriggerType }) => {
  const map = {
    time:   "bg-blue-100   dark:bg-blue-900/40   text-blue-700   dark:text-blue-300",
    sensor: "bg-green-100  dark:bg-green-900/40  text-green-700  dark:text-green-300",
    both:   "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${map[type]}`}>{type}</span>;
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function MqttDeviceDetailsView() {
  const [device,           setDevice]           = useState<DeviceData | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [togglingChannel,  setTogglingChannel]  = useState<string | null>(null);
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [selectedChannel,  setSelectedChannel]  = useState("");
  const [startTime,        setStartTime]        = useState("");
  const [endTime,          setEndTime]          = useState("");
  const [triggerType,      setTriggerType]      = useState<TriggerType>("time");
  const [scheduleLabel,    setScheduleLabel]    = useState("");
  const [refreshing,       setRefreshing]       = useState(false);
  const [addingSchedule,   setAddingSchedule]   = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<string | null>(null);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [chartPeriod,      setChartPeriod]      = useState<"day" | "week" | "month">("day");
  const { deviceId } = useParams();



/// for date 


// Add these state variables inside MqttDeviceDetailsView
const [dlType,       setDlType]       = useState<"channel" | "sensor">("channel");
const [dlName,       setDlName]       = useState("");
const [dlStartDate,  setDlStartDate]  = useState("");
const [dlEndDate,    setDlEndDate]    = useState("");
const [dlFormat,     setDlFormat]     = useState<"csv" | "json">("csv");
const [dlLoading,    setDlLoading]    = useState(false);
const [dlStatus,     setDlStatus]     = useState<{ msg: string; ok: boolean } | null>(null);
const [dlExpanded,   setDlExpanded]   = useState(false);

// Add this handler inside MqttDeviceDetailsView
const handleDownload = useCallback(async () => {
  if (!device?.deviceId || !dlName) {
    setDlStatus({ msg: "Device ID and name are required.", ok: false });
    return;
  }
  setDlLoading(true);
  setDlStatus(null);
  try {
    const start = dlStartDate ? new Date(dlStartDate).toISOString() : undefined;
    const end   = dlEndDate   ? new Date(dlEndDate).toISOString()   : undefined;

    const res = dlType === "channel"
      ? await getChannelHistory(device.deviceId, dlName, start, end)
      : await getSensorHistory(device.deviceId, dlName, start, end);

    if (!res.success) throw new Error(res.message || "API returned failure");

    const data: any[] = res.data?.data || [];
    if (!data.length) {
      setDlStatus({ msg: "No records found for the given range.", ok: true });
      setDlLoading(false);
      return;
    }

    const filename = `${device.deviceId}_${dlName}_history`;

    if (dlFormat === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      triggerDownload(blob, `${filename}.json`);
    } else {
      // Build CSV
      let rows: string[][] = [];
      if (dlType === "channel") {
        rows.push(["timestamp", "source", "channel_name", "channel_state", "sensor_name", "sensor_unit", "sensor_value"]);
        for (const r of data) {
          if (r.sensors?.length) {
            for (const s of r.sensors) {
              rows.push([r.timestamp, r.source ?? "", r.channel?.name ?? "", String(r.channel?.state ?? ""), s.name, s.unit, s.value]);
            }
          } else {
            rows.push([r.timestamp, r.source ?? "", r.channel?.name ?? "", String(r.channel?.state ?? ""), "", "", ""]);
          }
        }
      } else {
        rows.push(["timestamp", "sensor_name", "sensor_unit", "sensor_value"]);
        for (const r of data) {
          rows.push([r.timestamp, r.sensor?.name ?? "", r.sensor?.unit ?? "", String(r.sensor?.value ?? "")]);
        }
      }
      const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      triggerDownload(blob, `${filename}.csv`);
    }

    setDlStatus({ msg: `Downloaded ${data.length} record(s).`, ok: true });
  } catch (e: any) {
    setDlStatus({ msg: `Error: ${e.message}`, ok: false });
  }
  setDlLoading(false);
}, [device, dlType, dlName, dlStartDate, dlEndDate, dlFormat]);

const triggerDownload = (blob: Blob, filename: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

  const fetchDeviceDetails = useCallback(async (showRefresh = false) => {
    if (!deviceId) { setError("No device ID provided"); setLoading(false); return; }
    try {
      if (showRefresh) setRefreshing(true); else setLoading(true);
      const res = await getMqttDeviceDetails(deviceId);
      if (res.success && res.data) { setDevice(res.data); setError(null); }
      else setError("Failed to load device details");
    } catch { setError("An error occurred while loading device details"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [deviceId]);

  useEffect(() => { fetchDeviceDetails(); }, [fetchDeviceDetails]);

  const handleToggleChannel = useCallback(async (channelName: string, currentState: boolean) => {
    if (!device?.isOnline) { alert("Device is offline."); return; }
    try {
      setTogglingChannel(channelName);
      const res = await controlDigitalPin(device.deviceId, { channelName, state: !currentState });
      if (res.success) await fetchDeviceDetails(true);
      else alert("Failed to toggle channel.");
    } catch { alert("An error occurred."); }
    finally { setTogglingChannel(null); }
  }, [device, fetchDeviceDetails]);

  const toggleExpandChannel = useCallback((name: string) =>
    setExpandedChannels(prev => {
      const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s;
    }), []);

  const handleAddSchedule = useCallback(async () => {
    if (!selectedChannel) { alert("Please select a channel"); return; }
    if ((triggerType === "time" || triggerType === "both") && (!startTime || !endTime)) { alert("Set both times"); return; }
    if (startTime && endTime && startTime >= endTime) { alert("End time must be after start time"); return; }
    if (!device?.deviceId) return;
    try {
      setAddingSchedule(true);
      const payload = {
        label: scheduleLabel, isActive: true, triggerType,
        time: { startTime, endTime },
        sensor: { sensorName: "", triggerAbove: null, triggerBelow: null, turnOffAbove: null, turnOffBelow: null },
      };
      const res = await addMqttSchedule(selectedChannel, payload, device.deviceId);
      if (res.success) {
        alert("Schedule added!");
        setSelectedChannel(""); setStartTime(""); setEndTime(""); setScheduleLabel(""); setTriggerType("time"); setScheduleExpanded(false);
        await fetchDeviceDetails(true);
      } else alert(res.message || "Failed.");
    } catch { alert("Error adding schedule."); }
    finally { setAddingSchedule(false); }
  }, [selectedChannel, startTime, endTime, triggerType, scheduleLabel, device, fetchDeviceDetails]);

  const handleDeleteSchedule = useCallback(async (channelName: string, idx: number) => {
    if (!device?.deviceId || !window.confirm("Delete this schedule?")) return;
    const key = `${channelName}-${idx}`;
    try {
      setDeletingSchedule(key);
      const res = await deteteMqttSchedule(device.deviceId, channelName, idx);
      if (res.success) { alert("Deleted!"); await fetchDeviceDetails(true); }
      else alert(res.message || "Failed.");
    } catch { alert("Error."); }
    finally { setDeletingSchedule(null); }
  }, [device, fetchDeviceDetails]);

  const getChannelHistory = useCallback((name: string) =>
    (device?.historyLogs || [])
      .filter(l => l.channels.some(c => c.name === name))
      .slice(0, 20)
      .map(l => ({ state: l.channels.find(c => c.name === name)?.state ?? false, timestamp: l.timestamp })),
  [device?.historyLogs]);

  const inputCls = [
    "w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all",
    "border-2 border-gray-200 dark:border-gray-700",
    "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    "focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900",
    "hover:border-indigo-400 dark:hover:border-indigo-600",
  ].join(" ");

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold mt-4">Loading device…</p>
      </div>
    </div>
  );

  if (error || !device) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md text-center border border-gray-100 dark:border-gray-800">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Error Loading Device</h2>
        <p className="text-gray-500 mb-6">{error || "Device not found"}</p>
        <button onClick={() => fetchDeviceDetails()}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition shadow-lg">
          Try Again
        </button>
      </div>
    </div>
  );

  const totalChannelSensors = device.channels.reduce((t, c) => t + c.sensors.length, 0);

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 font-sans transition-colors duration-300">

      {/* ── Hero Header (matches DeviceDataDetails style) ── */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-700 text-white p-5 rounded-xl shadow-lg mx-4 mt-4">
        <div className="max-w-screen-2xl mx-auto px-5 py-3 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white leading-none">
              {device.companyName ? `Company: ${device.companyName}` : device.deviceName}
            </h1>
            <p className="text-sm text-indigo-200 font-mono mt-2">
              Device: {device.deviceName} &nbsp;·&nbsp; ID: {device.deviceId}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchDeviceDetails(true)} disabled={refreshing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/30 transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? "animate-spin" : ""}`} />
              <span className="text-sm font-semibold text-white">Refresh</span>
            </button>
            {device.isOnline ? (
              <div className="flex items-center gap-2 bg-emerald-500 px-4 py-2.5 rounded-xl shadow-lg">
                <Wifi className="w-4 h-4 text-white" />
                <span className="font-bold text-white text-sm">Online</span>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500 px-4 py-2.5 rounded-xl shadow-lg">
                <WifiOff className="w-4 h-4 text-white" />
                <span className="font-bold text-white text-sm">Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 space-y-7">

        {/* ── Device Info + Map ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="relative">
              {device.deviceImage ? (
                <div className="relative w-full h-80 overflow-hidden">
                  <img src={device.deviceImage} alt="Device" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className={`absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md border ${device.isOnline ? "bg-white/90 border-white/50" : "bg-gray-900/80 border-white/10"}`}>
                    <span className={`w-2 h-2 rounded-full ${device.isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    <span className={`text-xs font-bold ${device.isOnline ? "text-emerald-700" : "text-red-400"}`}>
                      {device.isOnline ? "Live" : "Offline"}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-white font-bold text-lg drop-shadow">{device.deviceName}</p>
                    {device.city && <p className="text-white/70 text-xs mt-0.5">{device.city}</p>}
                  </div>
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-white dark:bg-gray-600 rounded-2xl shadow flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-7 h-7 text-indigo-300" />
                    </div>
                    <p className="text-xs text-gray-400">No image available</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-3 py-2">
              <InfoRow label="Last Seen"    value={formatDate(device.lastSeen)} />
              <InfoRow label="Address"      value={device.address || "—"} />
              <InfoRow label="Created"      value={formatDate(device.createdAt)} />
              <InfoRow label="Last Updated" value={formatDate(device.updatedAt)} />
              <InfoRow label="Sensors"      value={`${device.sensors.length} device · ${totalChannelSensors} on channels`} />
              <InfoRow label="Channels"     value={String(device.channels.length)} />
            </div>
          </motion.div>

          {/* Map */}
          {device.mapShow && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="px-5 pt-5 pb-3 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Device Location</h3>
              </div>
              <div className="flex-1 min-h-[280px] overflow-hidden">
                {device.lat && device.long ? (
                  <iframe title="Map" width="100%" height="100%" style={{ border: 0, display: "block" }} loading="lazy" allowFullScreen
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(device.long) - 0.01},${parseFloat(device.lat) - 0.01},${parseFloat(device.long) + 0.01},${parseFloat(device.lat) + 0.01}&layer=mapnik&marker=${device.lat},${device.long}`}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 dark:bg-gray-700">
                    Location data not available
                  </div>
                )}
              </div>
              <div className="px-5 py-4 border-t border-gray-50 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Address</p>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{device.address || "No address"}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Live Sensor Readings ── */}
        {device.sensors.length > 0 && (
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-4">
              <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-xl">⚡</motion.span>
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Live Sensor Readings</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 dark:from-indigo-700 to-transparent" />
              <AnimatePresence>
                {device.isOnline && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-700/50 rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <div className="relative group rounded-2xl shadow overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-500 opacity-40 group-hover:opacity-100 transition-all duration-500 z-0" />
              <div className="relative z-10 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {device.sensors.map((s, idx) => (
                    <LiveStatCard key={s.name} label={s.name} value={s.lastValue} unit={s.unit} index={idx} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Device Sensor Graphs ── */}
        {device.sensors.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Sensor History</h2>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-bold">
                {device.sensors.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {device.sensors.map((s, idx) => (
                <SensorGraph key={idx} sensor={s} historyLogs={device.historyLogs} />
              ))}
            </div>
          </div>
        )}

        {/* ── Recharts Area + Bar ── */}
        {device.sensors.length > 0 && device.historyLogs.length > 1 && (
          <MqttCharts
            historyLogs={device.historyLogs}
            sensors={device.sensors}
            chartPeriod={chartPeriod}
            setChartPeriod={setChartPeriod}
          />
        )}

        {/* ── History Data Table ── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-50 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">History Logs</h3>
              <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold">
                {device.historyLogs.length}
              </span>
            </div>
          </div>
          <MqttDataTable historyLogs={device.historyLogs} sensors={device.sensors} />
        </div>

        {/* ── Channels ── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Channels</h2>
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold">
              {device.channels.length}
            </span>
          </div>

          {device.channels.length > 0 ? (
            <div className="space-y-6">
              {device.channels.map((channel, idx) => {
                const isExpanded = expandedChannels.has(channel.name);
                const history    = getChannelHistory(channel.name);

                return (
                  <div key={idx} className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl
                    ${channel.state
                      ? "border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-950"
                      : "border-gray-200 dark:border-gray-700 shadow-md"}`}>

                    {/* Channel header */}
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${channel.state ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg capitalize">
                            {channel.name.replace(/_/g, " ")}
                          </h3>
                          {channel.successMsg && (
                            <span className={`inline-flex items-center gap-1 mt-1 text-xs px-3 py-1 rounded-full font-semibold ${
                              channel.successCode === 0
                                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            }`}>
                              {channel.successMsg}
                            </span>
                          )}
                          {channel.sensors.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg w-fit">
                              <Activity className="w-3 h-3" />
                              <span className="font-semibold">{channel.sensors.length} sensor{channel.sensors.length > 1 ? "s" : ""}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${channel.state ? "bg-emerald-500 animate-pulse" : "bg-gray-300 dark:bg-gray-600"}`} />
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold ${channel.state ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                            {channel.state ? "ON" : "OFF"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleChannel(channel.name, channel.state)}
                          disabled={togglingChannel === channel.name || !device.isOnline}
                          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl
                            ${togglingChannel === channel.name || !device.isOnline
                              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                              : channel.state
                                ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                                : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
                            }`}>
                          {togglingChannel === channel.name ? "Wait…" : !device.isOnline ? "Offline" : `Turn ${channel.state ? "OFF" : "ON"}`}
                        </button>
                      </div>
                    </div>

                    {/* Channel sensors */}
                    {channel.sensors.length > 0 && (
                      <div className="mb-5 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 rounded-2xl border-l-4 border-indigo-400 dark:border-indigo-600 shadow-md">
                        <div className="flex items-center gap-2 mb-4">
                          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <h4 className="font-bold text-gray-800 dark:text-gray-100">Attached Sensors</h4>
                          <span className="px-2 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold">
                            {channel.sensors.length}
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {channel.sensors.map((s, sIdx) => <SensorMiniCard key={sIdx} sensor={s} />)}
                        </div>
                      </div>
                    )}

                    {/* Schedules */}
                    {channel.schedules?.length > 0 && (
                      <div className="mb-5 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30 rounded-2xl border-l-4 border-purple-400 dark:border-purple-600 shadow-md">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h4 className="font-bold text-gray-800 dark:text-gray-100">Schedules</h4>
                          <span className="px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                            {channel.schedules.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {channel.schedules.map((sch, sIdx) => (
                            <div key={sIdx} className="bg-white dark:bg-gray-900 rounded-xl p-4 border-2 border-purple-100 dark:border-purple-800/50 shadow-sm">
                              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <TriggerBadge type={sch.triggerType} />
                                  {sch.label && <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{sch.label}</span>}
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sch.isActive ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                                    {sch.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <button onClick={() => handleDeleteSchedule(channel.name, sIdx)}
                                  disabled={deletingSchedule === `${channel.name}-${sIdx}`}
                                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                  {deletingSchedule === `${channel.name}-${sIdx}`
                                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />}
                                </button>
                              </div>
                              {(sch.triggerType === "time" || sch.triggerType === "both") && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-700 dark:text-gray-300">
                                  <Clock className="w-4 h-4 text-purple-500" />
                                  <span className="font-bold">{sch.time.startTime} → {sch.time.endTime}</span>
                                </div>
                              )}
                              {sch.lastTriggered && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Last triggered: {formatDate(sch.lastTriggered)}
                                  {sch.lastAction && <span className="ml-1 font-semibold capitalize">({sch.lastAction})</span>}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity log */}
                    <div className="border-t-2 border-gray-100 dark:border-gray-700 pt-4">
                      <button onClick={() => toggleExpandChannel(channel.name)}
                        className="w-full flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          <span>Activity Log</span>
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold">
                            {history.length}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {isExpanded && history.length > 0 && (
                        <div className="mt-4 max-h-72 overflow-y-auto space-y-2 px-2">
                          {history.map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${log.state ? "bg-emerald-500" : "bg-red-500"}`} />
                                <span className={`text-sm font-semibold ${log.state ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                                  {log.state ? "Turned ON" : "Turned OFF"}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 font-mono">{formatTime(log.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No channels configured</p>
            </div>
          )}
        </div>



        {/* ── Download History ── */}
<div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
  <button onClick={() => setDlExpanded(p => !p)}
    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg">
        <Database className="w-6 h-6 text-white" />
      </div>
      <div className="text-left">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Download History</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Export channel or sensor data by date range</p>
      </div>
    </div>
    <div className={`p-2 rounded-xl transition ${dlExpanded ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
      {dlExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
    </div>
  </button>

  {dlExpanded && (
    <div className="px-8 pb-8 border-t-2 border-gray-100 dark:border-gray-800 pt-6 space-y-6">

      {/* Type + Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type</label>
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold h-[50px]">
            {(["channel", "sensor"] as const).map(t => (
              <button key={t} type="button" onClick={() => { setDlType(t); setDlName(""); }}
                className={`flex-1 capitalize transition ${dlType === t ? "bg-emerald-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {dlType === "channel" ? "Channel" : "Sensor"} Name
          </label>
          {dlType === "channel" ? (
            <select value={dlName} onChange={e => setDlName(e.target.value)} className={inputCls}>
              <option value="">Choose a channel…</option>
              {device.channels.map(c => (
                <option key={c.name} value={c.name}>{c.name.replace(/_/g, " ")}</option>
              ))}
            </select>
          ) : (
            <select value={dlName} onChange={e => setDlName(e.target.value)} className={inputCls}>
              <option value="">Choose a sensor…</option>
              {/* device-level sensors */}
              {device.sensors.map(s => (
                <option key={s.name} value={s.name}>{s.name} ({s.unit})</option>
              ))}
              {/* channel-level sensors */}
              {device.channels.flatMap(c => c.sensors).map(s => (
                <option key={s.name} value={s.name}>{s.name} ({s.unit})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Date Range + Format */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
          <input type="datetime-local" value={dlStartDate} onChange={e => setDlStartDate(e.target.value)}
            className={inputCls} style={{ colorScheme: "auto" }} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
          <input type="datetime-local" value={dlEndDate} onChange={e => setDlEndDate(e.target.value)}
            className={inputCls} style={{ colorScheme: "auto" }} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Format</label>
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold h-[50px]">
            {(["csv", "json"] as const).map(f => (
              <button key={f} type="button" onClick={() => setDlFormat(f)}
                className={`flex-1 uppercase transition ${dlFormat === f ? "bg-emerald-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      {dlStatus && (
        <div className={`px-4 py-3 rounded-xl text-sm font-semibold border ${
          dlStatus.ok
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
        }`}>
          {dlStatus.msg}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button onClick={handleDownload} disabled={dlLoading || !dlName}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {dlLoading ? (
            <><RefreshCw className="w-5 h-5 animate-spin" />Fetching…</>
          ) : (
            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>Download {dlFormat.toUpperCase()}</>
          )}
        </button>
      </div>

    </div>
  )}
</div>

        {/* ── Add Schedule ── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <button onClick={() => setScheduleExpanded(p => !p)}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add Schedule</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure time or sensor-based triggers</p>
              </div>
            </div>
            <div className={`p-2 rounded-xl transition ${scheduleExpanded ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
              {scheduleExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {scheduleExpanded && (
            <div className="px-8 pb-8 border-t-2 border-gray-100 dark:border-gray-800 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Channel</label>
                  <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)} className={inputCls}>
                    <option value="">Choose a channel…</option>
                    {device.channels.map(c => <option key={c.name} value={c.name}>{c.name.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Label (optional)</label>
                  <input type="text" value={scheduleLabel} onChange={e => setScheduleLabel(e.target.value)}
                    placeholder="e.g. Morning Run" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Trigger Type</label>
                  <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold h-[50px]">
                    {(["time", "sensor", "both"] as TriggerType[]).map(t => (
                      <button key={t} type="button" onClick={() => setTriggerType(t)}
                        className={`flex-1 capitalize transition ${triggerType === t ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {(triggerType === "time" || triggerType === "both") && (
                  <>
                    <TimeInput label="Start Time" value={startTime} onChange={setStartTime} />
                    <TimeInput label="End Time"   value={endTime}   onChange={setEndTime} />
                  </>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleAddSchedule} disabled={addingSchedule || !selectedChannel}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {addingSchedule
                    ? <><RefreshCw className="w-5 h-5 animate-spin" />Adding…</>
                    : <><Plus className="w-5 h-5" />Add Schedule</>}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}