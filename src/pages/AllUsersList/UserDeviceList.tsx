import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  adminGetUserDeviceApi,  
  adminDeleteUserDeviceApi,
} from '../../apis/adminApi';
import { getUserAllMqttDevices, deleteMqttDeviceDetails } from '../../apis/mqtt_api';
import { useNavigate, useParams } from 'react-router-dom';
import DeviceConfigForm from '../All_Mqtt_devices/createMqttDevice';
import { motion, AnimatePresence } from 'framer-motion';
import { createMqttDevice, updateMqttDevice } from '../../apis/mqtt_api';
import {
  Trash2, Edit, Plus, Wifi, WifiOff, MapPin, Clock,
  Eye, Link2, Server, Zap, RefreshCw
} from 'lucide-react';
import DeviceCard from '../UiElements/DeviceCard/DeviceCard';
import { useAppSelector } from '../../store/hooks';

type DeviceData = {
  _id?: string;
  userId?: string;
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
  mapShow?: boolean;
  emailNoti?: boolean;
  dataWithPlatform?: any;
  decimalPoints?: any;
  dataParameterFilter?: any;
}

type MqttDevice = {
  _id: string;
  companyName: string;
  deviceId: string;
  city: string;
  address: string;
  isOnline: boolean;
  lastSeen: string;
  timeIntervelSet: string;
  dataParameter: string;
  dataParameterTitle: string;
}

