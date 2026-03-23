import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Eye, Edit2, Mail, Trash2, X, UserPlus, Download, Upload, Power } from "lucide-react";
import toast from "react-hot-toast";
import {
  adminAllAdminApi,
  adminDeleteUserApi,
  adminActiveDeactiveApi,
  adminAddUserApi,
} from "../../apis/adminApi";

interface Admin {
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
  createdAt?: string;
}

export default function AdminListTable() {
  const [users, setUsers] = useState<Admin[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Admin[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewAdmin, setViewAdmin] = useState<Admin | null>(null);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    orgnization: '',
    address: '',
    status: 'active',
    role: 'admin',
    profileImage: '',
    imageFile: null,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAllAdminApi();
      if (res.success) {
        setUsers(res.data.users);
        setFilteredUsers(res.data.users);
      }
    } catch (error) {
      toast.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = users;

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [statusFilter, users]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleDelete = async (user: Admin) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) return;

    const res = await adminDeleteUserApi(user._id);
    if (res.success) {
      toast.success("Admin deleted successfully");
      fetchUsers();
      setOpenMenuId(null);
    } else {
      toast.error("Failed to delete admin");
    }
  };

  const handleStatusToggle = async (user: Admin) => {
    const res = await adminActiveDeactiveApi(user._id);
    if (res.success) {
      toast.success(`Admin ${user.status === "active" ? "deactivated" : "activated"}`);
      fetchUsers();
      setOpenMenuId(null);
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleAddUser = async () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'orgnization', 'address'];
    const missing = requiredFields.find(field => !formData[field]);

    if (missing) {
      toast.error(`Please fill in the ${missing} field.`);
      return;
    }

    try {
      const form = new FormData();
      form.append('firstName', formData.firstName);
      form.append('lastName', formData.lastName);
      form.append('email', formData.email);
      form.append('phone', formData.phone);
      form.append('password', 'D123456');
      form.append('orgnization', formData.orgnization);
      form.append('role', formData.role || 'admin');
      form.append('status', formData.status || 'active');
      form.append('address', formData.address);
      form.append('city', formData.city);

      if (formData.imageFile) {
        form.append('profileImage', formData.imageFile);
      }

      const response = await adminAddUserApi(form);

      if (response.success) {
        toast.success('Admin added successfully!');
        fetchUsers();
        setShowAddModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          city: '',
          orgnization: '',
          address: '',
          status: 'active',
          role: 'admin',
          profileImage: '',
          imageFile: null,
        });
      } else {
        toast.error(response.message || 'Failed to add admin');
      }
    } catch (err: any) {
      toast.error('Something went wrong');
      console.error('Error adding admin:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev: any) => ({
        ...prev,
        imageFile: file,
        profileImage: URL.createObjectURL(file),
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Organization', 'City', 'Address', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.firstName,
        user.lastName,
        user.email,
        user.phone,
        user.orgnization,
        user.city,
        user.address || '',
        user.status
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `admins_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Admins exported successfully!');
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
            Admin Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your administrators and their permissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="Total Admins"
            value={users.length}
            icon="👥"
            color="blue"
          />
          <StatsCard
            label="Active"
            value={users.filter((u) => u.status === "active").length}
            icon="✅"
            color="green"
          />
          <StatsCard
            label="Inactive"
            value={users.filter((u) => u.status === "inactive").length}
            icon="⏸️"
            color="orange"
          />
          <StatsCard
            label="This Month"
            value={users.filter((u) => {
              if (!u.createdAt) return false;
              const createdDate = new Date(u.createdAt);
              const now = new Date();
              return createdDate.getMonth() === now.getMonth() && 
                     createdDate.getFullYear() === now.getFullYear();
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
              {/* Export Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToExcel}
                className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-green-500/30 transition-all w-fit"
              >
                <Download className="w-5 h-5" />
                <span>Export to Excel</span>
              </motion.button>

              {/* Actions */}
              <div className="flex gap-3">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-brand-500/30 transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Admin</span>
                </motion.button>
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
                <p className="text-gray-500 dark:text-gray-400">No admins found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
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
                        {/* Admin Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="relative"
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
                                {user.profileImage ? (
                                  <img
                                    src={user.profileImage}
                                    alt={user.firstName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-bold text-lg">
                                    {user.firstName[0]}{user.lastName[0]}
                                  </span>
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                            </motion.div>

                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                              ID :   {user._id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Organization */}
                        <td className="px-6 py-4">
                          <p className="text-gray-900 dark:text-gray-200">
                            {user.orgnization}
                          </p>
                        </td>

                        {/* City */}
                        <td className="px-6 py-4">
                          <p className="text-gray-900 dark:text-gray-200">
                            {user.city}
                          </p>
                        </td>

                        {/* Status */}
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
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
                            {user.status}
                          </motion.span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center relative">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === user._id ? null : user._id
                              )
                            }
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
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                  }}
                                  className="absolute right-10 top-12 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                  <MenuItem
                                    icon={<Eye className="w-4 h-4" />}
                                    label="View Details"
                                    onClick={() => {
                                      setViewAdmin(user);
                                      setOpenMenuId(null);
                                    }}
                                  />

                                  <MenuItem
                                    icon={<Edit2 className="w-4 h-4" />}
                                    label="Edit Admin"
                                    onClick={() => {
                                      setEditAdmin(user);
                                      setOpenMenuId(null);
                                    }}
                                  />

                                  <MenuItem
                                    icon={<Power className="w-4 h-4" />}
                                    label={user.status === "active" ? "Deactivate" : "Activate"}
                                    onClick={() => handleStatusToggle(user)}
                                  />

                                  <MenuItem
                                    icon={<Mail className="w-4 h-4" />}
                                    label="Send Email"
                                    onClick={() => {
                                      window.open(`mailto:${user.email}`);
                                      setOpenMenuId(null);
                                    }}
                                  />

                                  <div className="border-t border-gray-200 dark:border-gray-700" />

                                  <MenuItem
                                    danger
                                    icon={<Trash2 className="w-4 h-4" />}
                                    label="Delete Admin"
                                    onClick={() => handleDelete(user)}
                                  />
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

          {/* Footer with Pagination */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-semibold">
                      {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}
                    </span>{" "}
                    of <span className="font-semibold">{filteredUsers.length}</span> admins
                  </p>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all outline-none"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>

                {/* Pagination buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        currentPage === 1
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      Previous
                    </motion.button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          );
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-gray-400 dark:text-gray-600">...</span>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => goToPage(page)}
                                className={`w-9 h-9 rounded-lg font-medium transition-all ${
                                  currentPage === page
                                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                              >
                                {page}
                              </motion.button>
                            </div>
                          );
                        })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        currentPage === totalPages
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
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
        {viewAdmin && (
          <ViewModal admin={viewAdmin} onClose={() => setViewAdmin(null)} />
        )}
        {editAdmin && (
          <EditModal
            admin={editAdmin}
            onClose={() => setEditAdmin(null)}
            onSave={fetchUsers}
          />
        )}
        {showAddModal && (
          <AddAdminModal
            formData={formData}
            onChange={handleChange}
            onImageChange={handleImageChange}
            onClose={() => {
              setShowAddModal(false);
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                city: '',
                orgnization: '',
                address: '',
                status: 'active',
                role: 'admin',
                profileImage: '',
                imageFile: null,
              });
            }}
            onSave={handleAddUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------- COMPONENTS -------------------------------- */

interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const StatsCard = ({ label, value, icon, color }: StatsCardProps) => {
  const colorClasses: Record<'blue' | 'green' | 'orange' | 'purple', string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg`}
        >
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
    whileHover={{ x: 4, backgroundColor: danger ? "rgba(239, 68, 68, 0.1)" : "rgba(0, 0, 0, 0.05)" }}
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
      danger
        ? "text-red-600 dark:text-red-400"
        : "text-gray-700 dark:text-gray-300"
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </motion.button>
);

interface ModalWrapperProps {
  children: React.ReactNode;
  onClose: () => void;
}

const ModalWrapper = ({ children, onClose }: ModalWrapperProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 relative"
    >
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
      >
        <X className="w-5 h-5" />
      </motion.button>
      {children}
    </motion.div>
  </motion.div>
);

interface ViewModalProps {
  admin: Admin;
  onClose: () => void;
}

const ViewModal = ({ admin, onClose }: ViewModalProps) => (
  <ModalWrapper onClose={onClose}>
    <div className="pr-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Admin Details
      </h3>

      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
          {admin.profileImage ? (
            <img
              src={admin.profileImage}
              alt={admin.firstName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-2xl">
              {admin.firstName[0]}{admin.lastName[0]}
            </span>
          )}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {admin.firstName} {admin.lastName}
          </p>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              admin.status === "active"
                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
            }`}
          >
            {admin.status}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <DetailRow label="Email" value={admin.email} />
        <DetailRow label="Phone" value={admin.phone} />
        <DetailRow label="Organization" value={admin.orgnization} />
        <DetailRow label="City" value={admin.city} />
        {admin.address && <DetailRow label="Address" value={admin.address} />}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
        className="w-full mt-6 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/30 transition-all"
      >
        Close
      </motion.button>
    </div>
  </ModalWrapper>
);

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
      {label}
    </span>
    <span className="text-sm font-semibold text-gray-900 dark:text-white">
      {value}
    </span>
  </div>
);

