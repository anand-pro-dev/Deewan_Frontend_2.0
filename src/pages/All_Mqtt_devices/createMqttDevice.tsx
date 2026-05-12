import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin, Bell, Cpu, Zap, Plus, Trash2,
  Upload, X, Database, ChevronDown, ChevronUp, Activity
} from 'lucide-react';
import { adminGetAllParameterApi } from '../../apis/adminApi';

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
interface Parameter {
  _id:          string;
  title:        string;
  parameterKey: { key: Record<string, string>; _id: string }[];
}

interface Sensor {
  name:                string;
  unit:                string;
  minValue:            number | '';
  maxValue:            number | '';
  lastValue:           number | '';
  consumptionShow:     boolean;
  consumptionValue:    string;
  dataParameter:       string;
  dataParameterFilter: string[];
  dataParameterTitle:  string;
}

interface Channel {
  name:    string;
  state:   boolean;
  sensors: Sensor[];
}

interface FormData {
  userId:      string;
  deviceName:  string;
  companyName: string;
  city:        string;
  lat:         string;
  long:        string;
  address:     string;
  mapShow:     boolean;
  emailNoti:   boolean;
  sensors:     Sensor[];
  channels:    Channel[];
  deviceImage: File | null;
}

interface DeviceConfigFormProps {
  deviceData?:       any;
  userId?:           string;
  onClose?:          () => void;
  onSuccess?:        () => void;
  createMqttDevice:  (formData: globalThis.FormData) => Promise<any>;
  updateMqttDevice?: (formData: globalThis.FormData, deviceId: string) => Promise<any>;
}

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const MAX_IMAGE_SIZE = 50 * 1024 * 1024;

const EMPTY_SENSOR = (): Sensor => ({
  name:                '',
  unit:                '',
  minValue:            '',
  maxValue:            '',
  lastValue:           '',
  consumptionShow:     false,
  consumptionValue:    '',
  dataParameter:       '',
  dataParameterFilter: [],
  dataParameterTitle:  '',
});

const EMPTY_CHANNEL = (): Channel => ({
  name: '', state: false, sensors: [],
});

const mapSensor = (s: any): Sensor => ({
  name:                s.name                ?? '',
  unit:                s.unit                ?? '',
  minValue:            s.minValue            ?? '',
  maxValue:            s.maxValue            ?? '',
  lastValue:           s.lastValue           ?? '',
  consumptionShow:     s.consumptionShow      ?? false,
  consumptionValue:    s.consumptionValue     ?? '',
  dataParameter:       s.dataParameter        ?? '',
  dataParameterFilter: s.dataParameterFilter  ?? [],
  dataParameterTitle:  s.dataParameterTitle   ?? '',
});

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition ' +
  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ' +
  'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200';

const inputErrCls = 'border-red-400 focus:border-red-500 focus:ring-red-500/20';
const labelCls    = 'block mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400';

/* ═══════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════ */
const Toggle = React.memo(({ id, checked, onChange, label }: any) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none">
    <div className="relative">
      <input type="checkbox" id={id} checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-10 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-colors" />
      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
    </div>
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
  </label>
));

const SectionHeader = ({ icon: Icon, title, required = false, action }: any) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" />{title}
      {required && <span className="text-red-500 normal-case font-normal">*</span>}
    </h2>
    {action}
  </div>
);

const Err = ({ msg }: { msg?: string }) =>
  msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

/* ═══════════════════════════════════════════════
   SENSOR ROW
═══════════════════════════════════════════════ */
interface SensorRowProps {
  sen:        Sensor;
  si:         number;
  oi:         number;
  prefix:     string;
  parameters: Parameter[];
  errors:     Record<string, string>;
  onUpdate:   (si: number, field: keyof Sensor, value: any) => void;
  onRemove:   (si: number) => void;
}

const SensorRow = React.memo(({
  sen, si, prefix, parameters, errors, onUpdate, onRemove,
}: SensorRowProps) => {
  const selectedParam = parameters.find(p => p._id === sen.dataParameter);

  // Options from loaded parameter, fallback to saved filter values
  const consumptionOptionsFromParam: string[] = selectedParam
    ? (Object.values(selectedParam.parameterKey?.[0]?.key ?? {}) as string[])
    : [];

  const consumptionOptions: string[] =
    consumptionOptionsFromParam.length > 0
      ? consumptionOptionsFromParam
      : sen.dataParameterFilter;

  const handleParamSelect = (paramId: string) => {
    if (!paramId) {
      onUpdate(si, 'dataParameter',       '');
      onUpdate(si, 'dataParameterTitle',  '');
      onUpdate(si, 'dataParameterFilter', []);
      onUpdate(si, 'consumptionValue',    '');
      return;
    }
    const param = parameters.find(p => p._id === paramId);
    if (!param) return;

    const filter: string[] = [];
    param.parameterKey?.forEach(pk => {
      Object.values(pk?.key ?? {}).forEach((val: any) => {
        if (typeof val === 'string') {
          val.split(',').map(v => v.trim().toUpperCase()).filter(Boolean).forEach(v => filter.push(v));
        }
      });
    });

    onUpdate(si, 'dataParameter',       param._id);
    onUpdate(si, 'dataParameterTitle',  param.title);
    onUpdate(si, 'dataParameterFilter', filter);
    onUpdate(si, 'consumptionValue',    '');
  };

  return (
    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl space-y-3 border border-green-100 dark:border-green-800/50">
      {/* Name / Unit / Min / Max / Remove */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
        <div className="col-span-2 sm:col-span-2">
          <label className={labelCls}>Name <span className="text-red-500">*</span></label>
          <input
            type="text" value={sen.name}
            onChange={e => onUpdate(si, 'name', e.target.value)}
            placeholder="temperature"
            className={`${inputCls} text-xs py-1.5 ${errors[`${prefix}_name`] ? inputErrCls : ''}`}
          />
          <Err msg={errors[`${prefix}_name`]} />
        </div>
        <div>
          <label className={labelCls}>Unit</label>
          <input
            type="text" value={sen.unit}
            onChange={e => onUpdate(si, 'unit', e.target.value)}
            placeholder="°C"
            className={`${inputCls} text-xs py-1.5`}
          />
        </div>
        <div>
          <label className={labelCls}>Min</label>
          <input
            type="number" value={sen.minValue}
            onChange={e => onUpdate(si, 'minValue', e.target.value)}
            placeholder="0"
            className={`${inputCls} text-xs py-1.5`}
          />
        </div>
        <div>
          <label className={labelCls}>Max</label>
          <input
            type="number" value={sen.maxValue}
            onChange={e => onUpdate(si, 'maxValue', e.target.value)}
            placeholder="100"
            className={`${inputCls} text-xs py-1.5 ${errors[`${prefix}_maxValue`] ? inputErrCls : ''}`}
          />
          <Err msg={errors[`${prefix}_maxValue`]} />
        </div>
        <div>
          <button
            type="button"
            onClick={() => onRemove(si)}
            className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Parameter section */}
      <div className="pt-2.5 border-t border-green-100 dark:border-green-800 space-y-2.5">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          Parameter
        </p>

        <div>
          <label className={labelCls}>Data Parameter</label>
          {parameters.length > 0 ? (
            <select
              value={sen.dataParameter}
              onChange={e => handleParamSelect(e.target.value)}
              className={`${inputCls} text-xs py-1.5`}
            >
              <option value="">-- Select Parameter --</option>
              {parameters.map(p => (
                <option key={p._id} value={p._id}>{p.title || 'Unnamed'}</option>
              ))}
            </select>
          ) : sen.dataParameter ? (
            <p className="text-xs text-gray-500 italic py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              Saved: <strong>{sen.dataParameterTitle || sen.dataParameter}</strong>
              <span className="ml-1 text-gray-400">(loading options…)</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic py-1">No parameters available</p>
          )}
        </div>

        {/* Filter badges */}
        {sen.dataParameterFilter.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sen.dataParameterFilter.map(f => (
              <span key={f} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Consumption toggle */}
        <Toggle
          id={`${prefix}_consumptionShow`}
          checked={sen.consumptionShow}
          onChange={(e: any) => {
            onUpdate(si, 'consumptionShow', e.target.checked);
            if (!e.target.checked) onUpdate(si, 'consumptionValue', '');
          }}
          label="Enable Consumption"
        />

        {/* Consumption key select — shows if toggled on and options exist (from API or saved filter) */}
        {sen.consumptionShow && sen.dataParameter && consumptionOptions.length > 0 && (
          <div>
            <label className={labelCls}>
              Consumption Parameter <span className="text-red-500">*</span>
            </label>
            <select
              value={sen.consumptionValue}
              onChange={e => onUpdate(si, 'consumptionValue', e.target.value)}
              className={`${inputCls} text-xs py-1.5 ${errors[`${prefix}_consumptionValue`] ? inputErrCls : ''}`}
            >
              <option value="">-- Select Key --</option>
              {consumptionOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <Err msg={errors[`${prefix}_consumptionValue`]} />
          </div>
        )}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   APPLY SENSOR FIELD UPDATE
═══════════════════════════════════════════════ */
const applyField = (s: Sensor, field: keyof Sensor, value: any): Sensor => {
  if (
    field === 'name' || field === 'unit' ||
    field === 'consumptionValue' || field === 'dataParameter' || field === 'dataParameterTitle'
  ) return { ...s, [field]: value };
  if (field === 'consumptionShow')     return { ...s, [field]: Boolean(value) };
  if (field === 'dataParameterFilter') return { ...s, [field]: value };
  return { ...s, [field]: value === '' ? '' : Number(value) };
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function DeviceConfigForm({
  deviceData, userId,
  onClose, onSuccess,
  createMqttDevice, updateMqttDevice,
}: DeviceConfigFormProps) {
  const isEditMode       = !!deviceData;
  const resolvedDeviceId = deviceData?._id ?? deviceData?.deviceId ?? '';

  const [parameters,        setParameters]        = useState<Parameter[]>([]);
  const [parametersLoaded,  setParametersLoaded]  = useState(false);
  const [form,              setForm]              = useState<FormData>({
    userId:      userId || '',
    deviceName:  '',
    companyName: '',
    city:        '',
    lat:         '',
    long:        '',
    address:     '',
    mapShow:     true,
    emailNoti:   true,
    sensors:     [],
    channels:    [],
    deviceImage: null,
  });

  const [imagePreview,      setImagePreview]      = useState<string | null>(null);
  const [errors,            setErrors]            = useState<Record<string, string>>({});
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [collapsedChannels, setCollapsedChannels] = useState<Set<number>>(new Set());

  // Lock body scroll while modal is open
useEffect(() => {
  document.body.style.overflow = 'hidden';
  document.body.classList.add('modal-open');
  return () => {
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  };
}, []);


  

  // Load parameters first
  useEffect(() => {
    adminGetAllParameterApi()
      .then(res => {
        if (res.success) setParameters(res.data);
      })
      .catch(() => {})
      .finally(() => setParametersLoaded(true));
  }, []);

  // Populate form AFTER parameters are loaded so <select> values stick
  useEffect(() => {
    if (!deviceData) return;
    // In create mode or before parameters load, skip
    if (!parametersLoaded) return;

    setForm({
      userId:      deviceData.userId      || userId || '',
      deviceName:  deviceData.deviceName  || '',
      companyName: deviceData.companyName || '',
      city:        deviceData.city        || '',
      // Handle both flat and nested location shapes
      lat:         String(deviceData.lat  ?? deviceData.location?.lat  ?? ''),
      long:        String(deviceData.long ?? deviceData.location?.long ?? ''),
      address:     deviceData.address     || '',
      mapShow:     deviceData.mapShow     ?? true,
      emailNoti:   deviceData.emailNoti   ?? true,
      deviceImage: null,
      sensors:     (deviceData.sensors  || []).map(mapSensor),
      channels:    (deviceData.channels || []).map((c: any) => ({
        name:    c.name    || '',
        state:   c.state   ?? false,
        sensors: (c.sensors || []).map(mapSensor),
      })),
    });

    if (deviceData.deviceImage) setImagePreview(deviceData.deviceImage);
  }, [deviceData, userId, parametersLoaded]);

  /* ═══════════ HELPERS ═══════════ */
  const clearErr = useCallback((key: string) =>
    setErrors(prev => {
      if (!prev[key]) return prev;
      const n = { ...prev }; delete n[key]; return n;
    }), []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    clearErr(name);
  }, [clearErr]);

  const applyImage = useCallback((file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors(p => ({ ...p, deviceImage: 'Image must be under 50 MB' }));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, deviceImage: 'Please upload a valid image' }));
      return;
    }
    setForm(p => ({ ...p, deviceImage: file }));
    clearErr('deviceImage');
    const r = new FileReader();
    r.onloadend = () => setImagePreview(r.result as string);
    r.readAsDataURL(file);
  }, [clearErr]);

  /* ═══════════ DEVICE-LEVEL SENSOR CRUD ═══════════ */
  const addDeviceSensor    = useCallback(() =>
    setForm(p => ({ ...p, sensors: [...p.sensors, EMPTY_SENSOR()] })), []);

  const removeDeviceSensor = useCallback((si: number) =>
    setForm(p => ({ ...p, sensors: p.sensors.filter((_, i) => i !== si) })), []);

  const updateDeviceSensor = useCallback((si: number, field: keyof Sensor, value: any) => {
    setForm(p => ({ ...p, sensors: p.sensors.map((s, i) => i !== si ? s : applyField(s, field, value)) }));
    clearErr(`dev_sen${si}_${field}`);
  }, [clearErr]);

  /* ═══════════ CHANNEL CRUD ═══════════ */
  const addChannel = useCallback(() => {
    setForm(p => ({ ...p, channels: [...p.channels, EMPTY_CHANNEL()] }));
    clearErr('channels');
  }, [clearErr]);

  const removeChannel = useCallback((ci: number) => {
    setForm(p => ({ ...p, channels: p.channels.filter((_, i) => i !== ci) }));
    setCollapsedChannels(p => { const n = new Set(p); n.delete(ci); return n; });
  }, []);

  const updateChannelField = useCallback((ci: number, field: keyof Channel, value: any) => {
    setForm(p => ({ ...p, channels: p.channels.map((c, i) => i !== ci ? c : { ...c, [field]: value }) }));
    clearErr(`channel_${field}_${ci}`);
  }, [clearErr]);

  const toggleCollapse = useCallback((ci: number) =>
    setCollapsedChannels(p => {
      const n = new Set(p); n.has(ci) ? n.delete(ci) : n.add(ci); return n;
    }), []);

  /* ═══════════ CHANNEL SENSOR CRUD ═══════════ */
  const addChannelSensor = useCallback((ci: number) =>
    setForm(p => ({
      ...p,
      channels: p.channels.map((c, i) =>
        i !== ci ? c : { ...c, sensors: [...c.sensors, EMPTY_SENSOR()] }
      ),
    })), []);

  const removeChannelSensor = useCallback((ci: number, si: number) =>
    setForm(p => ({
      ...p,
      channels: p.channels.map((c, i) =>
        i !== ci ? c : { ...c, sensors: c.sensors.filter((_, j) => j !== si) }
      ),
    })), []);

  const updateChannelSensor = useCallback((ci: number, si: number, field: keyof Sensor, value: any) => {
    setForm(p => ({
      ...p,
      channels: p.channels.map((c, i) =>
        i !== ci ? c : {
          ...c,
          sensors: c.sensors.map((s, j) => j !== si ? s : applyField(s, field, value)),
        }
      ),
    }));
    clearErr(`c${ci}_sen${si}_${field}`);
  }, [clearErr]);

  /* ═══════════ VALIDATION ═══════════ */
  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};

    if (!form.userId?.trim())      e.userId      = 'User ID is required';
    if (!form.deviceName?.trim())  e.deviceName  = 'Device name is required';
    if (!form.companyName?.trim()) e.companyName = 'Company name is required';
    if (!form.city?.trim())        e.city        = 'City is required';
    if (!form.address?.trim())     e.address     = 'Address is required';

    if (!imagePreview && !form.deviceImage) {
      e.deviceImage = 'Device image is required';
    }

    const checkSensors = (sensors: Sensor[], pfx: string) => {
      sensors.forEach((s, si) => {
        if (!s.name.trim()) e[`${pfx}${si}_name`] = 'Name is required';
        const min = s.minValue === '' ? undefined : Number(s.minValue);
        const max = s.maxValue === '' ? undefined : Number(s.maxValue);
        if (min !== undefined && max !== undefined && min >= max)
          e[`${pfx}${si}_maxValue`] = 'Max must be greater than min';
        if (s.consumptionShow && !s.consumptionValue)
          e[`${pfx}${si}_consumptionValue`] = 'Select a consumption key';
      });
    };

    checkSensors(form.sensors, 'dev_sen');
    form.channels.forEach((c, ci) => {
      if (!c.name.trim()) e[`channel_name_${ci}`] = 'Channel name is required';
      checkSensors(c.sensors, `c${ci}_sen`);
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, imagePreview]);

  /* ═══════════ SUBMIT HELPERS ═══════════ */
  const appendSensor = useCallback((fd: globalThis.FormData, pfx: string, s: Sensor) => {
    fd.append(`${pfx}[name]`,                s.name);
    fd.append(`${pfx}[unit]`,                s.unit);
    fd.append(`${pfx}[minValue]`,            String(s.minValue  === '' ? 0 : s.minValue));
    fd.append(`${pfx}[maxValue]`,            String(s.maxValue  === '' ? 0 : s.maxValue));
    fd.append(`${pfx}[lastValue]`,           String(s.lastValue === '' ? 0 : s.lastValue));
    fd.append(`${pfx}[consumptionShow]`,     s.consumptionShow.toString());
    fd.append(`${pfx}[consumptionValue]`,    s.consumptionValue);
    fd.append(`${pfx}[dataParameter]`,       s.dataParameter);
    fd.append(`${pfx}[dataParameterTitle]`,  s.dataParameterTitle);
    s.dataParameterFilter.forEach(f => fd.append(`${pfx}[dataParameterFilter]`, f));
  }, []);

  /* ═══════════ SUBMIT ═══════════ */
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      setTimeout(() =>
        document.querySelector('.border-red-400')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      50);
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new globalThis.FormData();
      fd.append('userId',      form.userId);
      fd.append('deviceName',  form.deviceName);
      fd.append('companyName', form.companyName);
      fd.append('city',        form.city);
      fd.append('lat',         form.lat);
      fd.append('long',        form.long);
      fd.append('address',     form.address);
      fd.append('mapShow',     form.mapShow.toString());
      fd.append('emailNoti',   form.emailNoti.toString());

      form.sensors.forEach((s, si) => appendSensor(fd, `sensors[${si}]`, s));
      form.channels.forEach((c, ci) => {
        fd.append(`channels[${ci}][name]`,  c.name);
        fd.append(`channels[${ci}][state]`, c.state.toString());
        c.sensors.forEach((s, si) => appendSensor(fd, `channels[${ci}][sensors][${si}]`, s));
      });

      if (form.deviceImage) fd.append('deviceImage', form.deviceImage);

      if (isEditMode) {
        if (!resolvedDeviceId) throw new Error('Device ID is missing — cannot update.');
        await updateMqttDevice!(fd, resolvedDeviceId);
      } else {
        await createMqttDevice(fd);
      }

      alert(`Device ${isEditMode ? 'updated' : 'created'} successfully!`);
      onSuccess?.();
    } catch (err: any) {
      alert(`Failed: ${err?.response?.data?.message || err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, form, appendSensor, isEditMode, resolvedDeviceId, createMqttDevice, updateMqttDevice, onSuccess]);

  const handleCancel = useCallback(() => {
    if (onClose) onClose(); else window.history.back();
  }, [onClose]);

  /* ═══════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
      <div className="relative w-full bg-white dark:bg-gray-900 flex flex-col h-screen sm:h-auto sm:max-h-[92vh] sm:my-6 sm:mx-4 sm:max-w-3xl sm:rounded-3xl sm:shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex-shrink-0 flex items-start justify-between gap-3 px-4 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h4 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
              {isEditMode ? 'Update' : 'Add'} IoT Device
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isEditMode ? 'Update device settings.' : 'Configure your device settings.'}
            </p>
          </div>
          <button onClick={handleCancel} disabled={isSubmitting}
            className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6 space-y-8">

          {/* Device Image */}
          <section>
            <SectionHeader icon={Upload} title="Device Image" required />
            <div
              className={`relative rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors
                ${errors.deviceImage
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/60'}`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) applyImage(f); }}
            >
              <input type="file" accept="image/*"
                onChange={e => { const f = e.target.files?.[0]; if (f) applyImage(f); }}
                className="absolute inset-0 opacity-0 cursor-pointer" />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview"
                    className="h-44 w-full object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                  <button type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setForm(p => ({ ...p, deviceImage: null }));
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow transition-colors">
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Click or drag &amp; drop to upload
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 50 MB</p>
                </div>
              )}
            </div>
            <Err msg={errors.deviceImage} />
          </section>

          {/* Basic Info */}
          <section className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <SectionHeader icon={Cpu} title="Basic Information" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { label: 'Device Name',  name: 'deviceName',  placeholder: 'Alpha Room Sensor' },
                { label: 'Company Name', name: 'companyName', placeholder: 'Acme IoT Ltd.' },
              ] as const).map(f => (
                <div key={f.name}>
                  <label className={labelCls}>{f.label} <span className="text-red-500">*</span></label>
                  <input type="text" name={f.name} value={(form as any)[f.name]}
                    onChange={handleInput} placeholder={f.placeholder}
                    className={`${inputCls} ${errors[f.name] ? inputErrCls : ''}`} />
                  <Err msg={errors[f.name]} />
                </div>
              ))}
            </div>
          </section>

          {/* Location */}
          <section className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <SectionHeader icon={MapPin} title="Location" required />
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City <span className="text-red-500">*</span></label>
                  <input type="text" name="city" value={form.city} onChange={handleInput}
                    placeholder="Mumbai"
                    className={`${inputCls} ${errors.city ? inputErrCls : ''}`} />
                  <Err msg={errors.city} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Latitude</label>
                    <input type="text" name="lat" value={form.lat} onChange={handleInput}
                      placeholder="19.0760" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Longitude</label>
                    <input type="text" name="long" value={form.long} onChange={handleInput}
                      placeholder="72.8777" className={inputCls} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Address <span className="text-red-500">*</span></label>
                <input type="text" name="address" value={form.address} onChange={handleInput}
                  placeholder="123 Main Street"
                  className={`${inputCls} ${errors.address ? inputErrCls : ''}`} />
                <Err msg={errors.address} />
              </div>
            </div>
          </section>

          {/* Toggles */}
          <section className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <SectionHeader icon={Bell} title="Visibility & Notifications" />
            <div className="flex flex-wrap gap-6">
              <Toggle id="mapShow" checked={form.mapShow}
                onChange={(e: any) => setForm(p => ({ ...p, mapShow: e.target.checked }))}
                label="Show on Map" />
              <Toggle id="emailNoti" checked={form.emailNoti}
                onChange={(e: any) => setForm(p => ({ ...p, emailNoti: e.target.checked }))}
                label="Email Notifications" />
            </div>
          </section>

          {/* Device-level Sensors */}
          <section className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <SectionHeader
              icon={Activity}
              title="Device Sensors"
              action={
                <button onClick={addDeviceSensor} type="button"
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-full text-xs font-semibold hover:bg-green-700 transition shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Add Sensor
                </button>
              }
            />
            <div className="mt-4 space-y-4">
              {form.sensors.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-6 text-center">
                  <Activity className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No device-level sensors — click <strong>Add Sensor</strong>
                  </p>
                </div>
              ) : form.sensors.map((sen, si) => (
                <SensorRow
                  key={si} sen={sen} si={si} oi={-1}
                  prefix={`dev_sen${si}`}
                  parameters={parameters}
                  errors={errors}
                  onUpdate={(i, field, val) => updateDeviceSensor(i, field, val)}
                  onRemove={removeDeviceSensor}
                />
              ))}
            </div>
          </section>

          {/* Channels */}
          <section className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <SectionHeader
              icon={Zap}
              title="Channels"
              action={
                <button onClick={addChannel} type="button"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 transition shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Add Channel
                </button>
              }
            />
            <Err msg={errors.channels} />

            <div className="space-y-4 mt-2">
              {form.channels.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-8 text-center">
                  <Zap className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No channels yet — click <strong>Add Channel</strong></p>
                </div>
              )}

              {form.channels.map((channel, ci) => {
                const isCollapsed = collapsedChannels.has(ci);
                const hasErr      = !!errors[`channel_name_${ci}`];

                return (
                  <div key={ci}
                    className={`rounded-2xl border overflow-hidden transition-colors
                      ${hasErr ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    {/* Channel header bar */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
                      <button type="button" onClick={() => toggleCollapse(ci)}
                        className="flex-1 flex items-center gap-2 text-left">
                        {isCollapsed
                          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          : <ChevronUp   className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Channel {ci + 1}
                          {channel.name && (
                            <span className="ml-2 text-gray-400 font-normal">— {channel.name}</span>
                          )}
                        </span>
                        <span className="ml-auto pr-2">
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-0.5 rounded-full text-xs">
                            {channel.sensors.length} sensor{channel.sensors.length !== 1 ? 's' : ''}
                          </span>
                        </span>
                      </button>
                      <button onClick={() => removeChannel(ci)} type="button"
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="p-4 space-y-5 bg-white dark:bg-gray-900">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelCls}>Name <span className="text-red-500">*</span></label>
                            <input type="text" value={channel.name}
                              onChange={e => updateChannelField(ci, 'name', e.target.value)}
                              placeholder="Pump 1"
                              className={`${inputCls} ${errors[`channel_name_${ci}`] ? inputErrCls : ''}`} />
                            <Err msg={errors[`channel_name_${ci}`]} />
                          </div>
                          <div className="flex items-end pb-1">
                            <Toggle
                              id={`state_${ci}`}
                              checked={channel.state}
                              onChange={(e: any) => updateChannelField(ci, 'state', e.target.checked)}
                              label="Initial State ON"
                            />
                          </div>
                        </div>

                        {/* Channel sensors */}
                        <div className="rounded-xl border border-green-100 dark:border-green-900/30 p-3">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 flex items-center gap-1.5">
                              <Database className="w-3.5 h-3.5" />
                              Attached Sensors ({channel.sensors.length})
                            </h4>
                            <button onClick={() => addChannelSensor(ci)} type="button"
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium hover:bg-green-700 transition-colors">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>

                          {channel.sensors.length === 0 ? (
                            <p className="text-xs text-gray-400 italic text-center py-2">
                              No sensors attached
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {channel.sensors.map((sen, si) => (
                                <SensorRow
                                  key={si} sen={sen} si={si} oi={ci}
                                  prefix={`c${ci}_sen${si}`}
                                  parameters={parameters}
                                  errors={errors}
                                  onUpdate={(i, field, val) => updateChannelSensor(ci, i, field, val)}
                                  onRemove={(i) => removeChannelSensor(ci, i)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 py-4 sm:px-8 sm:py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button onClick={handleCancel} disabled={isSubmitting} type="button"
            className="w-full sm:w-auto justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} type="button"
            className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-900 to-blue-600 shadow-md transition
              ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-lg active:scale-[0.98]'}`}>
            {isSubmitting
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
              : isEditMode ? '💾 Update Device' : '✅ Create Device'
            }
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}