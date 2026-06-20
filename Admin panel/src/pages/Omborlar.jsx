import { useEffect, useState } from 'react';
import { Add, Close, Delete, Edit } from '@mui/icons-material';
import { omborAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';

const Omborlar = () => {
  const { showError, showSuccess } = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isEditMode = Boolean(editingId);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await omborAPI.getAll();
      setItems(response?.data || []);
    } catch (error) {
      showError(error.message || "Omborlar ro'yxatini olib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setIsFormModalOpen(false);
  };

  const openCreateModal = () => {
    setName('');
    setEditingId(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (item) => {
    setName(item?.name || '');
    setEditingId(item?.id || item?._id || null);
    setIsFormModalOpen(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditMode) {
        await omborAPI.update(editingId, { name });
        showSuccess('Ombor yangilandi');
      } else {
        await omborAPI.create({ name });
        showSuccess('Ombor yaratildi');
      }
      resetForm();
      await loadItems();
    } catch (error) {
      showError(error.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await omborAPI.delete(deleteId);
      showSuccess("Ombor o'chirildi");
      setDeleteId(null);
      setIsDeleteModalOpen(false);
      await loadItems();
    } catch (error) {
      showError(error.message || "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Omborlar</h2>
        <p className="text-sm text-slate-500 mt-1">Ombor nomlarini yaratish, yangilash va o‘chirish.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <button
          type="button"
          onClick={openCreateModal}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center justify-center gap-2"
        >
          <Add sx={{ fontSize: 18 }} />
          Ombor qo‘shish
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-slate-500">Omborlar topilmadi</div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {items.map((item) => {
                const id = item.id || item._id;
                return (
                  <div key={id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        <Edit sx={{ fontSize: 16 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteId(id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                      >
                        <Delete sx={{ fontSize: 16 }} />
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
                    <th className="py-3 pr-4 flex-1">Nomi</th>
                    <th className="py-3 pr-4 w-48 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const id = item.id || item._id;
                    return (
                      <tr key={id} className="flex items-center justify-between border-b border-slate-100">
                        <td className="py-3 pr-4 text-slate-800 flex-1">{item.name}</td>
                        <td className="py-3 pr-4 w-48">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
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
          <div className="w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {isEditMode ? 'Omborni yangilash' : 'Ombor yaratish'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Close sx={{ fontSize: 18 }} />
              </button>
            </div>

            <form onSubmit={submitForm} className="p-5 space-y-3" style={{ marginTop: 0 }}>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="Asosiy ombor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-0" style={{ marginTop: 0 }}>
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                >
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
            <h3 className="text-lg font-semibold text-slate-900" style={{ marginTop: 0 }}>
              Omborni o‘chirish
            </h3>
            <p className="text-sm text-slate-500 mt-0" style={{ marginTop: 0 }}>
              Rostdan ham ushbu omborni o‘chirmoqchimisiz?
            </p>
            <div className="mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2" style={{ marginTop: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteId(null);
                  setIsDeleteModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
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

export default Omborlar;
