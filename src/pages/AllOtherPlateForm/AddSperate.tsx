import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  createConnectWithOther,
  getSingleConnectWtithOther,
  updateConnectWithOther,
} from "../../apis/apiConnectSite";
import {
  X, Server, Link2, Clock, Database, Key, Settings, AlertCircle,
  Info, Play, Square, Save, ChevronDown, Plus, Trash2, Lock,
  Globe, HardDrive, RefreshCw, ExternalLink, User, Calendar
} from "lucide-react";

interface AddSperateProps {
  Cancel: () => void;
  deviceId: any;
  indexId: any;
  dataWithPlatform: any;
  DataParameterFilter: any;
}

const intervalOptions = [
  "30 sec","1 min","3 min","10 min","15 min","20 min",
  "30 min","45 min","60 min","2 hrs","4 hrs","6 hrs",
  "10 hrs","12 hrs","1 day",
];

const KEY_LABELS = ["A","B","C","D","E","F","G","H","I","J"];

const DatePickerInput = ({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    if (!ref.current) return;
    ref.current.focus();
    try { (ref.current as any).showPicker?.(); } catch (_) {}
  };
  return (
    <div className="relative w-full cursor-pointer" onClick={openPicker}>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        className="
          w-full rounded-xl border border-gray-200 bg-white
          px-3.5 py-2.5 pr-10 text-sm text-gray-800
          transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200
          cursor-pointer
          [color-scheme:light] dark:[color-scheme:dark]
        "
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>
    </div>
  );
};

export default function AddSperate({
  Cancel, deviceId, dataWithPlatform, indexId, DataParameterFilter
}: AddSperateProps) {

  const getInitialConnectionType = () => {
    if (dataWithPlatform === "recieve") return "receive";
    return "api";
  };

  const [form, setForm] = useState({
    timeIntervelSet: "3 min",
    typeToConnect: getInitialConnectionType(),
    deviceName: "",
    sendingPlace: "",
    url: "",
    shareToOtherPlateform: "stop",
    apiHeaders: {} as Record<string, string>,
    ftpHost: "",
    ftpPort: 21,
    ftpUser: "",
    ftpPassword: "",
    ftpPath: "",
    keys:   { a:"",b:"",c:"",d:"",e:"",f:"",g:"",h:"",i:"",j:"" },
    values: { a:"",b:"",c:"",d:"",e:"",f:"",g:"",h:"",i:"",j:"" },
    // Optional extra reference — always saved alongside any connection type
    otherData: {
      otherLink:  "",
      userId:     "",
      password:   "",
      activeDate: "",
    },
  });

  const [errors, setErrors] = useState({
    typeToConnect:"", deviceName:"", sendingPlace:"",
    ftpHost:"", ftpUser:"", url:"", keyValue:""
  });

  const [submitting, setSubmitting]       = useState(false);
  const [isExisting, setIsExisting]       = useState(false);
  const [headerKey, setHeaderKey]         = useState("");
  const [headerValue, setHeaderValue]     = useState("");
  const [showOtherData, setShowOtherData] = useState(false);

  const keyInputRefs   = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const valueInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getSingleConnectWtithOther(indexId);
        if (res?.data) {
          const d = res.data;
          setIsExisting(true);
          const od = d.otherData || {};
          // Auto-expand section if previously saved data exists
          if (od.otherLink || od.userId || od.password || od.activeDate) {
            setShowOtherData(true);
          }
          setForm(prev => ({
            ...prev,
            timeIntervelSet: d.timeIntervelSet || "3 min",
            typeToConnect: d.typeToConnect || getInitialConnectionType(),
            deviceName: d.deviceName || "",
            sendingPlace: d.sendingPlace || "",
            shareToOtherPlateform: d.shareToOtherPlateform || "stop",
            url: d.url || "",
            apiHeaders: d.apiHeaders || {},
            ftpHost: d.ftpHost || "",
            ftpPort: d.ftpPort || 21,
            ftpUser: d.ftpUser || "",
            ftpPassword: d.ftpPassword || "",
            ftpPath: d.ftpPath || "",
            keys:   { ...prev.keys,   ...(d.keys   || {}) },
            values: { ...prev.values, ...(d.values || {}) },
            otherData: {
              otherLink:  od.otherLink  || "",
              userId:     od.userId     || "",
              password:   od.password   || "",
              activeDate: od.activeDate || "",
            },
          }));
        }
      } catch (err) { console.error("Failed to fetch data:", err); }
    };
    if (deviceId && indexId) fetchData();
  }, [deviceId, indexId]);

  const filterEmptyValues = (obj: Record<string, string>) =>
    Object.entries(obj).reduce((acc, [k, v]) => {
      if (v?.trim()) acc[k] = v.trim();
      return acc;
    }, {} as Record<string, string>);

  const validateForm = () => {
    let valid = true;
    const e = { typeToConnect:"", deviceName:"", sendingPlace:"", ftpHost:"", ftpUser:"", url:"", keyValue:"" };
    if (!form.typeToConnect)                                                        { e.typeToConnect = "Connection type is required.";  valid = false; }
    if (!form.deviceName.trim())                                                    { e.deviceName    = "Device name is required.";       valid = false; }
    if (form.typeToConnect !== "receive" && !form.sendingPlace.trim())              { e.sendingPlace  = "Sending place is required.";     valid = false; }
    if ((form.typeToConnect === "api" || form.typeToConnect === "receive") && !form.url.trim()) { e.url = "URL is required."; valid = false; }
    if (form.typeToConnect === "ftp") {
      if (!form.ftpHost.trim()) { e.ftpHost = "FTP Host is required."; valid = false; }
      if (!form.ftpUser.trim()) { e.ftpUser = "FTP User is required."; valid = false; }
    }
    if (form.typeToConnect !== "receive") {
      const kvErrors: string[] = [];
      KEY_LABELS.forEach(label => {
        const key = label.toLowerCase();
        const kv = form.keys[key as keyof typeof form.keys]?.trim();
        const vv = form.values[key as keyof typeof form.values]?.trim();
        if (kv && !vv) { kvErrors.push(`Key ${label} requires a value`); valid = false; }
        if (vv && !kv) { kvErrors.push(`Value ${label} requires a key`); valid = false; }
      });
      if (kvErrors.length) e.keyValue = kvErrors.join(", ");
    }
    setErrors(e);
    return valid;
  };

  const handleKeyChange   = (key: string, value: string) => setForm(prev => ({ ...prev, keys:   { ...prev.keys,   [key]: value } }));
  const handleValueChange = (key: string, value: string) => setForm(prev => ({ ...prev, values: { ...prev.values, [key]: value } }));
  const handleOtherDataChange = (field: keyof typeof form.otherData, value: string) =>
    setForm(prev => ({ ...prev, otherData: { ...prev.otherData, [field]: value } }));

  const addApiHeader = () => {
    if (headerKey.trim() && headerValue.trim()) {
      setForm(prev => ({ ...prev, apiHeaders: { ...prev.apiHeaders, [headerKey.trim()]: headerValue.trim() } }));
      setHeaderKey(""); setHeaderValue("");
    }
  };

  const removeApiHeader = (key: string) => {
    const h = { ...form.apiHeaders }; delete h[key];
    setForm(prev => ({ ...prev, apiHeaders: h }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        deviceName: form.deviceName.trim(), deviceId, dataWithPlatform,
        timeIntervelSet: form.timeIntervelSet, typeToConnect: form.typeToConnect,
        shareToOtherPlateform: form.shareToOtherPlateform,
        keys: filterEmptyValues(form.keys), values: filterEmptyValues(form.values),
        // Always include otherData — partial fills are fine, all fields optional
        otherData: {
          otherLink:  form.otherData.otherLink.trim(),
          userId:     form.otherData.userId.trim(),
          password:   form.otherData.password.trim(),
          activeDate: form.otherData.activeDate.trim(),
        },
      };
      if (form.typeToConnect !== "receive") payload.sendingPlace = form.sendingPlace.trim();
      if (form.typeToConnect === "api") {
        payload.url = form.url.trim();
        const h = filterEmptyValues(form.apiHeaders);
        if (Object.keys(h).length) payload.apiHeaders = h;
      } else if (form.typeToConnect === "ftp") {
        payload.ftpHost = form.ftpHost.trim(); payload.ftpPort = form.ftpPort;
        payload.ftpUser = form.ftpUser.trim();
        if (form.ftpPassword.trim()) payload.ftpPassword = form.ftpPassword.trim();
        if (form.ftpPath.trim())     payload.ftpPath     = form.ftpPath.trim();
      } else if (form.typeToConnect === "receive") {
        payload.url = form.url.trim();
      }
      if (isExisting) { await updateConnectWithOther(indexId, payload); alert("✅ Device updated successfully."); }
      else            { await createConnectWithOther(payload);          alert("✅ Device added successfully.");  }
      Cancel();
      window.location.reload();
    } catch (err) {
      console.error("❌ API Error:", err);
      alert("Failed to save device.");
    } finally { setSubmitting(false); }
  };

  const getAvailableConnectionTypes = () => {
    if (dataWithPlatform === "recieve") return [{ value:"receive", label:"Receive Data", icon:<RefreshCw className="w-4 h-4"/> }];
    if (dataWithPlatform === "send")    return [{ value:"api", label:"API Send", icon:<Globe className="w-4 h-4"/> }, { value:"ftp", label:"FTP Send", icon:<HardDrive className="w-4 h-4"/> }];
    return [
      { value:"api",     label:"API Send",     icon:<Globe      className="w-4 h-4"/> },
      { value:"ftp",     label:"FTP Send",     icon:<HardDrive  className="w-4 h-4"/> },
      { value:"receive", label:"Receive Data", icon:<RefreshCw  className="w-4 h-4"/> },
    ];
  };

  const getConnectionTypeLabel = () => ({ api:"API Send Settings", ftp:"FTP Send Settings", receive:"Receive Settings" }[form.typeToConnect] ?? "Connection Settings");
  const getConnectionIcon      = () => ({ api:<Globe className="w-5 h-5"/>, ftp:<HardDrive className="w-5 h-5"/>, receive:<RefreshCw className="w-5 h-5"/> }[form.typeToConnect] ?? <Link2 className="w-5 h-5"/>);

  const isReceiveMode    = form.typeToConnect === "receive";
  const hasOtherDataFilled = Object.values(form.otherData).some(v => v.trim() !== "");

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-gray-900/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && Cancel()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full bg-white dark:bg-gray-900 flex flex-col h-screen sm:h-auto sm:max-h-[92vh] sm:my-6 sm:mx-4 sm:max-w-4xl sm:rounded-3xl sm:shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {isExisting ? "Edit" : "Add"} Device Connection
                  </h2>
                  <p className="text-blue-100 text-sm mt-0.5">Configure your device connection settings</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={Cancel}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6 space-y-6">

            {/* Status info banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Platform:</strong> {dataWithPlatform} &nbsp;|&nbsp;
                <strong>Device ID:</strong> {indexId || "New"} &nbsp;|&nbsp;
                <strong>Mode:</strong> {isExisting ? "Edit" : "Add"} &nbsp;|&nbsp;
                <strong>Type:</strong> {form.typeToConnect}
              </p>
            </div>

            {/* ── Basic Settings ── */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> Basic Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Connection Type */}
                <div>
                  <label className={labelCls}>Connection Type <span className="text-red-500">*</span></label>
                  {dataWithPlatform === "recieve" ? (
                    <div className={`${inputCls} text-gray-500 bg-gray-50 dark:bg-gray-700 cursor-not-allowed`}>Receive Data</div>
                  ) : (
                    <div className="relative">
                      <select value={form.typeToConnect} onChange={(e) => setForm({ ...form, typeToConnect: e.target.value })} className={`${inputCls} appearance-none pr-10 cursor-pointer`}>
                        {getAvailableConnectionTypes().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                  {errors.typeToConnect && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.typeToConnect}</p>}
                </div>

                {/* Device Name */}
                <div>
                  <label className={labelCls}>Device Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.deviceName} onChange={(e) => setForm({ ...form, deviceName: e.target.value })} className={inputCls} placeholder="e.g., Sensor-01" />
                  {errors.deviceName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.deviceName}</p>}
                </div>

                {/* Sending Place */}
                {!isReceiveMode && (
                  <div>
                    <label className={labelCls}>Sending Place <span className="text-red-500">*</span></label>
                    <input type="text" value={form.sendingPlace} onChange={(e) => setForm({ ...form, sendingPlace: e.target.value })} className={inputCls} placeholder="e.g., Cloud Server" />
                    {errors.sendingPlace && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.sendingPlace}</p>}
                  </div>
                )}

                {/* Time Interval */}
                <div>
                  <label className={labelCls}><Clock className="w-3.5 h-3.5 inline mr-1"/>{isReceiveMode ? "Check Interval" : "Send Interval"}</label>
                  <div className="relative">
                    <select value={form.timeIntervelSet} onChange={(e) => setForm({ ...form, timeIntervelSet: e.target.value })} className={`${inputCls} appearance-none pr-10 cursor-pointer`}>
                      {intervalOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Connection-specific Settings ── */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                {getConnectionIcon()} {getConnectionTypeLabel()}
              </h3>

              {/* API */}
              {form.typeToConnect === "api" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}><Globe className="w-3.5 h-3.5 inline mr-1"/>API URL <span className="text-red-500">*</span></label>
                    <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inputCls} placeholder="https://api.example.com/endpoint" />
                    {errors.url && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.url}</p>}
                  </div>
                  <div>
                    <label className={labelCls}><Key className="w-3.5 h-3.5 inline mr-1"/>API Headers <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} className={inputCls} placeholder="Header key" />
                      <input type="text" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} className={inputCls} placeholder="Header value" />
                      <button type="button" onClick={addApiHeader} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 flex-shrink-0">
                        <Plus className="w-4 h-4"/> Add
                      </button>
                    </div>
                    {Object.entries(form.apiHeaders).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(form.apiHeaders).map(([k, v]) => (
                          <motion.div key={k} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{k}: {v}</span>
                            <button type="button" onClick={() => removeApiHeader(k)} className="text-red-500 hover:text-red-700 transition-colors p-1"><Trash2 className="w-4 h-4"/></button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Receive */}
              {form.typeToConnect === "receive" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}><RefreshCw className="w-3.5 h-3.5 inline mr-1"/>Receive URL <span className="text-red-500">*</span></label>
                    <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inputCls} placeholder="https://api.example.com/data-endpoint" />
                    {errors.url && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.url}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">URL to fetch data from, retrieved at the specified check interval.</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2"><Info className="w-4 h-4"/>Receive Mode</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Device ID: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">{deviceId}</code></p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Fetches data every <strong>{form.timeIntervelSet}</strong>.</p>
                  </div>
                </div>
              )}

              {/* FTP */}
              {form.typeToConnect === "ftp" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>FTP Host <span className="text-red-500">*</span></label>
                    <input type="text" value={form.ftpHost} onChange={(e) => setForm({ ...form, ftpHost: e.target.value })} className={inputCls} placeholder="ftp.example.com" />
                    {errors.ftpHost && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.ftpHost}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>FTP Port</label>
                    <input type="number" value={form.ftpPort} onChange={(e) => setForm({ ...form, ftpPort: parseInt(e.target.value) || 21 })} className={inputCls} placeholder="21" />
                  </div>
                  <div>
                    <label className={labelCls}>FTP User <span className="text-red-500">*</span></label>
                    <input type="text" value={form.ftpUser} onChange={(e) => setForm({ ...form, ftpUser: e.target.value })} className={inputCls} placeholder="username" />
                    {errors.ftpUser && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.ftpUser}</p>}
                  </div>
                  <div>
                    <label className={labelCls}><Lock className="w-3.5 h-3.5 inline mr-1"/>FTP Password</label>
                    <input type="password" value={form.ftpPassword} onChange={(e) => setForm({ ...form, ftpPassword: e.target.value })} className={inputCls} placeholder="••••••••" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>FTP Path <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input type="text" value={form.ftpPath} onChange={(e) => setForm({ ...form, ftpPath: e.target.value })} className={inputCls} placeholder="/uploads/" />
                  </div>
                </div>
              )}
            </div>

            {/* ── Sensor Data Mapping ── */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                <Database className="w-3.5 h-3.5"/> {isReceiveMode ? "Data Fields (Keys Only)" : "Sensor Data Mapping"}
              </h3>
              {errors.keyValue && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2"><AlertCircle className="w-4 h-4"/><strong>Validation Error:</strong> {errors.keyValue}</p>
                </div>
              )}
              <div className="space-y-3">
                {KEY_LABELS.map((label) => {
                  const key = label.toLowerCase();
                  const kv = form.keys[key as keyof typeof form.keys]?.trim();
                  const vv = form.values[key as keyof typeof form.values]?.trim();
                  const hasError = (kv && !vv) || (vv && !kv);
                  return (
                    <div key={key} className={isReceiveMode ? "w-full" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          Key {label} {vv && !kv && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          ref={(el: any) => keyInputRefs.current[key] = el}
                          value={form.keys[key as keyof typeof form.keys]}
                          onChange={(e) => handleKeyChange(key, e.target.value)}
                          className={`${inputCls} ${hasError ? "border-red-500" : ""}`}
                          placeholder={`Key ${label}`}
                        />
                      </div>
                      {!isReceiveMode && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                            Value {label} {kv && !vv && <span className="text-red-500">*</span>}
                          </label>
                          <div className="relative">
                            <input
                              ref={(el: any) => valueInputRefs.current[key] = el}
                              value={form.values[key as keyof typeof form.values]}
                              onChange={(e) => handleValueChange(key, e.target.value)}
                              className={`${inputCls} pr-20 ${hasError ? "border-red-500" : ""}`}
                              placeholder={`Value ${label}`}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <select
                                onChange={(e) => { if (e.target.value) handleValueChange(key, e.target.value); e.target.value = ""; }}
                                className="appearance-none bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs h-8 px-2 pr-6"
                              >
                                <option value="">▼</option>
                                <option value="time">time</option>
                                {Array.isArray(DataParameterFilter) && DataParameterFilter.map((param: string, i: number) => (
                                  <option key={i} value={param}>{param}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Other Reference Info (always available, collapsible, fully optional) ── */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <button
                type="button"
                onClick={() => setShowOtherData(p => !p)}
                className="w-full flex items-center justify-between mb-1"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Other Reference Info
                  <span className="normal-case font-normal">(Optional)</span>
                  {hasOtherDataFilled && (
                    <span className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      ● Filled
                    </span>
                  )}
                </h3>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showOtherData ? "rotate-180" : ""}`} />
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                Optionally save the destination platform link and login details alongside this connection.
              </p>

              <AnimatePresence>
                {showOtherData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 pb-2">
                      {/* Platform / Destination Link — full width */}
                      <div className="sm:col-span-2">
                        <label className={labelCls}>
                          <ExternalLink className="w-3.5 h-3.5 inline mr-1" />
                          Platform / Destination Link
                        </label>
                        <input
                          type="url"
                          value={form.otherData.otherLink}
                          onChange={(e) => handleOtherDataChange("otherLink", e.target.value)}
                          className={inputCls}
                          placeholder="https://platform.example.com/endpoint"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          The external platform URL this device is sending data to.
                        </p>
                      </div>

                      {/* User ID */}
                      <div>
                        <label className={labelCls}>
                          <User className="w-3.5 h-3.5 inline mr-1" />
                          User ID
                        </label>
                        <input
                          type="text"
                          value={form.otherData.userId}
                          onChange={(e) => handleOtherDataChange("userId", e.target.value)}
                          className={inputCls}
                          placeholder="e.g., admin"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <label className={labelCls}>
                          <Lock className="w-3.5 h-3.5 inline mr-1" />
                          Password
                        </label>
                        <input
                           type="text"
                          value={form.otherData.password}
                          onChange={(e) => handleOtherDataChange("password", e.target.value)}
                          className={inputCls}
                        
                        />
                      </div>

                      {/* Active Date */}
                      <div>
                        <label className={labelCls}>
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          Active Date
                        </label>
                        <DatePickerInput
                          min="2021-01-01"
                          max={new Date().toISOString().split('T')[0]}
                          value={(() => {
                            const raw = form.otherData.activeDate;
                            if (!raw) return '';
                            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
                            if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
                              const [dd, mm, yyyy] = raw.split('/');
                              return `${yyyy}-${mm}-${dd}`;
                            }
                            const d = new Date(raw);
                            if (isNaN(d.getTime())) return '';
                            return d.toISOString().split('T')[0];
                          })()}
                          onChange={(e) => handleOtherDataChange("activeDate", e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="flex-shrink-0 flex flex-wrap items-center justify-end gap-3 px-4 py-4 sm:px-8 sm:py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, shareToOtherPlateform: prev.shareToOtherPlateform === "start" ? "stop" : "start" }))}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all
                ${form.shareToOtherPlateform === "start" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
            >
              {form.shareToOtherPlateform === "start" ? <><Square className="w-4 h-4"/>Stop Sending</> : <><Play className="w-4 h-4"/>Start Sending</>}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="button" onClick={Cancel}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4"/> Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.98 }}
              type="button" onClick={handleSubmit} disabled={submitting}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-900 to-blue-600 shadow-md transition
                ${submitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-90 hover:shadow-lg active:scale-[0.98]"}`}
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving…</>
              ) : (
                <><Save className="w-4 h-4"/>{isExisting ? "Update" : "Save"} Device</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}