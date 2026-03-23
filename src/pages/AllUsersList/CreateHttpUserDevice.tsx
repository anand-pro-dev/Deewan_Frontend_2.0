import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  adminAddDevicesApi,
  adminGetAllParameterApi,
  adminUpdateUserDeviceApi,
} from '../../apis/adminApi';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

type DeviceData = {
  _id?: string;
  adminId?: string;
  deviceName?: string;
  companyName?: string;
  city?: string;
  lat?: string;
  long?: string;
  address?: string;
  timeIntervelSet?: any;
  dataParameter?: string;
  dataParameterTitle?: string;
  currentStatus?: 'inactive' | 'Inactive' | 'off' | string;
  deviceImage?: File | string;
  dataYmax?: string;
  deviceNextLogTime?: String;
  deviceinactiveData?: String;
  consumptionValue?: any;
  consumptionShow?: boolean;
  // admin / super-admin only
  serialNo?: String;
  make?: String;
  installationData?: any;
  deviceModel?: string;
  //
  mapShow?: boolean;
  emailNoti?: boolean;
  dataWithPlatform?: any;
  decimalPoints?: any;
  dataParameterFilter?: any;
};

type Parameter = {
  _id: string;
  title: string;
  parameterKey: {
    key: Record<string, string>;
    _id: string;
  }[];
};

const intervalOptions = [
  '30 sec', '1 min', '3 min', '10 min', '15 min', '20 min',
  '30 min', '45 min', '60 min', '2 hrs', '4 hrs', '6 hrs',
  '10 hrs', '12 hrs', '1 day',
];

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200';

const labelClass = 'block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300';

// ── Same PickerInput pattern as DeviceDataDetails ──────────────────────────
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
          transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
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

