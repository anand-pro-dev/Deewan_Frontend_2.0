import React, { useEffect, useState, useMemo, useCallback } from "react";
import { X, MapPin, Wifi, WifiOff, Lightbulb, Activity, Clock, Plus, Trash2, Calendar, ChevronDown, ChevronUp, Zap, TrendingUp, RefreshCw } from "lucide-react";
import { getMqttDeviceDetails, controlDigitalPin, addMqttSchedule, deteteMqttSchedule } from "../../apis/mqtt_api";
import { useParams } from "react-router-dom";

interface Schedule {
  startTime: string; endTime: string;
  lastRun?: { start: string | null; end: string | null };
}
interface Sensor { name: string; minValue: number; maxValue: number; lastValue: number; }
interface Output {
  name: string; pin: number; state: boolean;
  successMsg?: string; successCode?: number;
  lastTimestamp: string | null; schedules: Schedule[]; sensors: Sensor[];
}
interface HistoryLog {
  timestamp: string;
  sensors: Array<{ name: string; value: number }>;
  outputs: Array<{ name: string; state: boolean }>;
}
interface DeviceData {
  deviceId: string; deviceName: string; companyName: string;
  city: string; address: string; lat: string; long: string;
  isOnline: boolean; lastSeen: string | null;
  mapShow: boolean; emailNoti: boolean; deviceImage: string | null;
  deviceActiveData: string; adminId: string;
  adminFirstName: string; adminLastName: string;
  outputs: Output[]; historyLogs: HistoryLog[];
  createdAt: string; updatedAt: string;
}

// ─── TimeInput — opens native picker reliably on all browsers ─────────────────
const TimeInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const ref = React.useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (!ref.current) return;
    try {
      (ref.current as any).showPicker?.();
    } catch {
      ref.current.focus();
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div
        onClick={openPicker}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-900 transition-all cursor-pointer"
      >
        {/* Clock icon */}
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <input
          ref={ref}
          type="time"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer min-w-0"
          style={{ colorScheme: "auto" }}
        />
      </div>
    </div>
  );
};

