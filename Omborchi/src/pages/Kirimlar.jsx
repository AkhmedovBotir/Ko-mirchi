import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LocalShipping, Scale, Inventory2, Refresh, Add, Assignment } from '@mui/icons-material';
import { omborchiKirimAPI, omborchiKirimArizalariAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useOmbor } from '../contexts/OmborContext';
import { filterBySourceOmbor, getRecordOmborId } from '../utils/omborUtils';
import DetailModal from '../components/common/DetailModal';
import ViewDetailButton from '../components/common/ViewDetailButton';

const STATUS_FILTERS = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'reviewing', label: "Ko'rib chiqilmoqda" },
  { value: 'accepted', label: 'Qabul qilindi' },
  { value: 'rejected', label: 'Bekor qilindi' },
];

const emptyForm = {
  product: '',
  truckNumber: '',
  grossWeight: '',
  tareWeight: '',
};

const parseNumberValue = (value) => {
  if (value === null || value === undefined) return NaN;
  const cleaned = String(value).replace(/\s/g, '');
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const formatKgNumber = (value) => {
  const numeric = parseNumberValue(value);
  if (Number.isNaN(numeric)) return '';
  return Math.trunc(numeric).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatWeight = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return formatKgNumber(value);
};

const getKirimId = (record) => record?._id || record?.id || record?.kirimId || record?.kirim?._id || record?.kirim || null;

const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'reviewing':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'accepted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Kutilmoqda';
    case 'reviewing':
      return "Ko'rib chiqilmoqda";
    case 'accepted':
      return 'Qabul qilindi';
    case 'rejected':
      return 'Bekor qilindi';
    default:
      return status || '—';
  }
};

