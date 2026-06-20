import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LocalShipping, Scale, Outbox, Refresh, Add, Notes, Assignment } from '@mui/icons-material';
import { omborchiChiqimAPI, omborchiChiqimArizalariAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
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
  omborId: '',
  product: '',
  truckNumber: '',
  recipientOmborId: '',
  grossWeight: '',
  tareWeight: '',
  notes: '',
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

const getChiqimId = (record) =>
  record?._id || record?.id || record?.chiqimId || record?.chiqim?._id || record?.chiqim || null;

const getProductId = (item) => item?.product?._id || item?.product?.id || item?._id || item?.id;

const getOmborId = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object') return ref._id || ref.id || null;
  return ref;
};

const buildOmborNameMap = (...omborLists) => {
  const map = {};
  omborLists.flat().forEach((ombor) => {
    const id = getOmborId(ombor);
    if (id && ombor?.name) {
      map[String(id)] = ombor.name;
    }
  });
  return map;
};

const resolveOmborName = (ref, fallbackId, lookup = {}) => {
  if (ref && typeof ref === 'object' && ref.name) return ref.name;
  const id = getOmborId(ref) || fallbackId;
  if (id && lookup[String(id)]) return lookup[String(id)];
  return null;
};

const sameOmborId = (a, b) => {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
};

const getChiqimStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Kutilmoqda';
    case 'accepted':
      return 'Qabul qilingan';
    case 'rejected':
      return 'Bekor qilingan';
    default:
      return status || '—';
  }
};