interface EditModalProps {
  admin: Admin;
  onClose: () => void;
  onSave: () => void;
}

const EditModal = ({ admin, onClose, onSave }: EditModalProps) => {
  const [formData, setFormData] = useState({
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: admin.phone,
  });

  const handleSave = () => {
    toast.success("Admin updated successfully");
    onSave();
    onClose();
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="pr-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Edit Admin
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/30 transition-all"
          >
            Save Changes
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center gap-3">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-500 rounded-full"
    />
    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading admins...</p>
  </div>
);

interface AddAdminModalProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSave: () => void;
}

const AddAdminModal = ({ formData, onChange, onImageChange, onClose, onSave }: AddAdminModalProps) => (
  <ModalWrapper onClose={onClose}>
    <div className="pr-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Add New Admin
      </h3>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={onChange}
              placeholder="Enter first name"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={onChange}
              placeholder="Enter last name"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="admin@example.com"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="Enter phone number"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={onChange}
              placeholder="Enter city"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="orgnization"
              value={formData.orgnization}
              onChange={onChange}
              placeholder="Enter organization"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="Enter full address"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Image (Optional)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer">
              <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                <span>Choose Image</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
            </label>
            {formData.profileImage && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <img
                  src={formData.profileImage}
                  alt="Preview"
                  className="w-20 h-20 rounded-xl object-cover border-2 border-brand-500"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onChange({ target: { name: 'profileImage', value: '' } } as any);
                    onChange({ target: { name: 'imageFile', value: null } } as any);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          className="flex-1 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/30 transition-all"
        >
          Add Admin
        </motion.button>
      </div>
    </div>
  </ModalWrapper>
);