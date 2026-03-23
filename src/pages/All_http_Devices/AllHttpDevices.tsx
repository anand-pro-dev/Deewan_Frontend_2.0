import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw, Wifi, WifiOff, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetPublicActiveDeviceApi } from '../../apis/adminApi';
import { useNavigate, useParams } from 'react-router-dom';
import DeviceCard from '../UiElements/DeviceCard/DeviceCard';

type DeviceData = {
  _id?: string;
  deviceName?: string;
  companyName?: string;
  city?: string;
  lat?: string;
  long?: string;
  address?: string;
  timeIntervelSet?: string;
  dataParameter?: string;
  dataParameterTitle?: string;
  currentStatus?: string;
  deviceImage?: string;
};

const AllHttpDeviceslist = () => {
  const { userId } = useParams();
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDevices();
  }, [userId]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await adminGetPublicActiveDeviceApi();
      if (res.success) {
        const allDevices = res.data?.devices || res.data || [];
        setDevices(allDevices);
        toast.success('Devices loaded successfully!');
      } else {
        toast.error('Failed to fetch devices');
      }
    } catch (err) {
      toast.error('Error fetching devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeDevices = devices.filter((d) => d.currentStatus?.toLowerCase() === 'active');
  const inactiveDevices = devices.filter((d) => d.currentStatus?.toLowerCase() !== 'active');

  const filterDevices = (deviceList: DeviceData[]) => {
    if (!searchTerm.trim()) return deviceList;
    return deviceList.filter(device =>
      device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredActiveDevices = filterDevices(activeDevices);
  const filteredInactiveDevices = filterDevices(inactiveDevices);

  const totalCount = devices.length;
  const activeCount = activeDevices.length;
  const inactiveCount = inactiveDevices.length;

  const currentDevices = activeTab === 'active' ? filteredActiveDevices : filteredInactiveDevices;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="w-full p-6">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
                Device Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">Monitor and manage all your connected devices</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchDevices}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-xl font-semibold shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </motion.button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Devices</p>
                  <p className="text-4xl font-bold">{totalCount}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <Activity size={32} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Active Devices</p>
                  <p className="text-4xl font-bold">{activeCount}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <Wifi size={32} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-red-500 to-orange-600 dark:from-red-600 dark:to-orange-700 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Inactive Devices</p>
                  <p className="text-4xl font-bold">{inactiveCount}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <WifiOff size={32} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by device name, company, city, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 inline-flex gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className="relative px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              {activeTab === 'active' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-2 ${
                activeTab === 'active' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${activeTab === 'active' ? 'bg-white' : 'bg-green-500'}`} />
                Active ({activeCount})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inactive')}
              className="relative px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              {activeTab === 'inactive' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-2 ${
                activeTab === 'inactive' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${activeTab === 'inactive' ? 'bg-white' : 'bg-red-500'}`} />
                Inactive ({inactiveCount})
              </span>
            </button>
          </div>
        </motion.div>

        {/* Device Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                <div
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 dark:border-t-indigo-500 rounded-full animate-spin"
                  style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                />
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading devices...</p>
            </motion.div>

          ) : currentDevices.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap gap-6"
            >
              {currentDevices.map((device, index) => (
               
                <div
                  key={device._id || index}
                  className="group w-full lg:w-[calc(33.333%-16px)]"
                >
                  <DeviceCard
                    device={device}
                    index={index}
                    isActive={activeTab === 'active'}
                    onViewDetails={() => {
                      navigate('/DeviceData', { state: { deviceId: device._id } });
                    }}
                  />
                </div>
              ))}
            </motion.div>

          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
            >
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {activeTab === 'active' ? (
                  <Wifi size={48} className="text-gray-400 dark:text-gray-500" />
                ) : (
                  <WifiOff size={48} className="text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {searchTerm ? 'No devices found' : `No ${activeTab} devices`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : `There are currently no ${activeTab} devices to display`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AllHttpDeviceslist;