const DeviceCreateFotHttp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();

  const authUser = useAppSelector((state) => state.auth.user);
  const role = authUser?.role;
  const loggedInUserId = authUser?._id;
  const adminId = authUser?._id || '';
  const adminFirstName = authUser?.firstName || '';
  const adminLastName = authUser?.lastName || '';

  const editDevice = location.state?.device;
  const isEditMode = !!editDevice;

  // true for admin & super-admin, false for regular user
  const isAdminOrSuperAdmin = role !== 'user';

  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [deviceData, setDeviceData] = useState<DeviceData>({
    adminId: adminId,
    deviceName: '',
    companyName: '',
    city: '',
    lat: '',
    long: '',
    address: '',
    timeIntervelSet: '3 min',
    dataParameter: '',
    dataParameterTitle: '',
    currentStatus: 'Inactive',
    consumptionValue: '',
    // admin / super-admin only
    serialNo: '',
    make: '',
    installationData: '',
    deviceModel: '',
    //
    consumptionShow: false,
    mapShow: true,
    emailNoti: true,
    dataWithPlatform: '',
    decimalPoints: '.000',
    dataParameterFilter: [],
  });

  // Hide navbar & sidebar while this page is mounted
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    fetchParameters();
    if (editDevice) {
      setDeviceData({
        _id: editDevice._id,
        deviceName: editDevice.deviceName || '',
        companyName: editDevice.companyName || '',
        city: editDevice.city || '',
        lat: editDevice.lat || '',
        long: editDevice.long || '',
        address: editDevice.address || '',
        timeIntervelSet: editDevice.timeIntervelSet || '3 min',
        dataParameter: editDevice.dataParameter || '',
        dataParameterTitle: editDevice.dataParameterTitle || '',
        currentStatus: editDevice.currentStatus || 'active',
        deviceImage: editDevice.deviceImage || '',
        dataYmax: editDevice.dataYmax || '',
        // admin / super-admin only
        serialNo: editDevice.serialNo || '',
        make: editDevice.make || '',
        installationData: editDevice.installationData || '',
        deviceModel: editDevice.deviceModel || '',
        //
        consumptionShow: editDevice.consumptionShow || false,
        mapShow: editDevice.mapShow,
        emailNoti: editDevice.emailNoti,
        consumptionValue: editDevice.consumptionValue || '',
        dataWithPlatform: editDevice.dataWithPlatform || '',
        decimalPoints: editDevice.decimalPoints || '.000',
        dataParameterFilter: editDevice.dataParameterFilter || [],
      });
    }
  }, [editDevice]);

  const fetchParameters = async () => {
    try {
      const res = await adminGetAllParameterApi();
      if (res.success) setParameters(res.data);
    } catch (err) {
      toast.error('Failed to fetch parameters');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDeviceData((prev) => ({ ...prev, [name]: value }));
  };

  const handleParameterSelect = (paramId: string) => {
    const selected = parameters.find((p) => p._id === paramId);
    if (selected) {
      const dataParameterFilter: string[] = [];
      selected.parameterKey?.forEach((pk: any) => {
        const keys = pk?.key || {};
        Object.values(keys).forEach((val: any) => {
          if (typeof val === 'string') {
            const parts = val.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean);
            dataParameterFilter.push(...parts);
          }
        });
      });
      setDeviceData((prev) => ({
        ...prev,
        dataParameter: selected._id,
        dataParameterTitle: selected.title,
        dataParameterFilter,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setDeviceData((prev) => ({ ...prev, deviceImage: file }));
    }
  };

  const handleSubmit = async () => {
    const userIdToUse = role === 'user' ? loggedInUserId : userId;
    if (!userIdToUse) return toast.error('User ID is missing');

    if (
      !deviceData.deviceName ||
      !deviceData.city ||
      !deviceData.lat ||
      !deviceData.long ||
      !deviceData.address ||
      !deviceData.timeIntervelSet ||
      !deviceData.dataParameter ||
      !deviceData.deviceImage ||
      !deviceData.dataParameterFilter ||
      !deviceData.companyName ||
      (deviceData.consumptionShow && !deviceData.consumptionValue)
    ) {
      alert('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userIdToUse);

    // ✅ adminId never changes on update — only send on create
    if (!isEditMode) {
      formData.append('adminId', adminId);
      formData.append('adminFirstName', adminFirstName);
      formData.append('adminlastName', adminLastName);
    }

    const fieldsToSend: Partial<DeviceData> = {
      deviceName: deviceData.deviceName,
      city: deviceData.city,
      lat: deviceData.lat,
      long: deviceData.long,
      address: deviceData.address,
      mapShow: deviceData.mapShow,
      emailNoti: deviceData.emailNoti,
      timeIntervelSet: deviceData.timeIntervelSet,
      dataParameter: deviceData.dataParameter,
      dataParameterTitle: deviceData.dataParameterTitle,
      currentStatus: deviceData.currentStatus,
      dataYmax: deviceData.dataYmax,
      consumptionShow: deviceData.consumptionShow,
      dataWithPlatform: deviceData.dataWithPlatform,
      decimalPoints: deviceData.decimalPoints,
      dataParameterFilter: deviceData.dataParameterFilter,
      companyName: deviceData.companyName,

      // ✅ Only admin / super-admin fields — never sent for regular users
      ...(isAdminOrSuperAdmin && {
        serialNo: deviceData.serialNo,
        make: deviceData.make,
        installationData: deviceData.installationData,
        deviceModel: deviceData.deviceModel,
      }),
    };

    Object.entries(fieldsToSend).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (deviceData.deviceImage instanceof File) {
      formData.append('deviceImage', deviceData.deviceImage);
    }

    setSubmitting(true);
    try {
      const res = isEditMode
        ? await adminUpdateUserDeviceApi(deviceData._id!, formData)
        : await adminAddDevicesApi(formData);

      if (res.success) {
        toast.success(`✅ Device ${isEditMode ? 'updated' : 'added'} successfully`);
        navigate(-1);
      } else {
        toast.error(res.message || 'Failed to save device');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
      <div
        className="
          relative w-full bg-white dark:bg-gray-900
          flex flex-col
          h-screen sm:h-auto
          sm:max-h-[92vh]
          sm:my-6 sm:mx-4
          sm:max-w-2xl sm:rounded-3xl
          sm:shadow-2xl
          overflow-hidden
        "
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-4 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-0 border-b border-gray-100 dark:border-gray-800 sm:border-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                {isEditMode ? 'Edit Device' : 'Add New Device'}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isEditMode
                  ? 'Update the device details below.'
                  : 'Fill in the details to register a new device.'}
              </p>
            </div>

            {/* Mobile close / back button */}
            <button
              onClick={() => navigate(-1)}
              className="sm:hidden flex-shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6 space-y-6">

          {/* ── Section: Basic Info ── */}
          <div>
            <h5 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Device Details
            </h5>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  ['deviceName', 'Device Name', 'text'],
                  ['companyName', 'Company Name', 'text'],
                  ['city', 'City', 'text'],
                  ['address', 'Address', 'text'],
                  ['lat', 'Latitude', 'number'],
                  ['long', 'Longitude', 'number'],
                ] as [string, string, string][]
              ).map(([name, label, type]) => (
                <div key={name}>
                  <label htmlFor={name} className={labelClass}>{label}</label>
                  <input
                    id={name}
                    name={name}
                    type={type}
                    placeholder={label}
                    value={(deviceData as any)[name] ?? ''}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Section: Admin / Super-Admin Only — Hardware Info ── */}
          {isAdminOrSuperAdmin && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <h5 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Hardware Info
              </h5>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(
                  [
                    ['serialNo', 'Serial No.', 'text'],
                    ['make', 'Make', 'text'],
                    ['deviceModel', 'Device Model', 'text'],
                  ] as [string, string, string][]
                ).map(([name, label, type]) => (
                  <div key={name}>
                    <label htmlFor={name} className={labelClass}>{label}</label>
                    <input
                      id={name}
                      name={name}
                      type={type}
                      placeholder={label}
                      value={(deviceData as any)[name] ?? ''}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                ))}

                {/* Installation Date — full width */}
                <div className="sm:col-span-2">
                  <label htmlFor="installationData" className={labelClass}>
                    Installation Date
                  </label>
                  <DatePickerInput
                    min="2021-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    value={(() => {
                      const raw = deviceData.installationData as string;
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
                    onChange={(e) =>
                      setDeviceData((prev) => ({ ...prev, installationData: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Section: Toggles ── */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <h5 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Visibility &amp; Notifications
            </h5>
            <div className="flex flex-wrap gap-6">
              {[
                { id: 'mapShow', label: 'Show device on Map', key: 'mapShow' },
                { id: 'emailNoti', label: 'Email Notifications', key: 'emailNoti' },
              ].map(({ id, label, key }) => (
                <label key={id} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id={id}
                      checked={!!(deviceData as any)[key]}
                      onChange={(e) =>
                        setDeviceData((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-primary transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Section: Image Upload ── */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <h5 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Device Image
            </h5>
            <div
              className="relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors p-5 text-center cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/'))
                  setDeviceData((prev) => ({ ...prev, deviceImage: file }));
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {deviceData.deviceImage ? (
                <div className="relative">
                  <img
                    src={
                      deviceData.deviceImage instanceof File
                        ? URL.createObjectURL(deviceData.deviceImage)
                        : (deviceData.deviceImage as string)
                    }
                    alt="Device preview"
                    className="h-44 w-full object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeviceData((prev) => ({ ...prev, deviceImage: undefined }));
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow transition-colors"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Click or drag &amp; drop to upload
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Section: Admin-only Advanced Settings ── */}
          {isAdminOrSuperAdmin && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-5">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Advanced Settings
              </h5>

              {/* Data Interval */}
              <div>
                <label htmlFor="timeIntervelSet" className={labelClass}>Data Interval</label>
                <select
                  name="timeIntervelSet"
                  id="timeIntervelSet"
                  value={deviceData.timeIntervelSet}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  {intervalOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Select Parameter */}
              <div>
                <label htmlFor="dataParameter" className={labelClass}>Select Parameter</label>
                <select
                  name="dataParameter"
                  id="dataParameter"
                  value={deviceData.dataParameter}
                  onChange={(e) => handleParameterSelect(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Select a Parameter --</option>
                  {parameters.map((param) => (
                    <option key={param._id} value={param._id}>
                      {param.title || 'Unnamed'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consumption toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="consumptionShow"
                    checked={!!deviceData.consumptionShow}
                    onChange={(e) =>
                      setDeviceData((prev) => ({ ...prev, consumptionShow: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Consumption Parameter Key
                </span>
              </label>

              {/* Consumption Value selector */}
              {deviceData.consumptionShow &&
                deviceData.dataParameter &&
                (() => {
                  const selected = parameters.find((p) => p._id === deviceData.dataParameter);
                  if (!selected || selected.parameterKey.length === 0) return null;
                  const parameterKeys = selected.parameterKey[0].key;
                  return (
                    <div>
                      <label htmlFor="consumptionValue" className={labelClass}>
                        Select Parameter Key
                      </label>
                      <select
                        name="consumptionValue"
                        id="consumptionValue"
                        value={deviceData.consumptionValue || ''}
                        onChange={(e) =>
                          setDeviceData((prev) => ({ ...prev, consumptionValue: e.target.value }))
                        }
                        className={inputClass}
                      >
                        <option value="">-- Select Consumption Value --</option>
                        {Object.entries(parameterKeys).map(([key, value]) => (
                          <option key={key} value={value}>{value}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

              {/* Decimal Precision */}
              <div>
                <label htmlFor="decimalPoints" className={labelClass}>Decimal Precision</label>
                <select
                  id="decimalPoints"
                  name="decimalPoints"
                  value={deviceData.decimalPoints || '.000'}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  {['none', '.0', '.00', '.000', '.0000', '.00000', '.000000', '.0000000'].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'none' ? '0 Decimal Places' : `${opt.length - 1} Decimal Place${opt.length - 1 === 1 ? '' : 's'}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Use on Other Platform */}
              <div>
                <label htmlFor="dataWithPlatform" className={labelClass}>Use on Other Platform</label>
                <select
                  id="dataWithPlatform"
                  value={deviceData.dataWithPlatform || 'none'}
                  onChange={(e) =>
                    setDeviceData((prev) => ({ ...prev, dataWithPlatform: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="send">Send</option>
                  <option value="recieve">Receive</option>
                  <option value="none">None</option>
                </select>
              </div>

              {/* Data Y Max */}
              <div>
                <label htmlFor="dataYmax" className={labelClass}>Data Y Max</label>
                <input
                  id="dataYmax"
                  name="dataYmax"
                  type="number"
                  step="any"
                  placeholder="Maximum value"
                  value={deviceData.dataYmax || ''}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="
            flex-shrink-0
            flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3
            px-4 py-4 sm:px-8 sm:py-5
            border-t border-gray-100 dark:border-gray-800
            bg-white dark:bg-gray-900
          "
        >
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`
              w-full sm:w-auto flex items-center justify-center gap-2
              rounded-full px-6 py-2.5 text-sm font-semibold text-white
              bg-gradient-to-r from-blue-900 to-blue-600
              shadow-md transition
              ${submitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-lg active:scale-[0.98]'}
            `}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : isEditMode ? (
              '💾 Update Device'
            ) : (
              '✅ Add Device'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeviceCreateFotHttp;