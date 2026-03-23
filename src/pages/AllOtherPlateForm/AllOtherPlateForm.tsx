import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllDevicesWtithOther } from "../../apis/apiConnectSite";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from '../../store/hooks';
import { 
  Pencil, 
  Eye, 
  Activity, 
  Clock, 
  Zap, 
  Database, 
 UserCheck2Icon,
  Link2,
  Calendar,
  Server
} from "lucide-react";
import AddSperate from "./AddSperate";

interface DeviceItem {
  _id: string;
  deviceName?: string;
  sendingPlace?: string;
  deviceId?: string;
  timeIntervelSet?: string;
  typeToConnect?: string;
  keys?: Record<string, string>;
  values?: Record<string, string>;
  deviceNextLogTime?: string;
}

/* ================================ PLATFORM DEVICE CARD COMPONENT ================================ */

interface PlatformDeviceCardProps {
  device: DeviceItem;
  index: number;
  isSuperAdmin : boolean
  onEdit: (device: DeviceItem) => void;
  adminView: (device: DeviceItem) => void;
  onViewDetails: (device: DeviceItem) => void;
}

const PlatformDeviceCard = ({ device, index, onEdit, onViewDetails , adminView ,isSuperAdmin }: PlatformDeviceCardProps) => {
  const platformColors: Record<string, { from: string; to: string; bg: string; text: string }> = {
    thingspeak: { from: 'from-purple-500', to: 'to-indigo-600', bg: 'bg-purple-100', text: 'text-purple-600' },
    ubidots: { from: 'from-blue-500', to: 'to-cyan-600', bg: 'bg-blue-100', text: 'text-blue-600' },
    aws: { from: 'from-orange-500', to: 'to-amber-600', bg: 'bg-orange-100', text: 'text-orange-600' },
    azure: { from: 'from-sky-500', to: 'to-blue-600', bg: 'bg-sky-100', text: 'text-sky-600' },
    default: { from: 'from-gray-500', to: 'to-gray-600', bg: 'bg-gray-100', text: 'text-gray-600' }
  };

  const platformType = device.typeToConnect?.toLowerCase() || 'default';
  const colors = platformColors[platformType] || platformColors.default;

  const paramCount = Object.keys(device.keys || {}).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
    >
      {/* Main Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
        
        {/* Header with Platform Name */}
        <div className={`relative bg-gradient-to-br ${colors.from} ${colors.to} p-6 overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
          </div>

          {/* Content */}
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-5 h-5 text-white" />
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    {device.typeToConnect || 'Platform'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white line-clamp-2">
                  {device.deviceName || 'Unnamed Device'}
                </h2>
              </div>

              {/* Edit Button - Only visible on hover */}
{isSuperAdmin && (
  <motion.button
  initial={{ scale: 0.8 }}
  className="w-10 h-10 bg-white/20 backdrop-blur-sm
             hover:bg-white/30 rounded-xl
             flex items-center justify-center
             opacity-0 group-hover:opacity-100
             transition-all duration-300"
  whileHover={{ scale: 1.1, rotate: 15 }}
  whileTap={{ scale: 0.9 }}
  onClick={() => adminView(device)}
>
  <UserCheck2Icon className="w-6 h-6 text-white" />
</motion.button>
)}
              

              {/* Edit Button - Only visible on hover */}
              <motion.button
  initial={{ scale: 0.8 }}
  className="w-10 h-10 bg-white/20 backdrop-blur-sm
             hover:bg-white/30 rounded-xl
             flex items-center justify-center
             opacity-0 group-hover:opacity-100
             transition-all duration-300"
  whileHover={{ scale: 1.1, rotate: 15 }}
  whileTap={{ scale: 0.9 }}
  onClick={() => onEdit(device)}
>
  <Pencil className="w-6 h-6 text-white" />
</motion.button>

            </div>

            {/* Sending Place */}
            {device.sendingPlace && (
              <div className="flex items-center gap-2 text-white/90">
                <Server className="w-4 h-4" />
                <span className="text-sm font-medium">{device.sendingPlace}</span>
              </div>
            )}
          </div>
        </div>

        {/* Device Info Section */}
        <div className="p-6 pb-4">
          {/* Device ID */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Device ID</p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              {device._id}
            </p>
          </div>

          {/* Time Info */}
          <div className="space-y-3 mb-4">
            {/* Interval */}
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} dark:${colors.bg}/20 flex items-center justify-center flex-shrink-0`}>
                <Clock className={`w-5 h-5 ${colors.text} dark:${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Time Interval</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {device.timeIntervelSet || 'Not Set'}
                </p>
              </div>
            </div>

            {/* Next Log Time */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Next Log Time</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {device.deviceNextLogTime
                    ? new Date(device.deviceNextLogTime).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "Not Scheduled"}
                </p>
              </div>
            </div>
          </div>

          {/* Parameters Section */}
          {paramCount > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Parameters ({paramCount})
                </h3>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {Object.entries(device.keys || {}).map(([k, label]) => (
                  <div 
                    key={k}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Zap className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                        {label}:
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white ml-2">
                      {device.values?.[k] || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Details Button - Slides up from bottom on hover */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewDetails(device)}
            className={`w-full py-4 font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r ${colors.from} ${colors.to} hover:shadow-xl rounded-b-3xl`}
          >
            <Eye className="w-5 h-5" />
            <span>View Device Details</span>
          </motion.button>
        </motion.div>

        {/* Hover Glow Effect */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${colors.from}/5 ${colors.to}/5`} />
      </div>
    </motion.div>
  );
};

