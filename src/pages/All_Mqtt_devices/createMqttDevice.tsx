import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Bell, Cpu, Lightbulb, Plus, Trash2, Upload, X, Calendar, Database } from 'lucide-react';

interface Schedule {
  startTime: string;
  endTime: string;
}

interface Sensor {
  name: string;
  minValue: number;
  maxValue: number;
  lastValue: number;
}

interface Output {
  name: string;
  pin: number;
  state: boolean;
  schedules: Schedule[];
  sensors: Sensor[];
}

interface FormData {
  userId: string;
  deviceName: string;
  companyName: string;
  city: string;
  lat: string;
  long: string;
  address: string;
  mapShow: boolean;
  emailNoti: boolean;
  outputs: Output[];
  deviceImage?: File | null;
}

interface DeviceConfigFormProps {
  deviceData?: any;
  userId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
  createMqttDevice: (formData: globalThis.FormData) => Promise<any>;
  updateMqttDevice?: (formData: globalThis.FormData, deviceId: string) => Promise<any>;
}

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200';
const labelClass = 'block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300';

const InputField = React.memo(({ label, name, value, onChange, error, required = false, placeholder = '', type = 'text' }: any) => (
  <div>
    <label className={labelClass}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`${inputClass} ${error ? 'border-red-500' : ''}`}
      placeholder={placeholder}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
));

const SectionHeader = React.memo(({ icon: Icon, title, required = false }: any) => (
  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
    <Icon className="w-3.5 h-3.5" />
    {title} {required && <span className="text-red-500">*</span>}
  </h2>
));

