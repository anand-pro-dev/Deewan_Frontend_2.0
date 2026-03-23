import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import toast from "react-hot-toast";
import { adminProfilesApi, updateUserProfileApi } from "../../apis/adminApi";

const PasswordField = ({
  label,
  field,
  showEye,
  passwordFields,
  onToggleEye,
  onChange,
}: {
  label: string;
  field: "current" | "new" | "confirm";
  showEye: Record<string, boolean>;
  passwordFields: Record<string, string>;
  onToggleEye: (field: string) => void;
  onChange: (field: string, value: string) => void;
}) => (
  <div>
    <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="relative">
      <input
        type={showEye[field] ? "text" : "password"}
        value={passwordFields[field]}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={() => onToggleEye(field)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {showEye[field] ? (
          <EyeIcon className="w-5 h-5 text-gray-700 fill-gray-700 stroke-gray-700" />
        ) : (
          <EyeCloseIcon className="w-5 h-5 text-gray-700 fill-gray-700 stroke-gray-700" />
        )}
      </button>
    </div>
  </div>
);

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showEye, setShowEye] = useState({ current: false, new: false, confirm: false });
  const [passwordFields, setPasswordFields] = useState({ current: "", new: "", confirm: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await adminProfilesApi();
        if (res.success) {
          setProfile(res.data.user);
        } else {
          toast.error(res.message || "Failed to load profile");
        }
      } catch (err: any) {
        toast.error(err.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (showPasswordChange) {
      if (!passwordFields.current || !passwordFields.new || !passwordFields.confirm) {
        toast.error("Please fill in all password fields");
        return;
      }
      if (passwordFields.new !== passwordFields.confirm) {
        toast.error("New passwords do not match");
        return;
      }
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("firstName", profile.firstName);
      formData.append("lastName", profile.lastName);
      formData.append("phone", profile.phone || "");
      formData.append("orgnization", profile.orgnization || "");
      formData.append("city", profile.city || "");
      formData.append("address", profile.address || "");
      if (showPasswordChange) {
        formData.append("currentPassword", passwordFields.current);
        formData.append("newPassword", passwordFields.new);
      }

      const response = await updateUserProfileApi(formData);
      if (response.success) {
        toast.success("Profile updated successfully");
        setPasswordFields({ current: "", new: "", confirm: "" });
        setShowPasswordChange(false);
        closeModal();
      } else {
        toast.error(response.message || "Update failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Update error");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleEye = (field: string) => {
    setShowEye((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordFields((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const infoFields = [
    { label: "First Name", value: profile.firstName },
    { label: "Last Name", value: profile.lastName },
    { label: "Email Address", value: profile.email },
    { label: "Phone", value: profile.phone || "—" },
    { label: "Organization", value: profile.orgnization || "—" },
    { label: "City", value: profile.city || "—" },
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-y-5 gap-x-8 sm:grid-cols-2">
            {infoFields.map(({ label, value }) => (
              <div key={label} className="group min-w-0">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {label}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                  {value}
                </p>
              </div>
            ))}
            {profile.address && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.address}
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary/40 dark:hover:text-primary lg:inline-flex lg:w-auto flex-shrink-0"
        >
          <svg className="fill-current" width="16" height="16" viewBox="0 0 18 18">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="" />
          </svg>
          Edit
        </button>
      </div>

      {/* ✅ RESPONSIVE MODAL: fills screen on mobile, constrained on desktop */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="w-full max-w-[700px] mx-auto my-0 sm:my-4 sm:mx-4"
      >
        {/*
          Mobile:  full-screen, no border-radius at top, scrolls naturally
          Tablet+: rounded card, centered, with top margin
          Desktop: max 700px wide, proper padding
        */}
        <div className="relative w-full bg-white dark:bg-gray-900 flex flex-col
                        h-screen sm:h-auto
                        sm:max-h-[90vh]
                        sm:rounded-3xl
                        overflow-hidden">

          {/* ── Header (sticky on mobile) ── */}
          <div className="flex-shrink-0 px-4 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-0 border-b border-gray-100 dark:border-gray-800 sm:border-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                  Edit Personal Information
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Update your details to keep your profile up-to-date.
                </p>
              </div>
              {/* Mobile close button */}
              <button
                onClick={closeModal}
                className="sm:hidden flex-shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6 space-y-6">

            {/* Personal Fields */}
            <div>
              <h5 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Personal Details
              </h5>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Organization</label>
                  <input
                    type="text"
                    value={profile.orgnization || ""}
                    onChange={(e) => setProfile({ ...profile, orgnization: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                  <input
                    type="text"
                    value={profile.city || ""}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                  <textarea
                    value={profile.address || ""}
                    rows={2}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Password
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(!showPasswordChange);
                    setPasswordFields({ current: "", new: "", confirm: "" });
                  }}
                  className="text-xs font-medium text-primary hover:underline transition-colors"
                >
                  {showPasswordChange ? "Cancel" : "Change Password"}
                </button>
              </div>

              {showPasswordChange && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <PasswordField
                      label="Current Password"
                      field="current"
                      showEye={showEye}
                      passwordFields={passwordFields}
                      onToggleEye={handleToggleEye}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <PasswordField
                    label="New Password"
                    field="new"
                    showEye={showEye}
                    passwordFields={passwordFields}
                    onToggleEye={handleToggleEye}
                    onChange={handlePasswordChange}
                  />
                  <PasswordField
                    label="Confirm New Password"
                    field="confirm"
                    showEye={showEye}
                    passwordFields={passwordFields}
                    onToggleEye={handleToggleEye}
                    onChange={handlePasswordChange}
                  />
                </div>
              )}

              {!showPasswordChange && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  Click "Change Password" to update your password.
                </p>
              )}
            </div>
          </div>

          {/* ── Footer (sticky at bottom) ── */}
          <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3
                          px-4 py-4 sm:px-8 sm:py-5
                          border-t border-gray-100 dark:border-gray-800
                          bg-white dark:bg-gray-900">
            <Button
              size="sm"
              variant="outline"
              onClick={closeModal}
              className="w-full sm:w-auto justify-center"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updating}
              className="w-full sm:w-auto justify-center"
            >
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}