import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Eye, Edit2, Mail, Trash2, X, UserPlus, Download, Power, MapPin } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAddUserApi, adminActiveDeactiveApi, adminDeleteUserApi, adminAllUserApi } from '../../apis/adminApi';
import { useAppSelector } from '../../store/hooks';
import AddUserModal, { AddUserFormData } from './AddUserModal'; // ✅ Separated component

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  orgnization: string;
  address?: string;
  status: string;
  profileImage?: string | null;
  currentStatus?: string;
  createdAt?: string;
}

const AllUsersTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const navigate = useNavigate();

  const authUser = useAppSelector((state) => state.auth.user);

  const getInitialFormData = (): AddUserFormData => ({
    adminId: authUser?._id || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    orgnization: '',
    address: '',
    status: 'active',
    role: 'user',
    profileImage: '',
    imageFile: null,
  });

  const [formData, setFormData] = useState<AddUserFormData>(getInitialFormData);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAllUserApi();
      if (res.success) {
        setUsers(res.data.users);
        setFilteredUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [statusFilter, users]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 10) return;
      setFormData((prev) => ({ ...prev, phone: numericValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    const requiredFields: (keyof AddUserFormData)[] = ['firstName', 'lastName', 'email', 'phone', 'city', 'orgnization', 'address'];
    const missingField = requiredFields.find((field) => !formData[field]);

    if (missingField) {
      toast.error(`Please fill in the ${missingField} field.`);
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Phone number must be numeric and exactly 10 digits.');
      return;
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(formData.email.toLowerCase())) {
      toast.error('Please enter a valid email address in lowercase.');
      return;
    }

    const form = new FormData();
    form.append('adminId', authUser?._id || '');
    form.append('firstName', formData.firstName.trim());
    form.append('lastName', formData.lastName.trim());
    form.append('email', formData.email.toLowerCase().trim());
    form.append('phone', formData.phone.trim());
    form.append('password', 'D123456');
    form.append('orgnization', formData.orgnization.trim());
    form.append('role', formData.role || 'user');
    form.append('status', formData.status || 'active');
    form.append('address', formData.address.trim());
    form.append('city', formData.city.trim());

    if (formData.imageFile) {
      form.append('profileImage', formData.imageFile);
    }

    setIsAddingUser(true); // ✅ show loading, hide buttons
    try {
      const response = await adminAddUserApi(form);
      if (response.success) {
        toast.success('User added successfully!');
        fetchUsers();
        setShowModal(false);
        setFormData(getInitialFormData());
      } else {
        toast.error(response.message || 'Failed to add user');
      }
    } catch (err) {
      console.error('Add user error:', err);
      toast.error('Something went wrong while adding user');
    } finally {
      setIsAddingUser(false); // ✅ restore buttons (on error; on success modal is already closed)
    }
  };

  const handleUpdateProfile = (user: User) => {
    navigate(`/UpdateUserProfile/${user._id}`, { state: { user } });
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) return;

    try {
      const res = await adminDeleteUserApi(user._id);
      if (res.success) {
        toast.success(`${user.firstName} deleted successfully`);
        fetchUsers();
        setOpenMenuId(null);
      } else {
        toast.error(res.message || 'Failed to delete user');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error deleting user');
    }
  };

  const handleStatusToggle = async (user: User) => {
    try {
      const res = await adminActiveDeactiveApi(user._id);
      if (res.success) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        toast.success(`${user.firstName} status updated to ${newStatus}`);
        fetchUsers();
        setOpenMenuId(null);
      } else {
        toast.error(res.message || 'Failed to update status');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating status');
    }
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

  const exportToExcel = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Organization', 'City', 'Address', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map((user) =>
        [
          user.firstName, user.lastName, user.email, user.phone,
          user.orgnization, user.city, user.address || '', user.status,
        ].map((field) => `"${field}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Users exported successfully!');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your users and their access</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard label="Total Users" value={users.length} icon="👥" color="blue" />
          <StatsCard label="Active" value={users.filter((u) => u.status === "active").length} icon="✅" color="green" />
          <StatsCard label="Inactive" value={users.filter((u) => u.status === "inactive").length} icon="⏸️" color="orange" />
          <StatsCard
            label="This Month"
            value={users.filter((u) => {
              if (!u.createdAt) return false;
              const d = new Date(u.createdAt);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
            icon="📈"
            color="purple"
          />
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          {/* Toolbar */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToExcel}
                className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-green-500/30 transition-all w-fit"
              >
                <Download className="w-5 h-5" />
                <span>Export to Excel</span>
              </motion.button>

              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {authUser?.role === 'admin' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-brand-500/30 transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add User</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                    {["User", "Organization", "City", "Status"].map((h) => (
                      <th key={h} className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-center">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <AnimatePresence mode="popLayout">
                    {paginatedUsers.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div
                            onClick={() =>
                              navigate(`/deviceList/${user._id}`, {
                                state: { device: { _id: user._id, currentStatus: user.currentStatus, createdAt: user.createdAt } },
                              })
                            }
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <motion.div whileHover={{ scale: 1.1 }} className="relative">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
                                {user.profileImage ? (
                                  <img src={user.profileImage} alt={user.firstName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white font-bold text-lg">
                                    {user.firstName[0]}{user.lastName[0]}
                                  </span>
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                            </motion.div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{user.address}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-gray-900 dark:text-gray-200">{user.orgnization}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 dark:text-gray-200">{user.city}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                              user.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                            }`}
                            onClick={() => handleStatusToggle(user)}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
                            {user.status}
                          </motion.span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center relative">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </motion.button>

                          <AnimatePresence>
                            {openMenuId === user._id && (
                              <>
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="fixed inset-0 z-40"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className="absolute right-10 top-12 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                  <MenuItem icon={<Eye className="w-4 h-4" />} label="View Details" onClick={() => { setViewUser(user); setOpenMenuId(null); }} />
                                  <MenuItem icon={<Edit2 className="w-4 h-4" />} label="Update Profile" onClick={() => { handleUpdateProfile(user); setOpenMenuId(null); }} />
                                  <MenuItem icon={<Power className="w-4 h-4" />} label={user.status === "active" ? "Deactivate" : "Activate"} onClick={() => handleStatusToggle(user)} />
                                  <MenuItem icon={<Mail className="w-4 h-4" />} label="Send Email" onClick={() => { window.open(`mailto:${user.email}`); setOpenMenuId(null); }} />
                                  <div className="border-t border-gray-200 dark:border-gray-700" />
                                  {authUser?.role === 'superAdmin' && (
                                    <MenuItem danger icon={<Trash2 className="w-4 h-4" />} label="Delete User" onClick={() => handleDelete(user)} />
                                  )}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Footer / Pagination */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}</span> of{" "}
                    <span className="font-semibold">{filteredUsers.length}</span> users
                  </p>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                  >
                    {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} per page</option>)}
                  </select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${currentPage === 1 ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                      Previous
                    </motion.button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                        .map((page, index, array) => {
                          const showEllipsis = index > 0 && page - array[index - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => goToPage(page)}
                                className={`w-9 h-9 rounded-lg font-medium transition-all ${currentPage === page ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                                {page}
                              </motion.button>
                            </div>
                          );
                        })}
                    </div>

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${currentPage === totalPages ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                      Next
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {viewUser && <ViewModal user={viewUser} onClose={() => setViewUser(null)} />}
        {showModal && (
          <AddUserModal
            formData={formData}
            onChange={handleChange}
            onImageChange={handleImageChange}
            onClose={() => { if (!isAddingUser) { setShowModal(false); setFormData(getInitialFormData()); } }}
            onSave={handleAddUser}
            isLoading={isAddingUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllUsersTable;

/* ─── Shared Sub-components ──────────────────────────────────────────────── */

interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const StatsCard = ({ label, value, icon, color }: StatsCardProps) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
  };
  return (
    <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

const MenuItem = ({ icon, label, onClick, danger = false }: MenuItemProps) => (
  <motion.button
    whileHover={{ x: 4, backgroundColor: danger ? "rgba(239,68,68,0.1)" : "rgba(0,0,0,0.05)" }}
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${danger ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </motion.button>
);

interface ViewModalProps {
  user: { _id: string; firstName: string; lastName: string; email: string; phone: string; city: string; orgnization: string; address?: string; status: string; profileImage?: string | null };
  onClose: () => void;
}

const ModalWrapper = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }} onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 relative">
      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
        <X className="w-5 h-5" />
      </motion.button>
      {children}
    </motion.div>
  </motion.div>
);

const ViewModal = ({ user, onClose }: ViewModalProps) => (
  <ModalWrapper onClose={onClose}>
    <div className="pr-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Details</h3>
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
          {user.profileImage
            ? <img src={user.profileImage} alt={user.firstName} className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-2xl">{user.firstName[0]}{user.lastName[0]}</span>}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}>
            {user.status}
          </span>
        </div>
      </div>
      <div className="space-y-4">
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Phone" value={user.phone} />
        <DetailRow label="Organization" value={user.orgnization} />
        <DetailRow label="City" value={user.city} />
        {user.address && <DetailRow label="Address" value={user.address} />}
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
        className="w-full mt-6 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/30 transition-all">
        Close
      </motion.button>
    </div>
  </ModalWrapper>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center gap-3">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-500 rounded-full" />
    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading users...</p>
  </div>
);