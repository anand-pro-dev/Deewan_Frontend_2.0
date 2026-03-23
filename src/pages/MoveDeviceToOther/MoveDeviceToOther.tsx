import { useState, ChangeEvent, FormEvent, JSX } from "react";
import toast from "react-hot-toast";
import { moveToAnotherUser } from "../../apis/apiUploadEspFile";

// Type definitions
interface MoveDevicePayload {
  oldUserId: string;
  newUserId: string;
  deviceId: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

const MoveDeviceForm = (): JSX.Element => {
  const [oldUserId, setOldUserId] = useState<string>("");
  const [newUserId, setNewUserId] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const validateForm = (): boolean => {
    if (!oldUserId.trim()) {
      toast.error("Current User ID is required");
      return false;
    }
    if (!newUserId.trim()) {
      toast.error("New User ID is required");
      return false;
    }
    if (!deviceId.trim()) {
      toast.error("Device ID is required");
      return false;
    }
    if (oldUserId.trim() === newUserId.trim()) {
      toast.error("New User ID must be different from Current User ID");
      return false;
    }
    return true;
  };

  const handleMove = async (e?: FormEvent<HTMLFormElement>): Promise<void> => {
    if (e) e.preventDefault();
    
    setResponse(null);

    if (!validateForm()) return;

    const payload: MoveDevicePayload = {
      oldUserId: oldUserId.trim(),
      newUserId: newUserId.trim(),
      deviceId: deviceId.trim(),
    };

    setLoading(true);
    const toastId = toast.loading("Moving device...");

    try {
      const result: ApiResponse = await moveToAnotherUser(payload);
      toast.dismiss(toastId);

      setResponse(result);

      if (result.success) {
        toast.success(result.message || "Device moved successfully!");
        // Reset form on success
        setOldUserId("");
        setNewUserId("");
        setDeviceId("");
      } else {
        toast.error(result.message || "Failed to move device");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorResponse: ApiResponse = {
        success: false,
        message: err?.message || "Request failed. Please try again.",
        data: err,
      };
      setResponse(errorResponse);
      toast.error(errorResponse.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (): void => {
    setOldUserId("");
    setNewUserId("");
    setDeviceId("");
    setResponse(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header Section */}
<div className="text-center mb-8 flex flex-col items-center">
  <div className="flex items-start gap-4">
    {/* Icon */}
    <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
      <svg
        className="w-10 h-10 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    </div>

    {/* Text */}
    <div className="text-left">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
          Move Device to Another User
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
          Transfer device ownership between users
      </p>
    </div>
  </div>
</div>


        {/* Form Card */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleMove}>
            <div className="space-y-6">
              {/* Current User ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Current User ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={oldUserId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOldUserId(e.target.value)}
                    placeholder="Enter current user ID"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Device ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Device ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={deviceId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setDeviceId(e.target.value)}
                    placeholder="Enter device ID"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Transfer Arrow */}
              <div className="flex justify-center py-2">
                <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* New User ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  New User ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={newUserId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewUserId(e.target.value)}
                    placeholder="Enter new user ID"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Moving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>Move Device</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Response Box */}
          {response && (
            <div
              className={`mt-6 p-5 rounded-2xl border-2 animate-slideIn ${
                response.success
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    response.success
                      ? "bg-green-100 dark:bg-green-900/40"
                      : "bg-red-100 dark:bg-red-900/40"
                  }`}
                >
                  {response.success ? (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3
                    className={`font-bold text-lg mb-1 ${
                      response.success
                        ? "text-green-800 dark:text-green-300"
                        : "text-red-800 dark:text-red-300"
                    }`}
                  >
                    {response.success ? "✅ Success" : "❌ Error"}
                  </h3>

                  <p
                    className={`${
                      response.success
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {response.message}
                  </p>

                  {/* Show error details only if NOT success */}
                  {!response.success && response.data && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
                        View Error Details
                      </summary>
                      <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-xs overflow-x-auto text-red-800 dark:text-red-300">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Important Information
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Ensure both user IDs are valid before proceeding</li>
                <li>• Device will be transferred from current to new user</li>
                <li>• This action may require additional permissions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MoveDeviceForm;