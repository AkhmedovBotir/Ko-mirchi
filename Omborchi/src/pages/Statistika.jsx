import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Refresh,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Inventory2,
  Outbox,
  MoveToInbox,
  FilterList,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import {
  omborchiChiqimAPI,
  omborchiKirimAPI,
  omborchiStatistikaAPI,
} from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useOmbor } from '../contexts/OmborContext';
import DetailModal from '../components/common/DetailModal';
import ViewDetailButton from '../components/common/ViewDetailButton';
import { formatTonFromKg, formatWeight } from '../utils/formatWeight';

const TYPE_FILTERS = [
  {
    value: 'all',
    label: 'Barcha amallar',
    description: 'Kirim, chiqim va transferlar',
    icon: SwapHoriz,
    loader: omborchiStatistikaAPI.getAll,
  },
  {
    value: 'kirimlar',
    label: 'Kirimlar',
    description: "To'g'ridan-to'g'ri kirimlar",
    icon: Inventory2,
    loader: omborchiStatistikaAPI.getKirimlar,
  },
  {
    value: 'chiqimlar',
    label: 'Chiqimlar',
    description: 'Boshqa omborlarga yuborilgan',
    icon: Outbox,
    loader: omborchiStatistikaAPI.getChiqimlar,
  },
  {
    value: 'qabul-qilganlar',
    label: 'Qabul qilganlar',
    description: 'Kelgan transferlar',
    icon: MoveToInbox,
    loader: omborchiStatistikaAPI.getQabulQilganlar,
  },
];

const LIMIT_OPTIONS = ['20', '50', '100'];

const emptyFilters = {
  recipientOmborId: '',
  productId: '',
  from: '',
  to: '',
  limit: '20',
};

const formatOmborchiLabel = (omborchi) => {
  if (!omborchi) return "Noma'lum";
  const name =
    [omborchi.firstName, omborchi.lastName].filter(Boolean).join(' ').trim() ||
    omborchi.fullName ||
    omborchi.fullname ||
    omborchi.name ||
    omborchi.username ||
    '';
  return name || "Noma'lum";
};

const getTypeBadge = (type) => {
  switch (type) {
    case 'kirim':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'chiqim':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'qabul':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'kirim':
      return 'Kirim';
    case 'chiqim':
      return 'Chiqim';
    case 'qabul':
      return 'Qabul';
    default:
      return type || '-';
  }
};