/* ================================ MAIN COMPONENT ================================ */

const AllOtherPlateFormDevices: React.FC = () => {
  const navigate = useNavigate();

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setOpen] = useState(false);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDataWithPlatform, setSelectedDataWithPlatform] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const authUser    = useAppSelector((state) => state.auth.user);
  const role        = authUser?.role?.toLowerCase() ?? "";
  const isSuperAdmin = role === "superadmin";
 

  const fetchDevices = async () => {
    try {
      const res = await getAllDevicesWtithOther();
      if (res?.success && Array.isArray(res.data)) {
        setDevices(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (device: DeviceItem) => {
    navigate("/view_other_details", { state: { device } });
  };


  const handleViewDetailsAdmin = (device: DeviceItem) => {
    navigate("/view_other_details_admin", { state: { device } });
  };

  const handleEdit = (device: DeviceItem) => {
    setSelectedDeviceId(device._id);
    setSelectedDataWithPlatform(device.typeToConnect || "none");
    setOpen(true);
  };

  // Platform statistics
  const platformStats = devices.reduce((acc, device) => {
    const platform = device.typeToConnect?.toLowerCase() || 'other';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalDevices = devices.length;
  const totalParameters = devices.reduce((sum, d) => sum + Object.keys(d.keys || {}).length, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full mb-4"
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading platform devices...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Activity className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Platform Connections
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-1">
                Manage and monitor all connected platform devices
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Total Devices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">
                  Total Devices
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {totalDevices}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Server className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Total Parameters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">
                  Total Parameters
                </p>
                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {totalParameters}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Database className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Platforms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">
                  Platforms
                </p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {Object.keys(platformStats).length}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Link2 className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Platform Badges */}
        {Object.keys(platformStats).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-3">
              {Object.entries(platformStats).map(([platform, count], idx) => (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full shadow-md"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {platform.toUpperCase()}
                  </span>
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                    {count}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Device Grid */}
        {devices.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {devices.map((device, index) => (
                <PlatformDeviceCard
                isSuperAdmin = {isSuperAdmin}
                  key={device._id}
                  device={device}
                  index={index}
                  adminView={handleViewDetailsAdmin}
                  onEdit={handleEdit}

                  onViewDetails={handleViewDetails}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-200 dark:border-gray-800 shadow-xl text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
              <Server className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Platform Devices Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your first platform device to get started
            </p>
          </motion.div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {isOpen && (
            <AddSperate
              indexId={selectedDeviceId}
              Cancel={() => setOpen(false)}
              deviceId={selectedDeviceId}
              dataWithPlatform={selectedDataWithPlatform}
              DataParameterFilter={null}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};

export default AllOtherPlateFormDevices;