export default function DeviceConfigForm({ deviceData, onClose, onSuccess, userId, createMqttDevice, updateMqttDevice }: DeviceConfigFormProps) {
  const isUpdateMode = !!deviceData;

  const [formData, setFormData] = useState<FormData>({
    userId: userId || '',
    deviceName: '',
    companyName: '',
    city: '',
    lat: '',
    long: '',
    address: '',
    mapShow: true,
    emailNoti: true,
    outputs: [],
    deviceImage: null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Hide navbar & sidebar while this overlay is mounted ──
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    if (deviceData) {
      setFormData({
        userId: deviceData.userId || userId || '',
        deviceName: deviceData.deviceName || '',
        companyName: deviceData.companyName || '',
        city: deviceData.city || '',
        lat: deviceData.lat || '',
        long: deviceData.long || '',
        address: deviceData.address || '',
        mapShow: deviceData.mapShow ?? true,
        emailNoti: deviceData.emailNoti ?? true,
        outputs: (deviceData.outputs || []).map((output: any) => ({
          name: output.name || '',
          pin: output.pin || 0,
          state: output.state ?? false,
          schedules: (output.schedules || []).map((s: any) => ({ startTime: s.startTime || '', endTime: s.endTime || '' })),
          sensors: (output.sensors || []).map((s: any) => ({ name: s.name || '', minValue: s.minValue || 0, maxValue: s.maxValue || 100, lastValue: s.lastValue || 0 })),
        })),
        deviceImage: null,
      });
      if (deviceData.deviceImage) setImagePreview(deviceData.deviceImage);
    }
  }, [deviceData, userId]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    clearError(name);
  }, [clearError]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { setErrors(prev => ({ ...prev, deviceImage: 'Image size must be less than 50MB' })); return; }
    if (!file.type.startsWith('image/')) { setErrors(prev => ({ ...prev, deviceImage: 'Please upload a valid image file' })); return; }
    setFormData(prev => ({ ...prev, deviceImage: file }));
    clearError('deviceImage');
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [clearError]);

  const removeImage = useCallback(() => {
    setFormData(prev => ({ ...prev, deviceImage: null }));
    setImagePreview(null);
    setErrors(prev => ({ ...prev, deviceImage: 'Device image is required' }));
  }, []);

  const addOutput = useCallback(() => {
    setFormData(prev => ({ ...prev, outputs: [...prev.outputs, { name: '', pin: 0, state: false, schedules: [], sensors: [] }] }));
    clearError('outputs');
  }, [clearError]);

  const removeOutput = useCallback((index: number) => {
    setFormData(prev => ({ ...prev, outputs: prev.outputs.filter((_, i) => i !== index) }));
  }, []);

  const updateOutput = useCallback((index: number, field: keyof Output, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, outputs: prev.outputs.map((output, i) => i === index ? { ...output, [field]: field === 'pin' ? Number(value) || 0 : value } : output) }));
    clearError(`output_${field}_${index}`);
  }, [clearError]);

  const addSchedule = useCallback((outputIndex: number) => {
    setFormData(prev => ({ ...prev, outputs: prev.outputs.map((output, i) => i === outputIndex ? { ...output, schedules: [...output.schedules, { startTime: '', endTime: '' }] } : output) }));
  }, []);

  const removeSchedule = useCallback((outputIndex: number, scheduleIndex: number) => {
    setFormData(prev => ({ ...prev, outputs: prev.outputs.map((output, i) => i === outputIndex ? { ...output, schedules: output.schedules.filter((_, si) => si !== scheduleIndex) } : output) }));
  }, []);

  const updateSchedule = useCallback((outputIndex: number, scheduleIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({ ...prev, outputs: prev.outputs.map((output, i) => i === outputIndex ? { ...output, schedules: output.schedules.map((schedule, si) => si === scheduleIndex ? { ...schedule, [field]: value } : schedule) } : output) }));
    clearError(`output_${outputIndex}_schedule_${scheduleIndex}_${field}`);
  }, [clearError]);

  const addSensorToOutput = useCallback((outputIndex: number) => {
    setFormData(prev => ({ ...prev, outputs: prev.outputs.map((output, i) => i === outputIndex ? { ...output, sensors: [...output.sensors, { name: '', minValue: 0, maxValue: 100, lastValue: 0 }] } : output) }));
  }, []);

  const removeSensorFromOutput = useCallback((outputIndex: number, sensorIndex: number) => {
    setFormData(prev => ({ ...prev, outputs: prev.outputs.map((output, i) => i === outputIndex ? { ...output, sensors: output.sensors.filter((_, si) => si !== sensorIndex) } : output) }));
  }, []);

  const updateSensorInOutput = useCallback((outputIndex: number, sensorIndex: number, field: keyof Sensor, value: string | number) => {
    setFormData(prev => ({ ...prev, outputs: prev.outputs.map((output, i) => i === outputIndex ? { ...output, sensors: output.sensors.map((sensor, si) => si === sensorIndex ? { ...sensor, [field]: field === 'name' ? value : value === '' || value === '.' ? value : Number(value) } : sensor) } : output) }));
    clearError(`output_${outputIndex}_sensor_${sensorIndex}_${field}`);
  }, [clearError]);

  const handleCancel = useCallback(() => {
    if (onClose) onClose();
    else window.history.back();
  }, [onClose]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields: Array<{ field: keyof FormData; message: string }> = [
      { field: 'userId', message: 'User ID is required' },
      { field: 'deviceName', message: 'Device name is required' },
      { field: 'companyName', message: 'Company name is required' },
      { field: 'city', message: 'City is required' },
      { field: 'address', message: 'Address is required' },
    ];
    requiredFields.forEach(({ field, message }) => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && !value.trim())) newErrors[field] = message;
    });
    if (!imagePreview && !formData.deviceImage) newErrors.deviceImage = 'Device image is required';
    if (formData.outputs.length === 0) {
      newErrors.outputs = 'At least one output is required';
    } else {
      formData.outputs.forEach((output, oIndex) => {
        if (!output.name.trim()) newErrors[`output_name_${oIndex}`] = 'Output name is required';
        if (output.pin === null || output.pin === undefined) newErrors[`output_pin_${oIndex}`] = 'Pin number is required';
        output.schedules.forEach((schedule, sIndex) => {
          if (schedule.startTime && !schedule.endTime) newErrors[`output_${oIndex}_schedule_${sIndex}_endTime`] = 'End time is required';
          if (!schedule.startTime && schedule.endTime) newErrors[`output_${oIndex}_schedule_${sIndex}_startTime`] = 'Start time is required';
          if (schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime) newErrors[`output_${oIndex}_schedule_${sIndex}_endTime`] = 'End time must be after start time';
        });
        output.sensors.forEach((sensor, sIndex) => {
          if (!sensor.name.trim()) newErrors[`output_${oIndex}_sensor_${sIndex}_name`] = 'Sensor name is required';
          if (sensor.minValue >= sensor.maxValue) newErrors[`output_${oIndex}_sensor_${sIndex}_maxValue`] = 'Max value must be greater than min value';
        });
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, imagePreview]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      const firstError = document.querySelector('.border-red-500');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('userId', formData.userId);
      formDataToSend.append('deviceName', formData.deviceName);
      formDataToSend.append('companyName', formData.companyName);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('lat', formData.lat);
      formDataToSend.append('long', formData.long);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('mapShow', formData.mapShow.toString());
      formDataToSend.append('emailNoti', formData.emailNoti.toString());
      formData.outputs.forEach((output, index) => {
        formDataToSend.append(`outputs[${index}][name]`, output.name);
        formDataToSend.append(`outputs[${index}][pin]`, output.pin.toString());
        formDataToSend.append(`outputs[${index}][state]`, output.state.toString());
        output.schedules.forEach((schedule, sIndex) => {
          if (schedule.startTime && schedule.endTime) {
            formDataToSend.append(`outputs[${index}][schedules][${sIndex}][startTime]`, schedule.startTime);
            formDataToSend.append(`outputs[${index}][schedules][${sIndex}][endTime]`, schedule.endTime);
          }
        });
        output.sensors.forEach((sensor, sIndex) => {
          formDataToSend.append(`outputs[${index}][sensors][${sIndex}][name]`, sensor.name);
          formDataToSend.append(`outputs[${index}][sensors][${sIndex}][minValue]`, sensor.minValue.toString());
          formDataToSend.append(`outputs[${index}][sensors][${sIndex}][maxValue]`, sensor.maxValue.toString());
          formDataToSend.append(`outputs[${index}][sensors][${sIndex}][lastValue]`, sensor.lastValue.toString());
        });
      });
      if (formData.deviceImage) formDataToSend.append('deviceImage', formData.deviceImage);
      if (isUpdateMode) {
        await updateMqttDevice!(formDataToSend, deviceData.deviceId);
      } else {
        await createMqttDevice(formDataToSend);
      }
      alert(`Device ${isUpdateMode ? 'updated' : 'created'} successfully!`);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
      alert(`Failed to ${isUpdateMode ? 'update' : 'create'} device: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, isUpdateMode, onSuccess, createMqttDevice, updateMqttDevice, deviceData]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const toggleClass = 'w-10 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-primary transition-colors';
  const toggleThumb = 'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5';

  return createPortal(
    // ── Full-screen overlay rendered into document.body ──
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
      <div className="relative w-full bg-white dark:bg-gray-900 flex flex-col h-screen sm:h-auto sm:max-h-[92vh] sm:my-6 sm:mx-4 sm:max-w-3xl sm:rounded-3xl sm:shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-4 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-0 border-b border-gray-100 dark:border-gray-800 sm:border-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                {isUpdateMode ? 'Update' : 'Add'} IoT Device
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isUpdateMode ? 'Update device settings and parameters.' : 'Configure your device settings and parameters.'}
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6 space-y-6">

          {/* Device Image */}
          <div>
            <SectionHeader icon={Upload} title="Device Image" required />
            <div
              className={`relative rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors
                ${errors.deviceImage ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/60'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  setFormData(prev => ({ ...prev, deviceImage: file }));
                  clearError('deviceImage');
                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            >
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Device preview" className="h-44 w-full object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow transition-colors"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Click or drag &amp; drop to upload</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 50MB</p>
                </div>
              )}
            </div>
            {errors.deviceImage && <p className="mt-1.5 text-sm text-red-600">{errors.deviceImage}</p>}
          </div>

          {/* Basic Information */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <SectionHeader icon={Cpu} title="Basic Information" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Device Name" name="deviceName" value={formData.deviceName} onChange={handleInputChange} error={errors.deviceName} required placeholder="e.g., Alpha Room Sensor" />
              <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleInputChange} error={errors.companyName} required placeholder="Enter company name" />
            </div>
          </div>

          {/* Location */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <SectionHeader icon={MapPin} title="Location Settings" required />
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="City" name="city" value={formData.city} onChange={handleInputChange} error={errors.city} required placeholder="e.g., Mumbai" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Latitude" name="lat" value={formData.lat} onChange={handleInputChange} error={errors.lat} placeholder="21.0760" />
                  <InputField label="Longitude" name="long" value={formData.long} onChange={handleInputChange} error={errors.long} placeholder="72.8777" />
                </div>
              </div>
              <InputField label="Address" name="address" value={formData.address} onChange={handleInputChange} error={errors.address} required placeholder="123 Main Street, Andheri" />
            </div>
          </div>

          {/* Toggles */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <SectionHeader icon={Bell} title="Visibility &amp; Notifications" />
            <div className="flex flex-wrap gap-6">
              {[
                { id: 'mapShow', label: 'Show device on Map' },
                { id: 'emailNoti', label: 'Enable Email Notifications' },
              ].map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div className="relative">
                    <input type="checkbox" id={id} name={id} checked={!!(formData as any)[id]} onChange={handleInputChange} className="sr-only peer" />
                    <div className={toggleClass} />
                    <div className={toggleThumb} />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader icon={Lightbulb} title="Outputs, Schedules &amp; Sensors" required />
              <button
                onClick={addOutput}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Output
              </button>
            </div>
            {errors.outputs && <p className="mb-3 text-sm text-red-600">{errors.outputs}</p>}

            <div className="space-y-4">
              {formData.outputs.map((output, index) => (
                <div key={index} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                  {/* Output header */}
                  <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Output {index + 1}</span>
                    <button onClick={() => removeOutput(index)} type="button" className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Output fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Name <span className="text-red-500">*</span></label>
                        <input type="text" value={output.name} onChange={(e) => updateOutput(index, 'name', e.target.value)} className={`${inputClass} ${errors[`output_name_${index}`] ? 'border-red-500' : ''}`} placeholder="relay_1" />
                        {errors[`output_name_${index}`] && <p className="mt-1 text-xs text-red-600">{errors[`output_name_${index}`]}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Pin <span className="text-red-500">*</span></label>
                        <input type="number" value={output.pin} onChange={(e) => updateOutput(index, 'pin', e.target.value)} className={`${inputClass} ${errors[`output_pin_${index}`] ? 'border-red-500' : ''}`} placeholder="12" />
                        {errors[`output_pin_${index}`] && <p className="mt-1 text-xs text-red-600">{errors[`output_pin_${index}`]}</p>}
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <div className="relative">
                            <input type="checkbox" checked={output.state} onChange={(e) => updateOutput(index, 'state', e.target.checked)} className="sr-only peer" />
                            <div className={toggleClass} />
                            <div className={toggleThumb} />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Initial State ON</span>
                        </label>
                      </div>
                    </div>

                    {/* Schedules */}
                    <div className="rounded-xl border border-purple-100 dark:border-purple-900/30 bg-white dark:bg-gray-800 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Schedules ({output.schedules.length})
                        </h4>
                        <button onClick={() => addSchedule(index)} type="button" className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium hover:bg-purple-700 transition-colors">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {output.schedules.map((schedule, sIndex) => (
                          <div key={sIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                              <input type="time" value={schedule.startTime} onChange={(e) => updateSchedule(index, sIndex, 'startTime', e.target.value)} className={`${inputClass} text-xs py-1.5 ${errors[`output_${index}_schedule_${sIndex}_startTime`] ? 'border-red-500' : ''}`} />
                              {errors[`output_${index}_schedule_${sIndex}_startTime`] && <p className="mt-1 text-xs text-red-600">{errors[`output_${index}_schedule_${sIndex}_startTime`]}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                              <input type="time" value={schedule.endTime} onChange={(e) => updateSchedule(index, sIndex, 'endTime', e.target.value)} className={`${inputClass} text-xs py-1.5 ${errors[`output_${index}_schedule_${sIndex}_endTime`] ? 'border-red-500' : ''}`} />
                              {errors[`output_${index}_schedule_${sIndex}_endTime`] && <p className="mt-1 text-xs text-red-600">{errors[`output_${index}_schedule_${sIndex}_endTime`]}</p>}
                            </div>
                            <div className="flex items-end">
                              <button onClick={() => removeSchedule(index, sIndex)} type="button" className="w-full py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium transition-colors">Remove</button>
                            </div>
                          </div>
                        ))}
                        {output.schedules.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">No schedules added</p>}
                      </div>
                    </div>

                    {/* Sensors */}
                    <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-white dark:bg-gray-800 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" /> Sensors ({output.sensors.length})
                        </h4>
                        <button onClick={() => addSensorToOutput(index)} type="button" className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium hover:bg-green-700 transition-colors">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {output.sensors.map((sensor, sIndex) => (
                          <div key={sIndex} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                              <input type="text" value={sensor.name} onChange={(e) => updateSensorInOutput(index, sIndex, 'name', e.target.value)} className={`${inputClass} text-xs py-1.5 ${errors[`output_${index}_sensor_${sIndex}_name`] ? 'border-red-500' : ''}`} placeholder="temp_sensor" />
                              {errors[`output_${index}_sensor_${sIndex}_name`] && <p className="mt-1 text-xs text-red-600">{errors[`output_${index}_sensor_${sIndex}_name`]}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min</label>
                              <input type="number" value={sensor.minValue} onChange={(e) => updateSensorInOutput(index, sIndex, 'minValue', e.target.value)} className={`${inputClass} text-xs py-1.5`} placeholder="0" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max</label>
                              <input type="number" value={sensor.maxValue} onChange={(e) => updateSensorInOutput(index, sIndex, 'maxValue', e.target.value)} className={`${inputClass} text-xs py-1.5 ${errors[`output_${index}_sensor_${sIndex}_maxValue`] ? 'border-red-500' : ''}`} placeholder="100" />
                              {errors[`output_${index}_sensor_${sIndex}_maxValue`] && <p className="mt-1 text-xs text-red-600">{errors[`output_${index}_sensor_${sIndex}_maxValue`]}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Value</label>
                              <input type="number" value={sensor.lastValue} onChange={(e) => updateSensorInOutput(index, sIndex, 'lastValue', e.target.value)} className={`${inputClass} text-xs py-1.5`} placeholder="0" />
                            </div>
                            <div className="flex items-end">
                              <button onClick={() => removeSensorFromOutput(index, sIndex)} type="button" className="w-full py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium transition-colors">Remove</button>
                            </div>
                          </div>
                        ))}
                        {output.sensors.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">No sensors added</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 py-4 sm:px-8 sm:py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            type="button"
            className="w-full sm:w-auto justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || hasErrors}
            type="button"
            className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-900 to-blue-600 shadow-md transition
              ${isSubmitting || hasErrors ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-lg active:scale-[0.98]'}`}
          >
            {isSubmitting ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : isUpdateMode ? '💾 Update Device' : '✅ Create Device'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}