const getStatusLabel = (status) => {
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

const buildRequestParams = (filters, page) => {
  const params = {
    page,
    limit: filters.limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeSummary: true,
  };

  if (filters.recipientOmborId) params.recipientOmborId = filters.recipientOmborId;
  if (filters.productId) params.productId = filters.productId;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  return params;
};

const getCounterpartyLabel = (item) => {
  if (item.type === 'chiqim') {
    return item.recipientOmbor?.name || "Noma'lum";
  }
  if (item.type === 'qabul') {
    return formatOmborchiLabel(item.sender);
  }
  return '—';
};

const getStatistikaDetailRows = (item) => {
  const rows = [
    { label: 'Sana', value: item.createdAt ? new Date(item.createdAt).toLocaleString() : '—' },
    { label: 'Tur', value: getTypeLabel(item.type) },
    { label: 'Mahsulot', value: item.product?.name || '—' },
    { label: 'Kelib chiqishi', value: item.product?.origin || '—' },
    { label: 'Mashina raqami', value: item.truckNumber || '—' },
    { label: 'Yuk bilan og\'irlik', value: `${formatWeight(item.grossWeight)} kg` },
    { label: 'Bo\'sh og\'irlik', value: `${formatWeight(item.tareWeight)} kg` },
    { label: 'Sof og\'irlik', value: `${formatWeight(item.netWeight)} kg` },
    { label: 'O\'lchov birligi', value: item.weightUnit || 'kg' },
  ];

  if (item.type === 'kirim') {
    rows.push({ label: 'Ombor', value: item.ombor?.name || '—' });
  }

  if (item.type === 'chiqim') {
    rows.push({ label: 'Manba ombor', value: item.ombor?.name || '—' });
    rows.push({ label: 'Manzil ombor', value: getCounterpartyLabel(item) });
    rows.push({ label: 'Holat', value: getStatusLabel(item.status) });
  }

  if (item.type === 'qabul') {
    rows.push({ label: 'Yuboruvchi', value: getCounterpartyLabel(item) });
    rows.push({ label: 'Manba ombor', value: item.ombor?.name || '—' });
    rows.push({ label: 'Manzil ombor', value: item.recipientOmbor?.name || '—' });
    rows.push({ label: 'Holat', value: getStatusLabel(item.status) });
  }

  rows.push({ label: 'Eslatma', value: item.notes || '—', fullWidth: true });
  return rows;
};

const getOmborCellLabel = (item) => {
  if (item.type === 'kirim' || item.type === 'chiqim') {
    return item.ombor?.name || '—';
  }
  if (item.type === 'qabul') {
    return item.recipientOmbor?.name || item.ombor?.name || '—';
  }
  return '—';
};

const Statistika = () => {
  const { showError } = useSnackbar();
  const { selectedOmborId, selectedOmbor, completeOmborSwitch } = useOmbor();
  const [typeFilter, setTypeFilter] = useState('all');
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [products, setProducts] = useState([]);
  const [recipientOmbors, setRecipientOmbors] = useState([]);

  const showRecipientFilter = typeFilter === 'all' || typeFilter === 'chiqimlar';

  const loadReferenceData = async () => {
    try {
      const [productsRes, recipientRes] = await Promise.all([
        omborchiKirimAPI.getProducts(),
        omborchiChiqimAPI.getRecipientOmbors(),
      ]);
      setProducts(Array.isArray(productsRes?.data) ? productsRes.data : []);
      setRecipientOmbors(Array.isArray(recipientRes?.data) ? recipientRes.data : []);
    } catch {
      // filter dropdownlari bo'sh qolishi mumkin
    }
  };

  const loadData = async (tab = typeFilter, activeFilters = appliedFilters, activePage = page) => {
    setLoading(true);
    try {
      const selected = TYPE_FILTERS.find((item) => item.value === tab) || TYPE_FILTERS[0];
      const params = buildRequestParams(activeFilters, activePage);
      if (selectedOmborId) params.omborId = selectedOmborId;
      const response = await selected.loader(params);

      setItems(Array.isArray(response?.data) ? response.data : []);
      setSummary(response?.summary || null);
      setPagination({
        page: Number(response?.pagination?.page) || activePage,
        limit: Number(response?.pagination?.limit) || Number(activeFilters.limit) || 20,
        total: Number(response?.pagination?.total) || Number(response?.count) || 0,
        totalPages: Number(response?.pagination?.totalPages) || 1,
      });
    } catch (error) {
      showError(error.message || "Statistikani yuklab bo'lmadi");
      setItems([]);
      setSummary(null);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
      completeOmborSwitch();
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadData(typeFilter, appliedFilters, page);
  }, [typeFilter, appliedFilters, page, selectedOmborId]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handleTypeChange = (value) => {
    setTypeFilter(value);
    setPage(1);
  };

  const summaryStats = useMemo(() => {
    if (summary) {
      const kirimKg =
        (Number(summary.byType?.kirim?.netWeightKg) || 0) +
        (Number(summary.byType?.qabul?.netWeightKg) || 0);
      const chiqimKg = Number(summary.byType?.chiqim?.netWeightKg) || 0;
      const totalKg = Number(summary.totalNetWeightKg) || kirimKg + chiqimKg;
      const totalCount = Number(summary.totalCount) || pagination.total;

      return { totalCount, kirimKg, chiqimKg, totalKg };
    }

    const totalKg = items.reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0);
    const kirimKg = items
      .filter((item) => item.type === 'kirim' || item.type === 'qabul')
      .reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0);
    const chiqimKg = items
      .filter((item) => item.type === 'chiqim')
      .reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0);

    return { totalCount: pagination.total, kirimKg, chiqimKg, totalKg };
  }, [summary, items, pagination.total]);

  const hasActiveFilters = useMemo(
    () => JSON.stringify(appliedFilters) !== JSON.stringify(emptyFilters),
    [appliedFilters]
  );

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 text-slate-800 text-sm outline-none focus:border-indigo-400';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-4 sm:p-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Statistika</h2>
              <p className="text-sm text-slate-500 mt-1">
                Kirimlar, chiqimlar va qabul qilingan transferlar bo&apos;yicha tarix, filter va og&apos;irlik
                ko&apos;rsatkichlari.
                {selectedOmbor && (
                  <span className="block mt-1 text-indigo-600 font-medium">
                    Ombor: {selectedOmbor.name}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border inline-flex items-center justify-center gap-2 ${
                  hasActiveFilters
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                <FilterList sx={{ fontSize: 18 }} />
                Filterlar
              </button>
              <button
                type="button"
                onClick={() => loadData(typeFilter, appliedFilters, page)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 inline-flex items-center justify-center gap-2"
              >
                <Refresh sx={{ fontSize: 18 }} />
                Yangilash
              </button>
            </div>
          </div>
        </div>

        {filtersOpen && (
          <div className="px-4 sm:px-6 mt-4 pb-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Boshlanish sanasi</label>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => handleFilterChange('from', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Tugash sanasi</label>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => handleFilterChange('to', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Mahsulot</label>
                  <select
                    value={filters.productId}
                    onChange={(e) => handleFilterChange('productId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Barchasi</option>
                    {products.map((product) => {
                      const id = product._id || product.id;
                      return (
                        <option key={id} value={id}>
                          {product.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {showRecipientFilter && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Manzil ombor</label>
                    <select
                      value={filters.recipientOmborId}
                      onChange={(e) => handleFilterChange('recipientOmborId', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Barchasi</option>
                      {recipientOmbors.map((ombor) => {
                        const id = ombor._id || ombor.id;
                        return (
                          <option key={id} value={id}>
                            {ombor.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Har sahifada</label>
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                    className={inputClass}
                  >
                    {LIMIT_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white"
                >
                  Tozalash
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                >
                  Qo&apos;llash
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-3 sm:px-4 md:px-6 mt-4 sm:mt-5 pb-4 sm:pb-6">
          <div className="rounded-2xl bg-slate-100/80 p-1.5">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-1.5"
              role="tablist"
              aria-label="Statistika bo'limlari"
            >
              {TYPE_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = typeFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleTypeChange(filter.value)}
                    className={`relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-white shadow-sm ring-1 ring-indigo-100'
                        : 'hover:bg-white/70 text-slate-600'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {filter.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{filter.description}</p>
                    </div>
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm min-w-0"
        >
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 font-semibold leading-tight">
            Jami yozuvlar
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 sm:mt-2">
            {loading ? '—' : summaryStats.totalCount}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm min-w-0"
        >
          <div className="flex items-center gap-1 sm:gap-2 text-emerald-600 min-w-0">
            <TrendingUp sx={{ fontSize: { xs: 16, sm: 18 } }} className="shrink-0" />
            <p className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold leading-tight truncate">
              Kirim + qabul (net)
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 sm:mt-2">
            {loading ? '—' : `${formatTonFromKg(summaryStats.kirimKg)} t`}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
            {loading ? '—' : `${formatWeight(summaryStats.kirimKg)} kg`}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm min-w-0"
        >
          <div className="flex items-center gap-1 sm:gap-2 text-indigo-600 min-w-0">
            <TrendingDown sx={{ fontSize: { xs: 16, sm: 18 } }} className="shrink-0" />
            <p className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold leading-tight truncate">
              Chiqim (net)
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 sm:mt-2">
            {loading ? '—' : `${formatTonFromKg(summaryStats.chiqimKg)} t`}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
            {loading ? '—' : `${formatWeight(summaryStats.chiqimKg)} kg`}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm min-w-0"
        >
          <div className="flex items-center gap-1 sm:gap-2 text-sky-600 min-w-0">
            <SwapHoriz sx={{ fontSize: { xs: 16, sm: 18 } }} className="shrink-0" />
            <p className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold leading-tight truncate">
              Jami net og&apos;irlik
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 sm:mt-2">
            {loading ? '—' : `${formatTonFromKg(summaryStats.totalKg)} t`}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
            {loading ? '—' : `${formatWeight(summaryStats.totalKg)} kg`}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart className="text-indigo-600" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Amallar tarixi</h3>
          </div>
          {!loading && pagination.totalPages > 1 && (
            <p className="text-xs text-slate-500">
              {pagination.total} ta yozuvdan {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Yuklanmoqda...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">Ma&apos;lumot topilmadi.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Sana</th>
                  <th className="py-2 pr-3">Tur</th>
                  <th className="py-2 pr-3">Ombor</th>
                  <th className="py-2 pr-3">Mahsulot</th>
                  <th className="py-2 pr-3">Net</th>
                  <th className="py-2 pr-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getTypeBadge(item.type)}`}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{getOmborCellLabel(item)}</td>
                    <td className="py-2 pr-3">{item.product?.name || '-'}</td>
                    <td className="py-2 pr-3 font-semibold">{formatWeight(item.netWeight)} kg</td>
                    <td className="py-2 pr-3">
                      <ViewDetailButton onClick={() => setDetailItem(item)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Sahifa {pagination.page} / {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                title="Oldingi sahifa"
              >
                <ChevronLeft sx={{ fontSize: 20 }} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                title="Keyingi sahifa"
              >
                <ChevronRight sx={{ fontSize: 20 }} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <DetailModal
        open={!!detailItem}
        title="Amal tafsilotlari"
        rows={detailItem ? getStatistikaDetailRows(detailItem) : []}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
};

export default Statistika;
