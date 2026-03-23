import  { useState } from "react";
import { moveToAnotherUser } from "../../apis/apiUploadEspFile";   // <-- your API file

const MoveDeviceForm = () => {
  const [oldUserId, setOldUserId] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [deviceId, setDeviceId] = useState("");

  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    setResponse(null);

    if (!oldUserId || !newUserId || !deviceId) {
      setResponse({ success: false, message: "All fields are required" });
      return;
    }

    setLoading(true);
    try {
      const result = await moveToAnotherUser({
        oldUserId,
        newUserId,
        deviceId,
      });

      setResponse(result);
    } catch (err: any) {
      setResponse({
        success: false,
        message: err?.message || "Request failed",
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6 mt-10">

      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Move Device to Another User
      </h2>

      {/* Old User */}
      <label className="block mb-1 font-semibold">Current User ID</label>
      <input
        className="w-full border rounded-lg p-2 mb-4"
        value={oldUserId}
        onChange={(e) => setOldUserId(e.target.value)}
        placeholder="Enter current user ID"
      />

            {/* Device */}
      <label className="block mb-1 font-semibold">Device ID</label>
      <input
        className="w-full border rounded-lg p-2 mb-4"
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        placeholder="Enter device ID"
      />

      {/* New User */}
      <h2><> <br></br></></h2>
      <label className="block mb-1 font-semibold">New User ID</label>
      <input
        className="w-full border rounded-lg p-2 mb-4"
        value={newUserId}
        onChange={(e) => setNewUserId(e.target.value)}
        placeholder="Enter new user ID"
      />
   <h2><> <br></br></></h2>


      {/* Button */}
      <button
        onClick={handleMove}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700">
        {loading ? "Moving..." : "Move Device"}
      </button>

      {/* Response Box */}
      {response && (
  <div
    className={`mt-6 p-4 rounded-lg ${
      response.success ? "bg-green-100" : "bg-red-100"
    }`}
  >
    <h3 className="font-bold text-lg mb-1">
      {response.success ? "Success" : "Error"}
    </h3>

    {/* Show ONLY message on success */}
    {response.success ? (
      <p>{response.message}</p>
    ) : (
      <>
        <p>{response.message}</p>

        {/* Show error details only if NOT success */}
        {response.data && (
          <pre className="mt-3 p-3 bg-gray-200 rounded text-sm">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        )}
      </>
    )}
  </div>
)}

    </div>
  );
};

export default MoveDeviceForm;
