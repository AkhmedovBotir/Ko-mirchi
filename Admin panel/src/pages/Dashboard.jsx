import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Refresh,
  Inventory2,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Warehouse,
  Category,
  People,
  Person,
  Assignment,
  FilterList,
  Warning,
  CheckCircle,
  Cancel,
  HourglassEmpty,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  adminDashboardAPI,
  omborAPI,
  omborchiAPI,
  maxsulotAPI,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import CustomSelect from '../components/common/CustomSelect';
import { formatKgNumber, formatWeightAsTon } from '../utils/formatWeight';

const CHART_PERIODS = [
  { value: 'kun', label: 'Kunlik', description: 'Oxirgi 30 kun' },
  { value: 'hafta', label: 'Haftalik', description: 'Oxirgi 12 hafta' },
  { value: 'oy', label: 'Oylik', description: 'Oxirgi 12 oy' },
  { value: 'yil', label: 'Yillik', description: 'Oxirgi 5 yil' },
];

const ARIZA_STATUS_LABELS = {
  pending: 'Kutilmoqda',
  reviewing: "Ko'rib chiqilmoqda",
  accepted: 'Qabul qilindi',
  rejected: 'Bekor qilindi',
};

const formatChartLabel = (label, period) => {
  if (!label) return '';
  if (period === 'kun') {
    const parts = label.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
  }
  if (period === 'oy') {
    const parts = label.split('-');
    if (parts.length >= 2) return `${parts[1]}/${parts[0].slice(2)}`;
  }
  if (period === 'hafta' && label.includes('-W')) {
    return label.replace('-W', ' W');
  }
  return label;
};

const formatOmborchiName = (omborchi) => {
  if (!omborchi) return "Noma'lum";
  const name = [omborchi.firstName, omborchi.lastName].filter(Boolean).join(' ').trim();
  return name || omborchi.username || "Noma'lum";
};

const emptyFilters = () => ({
  omborId: '',
  omborchiId: '',
  productId: '',
});