export default function MqttDeviceDetailsView() {
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingOutput, setTogglingOutput] = useState<string | null>(null);
  const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set());
  const [selectedOutput, setSelectedOutput] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<string | null>(null);
  const { deviceId } = useParams();

  const fetchDeviceDetails = useCallback(async (showRefreshIndicator = false) => {
    if (!deviceId) { setError("No device ID provided"); setLoading(false); return; }
    try {
      if (showRefreshIndicator) setRefreshing(true); else setLoading(true);
      const response = await getMqttDeviceDetails(deviceId);
      if (response.success && response.data) { setDevice(response.data); setError(null); }
      else setError("Failed to load device details");
    } catch (err) { console.error(err); setError("An error occurred while loading device details"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [deviceId]);

  useEffect(() => { fetchDeviceDetails(); }, [fetchDeviceDetails]);

  const handleToggleOutput = useCallback(async (outputName: string, currentState: boolean) => {
    if (!device?.isOnline) { alert("Device is offline. Cannot control outputs."); return; }
    try {
      setTogglingOutput(outputName);
      const response = await controlDigitalPin(device.deviceId, { outputName, state: !currentState });
      if (response.success) await fetchDeviceDetails(true);
      else alert("Failed to toggle output. Please try again.");
    } catch (err) { console.error(err); alert("An error occurred while toggling the output"); }
    finally { setTogglingOutput(null); }
  }, [device, fetchDeviceDetails]);

  const toggleExpandOutput = useCallback((outputName: string) => {
    setExpandedOutputs(prev => {
      const s = new Set(prev);
      s.has(outputName) ? s.delete(outputName) : s.add(outputName);
      return s;
    });
  }, []);

  const formatDate = useCallback((d: string | null) =>
    d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never", []);

  const formatTimeOnly = useCallback((d: string | null) =>
    d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "N/A", []);

  const getOutputIcon = useCallback((name: string) => {
    const n = name.toLowerCase();
    return n.includes("led") || n.includes("light") ? <Lightbulb className="w-5 h-5" /> : <Zap className="w-5 h-5" />;
  }, []);

  const getOutputColor = useCallback((name: string, state: boolean) => {
    if (!state) return {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-400 dark:text-gray-500",
      border: "border-gray-300 dark:border-gray-700",
      glow: "",
    };
    const n = name.toLowerCase();
    if (n.includes("alert") || n.includes("warning")) return {
      bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400",
      border: "border-red-400 dark:border-red-700", glow: "shadow-red-200 dark:shadow-red-950",
    };
    if (n.includes("status")) return {
      bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-400 dark:border-blue-700", glow: "shadow-blue-200 dark:shadow-blue-950",
    };
    return {
      bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-400 dark:border-amber-700", glow: "shadow-amber-200 dark:shadow-amber-950",
    };
  }, []);

  const getOutputHistory = useCallback((outputName: string) => {
    if (!device?.historyLogs) return [];
    return device.historyLogs
      .filter(log => log.outputs.some(o => o.name === outputName)).slice(0, 20)
      .map(log => ({ state: log.outputs.find(o => o.name === outputName)?.state || false, timestamp: log.timestamp }));
  }, [device?.historyLogs]);

  const getOutputHistoryCount = useCallback((outputName: string) => {
    if (!device?.historyLogs) return 0;
    let count = 0, prev: boolean | null = null;
    device.historyLogs.filter(log => log.outputs.some(o => o.name === outputName)).forEach(log => {
      const o = log.outputs.find(o => o.name === outputName);
      if (o && prev !== null && prev !== o.state) count++;
      if (o) prev = o.state;
    });
    return count;
  }, [device?.historyLogs]);

  const handleAddSchedule = useCallback(async () => {
    if (!selectedOutput || !startTime || !endTime) { alert("Please select an output and set both start and end times"); return; }
    if (startTime >= endTime) { alert("End time must be after start time"); return; }
    if (!device?.deviceId) { alert("Device ID not found"); return; }
    try {
      setAddingSchedule(true);
      const response = await addMqttSchedule(selectedOutput, { startTime, endTime }, device.deviceId);
      if (response.success) {
        alert("Schedule added successfully!");
        setSelectedOutput(""); setStartTime(""); setEndTime("");
        await fetchDeviceDetails(true);
      } else alert(response.message || "Failed to add schedule.");
    } catch (err) { console.error(err); alert("An error occurred while adding the schedule"); }
    finally { setAddingSchedule(false); }
  }, [selectedOutput, startTime, endTime, device?.deviceId, fetchDeviceDetails]);

  const handleDeleteSchedule = useCallback(async (outputName: string, scheduleIndex: number) => {
    if (!device?.deviceId) { alert("Device ID not found"); return; }
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const key = `${outputName}-${scheduleIndex}`;
      setDeletingSchedule(key);
      const response = await deteteMqttSchedule(device.deviceId, outputName, scheduleIndex);
      if (response.success) { alert("Schedule deleted successfully!"); await fetchDeviceDetails(true); }
      else alert(response.message || "Failed to delete schedule.");
    } catch (err) { console.error(err); alert("An error occurred while deleting the schedule"); }
    finally { setDeletingSchedule(null); }
  }, [device?.deviceId, fetchDeviceDetails]);

  const totalSensors = useMemo(() => device?.outputs?.reduce((t, o) => t + o.sensors.length, 0) || 0, [device?.outputs]);
  const totalOutputs = device?.outputs?.length || 0;

  // Shared input style — works in both light and dark
  const inputCls = [
    "w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all",
    "border-2 border-gray-200 dark:border-gray-700",
    "bg-white dark:bg-gray-800",
    "text-gray-800 dark:text-gray-200",
    "placeholder-gray-400 dark:placeholder-gray-500",
    "cursor-pointer",
    "focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900",
    "hover:border-blue-400 dark:hover:border-blue-600",
  ].join(" ");

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold mt-4">Loading device details...</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Please wait</p>
      </div>
    </div>
  );

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !device) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md text-center border border-gray-100 dark:border-gray-800">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">Error Loading Device</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{error || "Device not found"}</p>
        <button onClick={() => fetchDeviceDetails()}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition shadow-lg">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 transition-colors">
      <div className="max-w-7xl mx-auto">

        {/* ── Hero Card ──────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden mb-8 border border-gray-100 dark:border-gray-800">

          {/*
            Banner always uses a deep gradient + bg-black/25 overlay.
            This guarantees white text is visible in BOTH light and dark OS modes
            without relying on the browser's color-scheme inversion.
          */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />

            <div className="relative flex items-start justify-between flex-wrap gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white drop-shadow-lg">
                  {device.deviceName || "Unnamed Device"}
                </h1>
                <p className="text-white/80 text-sm font-mono bg-white/20 border border-white/30 inline-block px-3 py-1 rounded-lg">
                  ID: {device.deviceId}
                </p>
                <p className="text-white text-xl mt-3 font-semibold drop-shadow">
                  {device.companyName}
                </p>
              </div>

              <div className="flex flex-col gap-3 shrink-0">
                {/* Refresh button — white text explicitly set, not inherited */}
                <button
                  onClick={() => fetchDeviceDetails(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/35 px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all border border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${refreshing ? "animate-spin" : ""}`} />
                  <span className="font-semibold text-white text-sm">Refresh</span>
                </button>

                {device.isOnline ? (
                  <div className="flex items-center gap-2 bg-emerald-500 px-5 py-3 rounded-xl shadow-lg">
                    <Wifi className="w-4 h-4 text-white" />
                    <span className="font-bold text-white">Online</span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-red-500 px-5 py-3 rounded-xl shadow-lg">
                    <WifiOff className="w-4 h-4 text-white" />
                    <span className="font-bold text-white">Offline</span>
                  </div>
                )}

                <div className="text-white/80 text-xs bg-white/10 border border-white/20 px-3 py-2 rounded-lg text-right backdrop-blur-sm">
                  Last seen: {formatDate(device.lastSeen)}
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
            {[
              {
                icon: <MapPin className="w-8 h-8 text-white" />, iconBg: "bg-blue-500",
                label: "Location", labelColor: "text-blue-700 dark:text-blue-400",
                cardBg: "from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
                primary: device.city, secondary: device.address,
              },
              {
                icon: <Activity className="w-8 h-8 text-white" />, iconBg: "bg-emerald-500",
                label: "Total Sensors", labelColor: "text-emerald-700 dark:text-emerald-400",
                cardBg: "from-green-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 border-green-200 dark:border-emerald-800",
                primary: String(totalSensors), secondary: "Active monitoring",
              },
              {
                icon: <Lightbulb className="w-8 h-8 text-white" />, iconBg: "bg-purple-500",
                label: "Total Outputs", labelColor: "text-purple-700 dark:text-purple-400",
                cardBg: "from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200 dark:border-purple-800",
                primary: String(totalOutputs), secondary: "Control points",
              },
            ].map(({ icon, iconBg, label, labelColor, cardBg, primary, secondary }) => (
              <div key={label} className="group hover:scale-[1.03] transition-transform duration-300">
                <div className={`flex items-center gap-4 p-6 bg-gradient-to-br ${cardBg} rounded-2xl shadow-md hover:shadow-xl transition-shadow border`}>
                  <div className={`p-4 ${iconBg} rounded-xl shadow-lg shrink-0`}>{icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold mb-1 ${labelColor}`}>{label}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-2xl truncate">{primary}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{secondary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Outputs column */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-lg">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  Outputs &amp; Schedules
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold">
                    {totalOutputs}
                  </span>
                </h2>
              </div>

              {device.outputs?.length > 0 ? (
                <div className="space-y-6">
                  {device.outputs.map((output, idx) => {
                    const colors = getOutputColor(output.name, output.state);
                    const isExpanded = expandedOutputs.has(output.name);
                    const outputHistory = getOutputHistory(output.name);
                    const historyCount = getOutputHistoryCount(output.name);

                    return (
                      <div key={idx} className={`border-2 ${colors.border} rounded-2xl p-6 transition-all duration-300 ${output.state ? `shadow-xl ${colors.glow}` : "shadow-md"} hover:shadow-2xl`}>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${colors.bg} ${colors.text} ${output.state ? "shadow-lg" : ""}`}>
                              {getOutputIcon(output.name)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg capitalize">
                                {output.name.replace(/_/g, " ")}
                              </h3>
                              {output.successMsg && (
                                <div className={`flex items-center gap-2 mt-2 text-sm px-4 py-2 rounded-xl inline-flex ${
                                  output.successCode === 0
                                    ? "text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40"
                                    : "text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/40"
                                }`}>
                                  <span className="font-semibold">{output.successMsg}</span>
                                </div>
                              )}
                              {output.sensors.length > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-lg w-fit">
                                  <Activity className="w-3 h-3" />
                                  <span className="font-semibold">{output.sensors.length} sensor{output.sensors.length > 1 ? "s" : ""} linked</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full ${output.state ? "bg-emerald-500 shadow-lg shadow-emerald-300 dark:shadow-emerald-900 animate-pulse" : "bg-gray-300 dark:bg-gray-600"}`} />
                              <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${output.state ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                                {output.state ? "ON" : "OFF"}
                              </span>
                            </div>
                            <button
                              onClick={() => handleToggleOutput(output.name, output.state)}
                              disabled={togglingOutput === output.name || !device.isOnline}
                              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl ${
                                togglingOutput === output.name || !device.isOnline
                                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                  : output.state
                                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                              }`}
                            >
                              {togglingOutput === output.name ? "Wait..." : !device.isOnline ? "Offline" : `Turn ${output.state ? "OFF" : "ON"}`}
                            </button>
                          </div>
                        </div>

                        {/* Sensors */}
                        {output.sensors.length > 0 && (
                          <div className="mb-5 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 rounded-2xl border-l-4 border-blue-400 dark:border-blue-600 shadow-md">
                            <div className="flex items-center gap-2 mb-4">
                              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <h4 className="font-bold text-gray-800 dark:text-gray-100">Linked Sensors</h4>
                              <span className="px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">{output.sensors.length}</span>
                            </div>
                            <div className="grid gap-3">
                              {output.sensors.map((sensor, sIdx) => (
                                <div key={sIdx} className="bg-white dark:bg-gray-900 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="font-bold text-gray-800 dark:text-gray-100">{sensor.name}</h5>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: {sensor.minValue} – {sensor.maxValue}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sensor.lastValue}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Schedules */}
                        {output.schedules?.length > 0 && (
                          <div className="mb-5 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30 rounded-2xl border-l-4 border-purple-400 dark:border-purple-600 shadow-md">
                            <div className="flex items-center gap-2 mb-4">
                              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              <h4 className="font-bold text-gray-800 dark:text-gray-100">Active Schedules</h4>
                              <span className="px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">{output.schedules.length}</span>
                            </div>
                            <div className="space-y-3">
                              {output.schedules.map((schedule, sIdx) => (
                                <div key={sIdx} className="bg-white dark:bg-gray-900 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                      <span className="text-base font-bold text-gray-800 dark:text-gray-100">{schedule.startTime} → {schedule.endTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-sm">Active</span>
                                      <button
                                        onClick={() => handleDeleteSchedule(output.name, sIdx)}
                                        disabled={deletingSchedule === `${output.name}-${sIdx}`}
                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                                      >
                                        {deletingSchedule === `${output.name}-${sIdx}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </div>
                                  {schedule.lastRun && (schedule.lastRun.start || schedule.lastRun.end) && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                                      <span className="font-semibold">Last run:</span> {schedule.lastRun.start || "N/A"} to {schedule.lastRun.end || "N/A"}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Activity Log */}
                        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                          <button
                            onClick={() => toggleExpandOutput(output.name)}
                            className="w-full flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5" />
                              <span>Activity Log</span>
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full text-xs">{historyCount} events</span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>

                          {isExpanded && outputHistory.length > 0 && (
                            <div className="mt-4 max-h-80 overflow-y-auto space-y-2 px-2">
                              {outputHistory.map((log, logIdx) => (
                                <div key={logIdx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${log.state ? "bg-emerald-500" : "bg-red-500"}`} />
                                    <span className={`text-sm font-semibold ${log.state ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                                      {log.state ? "Turned ON" : "Turned OFF"}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{formatTimeOnly(log.timestamp)}</span>
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
                    <Lightbulb className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No outputs configured</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 sticky top-4">

              {/* Add Schedule */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Add Schedule</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Output</label>
                  <select value={selectedOutput} onChange={e => setSelectedOutput(e.target.value)} className={inputCls}>
                    <option value="">Choose an output...</option>
                    {device.outputs.map(o => <option key={o.name} value={o.name}>{o.name.replace(/_/g, " ")}</option>)}
                  </select>
                </div>

                <TimeInput label="Start Time" value={startTime} onChange={setStartTime} />
                <TimeInput label="End Time" value={endTime} onChange={setEndTime} />

                <button
                  onClick={handleAddSchedule}
                  disabled={addingSchedule || !selectedOutput || !startTime || !endTime}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-300 dark:disabled:from-gray-700 disabled:to-gray-400 dark:disabled:to-gray-600 disabled:cursor-not-allowed"
                >
                  {addingSchedule
                    ? <><RefreshCw className="w-5 h-5 animate-spin" />Adding...</>
                    : <><Plus className="w-5 h-5" />Add Schedule</>}
                </button>
              </div>

              {/* Device Info */}
              <div className="mt-8 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Device Information
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Admin",        value: `${device.adminFirstName} ${device.adminLastName}` },
                    { label: "Created",      value: formatDate(device.createdAt) },
                    { label: "Last Updated", value: formatDate(device.updatedAt) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Status</span>
                    <span className={`font-semibold ${device.isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {device.deviceActiveData}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}