const ProductSelect = ({ products, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((item) => (item.name || '').toLowerCase().includes(query));
  }, [products, search]);

  const selectedProduct = useMemo(
    () => products.find((item) => (item._id || item.id) === value),
    [products, value]
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleSelect = (productId) => {
    onChange(productId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full rounded-xl border border-slate-200 px-3 py-3 bg-slate-50 text-slate-800 text-left"
      >
        {selectedProduct?.name || 'Mahsulotni tanlang'}
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredProducts.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">Mahsulot topilmadi</p>
            ) : (
              filteredProducts.map((item) => {
                const productId = item._id || item.id;
                const isActive = productId === value;
                return (
                  <button
                    key={productId}
                    type="button"
                    onClick={() => handleSelect(productId)}
                    className={`w-full px-3 py-2 text-left text-sm ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Kirimlar = () => {
  const { showSuccess, showError } = useSnackbar();
  const { selectedOmborId, selectedOmbor, hasOmbors, completeOmborSwitch } = useOmbor();
  const [products, setProducts] = useState([]);
  const [kirimlar, setKirimlar] = useState([]);
  const [arizalar, setArizalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [arizaKirim, setArizaKirim] = useState(null);
  const [arizaNote, setArizaNote] = useState('');
  const [detailAriza, setDetailAriza] = useState(null);
  const [arizaStatusFilter, setArizaStatusFilter] = useState('');

  const netWeightPreview = useMemo(() => {
    const gross = parseNumberValue(form.grossWeight);
    const tare = parseNumberValue(form.tareWeight);
    if (Number.isNaN(gross) || Number.isNaN(tare)) return '';
    const value = gross - tare;
    return value >= 0 ? value : '';
  }, [form.grossWeight, form.tareWeight]);

  const activeArizaByKirimId = useMemo(() => {
    const map = {};
    arizalar.forEach((ariza) => {
      if (ariza.status !== 'pending' && ariza.status !== 'reviewing') return;
      const kirimId = getKirimId(ariza.kirim) || ariza.kirimId;
      if (kirimId) map[String(kirimId)] = ariza;
    });
    return map;
  }, [arizalar]);

  const displayedArizalar = useMemo(() => {
    let list = arizalar;
    if (selectedOmborId) {
      list = list.filter((ariza) => {
        const kirim = typeof ariza.kirim === 'object' ? ariza.kirim : null;
        return getRecordOmborId(kirim) === String(selectedOmborId);
      });
    }
    if (!arizaStatusFilter) return list;
    return list.filter((item) => item.status === arizaStatusFilter);
  }, [arizalar, arizaStatusFilter, selectedOmborId]);

  const filteredKirimlar = useMemo(
    () => filterBySourceOmbor(kirimlar, selectedOmborId),
    [kirimlar, selectedOmborId]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, myRes, arizalarRes] = await Promise.all([
        omborchiKirimAPI.getProducts(),
        omborchiKirimAPI.getMyKirimlar(),
        omborchiKirimArizalariAPI.getList(),
      ]);
      setProducts(Array.isArray(productsRes?.data) ? productsRes.data : []);
      setKirimlar(Array.isArray(myRes?.data) ? myRes.data : []);
      setArizalar(Array.isArray(arizalarRes?.data) ? arizalarRes.data : []);
    } catch (error) {
      showError(error.message || "Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
      completeOmborSwitch();
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOmborId]);

  useEffect(() => {
    if (!isFormModalOpen) return;
    setForm(emptyForm);
  }, [selectedOmborId]);

  const handleChange = (field, value) => {
    if (field === 'grossWeight' || field === 'tareWeight') {
      const sanitized = value.replace(/\D/g, '');
      setForm((prev) => ({ ...prev, [field]: sanitized }));
      return;
    }
    const normalizedValue = field === 'truckNumber' ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [field]: normalizedValue }));
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setForm(emptyForm);
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setIsFormModalOpen(true);
  };

  const closeArizaModal = () => {
    setArizaKirim(null);
    setArizaNote('');
  };

  const openArizaModal = (item) => {
    setArizaKirim(item);
    setArizaNote('');
  };

  const getKirimDetailRows = (item) => [
    { label: 'Sana', value: item.createdAt ? new Date(item.createdAt).toLocaleString() : '—' },
    { label: 'Ombor', value: item.ombor?.name || '—' },
    { label: 'Mahsulot', value: item.product?.name || '—' },
    { label: 'Kelib chiqishi', value: item.product?.origin || '—' },
    { label: 'Mashina raqami', value: item.truckNumber || '—' },
    { label: 'Yuk bilan og\'irlik', value: `${formatWeight(item.grossWeight)} kg` },
    { label: 'Bo\'sh og\'irlik', value: `${formatWeight(item.tareWeight)} kg` },
    { label: 'Sof og\'irlik', value: `${formatWeight(item.netWeight)} kg` },
    { label: 'O\'lchov birligi', value: item.weightUnit || 'kg' },
  ];

  const getArizaDetailRows = (ariza) => {
    const kirim = typeof ariza.kirim === 'object' ? ariza.kirim : null;
    const rows = [
      { label: 'Sana', value: ariza.createdAt ? new Date(ariza.createdAt).toLocaleString() : '—' },
      { label: 'Holat', value: getStatusLabel(ariza.status) },
      { label: 'Kirim', value: kirim?.product?.name || '—' },
      { label: 'Mashina', value: kirim?.truckNumber || '—' },
      { label: 'Sof og\'irlik', value: kirim ? `${formatWeight(kirim.netWeight)} kg` : '—' },
      { label: 'Ariza matni', value: ariza.note || '—', fullWidth: true },
    ];
    if (ariza.status === 'rejected' && ariza.rejectionReason) {
      rows.push({ label: 'Rad etish sababi', value: ariza.rejectionReason, fullWidth: true });
    }
    return rows;
  };

  const validateForm = () => {
    const gross = parseNumberValue(form.grossWeight);
    const tare = parseNumberValue(form.tareWeight);
    if (!selectedOmborId || !form.product || !form.truckNumber.trim()) {
      showError("Mahsulot va mashina raqami to'ldirilishi shart");
      return false;
    }
    if (Number.isNaN(gross) || Number.isNaN(tare)) {
      showError('Og\'irlik qiymatlari raqam bo\'lishi kerak');
      return false;
    }
    if (gross < 0 || tare < 0) {
      showError('Og\'irlik qiymatlari 0 dan kichik bo\'lmasligi kerak');
      return false;
    }
    if (gross <= tare) {
      showError('Yuk bilan og\'irlik bo\'sh og\'irlikdan katta bo\'lishi kerak');
      return false;
    }
    return true;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await omborchiKirimAPI.createKirim({
        omborId: selectedOmborId,
        product: form.product,
        truckNumber: form.truckNumber.trim(),
        grossWeight: parseNumberValue(form.grossWeight),
        tareWeight: parseNumberValue(form.tareWeight),
      });
      showSuccess("Kirim muvaffaqiyatli qo'shildi");
      closeFormModal();
      await loadData();
    } catch (error) {
      showError(error.message || 'Kirimni saqlashda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAriza = async (e) => {
    e.preventDefault();
    if (!arizaKirim) return;
    const note = arizaNote.trim();
    if (!note) {
      showError('Ariza matni to\'ldirilishi shart');
      return;
    }
    setSubmitting(true);
    try {
      await omborchiKirimArizalariAPI.create({
        kirimId: getKirimId(arizaKirim),
        note,
      });
      showSuccess('Ariza admin uchun yuborildi');
      closeArizaModal();
      await loadData();
    } catch (error) {
      showError(error.message || 'Arizani yuborishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Kirimlar boshqaruvi</h2>
        <p className="text-sm text-slate-500 mt-1">
          Yangi kirim qo'shish mumkin. Tahrirlash va o'chirish faqat admin orqali — muammo bo'lsa ariza yuboring.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 inline-flex items-center justify-center gap-2"
          >
            <Add sx={{ fontSize: 18 }} />
            Yangi kirim
          </button>
          <button
            type="button"
            onClick={loadData}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 inline-flex items-center justify-center gap-2"
          >
            <Refresh sx={{ fontSize: 18 }} />
            Yangilash
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Inventory2 className="text-indigo-600" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Mening kirimlarim</h3>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Yuklanmoqda...</p>
        ) : filteredKirimlar.length === 0 ? (
          <p className="text-sm text-slate-500">Tanlangan omborda kirimlar topilmadi.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Sana</th>
                  <th className="py-2 pr-3">Mahsulot</th>
                  <th className="py-2 pr-3">Net</th>
                  <th className="py-2 pr-3">Ariza</th>
                  <th className="py-2 pr-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredKirimlar.map((item) => {
                  const kirimId = getKirimId(item);
                  const activeAriza = activeArizaByKirimId[String(kirimId)];

                  return (
                    <tr key={kirimId} className="border-b border-slate-100 text-slate-700">
                      <td className="py-2 pr-3">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-3">{item.product?.name || '-'}</td>
                      <td className="py-2 pr-3 font-semibold">{formatWeight(item.netWeight)} kg</td>
                      <td className="py-2 pr-3">
                        {activeAriza ? (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(activeAriza.status)}`}
                          >
                            {getStatusLabel(activeAriza.status)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <ViewDetailButton onClick={() => setDetailItem(item)} />
                          {!activeAriza && (
                            <button
                              type="button"
                              onClick={() => openArizaModal(item)}
                              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 inline-flex items-center gap-1"
                              title="Ariza yuborish"
                            >
                              <Assignment sx={{ fontSize: 16 }} />
                              <span className="hidden sm:inline">Ariza</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Assignment className="text-indigo-600" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Mening arizalarim</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value || 'all'}
                type="button"
                onClick={() => setArizaStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                  arizaStatusFilter === filter.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Yuklanmoqda...</p>
        ) : displayedArizalar.length === 0 ? (
          <p className="text-sm text-slate-500">Arizalar topilmadi.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Sana</th>
                  <th className="py-2 pr-3">Kirim</th>
                  <th className="py-2 pr-3">Holat</th>
                  <th className="py-2 pr-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {displayedArizalar.map((ariza) => (
                  <tr key={ariza._id || ariza.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-3">{ariza.createdAt ? new Date(ariza.createdAt).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-3 max-w-[180px] truncate">
                      {ariza.kirim?.product?.name || '—'}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(ariza.status)}`}
                      >
                        {getStatusLabel(ariza.status)}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <ViewDetailButton onClick={() => setDetailAriza(ariza)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ marginTop: '0' }}>
          <div className="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900">Yangi kirim qo&apos;shish</h3>
            <p className="text-sm text-slate-500 mt-1">Barcha maydonlarni to&apos;ldiring, sof og&apos;irlik avtomatik ko&apos;rsatiladi.</p>

            <p className="text-sm text-slate-500 mt-1">
              {selectedOmbor?.name ? `${selectedOmbor.name} omboriga` : 'Tanlangan omborga'} kirim qo&apos;shish.
            </p>

            <form onSubmit={handleSubmitForm} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">Mahsulot</label>
                <ProductSelect
                  products={products}
                  value={form.product}
                  onChange={(productId) => handleChange('product', productId)}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Mashina raqami</label>
                <div className="relative">
                  <LocalShipping className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.truckNumber}
                    onChange={(e) => handleChange('truckNumber', e.target.value)}
                    required
                    placeholder="01 A 123 BC"
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-3 py-3 bg-slate-50 text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Yuk bilan og&apos;irlik (kg)</label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatKgNumber(form.grossWeight)}
                    onChange={(e) => handleChange('grossWeight', e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-3 py-3 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Bo&apos;sh og&apos;irlik (kg)</label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatKgNumber(form.tareWeight)}
                    onChange={(e) => handleChange('tareWeight', e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-3 py-3 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Sof og&apos;irlik (auto)</label>
                <input
                  type="text"
                  value={netWeightPreview === '' ? '-' : `${formatWeight(netWeightPreview)} kg`}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 bg-slate-100 text-slate-700"
                />
              </div>

              <div className="md:col-span-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-1">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting || !hasOmbors || !selectedOmborId}
                  className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {arizaKirim && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ marginTop: '0' }}>
          <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Ariza yuborish</h3>
            <p className="text-sm text-slate-500 mt-1">
              {arizaKirim.product?.name || 'Kirim'} — admin ko&apos;rib chiqadi. Bir kirim uchun faqat bitta faol ariza
              bo&apos;lishi mumkin.
            </p>

            <form onSubmit={handleSubmitAriza} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">Ariza matni</label>
                <textarea
                  value={arizaNote}
                  onChange={(e) => setArizaNote(e.target.value)}
                  rows={4}
                  required
                  placeholder="Og'irlik noto'g'ri kiritilgan, qayta ko'rib chiqilsin"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 bg-slate-50 text-slate-800 resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeArizaModal}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:bg-amber-300"
                >
                  {submitting ? 'Yuborilmoqda...' : 'Yuborish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailModal
        open={!!detailItem}
        title="Kirim tafsilotlari"
        rows={detailItem ? getKirimDetailRows(detailItem) : []}
        onClose={() => setDetailItem(null)}
      />

      <DetailModal
        open={!!detailAriza}
        title="Ariza tafsilotlari"
        rows={detailAriza ? getArizaDetailRows(detailAriza) : []}
        onClose={() => setDetailAriza(null)}
      />
    </div>
  );
};

export default Kirimlar;