const StatCard = ({ icon: Icon, title, ton, kg, count, accent, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm h-full"
  >
    <div className={`flex items-center gap-2 ${accent}`}>
      <Icon sx={{ fontSize: 18 }} />
      <p className="text-xs uppercase tracking-wide font-semibold">{title}</p>
    </div>
    <p className="text-2xl font-bold text-slate-900 mt-2">{formatWeightAsTon({ kg, ton })} t</p>
    <p className="text-xs text-slate-500 mt-1">{formatKgNumber(kg)} kg</p>
    {count !== undefined && count !== null && (
      <p className="text-xs text-slate-400 mt-1">{count} ta amal</p>
    )}
    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
  </motion.div>
);

const OverviewCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900 mt-1">
          {Number(value ?? 0).toLocaleString('uz-UZ')}
        </p>
      </div>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${accent}`}>
        <Icon sx={{ fontSize: 20 }} />
      </div>
    </div>
  </div>
);

const ArizaStatusRow = ({ label, counts, accent }) => {
  const total = Object.values(counts || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-semibold ${accent}`}>{label}</p>
        <span className="text-xs text-slate-400">{total} jami</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(ARIZA_STATUS_LABELS).map(([key, statusLabel]) => (
          <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-400">{statusLabel}</p>
            <p className="text-lg font-semibold text-slate-800">{counts?.[key] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopList = ({ title, icon: Icon, items, renderName, emptyText }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
  >
    <div className="flex items-center gap-2 mb-4">
      <Icon className="text-indigo-600" />
      <h3 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h3>
    </div>
    {!items?.length ? (
      <p className="text-sm text-slate-500">{emptyText}</p>
    ) : (
      <div className="space-y-3">
        {items.map((item, index) => {
          const id =
            item.ombor?._id ||
            item.ombor?.id ||
            item.omborchi?._id ||
            item.omborchi?.id ||
            index;
          const maxKg = Math.max(...items.map((row) => Number(row.kg) || 0), 1);
          const percent = ((Number(item.kg) || 0) / maxKg) * 100;
          return (
            <div key={id}>
              <div className="flex items-center justify-between gap-2 text-sm mb-1">
                <span className="font-medium text-slate-800 truncate">
                  <span className="text-slate-400 mr-1.5">{index + 1}.</span>
                  {renderName(item)}
                </span>
                <span className="text-slate-600 shrink-0">{formatWeightAsTon(item)} t</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{formatKgNumber(item.kg)} kg</p>
            </div>
          );
        })}
      </div>
    )}
  </motion.div>
);

const Dashboard = () => {
  const { admin } = useAuth();
  const { showError } = useSnackbar();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('kun');
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [omborlar, setOmborlar] = useState([]);
  const [omborchilar, setOmborchilar] = useState([]);
  const [maxsulotlar, setMaxsulotlar] = useState([]);

  const displayName =
    admin?.fullName ||
    admin?.fullname ||
    [admin?.firstName, admin?.lastName].filter(Boolean).join(' ').trim() ||
    admin?.username ||
    'Admin';

  const omborOptions = useMemo(
    () => omborlar.map((item) => ({ value: item.id || item._id, label: item.name })),
    [omborlar]
  );

  const omborchiOptions = useMemo(
    () =>
      omborchilar.map((item) => ({
        value: item.id || item._id,
        label: formatOmborchiName(item),
      })),
    [omborchilar]
  );

  const maxsulotOptions = useMemo(
    () => maxsulotlar.map((item) => ({ value: item.id || item._id, label: item.name })),
    [maxsulotlar]
  );

  const hasActiveFilters = Boolean(
    appliedFilters.omborId || appliedFilters.omborchiId || appliedFilters.productId
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (appliedFilters.omborId) params.omborId = appliedFilters.omborId;
      if (appliedFilters.omborchiId) params.omborchiId = appliedFilters.omborchiId;
      if (appliedFilters.productId) params.productId = appliedFilters.productId;

      const response = await adminDashboardAPI.getDashboard(params);
      setData(response?.data || null);
    } catch (error) {
      showError(error.message || "Dashboard ma'lumotlarini yuklab bo'lmadi");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, showError]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const chartData = useMemo(() => {
    const series = data?.chart?.[chartPeriod];
    if (!Array.isArray(series)) return [];
    return series.map((point) => ({
      label: formatChartLabel(point.label, chartPeriod),
      fullLabel: point.label,
      kirim: Number(point.kirim?.kg) || 0,
      chiqim: Number(point.chiqim?.kg) || 0,
      qabul: Number(point.qabul?.kg) || 0,
    }));
  }, [data, chartPeriod]);

  const overview = data?.overview;
  const stock = data?.stock;
  const totals = data?.totals;
  const arizalar = data?.arizalar;
  const attention = arizalar?.attention;

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    const cleared = emptyFilters();
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <DashboardIcon />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Xush kelibsiz, {displayName}!
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Butun tizim bo&apos;yicha qoldiq, operatsiyalar, arizalar va dinamika.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Refresh sx={{ fontSize: 18 }} className={loading ? 'animate-spin' : ''} />
            Yangilash
          </button>
        </div>
      </motion.div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className="w-full px-4 sm:px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <span className="inline-flex items-center gap-2 font-medium text-slate-800">
            <FilterList sx={{ fontSize: 20 }} />
            Filterlar
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">
                Faol
              </span>
            )}
          </span>
          <span className="text-sm text-slate-500">{showFilters ? 'Yashirish' : "Ko'rsatish"}</span>
        </button>

        {showFilters && (
          <div className="px-4 sm:px-5 pb-5 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ombor</label>
                <CustomSelect
                  value={filters.omborId}
                  onChange={(value) => setFilters((prev) => ({ ...prev, omborId: value }))}
                  options={omborOptions}
                  placeholder="Barcha omborlar"
                  emptyText="Ombor topilmadi"
                  searchable
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Omborchi</label>
                <CustomSelect
                  value={filters.omborchiId}
                  onChange={(value) => setFilters((prev) => ({ ...prev, omborchiId: value }))}
                  options={omborchiOptions}
                  placeholder="Barcha omborchilar"
                  emptyText="Omborchi topilmadi"
                  searchable
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Maxsulot</label>
                <CustomSelect
                  value={filters.productId}
                  onChange={(value) => setFilters((prev) => ({ ...prev, productId: value }))}
                  options={maxsulotOptions}
                  placeholder="Barcha maxsulotlar"
                  emptyText="Maxsulot topilmadi"
                  searchable
                />
              </div>
            </div>
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
                Qo&apos;llash
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <p className="text-sm text-slate-500">Yuklanmoqda...</p>
        </div>
      ) : !data ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <p className="text-sm text-slate-500">Ma&apos;lumot topilmadi.</p>
        </div>
      ) : (
        <>
          {attention?.total > 0 && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/dashboard/arizalar')}
              className="w-full text-left rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 shadow-sm hover:bg-amber-100/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Warning className="text-amber-600 shrink-0" sx={{ fontSize: 22 }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-amber-900">
                    {attention.total} ta ariza ko&apos;rib chiqishni kutmoqda
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    {attention.pending} kutilmoqda · {attention.reviewing} ko&apos;rib chiqilmoqda
                  </p>
                  <p className="text-xs text-amber-700 mt-2">Arizalar sahifasiga o&apos;tish →</p>
                </div>
              </div>
            </motion.button>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <OverviewCard
              icon={People}
              label="Omborchilar"
              value={overview?.omborchilar}
              accent="text-sky-600 bg-sky-50 border-sky-100"
            />
            <OverviewCard
              icon={Warehouse}
              label="Omborlar"
              value={overview?.omborlar}
              accent="text-indigo-600 bg-indigo-50 border-indigo-100"
            />
            <OverviewCard
              icon={Category}
              label="Maxsulotlar"
              value={overview?.maxsulotlar}
              accent="text-violet-600 bg-violet-50 border-violet-100"
            />
            <OverviewCard
              icon={Person}
              label="Omborga biriktirilgan"
              value={overview?.omborchilarWithOmbor}
              accent="text-emerald-600 bg-emerald-50 border-emerald-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-4 sm:p-5 shadow-sm text-white sm:col-span-2 xl:col-span-1"
            >
              <div className="flex items-center gap-2 text-indigo-100">
                <Inventory2 sx={{ fontSize: 18 }} />
                <p className="text-xs uppercase tracking-wide font-semibold">Joriy qoldiq</p>
              </div>
              <p className="text-3xl font-bold mt-2">{formatWeightAsTon(stock?.overall)} t</p>
              <p className="text-sm text-indigo-100 mt-1">{formatKgNumber(stock?.overall?.kg)} kg</p>
              {hasActiveFilters && (
                <p className="text-xs text-indigo-200 mt-2">Filter qo&apos;llangan</p>
              )}
            </motion.div>

            <StatCard
              icon={TrendingUp}
              title="Jami kirim"
              ton={totals?.kirim?.ton}
              kg={totals?.kirim?.kg}
              count={totals?.kirim?.count}
              accent="text-emerald-600"
            />
            <StatCard
              icon={TrendingUp}
              title="To'g'ridan-to'g'ri kirim"
              ton={totals?.directKirim?.ton}
              kg={totals?.directKirim?.kg}
              count={totals?.directKirim?.count}
              accent="text-teal-600"
              subtitle="Transfer emas"
            />
            <StatCard
              icon={TrendingDown}
              title="Jami chiqim"
              ton={totals?.chiqim?.ton}
              kg={totals?.chiqim?.kg}
              count={totals?.chiqim?.count}
              accent="text-indigo-600"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <SwapHoriz className="text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Transferlar holati</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                icon={HourglassEmpty}
                title="Kutilmoqda"
                ton={totals?.transferlar?.pending?.ton}
                kg={totals?.transferlar?.pending?.kg}
                count={totals?.transferlar?.pending?.count}
                accent="text-amber-600"
              />
              <StatCard
                icon={CheckCircle}
                title="Qabul qilingan"
                ton={totals?.transferlar?.accepted?.ton}
                kg={totals?.transferlar?.accepted?.kg}
                count={totals?.transferlar?.accepted?.count}
                accent="text-emerald-600"
              />
              <StatCard
                icon={Cancel}
                title="Rad etilgan"
                ton={totals?.transferlar?.rejected?.ton}
                kg={totals?.transferlar?.rejected?.kg}
                count={totals?.transferlar?.rejected?.count}
                accent="text-rose-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Assignment className="text-slate-600" />
                <h3 className="text-base font-semibold text-slate-900">Arizalar statistikasi</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/arizalar')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Barcha arizalar →
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5">
                <p className="text-sm font-semibold text-indigo-900">Diqqat talab qiladi</p>
                <p className="text-3xl font-bold text-indigo-700 mt-2">{attention?.total ?? 0}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-indigo-400 text-xs">Kutilmoqda</p>
                    <p className="font-semibold text-indigo-900">{attention?.pending ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-indigo-400 text-xs">Ko&apos;rib chiqilmoqda</p>
                    <p className="font-semibold text-indigo-900">{attention?.reviewing ?? 0}</p>
                  </div>
                </div>
              </div>
              <ArizaStatusRow
                label="Kirim arizalari"
                counts={arizalar?.kirim}
                accent="text-emerald-700"
              />
              <ArizaStatusRow
                label="Chiqim arizalari"
                counts={arizalar?.chiqim}
                accent="text-indigo-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <TopList
              title="TOP omborlar (qoldiq)"
              icon={Warehouse}
              items={data?.top?.omborlar}
              renderName={(item) => item.ombor?.name || "Noma'lum"}
              emptyText="Ombor qoldiqlari topilmadi."
            />
            <TopList
              title="TOP omborchilar (qoldiq)"
              icon={People}
              items={data?.top?.omborchilar}
              renderName={(item) => formatOmborchiName(item.omborchi)}
              emptyText="Omborchi qoldiqlari topilmadi."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Warehouse className="text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Ombor bo&apos;yicha qoldiq</h3>
              </div>
              {!stock?.byOmbor?.length ? (
                <p className="text-sm text-slate-500">Ma&apos;lumot yo&apos;q.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {stock.byOmbor.map((item) => {
                    const id = item.ombor?._id || item.ombor?.id;
                    return (
                      <div key={id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-slate-800 truncate">{item.ombor?.name || "Noma'lum"}</span>
                        <span className="text-slate-600 shrink-0 whitespace-nowrap">
                          {formatWeightAsTon(item)} t
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Category className="text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Maxsulot bo&apos;yicha qoldiq</h3>
              </div>
              {!stock?.byProduct?.length ? (
                <p className="text-sm text-slate-500">Ma&apos;lumot yo&apos;q.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {stock.byProduct.map((item) => {
                    const id = item.product?._id || item.product?.id;
                    return (
                      <div key={id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <span className="font-medium text-slate-800 truncate block">
                            {item.product?.name || "Noma'lum"}
                          </span>
                          {item.product?.origin && (
                            <span className="text-xs text-slate-400">{item.product.origin}</span>
                          )}
                        </div>
                        <span className="text-slate-600 shrink-0 whitespace-nowrap">
                          {formatWeightAsTon(item)} t
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <People className="text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Omborchi bo&apos;yicha qoldiq</h3>
              </div>
              {!stock?.byOmborchi?.length ? (
                <p className="text-sm text-slate-500">Ma&apos;lumot yo&apos;q.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {stock.byOmborchi.map((item) => {
                    const id = item.omborchi?._id || item.omborchi?.id;
                    return (
                      <div key={id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-slate-800 truncate">
                          {formatOmborchiName(item.omborchi)}
                        </span>
                        <span className="text-slate-600 shrink-0 whitespace-nowrap">
                          {formatWeightAsTon(item)} t
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Operatsiyalar grafigi</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kirim, chiqim va qabul (kg)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CHART_PERIODS.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setChartPeriod(period.value)}
                    title={period.description}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                      chartPeriod === period.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">Grafik uchun ma&apos;lumot yo&apos;q.</p>
            ) : (
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `${Math.round(v / 1000)}t`}
                      width={40}
                    />
                    <Tooltip
                      formatter={(value) => [`${formatKgNumber(value)} kg`, '']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel || ''}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="kirim" name="Kirim" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="chiqim" name="Chiqim" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="qabul" name="Qabul" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
