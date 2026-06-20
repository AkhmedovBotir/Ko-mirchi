import { useEffect, useMemo, useState } from 'react';
import { Add, Close, Delete, Edit, Link, LinkOff, Visibility, VisibilityOff, Search } from '@mui/icons-material';
import { omborAPI, omborchiAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  username: '',
  password: '',
};

const getOmborchiOmbors = (item, omborlar = []) => {
  if (Array.isArray(item?.ombors) && item.ombors.length > 0) {
    return item.ombors.map((o) => {
      if (typeof o === 'object' && o !== null) {
        const id = o.id || o._id;
        return {
          id,
          name: o.name || omborlar.find((x) => (x.id || x._id) === id)?.name || 'Ombor',
        };
      }
      const id = o;
      return {
        id,
        name: omborlar.find((x) => (x.id || x._id) === id)?.name || 'Ombor',
      };
    });
  }
  if (item?.ombor) {
    const id = item.ombor.id || item.ombor._id;
    return [{ id, name: item.ombor.name || 'Ombor' }];
  }
  return [];
};

const OmborChips = ({ item, omborlar }) => {
  const ombors = getOmborchiOmbors(item, omborlar);
  if (ombors.length === 0) {
    return <span className="text-xs text-slate-500">Biriktirilmagan</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {ombors.map((ombor) => (
        <span
          key={ombor.id}
          className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs"
        >
          {ombor.name}
        </span>
      ))}
    </div>
  );
};

