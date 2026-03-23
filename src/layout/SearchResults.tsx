import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { adminSearchDeviceApi } from "../apis/adminApi";
import DeviceCard from "../pages/UiElements/DeviceCard/DeviceCard"; // same path as AllHttpDeviceslist
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";

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

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [results, setResults] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim()) fetchResults();
  }, [query]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await adminSearchDeviceApi(query.trim());

      if (res?.success) {
        const devices = Array.isArray(res.data) ? res.data : [];
        setResults(devices);
        if (devices.length === 0) toast.error("No devices found");
      } else {
        setResults([]);
        toast.error(res?.message || "No results found");
      }
    } catch (err) {
      toast.error("Error fetching search results");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

 

  const activeDevices = results.filter(
    (d) => d.currentStatus?.toLowerCase() === "active"
  );
  const inactiveDevices = results.filter(
    (d) => d.currentStatus?.toLowerCase() !== "active"
  );

  const activeCount = activeDevices.length;
  const inactiveCount = inactiveDevices.length;
  const currentDevices = activeTab === "active" ? activeDevices : inactiveDevices;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="w-full p-6">

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            Search Results for:{" "}
            <span className="text-blue-600 dark:text-blue-400 italic">"{query}"</span>
          </h1>

          {!loading && results.length > 0 && (
            <p className="text-xl text-gray-500 dark:text-gray-400 mt-2">
              Found{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {results.length}
              </span>{" "}
              device{results.length !== 1 ? "s" : ""}
              {activeCount > 0 && (
                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                  ({activeCount} active)
                </span>
              )}
              {inactiveCount > 0 && (
                <span className="ml-2 text-red-500 dark:text-red-400 font-medium">
                  ({inactiveCount} inactive)
                </span>
              )}
            </p>
          )}
        </motion.div>

        {/* Loading */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 dark:border-t-indigo-500 rounded-full animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              />
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Searching...</p>
          </motion.div>

        ) : results.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 opacity-40 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              No devices found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try a different search term
            </p>
          </motion.div>

        ) : (
          <>
            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 inline-flex gap-2">
                <button
                  onClick={() => setActiveTab("active")}
                  className="relative px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  {activeTab === "active" && (
                    <motion.div
                      layoutId="searchTab"
                      className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center gap-2 ${
                      activeTab === "active"
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeTab === "active" ? "bg-white" : "bg-green-500"
                      }`}
                    />
                    Active ({activeCount})
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("inactive")}
                  className="relative px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  {activeTab === "inactive" && (
                    <motion.div
                      layoutId="searchTab"
                      className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center gap-2 ${
                      activeTab === "inactive"
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeTab === "inactive" ? "bg-white" : "bg-red-500"
                      }`}
                    />
                    Inactive ({inactiveCount})
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Device Grid */}
            <AnimatePresence mode="wait">
              {currentDevices.length > 0 ? (
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
                        isActive={activeTab === "active"}
                        // onViewDetails={handleViewDetails}

                          onViewDetails={() => {
                            navigate("/DeviceData", { state: { deviceId: device._id } })
               
                    }}
                      />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-tab"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
                >
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    {activeTab === "active" ? (
                      <Wifi size={48} className="text-gray-400 dark:text-gray-500" />
                    ) : (
                      <WifiOff size={48} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    No {activeTab} devices found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Switch tabs to see other results
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

      </div>
    </div>
  );
};

export default SearchResults;