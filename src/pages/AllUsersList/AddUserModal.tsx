import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Phone, Building2, MapPin, Home, ImagePlus, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddUserFormData {
  adminId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  orgnization: string;
  address: string;
  status: string;
  role: string;
  profileImage: string;
  imageFile: File | null;
}

interface AddUserModalProps {
  formData: AddUserFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSave: () => void;
  isLoading?: boolean; // ✅ loading state from parent
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none text-sm";

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const InputWrapper = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
      {icon}
    </div>
    {children}
  </div>
);

// ─── AddUserModal ─────────────────────────────────────────────────────────────

const AddUserModal = ({ formData, onChange, onImageChange, onClose, onSave, isLoading = false }: AddUserModalProps) => {

  // Hide navbar & sidebar while modal is mounted
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={!isLoading ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New User</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Fill in the details to create a new user account
              </p>
            </div>
            {/* Hide close button while loading */}
            {!isLoading && (
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* ── Body ── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
          >
            <fieldset disabled={isLoading} className="contents">
              <div className="px-6 py-5 space-y-4 max-h-[58vh] overflow-y-auto">

                {/* Profile image preview */}
                {formData.profileImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 p-3 bg-brand-50 dark:bg-gray-800 rounded-xl border border-brand-100 dark:border-gray-700"
                  >
                    <img
                      src={formData.profileImage}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border-2 border-brand-400 shadow"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">Profile Image</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Image selected ✓</p>
                    </div>
                  </motion.div>
                )}

                {/* First + Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>First Name</Label>
                    <InputWrapper icon={<User className="w-4 h-4" />}>
                      <input type="text" name="firstName" value={formData.firstName} onChange={onChange}
                        placeholder="Enter first name" className={inputClass} />
                    </InputWrapper>
                  </div>
                  <div>
                    <Label required>Last Name</Label>
                    <InputWrapper icon={<User className="w-4 h-4" />}>
                      <input type="text" name="lastName" value={formData.lastName} onChange={onChange}
                        placeholder="Enter last name" className={inputClass} />
                    </InputWrapper>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label required>Email</Label>
                  <InputWrapper icon={<Mail className="w-4 h-4" />}>
                    <input type="email" name="email" value={formData.email} onChange={onChange}
                      placeholder="user@example.com" className={inputClass} />
                  </InputWrapper>
                </div>

                {/* Phone */}
                <div>
                  <Label required>Phone</Label>
                  <InputWrapper icon={<Phone className="w-4 h-4" />}>
                    <input type="tel" name="phone" value={formData.phone} onChange={onChange}
                      placeholder="Enter 10-digit phone number" maxLength={10} pattern="\d*"
                      inputMode="numeric" className={inputClass} />
                  </InputWrapper>
                </div>

                {/* City + Organization */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>City</Label>
                    <InputWrapper icon={<MapPin className="w-4 h-4" />}>
                      <input type="text" name="city" value={formData.city} onChange={onChange}
                        placeholder="Enter city" className={inputClass} />
                    </InputWrapper>
                  </div>
                  <div>
                    <Label required>Organization</Label>
                    <InputWrapper icon={<Building2 className="w-4 h-4" />}>
                      <input type="text" name="orgnization" value={formData.orgnization} onChange={onChange}
                        placeholder="Enter organization" className={inputClass} />
                    </InputWrapper>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label required>Address</Label>
                  <InputWrapper icon={<Home className="w-4 h-4" />}>
                    <input type="text" name="address" value={formData.address} onChange={onChange}
                      placeholder="Enter full address" className={inputClass} />
                  </InputWrapper>
                </div>

                {/* Profile Image Upload */}
                <div>
                  <Label>
                    Profile Image{" "}
                    <span className="text-gray-400 font-normal normal-case tracking-normal">(Optional)</span>
                  </Label>
                  <label className={`flex flex-col items-center justify-center gap-3 w-full px-6 py-8 bg-gray-50 dark:bg-gray-800/80 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl transition-all group ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-900/10'}`}>
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 transition-colors">
                      <ImagePlus className="w-6 h-6 text-gray-400 group-hover:text-brand-500 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-brand-500 transition-colors">
                        {formData.imageFile
                          ? (formData.imageFile as File).name
                          : "Click to upload a profile image"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        PNG, JPG, WEBP — max 20 MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 20 * 1024 * 1024) {
                          import('react-hot-toast').then(({ default: toast }) =>
                            toast.error('Image must be under 20 MB.')
                          );
                          e.target.value = '';
                          return;
                        }
                        onImageChange(e);
                      }}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                </div>
              </div>
            </fieldset>

            {/* ── Footer: Loading state replaces both buttons ── */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 min-h-[76px]">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  /* ── Loading indicator — replaces Cancel + Add User ── */
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex items-center justify-center gap-3 py-3"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-6 h-6 text-brand-500" />
                    </motion.div>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Creating user, please wait…
                    </span>
                  </motion.div>
                ) : (
                  /* ── Normal Cancel + Add User buttons ── */
                  <motion.div
                    key="buttons"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex gap-3"
                  >
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold shadow-lg shadow-brand-500/25 transition-all text-sm"
                    >
                      Add User
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddUserModal;