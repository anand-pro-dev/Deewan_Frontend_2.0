import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { adminUpdateProfileApi } from "../../apis/adminApi";

const UpdateUserProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const index = location.state?.index;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    _id: user?._id || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    orgnization: user?.orgnization || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    postalCode: user?.postalCode || "",
    country: user?.country || "",
    lat: user?.lat || "",
    long: user?.long || "",
    newPassword: "",
    profileImage: user?.profileImage || "",
    imageFile: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        profileImage: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("firstName", formData.firstName);
      payload.append("lastName", formData.lastName);
      payload.append("email", formData.email);
      payload.append("phone", formData.phone);
      payload.append("orgnization", formData.orgnization);
      payload.append("address", formData.address);
      payload.append("city", formData.city);
      payload.append("state", formData.state);
      payload.append("postalCode", formData.postalCode);
      payload.append("country", formData.country);
      payload.append("lat", formData.lat);
      payload.append("long", formData.long);
      if (formData.newPassword) payload.append("newPassword", formData.newPassword);
      if (formData.imageFile) payload.append("profileImage", formData.imageFile);

      const response = await adminUpdateProfileApi(formData._id, payload);

      if (response?.success) {
        toast.success("User profile updated successfully!");
        navigate("/users", { state: { updatedUser: response.data, index } });
      } else {
        toast.error(response?.message || "Update failed!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Something went wrong while updating user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 sm:p-10 transition-all duration-300 hover:shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b pb-5">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Update User Profile
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Modify details and save changes to database
            </p>
          </div>

          {formData.profileImage && (
            <img
              src={formData.profileImage}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4 border-blue-500 shadow-md mt-4 sm:mt-0"
            />
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {[
            { label: "First Name", name: "firstName" },
            { label: "Last Name", name: "lastName" },
            { label: "Email", name: "email", type: "email" },
            { label: "Phone", name: "phone" },
            { label: "Organization", name: "orgnization" },
            { label: "City", name: "city" },
            { label: "State", name: "state" },
            { label: "Postal Code", name: "postalCode" },
           
            { label: "Latitude", name: "lat" },
            { label: "Longitude", name: "long" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label}
              </label>
              <input
                name={f.name}
                value={(formData as any)[f.name]}
                onChange={handleChange}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                type={f.type || "text"}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          ))}

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter full address"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Password with eye toggle */}
          <div className="sm:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password (optional)
            </label>
            <div className="relative">
              <input
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password (if changing)"
                type={showPassword ? "text" : "password"}
                className="w-full border rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ?     <EyeIcon className="w-5 h-5 text-gray-700 fill-gray-700 stroke-gray-700" />  :   <EyeCloseIcon className="w-5 h-5 text-gray-700 fill-gray-700 stroke-gray-700" /> }
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Profile Image
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm text-gray-500"
              />
              {formData.profileImage && (
                <img
                  src={formData.profileImage}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white px-5 py-2.5 rounded-lg shadow-md transition-all font-medium`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateUserProfile;