const DeviceList = () => {
  const { userId } = useParams(); // this is the user's ID passed by admin/superAdmin in URL
  const navigate = useNavigate();

  // Redux auth state
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;
  const loggedInUserId = user?._id;

  // admin/superAdmin always have userId in URL (the user they manage)
  // user role uses their own loggedInUserId
  const targetUserId = role === 'user' ? loggedInUserId : userId;

  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [mqttDevices, setMqttDevices] = useState<MqttDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [mqttLoading, setMqttLoading] = useState(true);
  const [showFormMqtt, setShowFormMqtt] = useState(false);
  const [selectedDeviceMqtt, setSelectedDeviceMqtt] = useState(null);
  const [searchQuery] = useState('');

  // Only fetch when targetUserId is available (waits for Redux rehydration)
  useEffect(() => {
    if (targetUserId) {
      fetchDevices();
      fetchMqttDevices();
    }
  }, [userId, loggedInUserId, targetUserId]);

const fetchDevices = async () => {
  try {
    setLoading(true);

    let res;

    if (role === "user") {
      res = await adminGetUserDeviceApi(targetUserId || '');
 
    } else {
      res = await adminGetUserDeviceApi(userId || '');
 
    }

    if (res?.success) {
      const allDevices = res.data?.devices || res.data || [];
      setDevices(allDevices);
    } else {
      toast.error('Failed to fetch devices');
    }
  } catch (err) {
    console.error(err);
    toast.error('Error fetching devices');
  } finally {
    setLoading(false);
  }
};

  const fetchMqttDevices = async () => {
    try {
      setMqttLoading(true);
      const res = await getUserAllMqttDevices(targetUserId || '');
      setMqttDevices(res?.data || []);
    } catch (err) {
      console.error('Error loading MQTT devices', err);
    } finally {
      setMqttLoading(false);
    }
  };

  const handleViewMqttDeviceDetials = (deviceId: any) => {
    navigate(`/viewMqttDeviceDetails/${deviceId}`);
  };

  const handleEditMqttDevice = (device: any) => {
    setSelectedDeviceMqtt(device);
    setShowFormMqtt(true);
  };

const handleAddDevice = () => {
  // If user role → use their own ID
  // If admin/superAdmin → userId from URL param is the user they manage
  const navUserId = role === 'user' ? loggedInUserId : userId;
  console.log('handleAddDevice navUserId:', navUserId, 'role:', role, 'userId param:', userId, 'loggedInUserId:', loggedInUserId);
  if (!navUserId) {
    toast.error('User ID is missing. Please go back and try again.');
    return;
  }
  navigate(`/deviceCreateForHttp/${navUserId}`);
};

const handleEditDevice = (device: DeviceData) => {
  const navUserId = device.userId || (role === 'user' ? loggedInUserId : userId);
  console.log('handleEditDevice navUserId:', navUserId, 'device.userId:', device.userId);
  if (!navUserId) {
    toast.error('User ID is missing');
    return;
  }
  navigate(`/deviceCreateForHttp/${navUserId}`, { state: { device } });
};

  const handleAddDeviceMqtt = () => {
    setSelectedDeviceMqtt(null);
    setShowFormMqtt(true);
  };

  const handleCloseMqtt = () => {
    setShowFormMqtt(false);
    setSelectedDeviceMqtt(null);
  };

  const handleSuccessMqtt = () => {
    setShowFormMqtt(false);
    setSelectedDeviceMqtt(null);
    fetchDevices();
    fetchMqttDevices();
  };

  const handleOtherApiList = (device: DeviceData) => {
    navigate('/otherApiList', {
      state: {
        deviceId: device._id,
        deviceDataParameterFilter: device.dataParameterFilter,
      },
    });
  };


const handleDeleteDevice = async (deviceId: string) => {
  if (!window.confirm('Are you sure you want to delete this device?')) return;
  try {
    const res = await adminDeleteUserDeviceApi(deviceId);
    if (res.success) {
      toast.success('🗑️ Device deleted successfully');
      setTimeout(() => window.location.reload(), 500); // ✅ slight delay so toast is visible
    } else {
      toast.error(res.message || 'Failed to delete device');
    }
  } catch (err) {
    toast.error('Error deleting device');
    console.error(err);
  }
};

  const handleDeleteMqtttDevice = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      const res = await deleteMqttDeviceDetails(deviceId);
      if (res.success) {
        toast.success('🗑️ Device deleted successfully');
        setMqttDevices(prev => prev.filter(device => device._id !== deviceId));
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error(res.message || 'Failed to delete device');
      }
    } catch (err) {
      toast.error('Error deleting device');
      console.error(err);
    }
  };

  const handleRefresh = () => {
    fetchDevices();
    fetchMqttDevices();
    toast.success('Refreshing devices...');
  };

  const filteredDevices = devices.filter(device =>
    device.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMqttDevices = mqttDevices.filter(device =>
    device.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.deviceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const activeDevices = devices.filter(d => d.currentStatus?.toLowerCase() === 'active').length;
  // const totalDevices = devices.length;
  // const onlineMqttDevices = mqttDevices.filter(d => d.isOnline).length;
  // const totalMqttDevices = mqttDevices.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Top Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
                Device Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage and monitor all your connected devices
              </p>
                {role !== 'user' && (
               <>   <br/>
              <p className="text-gray-400 dark:text-gray-300">
               UserID :  {targetUserId}
              </p>
               </>
              )}
           
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Refresh */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={loading || mqttLoading}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-xl font-semibold shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={(loading || mqttLoading) ? 'animate-spin' : ''} />
                Refresh
              </motion.button>

              {/* Add HTTP Device - admin only */}
              {role === 'admin' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddDevice}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={18} />
                  Add HTTP Device
                </motion.button>
              )}

              {/* Add MQTT Device - superAdmin only */}
              {role === 'superAdmin' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddDeviceMqtt}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={18} />
                  Add MQTT Device
                </motion.button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 dark:text-blue-200 text-sm font-medium mb-1">HTTP Devices</p>
                  <p className="text-4xl font-bold">{totalDevices}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <Server size={32} />
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
                  <p className="text-green-100 dark:text-green-200 text-sm font-medium mb-1">Active HTTP</p>
                  <p className="text-4xl font-bold">{activeDevices}</p>
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
              className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 dark:text-purple-200 text-sm font-medium mb-1">MQTT Devices</p>
                  <p className="text-4xl font-bold">{totalMqttDevices}</p>
                  <p className="text-sm text-purple-100 dark:text-purple-200 mt-1">{onlineMqttDevices} Online</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <Zap size={32} />
                </div>
              </div>
            </motion.div>
          </div> */}

          {/* Search Bar */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search devices by name, company, city, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </motion.div> */}
        </motion.div>

        {/* HTTP DEVICES SECTION */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Server size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200"> Devices</h2>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              {filteredDevices.length}
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                  <div
                    className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 dark:border-t-indigo-500 rounded-full animate-spin"
                    style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                  />
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading HTTP devices...</p>
              </motion.div>
            ) : filteredDevices.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Server size={48} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  No devices found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first device'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="devices"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-wrap gap-6"
              >
                {filteredDevices.map((device, index) => (
                  <div key={device._id || index} className="group relative w-full lg:w-[calc(33.333%-16px)]">
                    {/* Action Buttons Overlay */}
                    <div className="absolute top-16 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleEditDevice(device); }}
                        className="p-2.5 bg-white/95 dark:bg-gray-800/95 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl shadow-lg transition-all backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                        title="Edit Device"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      {role !== 'user' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); handleDeleteDevice(device._id!); }}
                          className="p-2.5 bg-white/95 dark:bg-gray-800/95 hover:bg-red-600 text-red-600 hover:text-white rounded-xl shadow-lg transition-all backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                          title="Delete Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>

                    <DeviceCard
                      device={device}
                      index={index}
                      isActive={device.currentStatus?.toLowerCase() === 'active'}
                      onViewDetails={() => navigate('/DeviceData', { state: { deviceId: device._id } })}
                    />

                    {device.dataWithPlatform !== 'none' && device.dataWithPlatform !== '' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                        className="mt-2"
                      >
                        <button
                          onClick={() => handleOtherApiList(device)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300 rounded-xl transition-all shadow-sm hover:shadow-md group/link"
                        >
                          <Link2 size={16} className="text-blue-600 dark:text-blue-400 group-hover/link:rotate-45 transition-transform" />
                          <span className="text-sm font-medium">View Platform Links</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MQTT DEVICES SECTION */}
        {!mqttLoading && filteredMqttDevices.length > 0 && (
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">IOT Devices</h2>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {filteredMqttDevices.length}
              </span>
            </motion.div>

            <div className="flex flex-wrap gap-6">
              {filteredMqttDevices.map((device, index) => (
                <motion.div
                  key={device.deviceId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative group w-full lg:w-[calc(33.333%-16px)]"
                >
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleEditMqttDevice(device); }}
                      className="p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl shadow-lg transition-all backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteMqtttDevice(device.deviceId); }}
                      className="p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-red-600 text-red-600 hover:text-white rounded-xl shadow-lg transition-all backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl dark:shadow-gray-900/50 transition-all duration-300 overflow-hidden h-full flex flex-col">
                    <div className={`px-6 py-5 text-center font-bold text-xl ${
                      device.isOnline
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    }`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {device.isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                        <span>{device.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                      <p className="text-lg">{device.companyName || 'Unknown Company'}</p>
                    </div>

                    <div className="flex-1 px-6 py-5 pb-8 space-y-4">
                      <div className="text-center pb-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Device ID</p>
                        <p className="text-sm font-mono text-purple-600 dark:text-purple-400 break-all">
                          {device.deviceId}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 capitalize">
                          {device.city || 'Unknown City'}
                        </p>
                      </div>
                      <div className="flex items-start justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin size={16} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-center line-clamp-2">{device.address || 'No address provided'}</p>
                      </div>
                      {device.lastSeen && (
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Clock size={16} className="text-gray-400" />
                          <div className="text-center">
                            <span className="text-gray-600 dark:text-gray-300 block text-xs">Last seen</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-xs">
                              {new Date(device.lastSeen).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative overflow-hidden">
                      <div className="px-6 pb-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                        <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
                        <motion.button
                          onClick={() => handleViewMqttDeviceDetials(device.deviceId)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg transition-all duration-300 relative overflow-hidden ${
                            device.isOnline
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                          }`}
                        >
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          <span className="relative flex items-center justify-center gap-2">
                            <Eye size={18} />
                            View Details
                          </span>
                        </motion.button>
                      </div>
                    </div>

                    {device.isOnline && (
                      <div className="absolute top-4 left-4">
                        <div className="relative">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                          <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showFormMqtt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseMqtt}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <DeviceConfigForm
                userId={role === 'user' ? loggedInUserId : userId}
                createMqttDevice={createMqttDevice}
                updateMqttDevice={updateMqttDevice}
                deviceData={selectedDeviceMqtt}
                onSuccess={handleSuccessMqtt}
                onClose={handleCloseMqtt}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeviceList;