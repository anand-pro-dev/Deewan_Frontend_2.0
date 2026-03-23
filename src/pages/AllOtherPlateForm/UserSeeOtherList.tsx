import { useEffect, useState } from 'react';
import { deleteConnectWtithOther, getWebConnectWtithOther } from '../../apis/apiConnectSite';
import AddSperate from './AddSperate';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

type DynamicKeyMap = { [key: string]: string };

type Device = {
  _id: string;
  deviceName: string;
  deviceId: string;
  keys: DynamicKeyMap;
  values: DynamicKeyMap;
  typeToConnect: string;
  sendingPlace: string;
  urls: string;
  timeIntervelSet: string;
  deviceNextLogTime?: string;
};

// ✅ Typed location state
type LocationState = {
  deviceId?: string;
  deviceDataParameterFilter?: unknown;
};

const SeeOtherSiteList = () => {
  const navigate = useNavigate();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDataWithPlatform, setSelectedDataWithPlatform] = useState<string | null>(null);
  // ✅ Removed selectedDataParameterFilter state — was set but never read

  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const currentDeviceId = state.deviceId;
  const currentDataParameterFilter = state.deviceDataParameterFilter;

  const authUser = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = authUser?.role?.toLowerCase() === 'superadmin';

  useEffect(() => {
    // ✅ Wait until currentDeviceId is available before fetching
    if (!currentDeviceId) {
      setLoading(false);
      setError('Device ID not found. Please go back and try again.');
      return;
    }

    const fetchDevices = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getWebConnectWtithOther(currentDeviceId);
        if (response.success && Array.isArray(response.data)) {
          setDevices(response.data);
        } else {
          setError('Failed to load devices');
        }
      } catch {
        setError('Error fetching device data');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [currentDeviceId]); // ✅ re-run if deviceId changes

  const handleViewDetails = (device: Device) => {
    navigate('/view_other_details', { state: { device } });
  };

  const handleAddDevice = () => {
    setSelectedDeviceId(currentDeviceId ?? null);
    setSelectedDataWithPlatform('none');
    setOpen(true);
  };

  const handleAddSeparate = (id: string, typeToConnect: string) => {
    setSelectedDeviceId(id);
    setSelectedDataWithPlatform(typeToConnect);
    setOpen(true);
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;

    try {
      const res = await deleteConnectWtithOther(deviceId);
      if (res.success) {
        toast.success('🗑️ Device deleted successfully');
        setDevices((prev) => prev.filter((device) => device._id !== deviceId));
      } else {
        toast.error(res.message || 'Failed to delete device');
      }
    } catch (err) {
      toast.error('Error deleting device');
      console.error(err);
    }
  };

  if (loading) return <p className="text-gray-600">Loading devices...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Device Summary</h2>

        {isSuperAdmin && (
          <button
            onClick={handleAddDevice}
            className="bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold px-6 py-2 rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
          >
            + Add Device
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">Device ID: {currentDeviceId}</p>

      {devices.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No devices found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
          {devices.map((device) => (
            <div
              key={device._id}
              className="relative group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all transform hover:-translate-y-1 hover:shadow-xl h-auto"
            >
              {/* Value Badge */}
              <div className="text-white text-center py-4 text-2xl font-bold transition-all duration-500 bg-gradient-to-r from-blue-700 to-blue-400 group-hover:from-green-500 group-hover:to-white group-hover:text-black rounded-t-2xl">
                {Object.values(device.deviceName)}
              </div>

              {/* Edit Button */}
              {isSuperAdmin && (
                <div className="absolute top-4 right-12 group">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleAddSeparate(device._id, device.typeToConnect || 'none')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                      title="Edit"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Button */}
              {isSuperAdmin && (
                <div className="absolute top-4 right-3 group">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleDeleteDevice(device._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="p-4 text-center">
                <div className="bg-gray-100 dark:bg-gray-700 text-blue-900 dark:text-blue-100 text-center py-2 font-semibold text-xs uppercase rounded">
                  {device.sendingPlace || 'Unknown'}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Interval: <span className="font-medium">{device.timeIntervelSet || 'N/A'}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Next Log:{' '}
                  <span className="font-medium">
                    {device.deviceNextLogTime
                      ? new Date(device.deviceNextLogTime).toLocaleString('en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : '—'}
                  </span>
                </p>

                {/* Parameters */}
                <div className="mt-3 text-left">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Parameters</h4>
                  <ul className="text-xs text-gray-700 dark:text-gray-400 space-y-1">
                    {Object.entries(device?.keys ?? {}).map(([key, label]) => {
                      const value = device.values?.[key];
                      if (!label) return null;
                      return (
                        <li key={key}>
                          <span className="font-medium">{label}</span>: {value?.trim() ? value : 'Empty'}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Hover Actions */}
                <div className="mt-2 hidden group-hover:flex flex-col gap-2 transition-all duration-300">
                  <button
                    onClick={() => handleViewDetails(device)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-semibold shadow transition-all"
                  >
                    View Device Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isOpen && currentDeviceId && (
        <AddSperate
          indexId={selectedDeviceId}
          Cancel={() => setOpen(false)}
          deviceId={currentDeviceId}                                      // ✅ never undefined here
          dataWithPlatform={selectedDataWithPlatform}
          DataParameterFilter={
            Array.isArray(currentDataParameterFilter)
              ? (currentDataParameterFilter as string[])
              : null
          }
        />
      )}
    </div>
  );
};

export default SeeOtherSiteList;