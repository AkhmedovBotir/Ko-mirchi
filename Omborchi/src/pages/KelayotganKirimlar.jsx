import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Refresh, CheckCircle, Cancel } from '@mui/icons-material';
import { omborchiKelayotganKirimAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useOmbor } from '../contexts/OmborContext';
import { filterByRecipientOmbor } from '../utils/omborUtils';
import DetailModal from '../components/common/DetailModal';
import ViewDetailButton from '../components/common/ViewDetailButton';

const STATUS_FILTERS = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'accepted', label: 'Qabul qilingan' },
  { value: 'rejected', label: 'Bekor qilingan' },
];

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

const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
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
    case 'accepted':
      return 'Qabul qilingan';
    case 'rejected':
      return 'Bekor qilingan';
    default:
      return status || '-';
  }
};

const KelayotganKirimlar = () => {
  const { showSuccess, showError } = useSnackbar();
  const { selectedOmborId, selectedOmbor, completeOmborSwitch } = useOmbor();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const loadData = async (status = statusFilter) => {
    setLoading(true);
    try {
      const response = await omborchiKelayotganKirimAPI.getList(status || undefined);
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      showError(error.message || "Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
      completeOmborSwitch();
    }
  };

  useEffect(() => {
    loadData(statusFilter);
  }, [statusFilter, selectedOmborId]);

  const filteredItems = useMemo(
    () => filterByRecipientOmbor(items, selectedOmborId),
    [items, selectedOmborId]
  );

  const handleStatusChange = (status) => {
    setStatusFilter(status);
  };

  const openConfirm = (action, item) => {
    setConfirmAction({ action, item });
  };

  const closeConfirm = () => {
    setConfirmAction(null);
  };

  const getKelayotganDetailRows = (item) => [
    { label: 'Sana', value: item.createdAt ? new Date(item.createdAt).toLocaleString() : '—' },
    { label: 'Yuboruvchi', value: formatOmborchiLabel(item.omborchi) },
    { label: 'Manba ombor', value: item.ombor?.name || '—' },
    { label: 'Manzil ombor', value: item.recipientOmbor?.name || '—' },
    { label: 'Mahsulot', value: item.product?.name || '—' },
    { label: 'Kelib chiqishi', value: item.product?.origin || '—' },
    { label: 'Mashina raqami', value: item.truckNumber || '—' },
    { label: 'Yuk bilan og\'irlik', value: `${formatWeight(item.grossWeight)} kg` },
    { label: 'Bo\'sh og\'irlik', value: `${formatWeight(item.tareWeight)} kg` },
    { label: 'Sof og\'irlik', value: `${formatWeight(item.netWeight)} kg` },
    { label: 'O\'lchov birligi', value: item.weightUnit || 'kg' },
    { label: 'Holat', value: getStatusLabel(item.status) },
    { label: 'Eslatma', value: item.notes || '—', fullWidth: true },
  ];

  const handleConfirm = async () => {
    if (!confirmAction?.item) return;
    const itemId = confirmAction.item._id || confirmAction.item.id;
    setSubmitting(true);
    try {
      if (confirmAction.action === 'qabul') {
        await omborchiKelayotganKirimAPI.qabul(itemId);
        showSuccess(`Kirim qabul qilindi va ${confirmAction.item.recipientOmbor?.name || 'manzil ombor'}ga yozildi`);
      } else {
        await omborchiKelayotganKirimAPI.bekor(itemId);
        showSuccess('Kirim bekor qilindi');
      }
      closeConfirm();
      await loadData(statusFilter);
    } catch (error) {
      showError(error.message || 'Amalni bajarishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Kelayotgan kirimlar</h2>
        <p className="text-sm text-slate-500 mt-1">
          Boshqa omborchilar sizga biriktirilgan omborga yuborgan chiqimlar shu yerda ko&apos;rinadi. Kutilmoqdagilarni qabul yoki bekor qilishingiz mumkin.
          {selectedOmbor && (
            <span className="block mt-1 text-indigo-600 font-medium">
              Manzil ombor: {selectedOmbor.name}
            </span>
          )}
        </p>
        <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value || 'all'}
                type="button"
                onClick={() => handleStatusChange(filter.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => loadData(statusFilter)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 inline-flex items-center justify-center gap-2"
          >
            <Refresh sx={{ fontSize: 18 }} />
            Yangilash
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="text-indigo-600" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Kirimlar ro'yxati</h3>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Yuklanmoqda...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            {items.length > 0
              ? 'Tanlangan ombor uchun kelayotgan kirimlar topilmadi.'
              : 'Kelayotgan kirimlar topilmadi.'}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Sana</th>
                  <th className="py-2 pr-3">Yuboruvchi</th>
                  <th className="py-2 pr-3">Manba</th>
                  <th className="py-2 pr-3">Manzil</th>
                  <th className="py-2 pr-3">Mahsulot</th>
                  <th className="py-2 pr-3">Mashina raqami</th>
                  <th className="py-2 pr-3">Holat</th>
                  <th className="py-2 pr-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id || item.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-3">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-3">{formatOmborchiLabel(item.omborchi)}</td>
                    <td className="py-2 pr-3">{item.ombor?.name || '-'}</td>
                    <td className="py-2 pr-3">{item.recipientOmbor?.name || '-'}</td>
                    <td className="py-2 pr-3">{item.product?.name || '-'}</td>
                    <td className="py-2 pr-3 font-medium">{item.truckNumber || '-'}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <ViewDetailButton onClick={() => setDetailItem(item)} />
                        {item.status === 'pending' ? (
                          <>
                            <button
                            type="button"
                            onClick={() => openConfirm('qabul', item)}
                            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 inline-flex items-center gap-1"
                            title="Qabul qilish"
                          >
                            <CheckCircle sx={{ fontSize: 16 }} />
                            <span className="hidden sm:inline">Qabul</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openConfirm('bekor', item)}
                            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                            title="Bekor qilish"
                          >
                            <Cancel sx={{ fontSize: 16 }} />
                            <span className="hidden sm:inline">Bekor</span>
                          </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <DetailModal
        open={!!detailItem}
        title="Kelayotgan kirim tafsilotlari"
        rows={detailItem ? getKelayotganDetailRows(detailItem) : []}
        onClose={() => setDetailItem(null)}
      />

      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ marginTop: '0' }}>
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {confirmAction.action === 'qabul' ? 'Kirimni qabul qilish' : 'Kirimni bekor qilish'}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {confirmAction.action === 'qabul'
                ? `${formatOmborchiLabel(confirmAction.item.omborchi)} yuborgan ${confirmAction.item.product?.name || 'mahsulot'} kirimini ${confirmAction.item.recipientOmbor?.name || 'manzil ombor'}ga qabul qilasizmi?`
                : `${formatOmborchiLabel(confirmAction.item.omborchi)} yuborgan kirimni bekor qilasizmi?`}
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className={`px-4 py-2.5 rounded-lg text-white disabled:opacity-50 ${
                  confirmAction.action === 'qabul'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting
                  ? 'Bajarilmoqda...'
                  : confirmAction.action === 'qabul'
                    ? 'Qabul qilish'
                    : 'Bekor qilish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelayotganKirimlar;
