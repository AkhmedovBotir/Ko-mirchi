import { useEffect, useMemo, useState } from 'react';
import { Edit, Delete, PersonAdd, Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { adminAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';

const emptyForm = {
  firstName: '',
  lastName: '',
  username: '',
  phone: '',
  password: '',
  role: 'admin',
};

const Admins = () => {
  const { showError, showSuccess } = useSnackbar();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isEditMode = useMemo(() => Boolean(editingId), [editingId]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllAdmins();
      setAdmins(response?.data || []);
    } catch (error) {
      showError(error.message || "Adminlar ro'yxatini olib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowPassword(false);
    setIsFormModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditMode) {
        const payload = {
          firstName: form.firstName,
          lastName: form.lastName,
          username: form.username,
          phone: form.phone,
          role: form.role,
        };
        await adminAPI.updateAdmin(editingId, payload);
        showSuccess('Admin yangilandi');
      } else {
        await adminAPI.createAdmin(form);
        showSuccess('Admin yaratildi');
      }
      resetForm();
      await loadAdmins();
    } catch (error) {
      showError(error.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingId(admin.id || admin._id);
    setForm({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      username: admin.username || '',
      phone: admin.phone || '',
      password: '',
      role: admin.role || 'admin',
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminAPI.deleteAdmin(deleteId);
      showSuccess("Admin o'chirildi");
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      await loadAdmins();
    } catch (error) {
      showError(error.message || "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Adminlar</h2>
        <p className="text-sm text-slate-500 mt-1">
          Bu bo'lim faqat `general` rol uchun ochiq.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowPassword(false);
            setIsFormModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center justify-center gap-2"
        >
          <PersonAdd sx={{ fontSize: 18 }} />
          Admin qo‘shish
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : admins.length === 0 ? (
          <div className="py-8 text-center text-slate-500">Adminlar topilmadi</div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {admins.map((admin) => {
                const id = admin.id || admin._id;
                const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(' ');
                return (
                  <div key={id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="font-medium text-slate-900">{fullName || admin.fullName || '-'}</p>
                      <p className="text-sm text-slate-500 mt-0.5">@{admin.username}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs">Telefon</p>
                        <p className="text-slate-700">{admin.phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Role</p>
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs">{admin.role}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(admin)}
                        className="flex-1 px-2.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center justify-center gap-1 text-sm"
                      >
                        <Edit sx={{ fontSize: 16 }} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteId(id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex-1 px-2.5 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center justify-center gap-1 text-sm"
                      >
                        <Delete sx={{ fontSize: 16 }} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="flex items-center justify-between text-left text-slate-500 border-b border-slate-200">
                    <th className="py-3 pr-4 flex-1">Ism</th>
                    <th className="py-3 pr-4 flex-1">Username</th>
                    <th className="py-3 pr-4 flex-1">Telefon</th>
                    <th className="py-3 pr-4 w-28">Role</th>
                    <th className="py-3 pr-4 w-48 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => {
                    const id = admin.id || admin._id;
                    const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(' ');
                    return (
                      <tr key={id} className="flex items-center justify-between border-b border-slate-100">
                        <td className="py-3 pr-4 text-slate-800 flex-1">{fullName || admin.fullName || '-'}</td>
                        <td className="py-3 pr-4 text-slate-700 flex-1">{admin.username}</td>
                        <td className="py-3 pr-4 text-slate-700 flex-1">{admin.phone}</td>
                        <td className="py-3 pr-4 w-28">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{admin.role}</span>
                        </td>
                        <td className="py-3 pr-4 w-48">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(admin)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1"
                            >
                              <Edit sx={{ fontSize: 16 }} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteId(id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center gap-1"
                            >
                              <Delete sx={{ fontSize: 16 }} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ marginTop: 0 }}>
          <div className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {isEditMode ? 'Adminni yangilash' : 'Admin yaratish'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Close sx={{ fontSize: 18 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ marginTop: 0 }}>
              <input
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="Ism"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                required
              />
              <input
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="Familiya"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                required
              />
              <input
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                required
              />
              <input
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="+998901112233"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
              />
              <select
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="admin">admin</option>
                <option value="general">general</option>
              </select>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder={isEditMode ? "Yangi parol (ixtiyoriy)" : 'Parol'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required={!isEditMode}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </button>
              </div>

              <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-2 mt-0" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 inline-flex items-center gap-2"
                >
                  <PersonAdd sx={{ fontSize: 18 }} />
                  {saving ? 'Saqlanmoqda...' : isEditMode ? 'Yangilash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ marginTop: 0 }}>
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl p-5">
            <h3 className="text-lg font-semibold text-slate-900" style={{ marginTop: 0 }}>Adminni o‘chirish</h3>
            <p className="text-sm text-slate-500 mt-0" style={{ marginTop: 0 }}>
              Rostdan ham bu adminni o‘chirmoqchimisiz? Bu amalni ortga qaytarib bo‘lmaydi.
            </p>
            <div className="mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2" style={{ marginTop: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300"
              >
                {deleting ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
