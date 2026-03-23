import { useEffect, useState, ChangeEvent, JSX } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../store/hooks';
import {
  adminGetAllParameterApi,
  adminAddParameterApi,
  adminUpdateParameterApi,
  adminDeleteParameterApi,
} from '../../apis/adminApi';

interface ParameterKey {
  key: Record<string, string>;
}

interface ParameterValue {
  value: Record<string, string>;
}

interface Parameter {
  _id: string;
  title: string;
  parameterKey: ParameterKey[];
  parameterValue: ParameterValue[];
  deviceCount?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

const alphabet: string[] = 'ABCDEFGHIJKLMNO'.split('');

const ParameterList = (): JSX.Element => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [valueValues, setValueValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<boolean>(false);

  const authUser = useAppSelector((state) => state.auth.user);
  const role = authUser?.role?.toLowerCase();
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const canEdit = isSuperAdmin;

  useEffect(() => {
    fetchParameters();
    resetForm();
  }, []);

  useEffect(() => {
    if (showForm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showForm]);

  const resetForm = (): void => {
    const init: Record<string, string> = {};
    alphabet.forEach(letter => { init[letter] = ''; });
    setKeyValues(init);
    setValueValues(init);
    setFormName('');
    setEditingId(null);
  };

  const fetchParameters = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const res: ApiResponse<Parameter[]> = await adminGetAllParameterApi();
      if (res.success && res.data) {
        setParameters(res.data);
      } else {
        const errorMsg = res.message || 'Failed to fetch parameters';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = 'Error fetching parameters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyChange = (letter: string, value: string): void => {
    setKeyValues(prev => ({ ...prev, [letter]: value }));
  };

  const handleValueChange = (letter: string, value: string): void => {
    setValueValues(prev => ({ ...prev, [letter]: value }));
  };

  const validateForm = (): boolean => {
    if (!formName.trim()) {
      toast.error('Title is required');
      return false;
    }
    for (const letter of alphabet) {
      const keyFilled = keyValues[letter]?.trim();
      const valueFilled = valueValues[letter]?.trim();
      if (keyFilled && !valueFilled) {
        toast.error(`Value for ${letter} is required since key is filled`);
        return false;
      }
      if (!keyFilled && valueFilled) {
        toast.error(`Key for ${letter} is required since value is filled`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    const keyPayload: Record<string, string> = {};
    const valuePayload: Record<string, string> = {};

    alphabet.forEach(letter => {
      const k = keyValues[letter]?.trim();
      const v = valueValues[letter]?.trim();
      if (k && v) {
        keyPayload[letter.toLowerCase()] = k;
        valuePayload[letter.toLowerCase()] = v;
      }
    });

    const payload = {
      title: formName.trim(),
      parameterKey: [{ key: keyPayload }],
      parameterValue: [{ value: valuePayload }],
    };

    try {
      setSaving(true);
      const toastId = toast.loading(editingId ? 'Updating parameter...' : 'Saving parameter...');
      const res: ApiResponse = editingId
        ? await adminUpdateParameterApi(payload, editingId)
        : await adminAddParameterApi(payload);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(`✅ Parameter ${editingId ? 'updated' : 'added'} successfully`);
        setShowForm(false);
        fetchParameters();
        resetForm();
      } else {
        toast.error(res.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this parameter?')) return;
    try {
      const toastId = toast.loading('Deleting...');
      const res: ApiResponse = await adminDeleteParameterApi(id);
      toast.dismiss(toastId);
      if (res.success) {
        toast.success('🗑️ Parameter deleted successfully');
        fetchParameters();
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting parameter');
    }
  };

  const handleEdit = (param: Parameter): void => {
    setShowForm(true);
    setEditingId(param._id);
    setFormName(param.title || '');
    const keys = param.parameterKey?.[0]?.key || {};
    const values = param.parameterValue?.[0]?.value || {};
    const newKeyValues: Record<string, string> = {};
    const newValueValues: Record<string, string> = {};
    alphabet.forEach(letter => {
      const lower = letter.toLowerCase();
      newKeyValues[letter] = keys[lower] || '';
      newValueValues[letter] = values[lower] || '';
    });
    setKeyValues(newKeyValues);
    setValueValues(newValueValues);
  };

  const toggleCardExpansion = (id: string): void => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddNew = (): void => {
    resetForm();
    setShowForm(true);
  };

  const handleCloseForm = (): void => {
    setShowForm(false);
    resetForm();
  };

  const totalDevices = parameters.reduce((sum, p) => sum + (p.deviceCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl">📊</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Parameters Management
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your system parameters and configurations
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleAddNew}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Add Parameter</span>
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
          )}
        </div>

        {/* Admin Stats Banner */}
        {(isAdmin || isSuperAdmin) && !loading && parameters.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">

            {/* Total Parameters */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-4 shadow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-md">
                📋
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Parameters</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{parameters.length}</p>
              </div>
            </div>

            {/* Total Devices — admin only */}
            {isAdmin && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-4 shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-md">
                  📡
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Devices</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalDevices}</p>
                </div>
              </div>
            )}

            {/* Most Used Parameter — admin only, only when at least one device exists */}
            {isAdmin && parameters.some(p => (p.deviceCount ?? 0) > 0) && (
              <div className="col-span-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-4 shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl shadow-md">
                  🏆
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Most Used Parameter</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white truncate">
                    {parameters.reduce((a, b) => (a.deviceCount ?? 0) > (b.deviceCount ?? 0) ? a : b).title}
                  </p>
                  <p className="text-xs text-purple-500 font-medium">
                    {Math.max(...parameters.map(p => p.deviceCount ?? 0))} devices
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-blue-600 font-medium mt-4 text-center">Loading...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">⚠️ Error</div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && parameters.length === 0 && (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Parameters Found</h3>
            <p className="text-gray-500 dark:text-gray-400">Get started by adding your first parameter</p>
          </div>
        )}

        {/* Parameters Grid */}
        {!loading && !error && parameters.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parameters.map(param => {
              const isExpanded = expandedCards[param._id];
              const keyList = Object.entries(param.parameterKey?.[0]?.key || {});
              const valList = Object.entries(param.parameterValue?.[0]?.value || {});

              return (
                <div
                  key={param._id}
                  className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 hover:scale-[1.02]"
                >
                  {/* Edit/Delete Buttons */}
                  {canEdit && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEdit(param)}
                        title="Edit"
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(param._id)}
                        title="Delete"
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 pr-20">
                    {param.title}
                  </h3>

                  {/* ✅ Device Count Badge — only for admin, only when deviceCount > 0 */}
                  {isAdmin && (param.deviceCount ?? 0) > 0 && (
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40">
                        📡 {param.deviceCount} {param.deviceCount === 1 ? 'Device' : 'Devices'} using this
                      </span>
                    </div>
                  )}

                  {/* Parameter List */}
                  <ul className="space-y-2">
                    {(isExpanded ? keyList : keyList.slice(0, 5)).map(([k, v]) => {
                      const match = valList.find(([vk]) => vk === k);
                      return (
                        <li
                          key={k}
                          className="flex justify-between items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30"
                        >
                          <span className="text-blue-700 dark:text-blue-400 font-semibold text-sm truncate flex-1">
                            {String(v)}
                          </span>
                          <span className="text-green-700 dark:text-green-400 font-medium text-sm truncate flex-1 text-right">
                            {String(match?.[1] || '')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Show More/Less */}
                  {keyList.length > 5 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => toggleCardExpansion(param._id)}
                        className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline inline-flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <span>Show Less</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>Show More ({keyList.length - 5} more)</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl bg-white dark:bg-gray-900 animate-slideUp">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    {editingId ? '✏️ Edit Parameter' : '➕ Add New Parameter'}
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {editingId ? 'Update parameter details' : 'Create a new parameter configuration'}
                  </p>
                </div>
                <button onClick={handleCloseForm} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Parameter Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter parameter title..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={formName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Parameter Key-Value Pairs
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alphabet.map((letter) => (
                    <div key={letter} className="flex gap-2 items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {letter}
                      </div>
                      <input
                        placeholder={`Key ${letter}`}
                        value={keyValues[letter] || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleKeyChange(letter, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                      />
                      <input
                        placeholder={`Value ${letter}`}
                        value={valueValues[letter] || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange(letter, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                onClick={handleCloseForm}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Save Parameter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default ParameterList;