const Omborchilar = () => {
  const { showError, showSuccess } = useSnackbar();
  const [items, setItems] = useState([]);
  const [omborlar, setOmborlar] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attachingKey, setAttachingKey] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [attachUser, setAttachUser] = useState(null);
  const [attachSearch, setAttachSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const isEditMode = useMemo(() => Boolean(editingId), [editingId]);

  const filteredOmborlar = useMemo(() => {
    const q = attachSearch.toLowerCase().trim();
    if (!q) return omborlar;
    return omborlar.filter((o) => String(o.name || '').toLowerCase().includes(q));
  }, [attachSearch, omborlar]);

  const attachedOmbors = useMemo(() => {
    if (!attachUser) return [];
    return getOmborchiOmbors(attachUser, omborlar);
  }, [attachUser, omborlar]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [omborchilarRes, omborlarRes] = await Promise.all([
        omborchiAPI.getAll(),
        omborAPI.getAll(),
      ]);
      const omborchilar = omborchilarRes?.data || [];
      const omborList = omborlarRes?.data || [];
      setItems(omborchilar);
      setOmborlar(omborList);
      return { omborchilar, omborList };
    } catch (error) {
      showError(error.message || "Ma'lumotlarni olib bo'lmadi");
      return { omborchilar: [], omborList: [] };
    } finally {
      setLoading(false);
    }
  };

  const refreshAttachUser = (omborchilar) => {
    setAttachUser((prev) => {
      if (!prev) return prev;
      const id = prev.id || prev._id;
      return omborchilar.find((item) => (item.id || item._id) === id) || prev;
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowPassword(false);
    setIsFormModalOpen(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowPassword(false);
    setIsFormModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id || item._id);
    setForm({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      phone: item.phone || '',
      username: item.username || '',
      password: '',
    });
    setIsFormModalOpen(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!isEditMode && form.password.length < 6) {
      showError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (isEditMode && form.password && form.password.length < 6) {
      showError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        const payload = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          username: form.username,
        };
        if (form.password.trim()) payload.password = form.password;
        await omborchiAPI.update(editingId, payload);
        showSuccess('Omborchi yangilandi');
      } else {
        await omborchiAPI.create(form);
        showSuccess('Omborchi yaratildi');
      }
      resetForm();
      await loadData();
    } catch (error) {
      showError(error.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await omborchiAPI.delete(deleteId);
      showSuccess("Omborchi o'chirildi");
      setDeleteId(null);
      setIsDeleteModalOpen(false);
      await loadData();
    } catch (error) {
      showError(error.message || "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  const handleAttach = async (omborId) => {
    if (!attachUser || !omborId) return;
    const omborchiId = attachUser.id || attachUser._id;
    setAttachingKey(`${omborchiId}-attach-${omborId}`);
    try {
      await omborchiAPI.attachOmbor(omborchiId, omborId);
      showSuccess('Omborga biriktirildi');
      const { omborchilar } = await loadData();
      refreshAttachUser(omborchilar);
    } catch (error) {
      showError(error.message || 'Biriktirishda xatolik');
    } finally {
      setAttachingKey(null);
    }
  };

  const handleDetach = async (omborId) => {
    if (!attachUser || !omborId) return;
    const omborchiId = attachUser.id || attachUser._id;
    setAttachingKey(`${omborchiId}-detach-${omborId}`);
    try {
      await omborchiAPI.detachOmbor(omborchiId, omborId);
      showSuccess('Ombordan ajratildi');
      const { omborchilar } = await loadData();
      refreshAttachUser(omborchilar);
    } catch (error) {
      showError(error.message || 'Ajratishda xatolik');
    } finally {
      setAttachingKey(null);
    }
  };

  const isOmborAttached = (omborId) => {
    return attachedOmbors.some((o) => o.id === omborId);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Omborchilar</h2>
        <p className="text-sm text-slate-500 mt-1">
          General admin uchun omborchi CRUD. Bir omborchiga bir nechta ombor biriktirish mumkin.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <button
          type="button"
          onClick={openCreate}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center justify-center gap-2"
        >
          <Add sx={{ fontSize: 18 }} />
          Omborchi qo‘shish
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-slate-500">Omborchilar topilmadi</div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {items.map((item) => {
                const id = item.id || item._id;
                const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ');
                return (
                  <div key={id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="font-medium text-slate-900">{fullName || '-'}</p>
                      <p className="text-sm text-slate-500 mt-0.5">@{item.username}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs">Telefon</p>
                        <p className="text-slate-700">{item.phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Omborlar</p>
                        <OmborChips item={item} omborlar={omborlar} />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAttachUser(item);
                          setAttachSearch('');
                          setIsAttachModalOpen(true);
                        }}
                        className="px-2.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        title="Ombor biriktirish"
                      >
                        <Link sx={{ fontSize: 16 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
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
                    <th className="py-3 pr-4 flex-1">F.I.SH</th>
                    <th className="py-3 pr-4 flex-1">Username</th>
                    <th className="py-3 pr-4 flex-1">Telefon</th>
                    <th className="py-3 pr-4 flex-1">Omborlar</th>
                    <th className="py-3 pr-4 w-48 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const id = item.id || item._id;
                    const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ');
                    return (
                      <tr key={id} className="flex items-center justify-between border-b border-slate-100">
                        <td className="py-3 pr-4 text-slate-800 flex-1">{fullName || '-'}</td>
                        <td className="py-3 pr-4 text-slate-700 flex-1">{item.username}</td>
                        <td className="py-3 pr-4 text-slate-700 flex-1">{item.phone}</td>
                        <td className="py-3 pr-4 flex-1">
                          <OmborChips item={item} omborlar={omborlar} />
                        </td>
                        <td className="py-3 pr-4 w-48">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAttachUser(item);
                                setAttachSearch('');
                                setIsAttachModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1"
                              title="Ombor biriktirish"
                            >
                              <Link sx={{ fontSize: 16 }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1"
                            >
                              <Edit sx={{ fontSize: 16 }} />
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
                {isEditMode ? 'Omborchini yangilash' : 'Omborchi yaratish'}
              </h3>
              <button type="button" onClick={resetForm} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                <Close sx={{ fontSize: 18 }} />
              </button>
            </div>
            <form onSubmit={submitForm} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ marginTop: 0 }}>
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
                placeholder="+998901234567"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
              />
              <input
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                required
              />
              <div className="md:col-span-2 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder={isEditMode ? 'Yangi parol (ixtiyoriy, min 6)' : 'Parol (min 6)'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required={!isEditMode}
                  minLength={isEditMode ? undefined : 6}
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
            <h3 className="text-lg font-semibold text-slate-900" style={{ marginTop: 0 }}>Omborchini o‘chirish</h3>
            <p className="text-sm text-slate-500 mt-0" style={{ marginTop: 0 }}>
              Rostdan ham ushbu omborchini o‘chirmoqchimisiz?
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

      {isAttachModalOpen && attachUser && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ marginTop: 0 }}>
          <div className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Ombor biriktirish</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bir nechta ombor biriktirish mumkin</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachUser(null);
                  setAttachSearch('');
                  setIsAttachModalOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Close sx={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5" style={{ marginTop: 0 }}>
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-800">
                  {attachUser.firstName} {attachUser.lastName}
                </h4>
                <p className="text-xs text-slate-500 mt-2">Biriktirilgan omborlar:</p>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {attachedOmbors.length === 0 ? (
                    <p className="text-sm text-slate-500">Hali biriktirilmagan</p>
                  ) : (
                    attachedOmbors.map((ombor) => {
                      const omborchiId = attachUser.id || attachUser._id;
                      const detachKey = `${omborchiId}-detach-${ombor.id}`;
                      return (
                        <div
                          key={ombor.id}
                          className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm text-slate-700">{ombor.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDetach(ombor.id)}
                            disabled={attachingKey === detachKey}
                            className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 inline-flex items-center gap-1 text-xs disabled:opacity-50"
                          >
                            <LinkOff sx={{ fontSize: 14 }} />
                            Ajratish
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="relative mb-3">
                  <Search sx={{ fontSize: 16 }} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={attachSearch}
                    onChange={(e) => setAttachSearch(e.target.value)}
                    placeholder="Ombor qidirish..."
                    className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredOmborlar.map((ombor) => {
                    const omborId = ombor.id || ombor._id;
                    const omborchiId = attachUser.id || attachUser._id;
                    const attachKey = `${omborchiId}-attach-${omborId}`;
                    const attached = isOmborAttached(omborId);
                    return (
                      <div key={omborId} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                        <span className="text-sm text-slate-700">{ombor.name}</span>
                        {attached ? (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">Birikkan</span>
                        ) : (
                          <button
                            type="button"
                            disabled={attachingKey === attachKey}
                            onClick={() => handleAttach(omborId)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs disabled:opacity-50"
                          >
                            Biriktir
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {filteredOmborlar.length === 0 && (
                    <div className="text-xs text-slate-500">Ombor topilmadi</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Omborchilar;
