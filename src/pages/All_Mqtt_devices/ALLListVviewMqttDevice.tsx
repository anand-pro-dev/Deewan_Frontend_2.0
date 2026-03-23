import  { useEffect, useState } from "react";
import { getAllMqttDevices } from "../../apis/mqtt_api";
import { useNavigate } from "react-router-dom";

interface Device {
  deviceId: string;
  deviceName: string;
  companyName: string;
  city: string;
  address: string;
  isOnline: boolean;
  lastSeen: string;
  userId: string;
  adminId: string;
  adminFirstName: string;
  adminLastName: string;
  deviceImage: string;
  outputsCount: number;
  sensorsCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function MqttDevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Handle viewing device details
  const handleViewDeviceDetails = (deviceId: string) => {
    navigate(`/viewMqttDeviceDetails/${deviceId}`);
    console.log(deviceId);
  };

  const loadDevices = async () => {
    try {
      setLoading(true);
      const res = await getAllMqttDevices();
      setDevices(res?.data?.devices || []);
    } catch (err) {
      console.log("Error loading devices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Loading devices...</p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">MQTT Devices</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-xl text-gray-500">No devices found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">MQTT Devices</h1>
        <p className="text-gray-600">Total: {devices.length} device{devices.length !== 1 ? 's' : ''}</p>
      </div>

      {/* GRID */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((d) => (
          <div key={d.deviceId} className="relative group">
            {/* CARD */}
            <div
              className="
                bg-white rounded-2xl shadow-md overflow-hidden
                transition-all duration-300
                group-hover:shadow-xl group-hover:-translate-y-1
                group-hover:ring-2 group-hover:ring-blue-400 group-hover:ring-offset-2
              "
            >
              {/* TOP STRIP */}
              <div
                className={`
                  h-12 flex items-center justify-between px-5 text-white font-semibold text-lg
                  transition-all duration-300
                  ${d.isOnline 
                    ? 'bg-gradient-to-r from-green-500 to-green-700 group-hover:from-green-600 group-hover:to-green-400' 
                    : 'bg-gradient-to-r from-red-500 to-red-700 group-hover:from-red-600 group-hover:to-red-400'
                  }
                `}
              >
                <span>{d.companyName || "Unknown Company"}</span>
                <div className="flex items-center gap-2">
                  <span 
                    className={`w-3 h-3 rounded-full ${d.isOnline ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`} 
                    title={d.isOnline ? 'Online' : 'Offline'}
                  />
                  <span className="text-xs font-normal">
                    {d.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-5 text-center">
                <p className="text-gray-900 font-bold text-lg mb-2">
                  {d.deviceName || "Unnamed Device"}
                </p>

                <p className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block mb-3">
                  ID: {d.deviceId}
                </p>

                <p className="text-lg font-semibold mt-3 capitalize text-gray-800">
                  📍 {d.city || "Unknown City"}
                </p>

                <p className="text-gray-600 text-sm mt-1">
                  {d.address || "No address provided"}
                </p>

                {d.lastSeen && (
                  <p className="text-gray-500 text-xs mt-3">
                    ⏰ Last seen: {formatLastSeen(d.lastSeen)}
                  </p>
                )}


                <div className="flex justify-center gap-4 mt-4 text-sm">
                  <div className="bg-blue-50 px-3 py-2 rounded-lg">
                    <p className="text-blue-700 font-semibold">
                      🔌 {d.outputsCount}
                    </p>
                    <p className="text-blue-600 text-xs">Outputs</p>
                  </div>
                  <div className="bg-green-50 px-3 py-2 rounded-lg">
                    <p className="text-green-700 font-semibold">
                      📊 {d.sensorsCount}
                    </p>
                    <p className="text-green-600 text-xs">Sensors</p>
                  </div>
                </div>
                 
              </div>
            </div>

            {/* BUTTON: appears on hover */}
            <button
              onClick={() => handleViewDeviceDetails(d.deviceId)}
              className={`
                absolute left-1/2 -translate-x-1/2 
                bottom-4 opacity-0 group-hover:opacity-100 
                group-hover:translate-y-2
                transition-all duration-300
                font-semibold px-6 py-2 rounded-full shadow-lg
                z-10
                ${d.isOnline 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }
              `}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}