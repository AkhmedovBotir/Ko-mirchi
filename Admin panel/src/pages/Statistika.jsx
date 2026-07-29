import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FilterList,
  Refresh,
  ChevronLeft,
  ChevronRight,
  Search,
  Visibility,
  Close,
  FileDownload,
} from '@mui/icons-material';
import { statistikaAPI, omborAPI, omborchiAPI, maxsulotAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import CustomSelect from '../components/common/CustomSelect';
import MultiSelect from '../components/common/MultiSelect';

const TABS = [
  { id: 'all', label: 'Barchasi', fetch: statistikaAPI.getAll },
  { id: 'kirimlar', label: 'Kirimlar', fetch: statistikaAPI.getKirimlar },
  { id: 'chiqimlar', label: 'Chiqimlar', fetch: statistikaAPI.getChiqimlar },
  { id: 'qabul', label: 'Qabul qilinganlar', fetch: statistikaAPI.getQabulQilganlar },
];

const TAB_HINTS = {
  all: "Ro'yxatda kirim, chiqim va qabul barchasi ko'rinadi (default).",
  kirimlar: "Ro'yxat va yig'inda faqat kirimlar.",
  chiqimlar: "Ro'yxat va yig'inda faqat chiqimlar.",
  qabul: "Qabul qilingan transferlar (default: accepted). Omborchi filtri — biriktirilgan manzil omborlar bo'yicha.",
};

const BY_TYPE_ORDER = ['kirim', 'chiqim', 'qabul'];

const TAB_TO_SCOPE = {
  all: 'all',
  kirimlar: 'kirimlar',
  chiqimlar: 'chiqimlar',
  qabul: 'qabul-qilganlar',
};

const EXPORT_STATUS_LABELS = {
  pending: 'Navbatda...',
  processing: 'Tayyorlanmoqda...',
  completed: 'Tayyor',
  failed: 'Xatolik',
};

const appendWeightRange = (params, minKey, maxKey, minVal, maxVal) => {
  if (minVal === '' && maxVal === '') return;
  const min = minVal !== '' ? Number(minVal) : null;
  const max = maxVal !== '' ? Number(maxVal) : null;
  if (min === 0 && max === 0) return;
  if (minVal !== '') params[minKey] = min;
  if (maxVal !== '') params[maxKey] = max;
};

const buildFilterParams = (source, tab) => {
  const params = {
    sortBy: source.sortBy,
    sortOrder: source.sortOrder,
  };

  if (source.from) params.from = source.from;
  if (source.to) params.to = source.to;
  if (source.omborchiId) params.omborchiId = source.omborchiId;
  if (source.senderOmborchiId) params.senderOmborchiId = source.senderOmborchiId;
  if (source.recipientOmborId) params.recipientOmborId = source.recipientOmborId;
  if (source.omborIds?.length) params.omborIds = source.omborIds.join(',');
  if (source.productId) params.productId = source.productId;
  if (source.status) params.status = source.status;
  if (source.truckNumber?.trim()) params.truckNumber = source.truckNumber.trim();
  appendWeightRange(params, 'minNetWeight', 'maxNetWeight', source.minNetWeight, source.maxNetWeight);
  appendWeightRange(params, 'minGrossWeight', 'maxGrossWeight', source.minGrossWeight, source.maxGrossWeight);

  if (tab === 'all' && source.selectedTypes?.length > 0) {
    params.types = source.selectedTypes.join(',');
  }

  return params;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const triggerFileDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const TYPE_OPTIONS = [
  { value: 'kirim', label: 'Kirim' },
  { value: 'chiqim', label: 'Chiqim' },
  { value: 'qabul', label: 'Qabul' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'accepted', label: 'Qabul qilingan' },
  { value: 'rejected', label: 'Rad etilgan' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Yaratilgan sana' },
  { value: 'updatedAt', label: 'Yangilangan sana' },
  { value: 'netWeight', label: "Sof og'irlik" },
  { value: 'grossWeight', label: "Umumiy og'irlik" },
  { value: 'tareWeight', label: "Tara og'irligi" },
];

const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Kamayish' },
  { value: 'asc', label: "O'sish" },
];

const LIMIT_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

const formatDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getOmborchiFilterLabel = (tab) => {
  if (tab === 'qabul') return 'Omborchi (manzil omborlar)';
  if (tab === 'kirimlar') return 'Omborchi (kirim egasi)';
  if (tab === 'chiqimlar') return 'Omborchi (yuboruvchi)';
  return 'Omborchi';
};

const emptyFilters = () => ({
  omborchiId: '',
  senderOmborchiId: '',
  recipientOmborId: '',
  omborIds: [],
  productId: '',
  status: '',
  truckNumber: '',
  from: '',
  to: '',
  selectedTypes: [],
  minNetWeight: '',
  maxNetWeight: '',
  minGrossWeight: '',
  maxGrossWeight: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
  includeSummary: true,
});

const formatPerson = (person) => {
  if (!person) return '-';
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
  return name || person.username || '-';
};

const formatOmbor = (ombor) => {
  if (!ombor) return '-';
  if (typeof ombor === 'object') return ombor.name || '-';
  return String(ombor);
};

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatWeight = (value, unit = 'kg') => {
  if (value === undefined || value === null || value === '') return '-';
  return `${Number(value).toLocaleString('uz-UZ')} ${unit}`;
};

const typeBadgeClass = (type) => {
  if (type === 'kirim') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (type === 'chiqim') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (type === 'qabul') return 'bg-violet-50 text-violet-700 border-violet-100';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const statusBadgeClass = (status) => {
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-700';
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-700';
};

const typeLabel = (type) => {
  if (type === 'kirim') return 'Kirim';
  if (type === 'chiqim') return 'Chiqim';
  if (type === 'qabul') return 'Qabul';
  return type || '-';
};

const statusLabel = (status) => {
  if (status === 'accepted') return 'Qabul qilingan';
  if (status === 'pending') return 'Kutilmoqda';
  if (status === 'rejected') return 'Rad etilgan';
  return status || '-';
};

const getItemKey = (item, index) => `${item.type || 'item'}-${item.id || item._id || index}`;

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-sm text-slate-800 mt-0.5 break-words">{value ?? '-'}</p>
  </div>
);

const StatistikaDetailModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ marginTop: 0 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Amal tafsilotlari</h3>
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${typeBadgeClass(item.type)}`}>
              {typeLabel(item.type)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Close sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="ID" value={item.id || item._id} />
          <div>
            <p className="text-xs text-slate-400">Holat</p>
            {item.status ? (
              <span className={`inline-flex mt-1 px-2 py-0.5 rounded-lg text-xs ${statusBadgeClass(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            ) : (
              <p className="text-sm text-slate-800 mt-0.5">-</p>
            )}
          </div>
          <DetailRow label="Yaratilgan sana" value={formatDateTime(item.createdAt)} />
          <DetailRow label="Yangilangan sana" value={formatDateTime(item.updatedAt)} />
          <DetailRow label="Maxsulot" value={item.product?.name} />
          <DetailRow label="Kelib chiqishi" value={item.product?.origin} />
          <DetailRow label="Omborchi" value={formatPerson(item.omborchi)} />
          <DetailRow label="Omborchi telefoni" value={item.omborchi?.phone} />
          <DetailRow label="Manba ombor" value={formatOmbor(item.ombor)} />
          <DetailRow label="Manzil ombor" value={formatOmbor(item.recipientOmbor)} />
          <DetailRow label="Mashina raqami" value={item.truckNumber} />
          <DetailRow label="Sof og'irlik" value={formatWeight(item.netWeight, item.weightUnit)} />
          <DetailRow label="Umumiy og'irlik" value={formatWeight(item.grossWeight, item.weightUnit)} />
          <DetailRow label="Tara og'irligi" value={formatWeight(item.tareWeight, item.weightUnit)} />
          <DetailRow label="O'lchov birligi" value={item.weightUnit || 'kg'} />
          <div className="sm:col-span-2">
            <DetailRow label="Izoh" value={item.notes || '-'} />
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

const StatistikaCard = ({ item, onView }) => (
  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${typeBadgeClass(item.type)}`}>
          {typeLabel(item.type)}
        </span>
        <p className="font-medium text-slate-900 mt-2 truncate">{item.product?.name || '-'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(item.createdAt)}</p>
      </div>
      <p className="text-sm font-semibold text-slate-800 shrink-0">
        {formatWeight(item.netWeight, item.weightUnit)}
      </p>
    </div>
    <button
      type="button"
      onClick={() => onView(item)}
      className="w-full px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center justify-center gap-1.5 text-sm"
    >
      <Visibility sx={{ fontSize: 16 }} />
      Ko'rish
    </button>
  </div>
);

const StatistikaTableRow = ({ item, onView }) => (
  <tr className="border-b border-slate-100 text-sm hover:bg-slate-50/60">
    <td className="py-3 pr-3 whitespace-nowrap">
      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${typeBadgeClass(item.type)}`}>
        {typeLabel(item.type)}
      </span>
    </td>
    <td className="py-3 pr-3 text-slate-700 whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
    <td className="py-3 pr-3 text-slate-800">{item.product?.name || '-'}</td>
    <td className="py-3 pr-3 text-slate-700">{formatPerson(item.omborchi)}</td>
    <td className="py-3 pr-3 text-slate-800 font-medium whitespace-nowrap">{formatWeight(item.netWeight, item.weightUnit)}</td>
    <td className="py-3 pr-3 whitespace-nowrap text-right">
      <button
        type="button"
        onClick={() => onView(item)}
        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1"
      >
        <Visibility sx={{ fontSize: 16 }} />
        Ko'rish
      </button>
    </td>
  </tr>
);

const Statistika = () => {
  const { showError, showSuccess, showInfo } = useSnackbar();
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const exportAbortRef = useRef(false);

  const [omborlar, setOmborlar] = useState([]);
  const [omborchilar, setOmborchilar] = useState([]);
  const [maxsulotlar, setMaxsulotlar] = useState([]);

  const omborchiOptions = useMemo(
    () =>
      omborchilar.map((item) => ({
        value: item.id || item._id,
        label: formatPerson(item),
      })),
    [omborchilar]
  );

  const omborOptions = useMemo(
    () =>
      omborlar.map((item) => ({
        value: item.id || item._id,
        label: item.name,
      })),
    [omborlar]
  );

  const maxsulotOptions = useMemo(
    () =>
      maxsulotlar.map((item) => ({
        value: item.id || item._id,
        label: item.name,
      })),
    [maxsulotlar]
  );

  const loadFilterOptions = useCallback(async () => {
    const results = await Promise.allSettled([
      omborAPI.getAll(),
      omborchiAPI.getAll(),
      maxsulotAPI.getAll(),
    ]);
    if (results[0].status === 'fulfilled') setOmborlar(results[0].value?.data || []);
    if (results[1].status === 'fulfilled') setOmborchilar(results[1].value?.data || []);
    if (results[2].status === 'fulfilled') setMaxsulotlar(results[2].value?.data || []);
  }, []);

  const buildParams = useCallback(
    (source) => ({
      ...buildFilterParams(source, activeTab),
      page: source.page,
      limit: source.limit,
      includeSummary: source.includeSummary,
    }),
    [activeTab]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tab = TABS.find((t) => t.id === activeTab) || TABS[0];
      const params = buildParams(appliedFilters);
      const result = await tab.fetch(params);
      setResponse(result);
    } catch (error) {
      showError(error.message || "Statistikani olib bo'lmadi");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, appliedFilters, buildParams, showError]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      exportAbortRef.current = true;
    };
  }, []);

  const pollAndDownloadExport = useCallback(
    async (jobId) => {
      const maxAttempts = 90;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (exportAbortRef.current) return;

        const statusRes = await statistikaAPI.getExportStatus(jobId);
        const job = statusRes?.data ?? statusRes;
        const status = job?.status || 'pending';
        const ready = Boolean(job?.ready) || status === 'completed';

        setExportStatus({
          jobId,
          status,
          message: EXPORT_STATUS_LABELS[status] || status,
        });

        if (status === 'failed') {
          throw new Error(job?.message || job?.error || 'Export muvaffaqiyatsiz tugadi');
        }

        if (ready) {
          const { blob, filename } = await statistikaAPI.downloadExport(jobId);
          triggerFileDownload(blob, filename);
          showSuccess('Excel fayl yuklab olindi');
          setExportStatus(null);
          return;
        }

        await sleep(2000);
      }

      throw new Error("Export vaqti tugadi. Keyinroq qayta urinib ko'ring.");
    },
    [showSuccess]
  );

  const handleExport = async () => {
    if (exporting) return;

    exportAbortRef.current = false;
    setExporting(true);
    setExportStatus({ status: 'pending', message: "So'rov yuborilmoqda..." });

    try {
      const scope = TAB_TO_SCOPE[activeTab] || 'all';
      const filters = buildFilterParams(appliedFilters, activeTab);

      showInfo('Excel export boshlandi...');
      const result = await statistikaAPI.startExport({ scope, filters });
      const jobId = result?.data?.jobId;

      if (!jobId) {
        throw new Error('Export job ID topilmadi');
      }

      await pollAndDownloadExport(jobId);
    } catch (error) {
      showError(error.message || 'Excel exportda xatolik');
      setExportStatus(null);
    } finally {
      setExporting(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters, page: 1 });
  };

  const handleResetFilters = () => {
    const defaults = emptyFilters();
    setFilters(defaults);
    setAppliedFilters(defaults);
  };

  const handleOmborIdsChange = (nextIds) => {
    setFilters((prev) => ({ ...prev, omborIds: nextIds, page: 1 }));
    setAppliedFilters((prev) => ({ ...prev, omborIds: nextIds, page: 1 }));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setAppliedFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setAppliedFilters((prev) => ({ ...prev, page }));
    setFilters((prev) => ({ ...prev, page }));
  };

  const setQuickDateRange = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFilters((prev) => ({
      ...prev,
      from: formatDateInput(from),
      to: formatDateInput(to),
    }));
  };

  const toggleType = (type) => {
    setFilters((prev) => {
      const exists = prev.selectedTypes.includes(type);
      return {
        ...prev,
        selectedTypes: exists
          ? prev.selectedTypes.filter((t) => t !== type)
          : [...prev.selectedTypes, type],
      };
    });
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewItem = (item) => setSelectedItem(item);
  const handleCloseDetail = () => setSelectedItem(null);

  const summary = response?.summary;
  const items = response?.data || [];
  const pagination = response?.pagination;
  const totalCount = pagination?.total ?? summary?.totalCount ?? response?.count ?? items.length;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Statistika</h2>
        <p className="text-sm text-slate-500 mt-1">
          Kirim, chiqim va qabul qilingan transferlar bo'yicha hisobotlar. `/all` da barcha turlar default ko'rinadi.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Ombor bo&apos;yicha
            </label>
            <MultiSelect
              value={appliedFilters.omborIds}
              onChange={handleOmborIdsChange}
              options={omborOptions}
              placeholder="Barcha omborlar"
              emptyText="Ombor topilmadi"
              searchable
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`w-full lg:w-auto shrink-0 px-4 py-2.5 rounded-xl border inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FilterList sx={{ fontSize: 20 }} />
            Filtrlar
            <span className={`text-xs ${showFilters ? 'text-indigo-100' : 'text-slate-500'}`}>
              {showFilters ? 'Yashirish' : "Ko'rsatish"}
            </span>
          </button>
        </div>

        {showFilters && (
          <div className="px-4 sm:px-5 pb-5 border-t border-slate-100">
            <div className="flex flex-wrap gap-2 pt-4 pb-2">
              <button
                type="button"
                onClick={() => setQuickDateRange(7)}
                className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Oxirgi 7 kun
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange(30)}
                className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Oxirgi 30 kun
              </button>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, from: '', to: '' }))}
                className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Barcha sanalar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Boshlanish</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => updateFilter('from', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tugash</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => updateFilter('to', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Holat</label>
                <CustomSelect
                  value={filters.status}
                  onChange={(value) => updateFilter('status', value)}
                  options={STATUS_OPTIONS.filter((opt) => opt.value)}
                  placeholder="Barcha holatlar"
                  searchable={false}
                  allowClear
                  clearLabel="Barcha holatlar"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Mashina raqami</label>
                <div className="relative">
                  <Search sx={{ fontSize: 16 }} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={filters.truckNumber}
                    onChange={(e) => updateFilter('truckNumber', e.target.value)}
                    placeholder="01 A 123 BC"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {getOmborchiFilterLabel(activeTab)}
                </label>
                <CustomSelect
                  value={filters.omborchiId}
                  onChange={(value) => updateFilter('omborchiId', value)}
                  options={omborchiOptions}
                  placeholder="Barchasi"
                  emptyText="Omborchi topilmadi"
                  searchable
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Yuboruvchi omborchi</label>
                <CustomSelect
                  value={filters.senderOmborchiId}
                  onChange={(value) => updateFilter('senderOmborchiId', value)}
                  options={omborchiOptions}
                  placeholder="Barchasi"
                  emptyText="Omborchi topilmadi"
                  searchable
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Manzil ombor (chiqim)</label>
                <CustomSelect
                  value={filters.recipientOmborId}
                  onChange={(value) => updateFilter('recipientOmborId', value)}
                  options={omborOptions}
                  placeholder="Barchasi"
                  emptyText="Ombor topilmadi"
                  searchable
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Maxsulot</label>
                <CustomSelect
                  value={filters.productId}
                  onChange={(value) => updateFilter('productId', value)}
                  options={maxsulotOptions}
                  placeholder="Barchasi"
                  emptyText="Maxsulot topilmadi"
                  searchable
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Min sof (kg)</label>
                <input
                  type="number"
                  value={filters.minNetWeight}
                  onChange={(e) => updateFilter('minNetWeight', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max sof (kg)</label>
                <input
                  type="number"
                  value={filters.maxNetWeight}
                  onChange={(e) => updateFilter('maxNetWeight', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Min umumiy (kg)</label>
                <input
                  type="number"
                  value={filters.minGrossWeight}
                  onChange={(e) => updateFilter('minGrossWeight', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max umumiy (kg)</label>
                <input
                  type="number"
                  value={filters.maxGrossWeight}
                  onChange={(e) => updateFilter('maxGrossWeight', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Saralash</label>
                <CustomSelect
                  value={filters.sortBy}
                  onChange={(value) => updateFilter('sortBy', value)}
                  options={SORT_OPTIONS}
                  placeholder="Saralash"
                  searchable={false}
                  allowClear={false}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tartib</label>
                <CustomSelect
                  value={filters.sortOrder}
                  onChange={(value) => updateFilter('sortOrder', value)}
                  options={SORT_ORDER_OPTIONS}
                  placeholder="Tartib"
                  searchable={false}
                  allowClear={false}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Har sahifada</label>
                <CustomSelect
                  value={filters.limit}
                  onChange={(value) => updateFilter('limit', Number(value))}
                  options={LIMIT_OPTIONS}
                  placeholder="20"
                  searchable={false}
                  allowClear={false}
                />
              </div>
            </div>

            {activeTab === 'all' && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Turlar (faqat &quot;Barchasi&quot; tabi uchun). Bo'sh qoldirilsa — kirim, chiqim va qabul barchasi.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((opt) => {
                    const checked = filters.selectedTypes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleType(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          checked
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Tozalash
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Qo'llash
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="overflow-x-auto flex-1 min-w-0">
            <div className="flex gap-1 min-w-max sm:min-w-0 sm:flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || exporting}
              className="px-3 sm:px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileDownload sx={{ fontSize: 18 }} className={exporting ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading || exporting}
              className="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Refresh sx={{ fontSize: 18 }} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Yangilash</span>
            </button>
          </div>
        </div>
        <p className="px-2 sm:px-3 pb-2 text-xs text-slate-500">{TAB_HINTS[activeTab]}</p>
        {exportStatus && (
          <div className="mx-2 sm:mx-3 mb-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-800 flex items-center gap-2">
            <Refresh sx={{ fontSize: 16 }} className="animate-spin shrink-0" />
            <span>Excel: {exportStatus.message}</span>
          </div>
        )}
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-sm text-slate-500">Jami yozuvlar</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {summary.totalCount?.toLocaleString('uz-UZ') ?? 0}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-sm text-slate-500">Sof og'irlik (tonna)</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {summary.totalNetWeightTon?.toLocaleString('uz-UZ') ?? 0}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-sm text-slate-500">Sof og'irlik (kg)</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {summary.totalNetWeightKg?.toLocaleString('uz-UZ') ?? 0}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p className="text-sm text-slate-500">Umumiy og'irlik (kg)</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {summary.totalGrossWeightKg?.toLocaleString('uz-UZ') ?? 0}
              </p>
            </div>
          </div>

          {summary.byType && BY_TYPE_ORDER.some((key) => summary.byType[key]) && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Turlar bo'yicha yig'indi
                {activeTab !== 'all' && (
                  <span className="font-normal text-slate-500"> — joriy tab turi bo'yicha</span>
                )}
              </p>
              <div className={`grid grid-cols-1 gap-4 ${BY_TYPE_ORDER.filter((k) => summary.byType[k]).length > 1 ? 'sm:grid-cols-3' : 'sm:grid-cols-1 max-w-sm'}`}>
                {BY_TYPE_ORDER.filter((key) => summary.byType[key]).map((key) => {
                  const value = summary.byType[key];
                  return (
                    <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${typeBadgeClass(key)}`}>
                        {typeLabel(key)}
                      </span>
                      <p className="text-xl font-semibold text-slate-900 mt-2">{value.count ?? 0} ta</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {(value.netWeightKg ?? 0).toLocaleString('uz-UZ')} kg
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm text-slate-500">
            Ko'rsatilmoqda: <span className="font-medium text-slate-800">{items.length}</span> ta
            {totalCount > items.length ? ` · Jami: ${totalCount} ta` : ''}
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p>Ma'lumot topilmadi</p>
            <p className="text-xs mt-2 text-slate-400">
              Filtrlarni tozalang yoki &quot;Barcha sanalar&quot; tugmasini bosing
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {items.map((item, index) => (
                <StatistikaCard key={getItemKey(item, index)} item={item} onView={handleViewItem} />
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-3">Tur</th>
                    <th className="py-3 pr-3">Sana</th>
                    <th className="py-3 pr-3">Maxsulot</th>
                    <th className="py-3 pr-3">Omborchi</th>
                    <th className="py-3 pr-3">Sof (kg)</th>
                    <th className="py-3 pr-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <StatistikaTableRow
                      key={getItemKey(item, index)}
                      item={item}
                      onView={handleViewItem}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {pagination.page} / {pagination.totalPages} sahifa · Jami {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1"
              >
                <ChevronLeft sx={{ fontSize: 18 }} />
                Oldingi
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1"
              >
                Keyingi
                <ChevronRight sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <StatistikaDetailModal item={selectedItem} onClose={handleCloseDetail} />
      )}
    </div>
  );
};

export default Statistika;