const getArizaStatusLabel = (status) => {
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

const formatOmborProductLabel = (item) => {
  const name = item?.product?.name || "Noma'lum";
  const qoldiq = Number(item?.balance?.kg) || 0;
  return `${name} — ${formatWeight(qoldiq)} kg qoldiq`;
};

const OmborSelect = ({ ombors, value, onChange, disabled, placeholder = 'Omborni tanlang', emptyText = 'Ombor topilmadi' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const filteredOmbors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ombors;
    return ombors.filter((item) => (item.name || '').toLowerCase().includes(query));
  }, [ombors, search]);

  const selectedOmbor = useMemo(
    () => ombors.find((item) => sameOmborId(item._id || item.id, value)),
    [ombors, value]
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

  const handleSelect = (omborId) => {
    onChange(String(omborId));
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className="w-full rounded-xl border border-slate-200 px-3 py-3 bg-slate-50 text-slate-800 text-left disabled:opacity-60"
      >
        {selectedOmbor?.name || placeholder}
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
            {filteredOmbors.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">{emptyText}</p>
            ) : (
              filteredOmbors.map((item) => {
                const omborId = item._id || item.id;
                const isActive = sameOmborId(omborId, value);
                return (
                  <button
                    key={omborId}
                    type="button"
                    onClick={() => handleSelect(omborId)}
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

const ProductSelect = ({ products, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((item) =>
      formatOmborProductLabel(item).toLowerCase().includes(query)
    );
  }, [products, search]);

  const selectedProduct = useMemo(
    () => products.find((item) => getProductId(item) === value),
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
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className="w-full rounded-xl border border-slate-200 px-3 py-3 bg-slate-50 text-slate-800 text-left disabled:opacity-60"
      >
        {selectedProduct
          ? formatOmborProductLabel(selectedProduct)
          : disabled
            ? 'Avval omborni tanlang'
            : 'Mahsulotni tanlang'}
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
                const productId = getProductId(item);
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
                    <span className="block truncate">{formatOmborProductLabel(item)}</span>
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

const Chiqimlar = () => {
  const { showSuccess, showError } = useSnackbar();
  const [ombors, setOmbors] = useState([]);
  const [omborProducts, setOmborProducts] = useState([]);
  const [omborNameLookup, setOmborNameLookup] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [recipientOmbors, setRecipientOmbors] = useState([]);
  const [loadingRecipientOmbors, setLoadingRecipientOmbors] = useState(false);
  const [chiqimlar, setChiqimlar] = useState([]);
  const [arizalar, setArizalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [arizaChiqim, setArizaChiqim] = useState(null);
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

  const activeArizaByChiqimId = useMemo(() => {
    const map = {};
    arizalar.forEach((ariza) => {
      if (ariza.status !== 'pending' && ariza.status !== 'reviewing') return;
      const chiqimId = getChiqimId(ariza.chiqim) || ariza.chiqimId;
      if (chiqimId) map[String(chiqimId)] = ariza;
    });
    return map;
  }, [arizalar]);

  const displayedArizalar = useMemo(() => {
    if (!arizaStatusFilter) return arizalar;
    return arizalar.filter((item) => item.status === arizaStatusFilter);
  }, [arizalar, arizaStatusFilter]);

  const loadOmborProducts = async (omborId) => {
    if (!omborId) {
      setOmborProducts([]);
      return;
    }
    setLoadingProducts(true);
    try {
      const res = await omborchiChiqimAPI.getOmborProducts(omborId);
      setOmborProducts(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      showError(error.message || "Ombor mahsulotlarini yuklab bo'lmadi");
      setOmborProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadRecipientOmbors = async (sourceOmborId) => {
    if (!sourceOmborId) {
      setRecipientOmbors([]);
      return;
    }
    setLoadingRecipientOmbors(true);
    try {
      const res = await omborchiChiqimAPI.getRecipientOmbors(sourceOmborId);
      const data = Array.isArray(res?.data) ? res.data : [];
      setRecipientOmbors(data);
      setOmborNameLookup((prev) => ({ ...prev, ...buildOmborNameMap(data) }));
    } catch (error) {
      showError(error.message || "Manzil omborlarini yuklab bo'lmadi");
      setRecipientOmbors([]);
    } finally {
      setLoadingRecipientOmbors(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [omborsRes, allOmborsRes, chiqimRes, arizalarRes] = await Promise.all([
        omborchiChiqimAPI.getOmbors(),
        omborchiChiqimAPI.getRecipientOmbors(),
        omborchiChiqimAPI.getMyChiqimlar(),
        omborchiChiqimArizalariAPI.getList(),
      ]);
      const sourceOmbors = Array.isArray(omborsRes?.data) ? omborsRes.data : [];
      const allOmbors = Array.isArray(allOmborsRes?.data) ? allOmborsRes.data : [];
      const chiqimList = Array.isArray(chiqimRes?.data) ? chiqimRes.data : [];

      setOmbors(sourceOmbors);
      setChiqimlar(chiqimList);
      setArizalar(Array.isArray(arizalarRes?.data) ? arizalarRes.data : []);
      setOmborNameLookup(
        buildOmborNameMap(
          sourceOmbors,
          allOmbors,
          chiqimList.map((item) => item.ombor),
          chiqimList.map((item) => item.recipientOmbor)
        )
      );
    } catch (error) {
      showError(error.message || "Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isFormModalOpen && form.omborId) {
      loadOmborProducts(form.omborId);
      loadRecipientOmbors(form.omborId);
    }
  }, [isFormModalOpen, form.omborId]);

  const handleChange = (field, value) => {
    if (field === 'grossWeight' || field === 'tareWeight') {
      const sanitized = value.replace(/\D/g, '');
      setForm((prev) => ({ ...prev, [field]: sanitized }));
      return;
    }
    if (field === 'omborId') {
      setForm((prev) => ({ ...prev, omborId: value, product: '', recipientOmborId: '' }));
      return;
    }
    const normalizedValue = field === 'truckNumber' ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [field]: normalizedValue }));
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setForm(emptyForm);
    setOmborProducts([]);
    setRecipientOmbors([]);
  };

  const openCreateModal = () => {
    const defaultOmborId = ombors.length === 1 ? ombors[0]._id || ombors[0].id : '';
    setForm({ ...emptyForm, omborId: defaultOmborId });
    setIsFormModalOpen(true);
  };

  const closeArizaModal = () => {
    setArizaChiqim(null);
    setArizaNote('');
  };

  const openArizaModal = (item) => {
    setArizaChiqim(item);
    setArizaNote('');
  };

  const getManzilName = (item) =>
    resolveOmborName(item.recipientOmbor, item.recipientOmborId, omborNameLookup) || '—';

  const getManbaName = (item) =>
    resolveOmborName(item.ombor, item.omborId, omborNameLookup) || '—';

  const getChiqimDetailRows = (item) => [
    { label: 'Sana', value: item.createdAt ? new Date(item.createdAt).toLocaleString() : '—' },
    { label: 'Manba ombor', value: getManbaName(item) },
    { label: 'Manzil ombor', value: getManzilName(item) },
    { label: 'Mahsulot', value: item.product?.name || '—' },
    { label: 'Kelib chiqishi', value: item.product?.origin || '—' },
    { label: 'Mashina raqami', value: item.truckNumber || '—' },
    { label: 'Yuk bilan og\'irlik', value: `${formatWeight(item.grossWeight)} kg` },
    { label: 'Bo\'sh og\'irlik', value: `${formatWeight(item.tareWeight)} kg` },
    { label: 'Sof og\'irlik', value: `${formatWeight(item.netWeight)} kg` },
    { label: 'O\'lchov birligi', value: item.weightUnit || 'kg' },
    { label: 'Holat', value: getChiqimStatusLabel(item.status) },
    { label: 'Eslatma', value: item.notes || '—', fullWidth: true },
  ];

  const getArizaDetailRows = (ariza) => {
    const chiqim = typeof ariza.chiqim === 'object' ? ariza.chiqim : null;
    const rows = [
      { label: 'Sana', value: ariza.createdAt ? new Date(ariza.createdAt).toLocaleString() : '—' },
      { label: 'Holat', value: getArizaStatusLabel(ariza.status) },
      { label: 'Chiqim', value: chiqim?.product?.name || '—' },
      { label: 'Manba ombor', value: chiqim ? getManbaName(chiqim) : '—' },
      { label: 'Manzil ombor', value: chiqim ? getManzilName(chiqim) : '—' },
      { label: 'Mashina', value: chiqim?.truckNumber || '—' },
      { label: 'Sof og\'irlik', value: chiqim ? `${formatWeight(chiqim.netWeight)} kg` : '—' },
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
    if (!form.omborId || !form.product || !form.truckNumber.trim() || !form.recipientOmborId) {
      showError("Manba ombor, mahsulot, mashina raqami va manzil ombor to'ldirilishi shart");
      return false;
    }
    if (Number.isNaN(gross) || Number.isNaN(tare)) {
      showError('Yuk va bo\'sh og\'irlik raqam bo\'lishi kerak');
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
      await omborchiChiqimAPI.createChiqim({
        omborId: form.omborId,
        product: form.product,
        truckNumber: form.truckNumber.trim(),
        recipientOmborId: form.recipientOmborId,
        grossWeight: parseNumberValue(form.grossWeight),
        tareWeight: parseNumberValue(form.tareWeight),
        notes: form.notes.trim(),
      });
      showSuccess("Chiqim muvaffaqiyatli qo'shildi");
      closeFormModal();
      await loadData();
    } catch (error) {
      showError(error.message || 'Chiqimni saqlashda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAriza = async (e) => {
    e.preventDefault();
    if (!arizaChiqim) return;
    const note = arizaNote.trim();
    if (!note) {
      showError('Ariza matni to\'ldirilishi shart');
      return;
    }
    setSubmitting(true);
    try {
      await omborchiChiqimArizalariAPI.create({
        chiqimId: getChiqimId(arizaChiqim),
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

  const canSubmitForm =
    ombors.length > 0 &&
    form.omborId &&
    !loadingProducts &&
    !loadingRecipientOmbors &&
    omborProducts.length > 0 &&
    recipientOmbors.length > 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Chiqimlar boshqaruvi</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ombordan chiqim qo&apos;shish mumkin. Tahrirlash va o&apos;chirish faqat admin orqali — muammo bo&apos;lsa ariza yuboring.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 inline-flex items-center justify-center gap-2"
          >
            <Add sx={{ fontSize: 18 }} />
            Yangi chiqim
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
          <Outbox className="text-indigo-600" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Mening chiqimlarim</h3>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Yuklanmoqda...</p>
        ) : chiqimlar.length === 0 ? (
          <p className="text-sm text-slate-500">Hozircha chiqimlar mavjud emas.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Sana</th>
                  <th className="py-2 pr-3">Manba</th>
                  <th className="py-2 pr-3">Mahsulot</th>
                  <th className="py-2 pr-3">Manzil ombor</th>
                  <th className="py-2 pr-3">Net</th>
                  <th className="py-2 pr-3">Holat</th>
                  <th className="py-2 pr-3">Ariza</th>
                  <th className="py-2 pr-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {chiqimlar.map((item) => {
                  const chiqimId = getChiqimId(item);
                  const activeAriza = activeArizaByChiqimId[String(chiqimId)];

                  return (
                    <tr key={chiqimId} className="border-b border-slate-100 text-slate-700">
                      <td className="py-2 pr-3">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-3">{getManbaName(item)}</td>
                      <td className="py-2 pr-3">{item.product?.name || '-'}</td>
                      <td className="py-2 pr-3">{getManzilName(item)}</td>
                      <td className="py-2 pr-3 font-semibold">{formatWeight(item.netWeight)} kg</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(item.status)}`}
                        >
                          {getChiqimStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        {activeAriza ? (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(activeAriza.status)}`}
                          >
                            {getArizaStatusLabel(activeAriza.status)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Yo&apos;q</span>
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
                  <th className="py-2 pr-3">Chiqim</th>
                  <th className="py-2 pr-3">Holat</th>
                  <th className="py-2 pr-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {displayedArizalar.map((ariza) => (
                  <tr key={ariza._id || ariza.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-3">{ariza.createdAt ? new Date(ariza.createdAt).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-3 max-w-[180px] truncate">
                      {ariza.chiqim?.product?.name || '—'}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(ariza.status)}`}
                      >
                        {getArizaStatusLabel(ariza.status)}
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
            <h3 className="text-lg font-semibold text-slate-900">Yangi chiqim qo&apos;shish</h3>
            <p className="text-sm text-slate-500 mt-1">
              Avval manba omborni tanlang, keyin mahsulot va manzil omborni belgilang.
            </p>

            <form onSubmit={handleSubmitForm} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700 mb-2">Manba ombor</label>
                <OmborSelect
                  ombors={ombors}
                  value={form.omborId}
                  onChange={(omborId) => handleChange('omborId', omborId)}
                />
                {ombors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Sizga biriktirilgan omborlar topilmadi.</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Mahsulot</label>
                <ProductSelect
                  products={omborProducts}
                  value={form.product}
                  onChange={(productId) => handleChange('product', productId)}
                  disabled={!form.omborId || loadingProducts}
                />
                {form.omborId && !loadingProducts && omborProducts.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Tanlangan omborda qoldig&apos;i bor mahsulot yo&apos;q.</p>
                )}
                {loadingProducts && (
                  <p className="text-xs text-slate-500 mt-1">Mahsulotlar yuklanmoqda...</p>
                )}
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
                    placeholder="01 B 777 XX"
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-3 py-3 bg-slate-50 text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700 mb-2">Manzil ombor</label>
                <OmborSelect
                  ombors={recipientOmbors}
                  value={form.recipientOmborId}
                  onChange={(omborId) => handleChange('recipientOmborId', omborId)}
                  disabled={!form.omborId || loadingRecipientOmbors}
                  placeholder={!form.omborId ? 'Avval manba omborni tanlang' : 'Manzil omborni tanlang'}
                  emptyText="Manzil ombor topilmadi"
                />
                {form.omborId && !loadingRecipientOmbors && recipientOmbors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Manzil omborlar topilmadi.</p>
                )}
                {loadingRecipientOmbors && (
                  <p className="text-xs text-slate-500 mt-1">Manzil omborlar yuklanmoqda...</p>
                )}
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

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700 mb-2">Eslatma (ixtiyoriy)</label>
                <div className="relative">
                  <Notes className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={2}
                    placeholder="Shtab chiqishi"
                    className="w-full rounded-xl border border-slate-200 pl-11 pr-3 py-3 bg-slate-50 text-slate-800 resize-none"
                  />
                </div>
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
                  disabled={submitting || !canSubmitForm}
                  className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {arizaChiqim && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ marginTop: '0' }}>
          <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Ariza yuborish</h3>
            <p className="text-sm text-slate-500 mt-1">
              {arizaChiqim.product?.name || 'Chiqim'} — admin ko&apos;rib chiqadi. Bir chiqim uchun faqat bitta faol ariza
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
                  placeholder="Manzil ombor noto'g'ri tanlangan, qayta ko'rib chiqilsin"
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
        title="Chiqim tafsilotlari"
        rows={detailItem ? getChiqimDetailRows(detailItem) : []}
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

export default Chiqimlar;
