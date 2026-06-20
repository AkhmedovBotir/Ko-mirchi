import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dashboard,
  Refresh,
  Inventory2,
  TrendingUp,
  TrendingDown,
  Inbox,
  Warehouse,
  Category,
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
import { omborchiDashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { formatKgNumber, formatWeightAsTon } from '../utils/formatWeight';

const CHART_PERIODS = [
  { value: 'kun', label: 'Kunlik', description: 'Oxirgi 30 kun' },
  { value: 'hafta', label: 'Haftalik', description: 'Oxirgi 12 hafta' },
  { value: 'oy', label: 'Oylik', description: 'Oxirgi 12 oy' },
  { value: 'yil', label: 'Yillik', description: 'Oxirgi 5 yil' },
];

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

const StatCard = ({ icon: Icon, title, ton, kg, count, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm"
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
  </motion.div>
);

const BoshSahifa = () => {
  const { user } = useAuth();
  const { showError } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('kun');

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.fullName ||
    user?.username ||
    'Omborchi';

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await omborchiDashboardAPI.getDashboard();
      setData(response?.data || null);
    } catch (error) {
      showError(error.message || "Dashboard ma'lumotlarini yuklab bo'lmadi");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const stock = data?.stock;
  const totals = data?.totals;

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
              <Dashboard />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Xush kelibsiz, {displayName}!
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Ombor qoldig&apos;i, operatsiyalar va vaqt bo&apos;yicha dinamika.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Refresh sx={{ fontSize: 18 }} />
            Yangilash
          </button>
        </div>
      </motion.div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
              icon={TrendingDown}
              title="Jami chiqim"
              ton={totals?.chiqim?.ton}
              kg={totals?.chiqim?.kg}
              count={totals?.chiqim?.count}
              accent="text-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              icon={Inbox}
              title="Kelayotgan — kutilmoqda"
              ton={totals?.kelganlar?.pending?.ton}
              kg={totals?.kelganlar?.pending?.kg}
              count={totals?.kelganlar?.pending?.count}
              accent="text-amber-600"
            />
            <StatCard
              icon={Inbox}
              title="Kelayotgan — qabul qilingan"
              ton={totals?.kelganlar?.accepted?.ton}
              kg={totals?.kelganlar?.accepted?.kg}
              count={totals?.kelganlar?.accepted?.count}
              accent="text-sky-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Warehouse className="text-indigo-600" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Omborlar bo&apos;yicha qoldiq</h3>
              </div>
              {!stock?.byOmbor?.length ? (
                <p className="text-sm text-slate-500">Ombor qoldiqlari topilmadi.</p>
              ) : (
                <div className="space-y-3">
                  {stock.byOmbor.map((item) => {
                    const id = item.ombor?._id || item.ombor?.id || item.ombor;
                    const maxKg = Math.max(...stock.byOmbor.map((o) => Number(o.kg) || 0), 1);
                    const percent = ((Number(item.kg) || 0) / maxKg) * 100;
                    return (
                      <div key={id}>
                        <div className="flex items-center justify-between gap-2 text-sm mb-1">
                          <span className="font-medium text-slate-800 truncate">{item.ombor?.name || "Noma'lum"}</span>
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

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Category className="text-indigo-600" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Mahsulotlar bo&apos;yicha qoldiq</h3>
              </div>
              {!stock?.byProduct?.length ? (
                <p className="text-sm text-slate-500">Mahsulot qoldiqlari topilmadi.</p>
              ) : (
                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="w-full min-w-[16rem] text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-200 text-slate-500">
                        <th className="py-2 pr-3">Mahsulot</th>
                        <th className="py-2 pr-3 text-right">Qoldiq</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.byProduct.map((item) => {
                        const id = item.product?._id || item.product?.id;
                        return (
                          <tr key={id} className="border-b border-slate-100 text-slate-700">
                            <td className="py-2 pr-3">
                              <span className="font-medium">{item.product?.name || "Noma'lum"}</span>
                              {item.product?.origin && (
                                <span className="block text-xs text-slate-400">{item.product.origin}</span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-right whitespace-nowrap">
                              <span className="font-semibold">{formatWeightAsTon(item)} t</span>
                              <span className="block text-xs text-slate-400">{formatKgNumber(item.kg)} kg</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
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

export default BoshSahifa;
