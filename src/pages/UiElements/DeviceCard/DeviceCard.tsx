import { motion } from 'framer-motion';
import { MapPin, Clock, Zap } from 'lucide-react';

// Updated type to match the parent component
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
  mapShow?: boolean;
  emailNoti?: boolean;
  dataWithPlatform?: any;
  decimalPoints?: any;
  dataParameterFilter?: any;
};

interface DeviceCardProps {
  device: DeviceData;
  index: number;
  isActive: boolean;
  onViewDetails: (device: DeviceData) => void;
}

const DeviceCard = ({ device, index, isActive, onViewDetails }: DeviceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative w-full"
    >
      {/* Card container with shadow and theme support */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl dark:shadow-gray-900/50 transition-all duration-300 overflow-hidden h-full flex flex-col">
        
        {/* Header with company name */}
        <div
          className={`px-6 py-5 text-center font-bold text-xl transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
          }`}
        >
          {device.companyName}
        </div>

        {/* Content section - grows to push button down when hidden */}
        <div className="flex-1 px-6 py-5 pb-8 space-y-4">
          
          {/* Device ID */}
          <div className="text-center pb-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
              ID: {device._id}
            </p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 italic">
              {device.deviceName}
            </p>
          </div>

          {/* City */}
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {device.city}
            </p>
          </div>

          {/* Address with icon */}
          <div className="flex items-start justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={16} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-center line-clamp-2">
              {device.address}
              ,  {device.adminId}
            </p>
          </div>

          {/* Interval */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-300">Interval:</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{device.timeIntervelSet}</span>
          </div>

          {/* Parameter */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Zap size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-300">Parameter:</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{device.dataParameterTitle}</span>
          </div>
        </div>

        {/* Animated Button Container - Slides up from bottom on hover */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          {/* Gradient overlay for smooth transition */}
          <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
          
          <motion.button
            onClick={() => onViewDetails(device)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg transition-all duration-300 relative overflow-hidden ${
              isActive
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {/* Button shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative">View Device Details</span>
          </motion.button>
        </div>

        {/* Hover indicator at bottom when button is hidden */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 dark:via-blue-500 to-transparent opacity-0 group-hover:opacity-0 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
};

export default DeviceCard;