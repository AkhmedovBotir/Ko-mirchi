import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Refresh,
  Visibility,
  Close,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Delete,
  Edit,
  Cancel,
  RateReview,
} from '@mui/icons-material';
import {
  adminKirimArizalariAPI,
  adminChiqimArizalariAPI,
  omborchiAPI,
  omborAPI,
  maxsulotAPI,
} from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import CustomSelect from '../components/common/CustomSelect';

const TABS = [
  {
    id: 'kirim',
    label: 'Kirim arizalari',
    hint: 'Omborchilar kirimni tahrirlash yoki o\'chirish uchun yuborgan arizalar.',
    api: adminKirimArizalariAPI,
    recordKey: 'kirim',
  },
  {
    id: 'chiqim',
    label: 'Chiqim arizalari',
    hint: 'Omborchilar chiqimni tahrirlash yoki o\'chirish uchun yuborgan arizalar.',
    api: adminChiqimArizalariAPI,
    recordKey: 'chiqim',
  },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'reviewing', label: "Ko'rib chiqilmoqda" },
  { value: 'accepted', label: 'Qabul qilindi' },
  { value: 'rejected', label: 'Bekor qilindi' },
];

const LIMIT_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

const ACTIVE_STATUSES = ['pending', 'reviewing'];

const formatPerson = (person) => {
  if (!person) return '-';
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
  return name || person.username || '-';
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

const formatWeight = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  return `${Number(value).toLocaleString('uz-UZ')} kg`;
};

const getStatusBadgeClass = (status) => {
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'reviewing') return 'bg-sky-50 text-sky-700 border-sky-200';
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const getStatusLabel = (status) =>
  STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status || '-';

const getActionTakenLabel = (action) => {
  if (action === 'updated') return 'Tahrirlangan';
  if (action === 'deleted') return "O'chirilgan";
  return action || '-';
};

const getRecordLabel = (record, tabId) => {
  if (!record) return '-';
  const product = record.product?.name || '-';
  const truck = record.truckNumber ? ` · ${record.truckNumber}` : '';
  const ombor = record.ombor?.name ? ` · ${record.ombor.name}` : '';
  if (tabId === 'chiqim' && record.recipientOmbor?.name) {
    return `${product}${truck}${ombor} → ${record.recipientOmbor.name}`;
  }
  return `${product}${truck}${ombor}`;
};

const isKirimTransfer = (record) => Boolean(record?.sourceChiqim);

const canProcessAriza = (ariza) => ACTIVE_STATUSES.includes(ariza?.status);

const canUpdateRecord = (ariza, tabId) => {
  const record = ariza?.[tabId === 'kirim' ? 'kirim' : 'chiqim'];
  if (!record) return false;
  if (tabId === 'kirim') return !isKirimTransfer(record);
  return record.status === 'pending';
};

const canDeleteRecord = (ariza, tabId) => canUpdateRecord(ariza, tabId);

const emptyFilters = () => ({
  status: '',
  omborchiId: '',
  page: 1,
  limit: 20,
});

const emptyUpdateForm = () => ({
  product: '',
  truckNumber: '',
  omborId: '',
  recipientOmborId: '',
  grossWeight: '',
  tareWeight: '',
  notes: '',
});

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-sm text-slate-800 mt-0.5 break-words">{value ?? '-'}</p>
  </div>
);

const ArizaProcessModal = ({
  ariza,
  tab,
  omborOptions,
  maxsulotOptions,
  onClose,
  onUpdated,
}) => {
  const { showError, showSuccess } = useSnackbar();
  const [actionMode, setActionMode] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [updateForm, setUpdateForm] = useState(emptyUpdateForm);

  const record = ariza?.[tab.recordKey];
  const processable = canProcessAriza(ariza);
  const allowUpdate = canUpdateRecord(ariza, tab.id);
  const allowDelete = canDeleteRecord(ariza, tab.id);
  const isTransferKirim = tab.id === 'kirim' && isKirimTransfer(record);

  useEffect(() => {
    if (!ariza || !record) return;
    setActionMode(null);
    setRejectionReason('');
    setUpdateForm({
      product: record.product?.id || record.product?._id || '',
      truckNumber: record.truckNumber || '',
      omborId: record.ombor?.id || record.ombor?._id || '',
      recipientOmborId: record.recipientOmbor?.id || record.recipientOmbor?._id || '',
      grossWeight: record.grossWeight ?? '',
      tareWeight: record.tareWeight ?? '',
      notes: record.notes || '',
    });
  }, [ariza, record]);

  if (!ariza) return null;

  const handleReviewing = async () => {
    setProcessing(true);
    try {
      await tab.api.update(ariza.id || ariza._id, { status: 'reviewing' });
      showSuccess('Ariza ko\'rib chiqilmoqda holatiga o\'tkazildi');
      onUpdated();
    } catch (error) {
      showError(error.message || 'Holatni yangilashda xatolik');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptUpdate = async (e) => {
    e.preventDefault();
    const data = {};
    if (updateForm.product) data.product = updateForm.product;
    if (updateForm.truckNumber?.trim()) data.truckNumber = updateForm.truckNumber.trim();
    if (updateForm.omborId) data.omborId = updateForm.omborId;
    if (updateForm.grossWeight !== '') data.grossWeight = Number(updateForm.grossWeight);
    if (updateForm.tareWeight !== '') data.tareWeight = Number(updateForm.tareWeight);
    if (tab.id === 'chiqim') {
      if (updateForm.recipientOmborId) data.recipientOmborId = updateForm.recipientOmborId;
      if (updateForm.notes !== undefined) data.notes = updateForm.notes;
    }

    setProcessing(true);
    try {
      await tab.api.update(ariza.id || ariza._id, {
        status: 'accepted',
        action: 'update',
        data,
      });
      showSuccess('Ariza qabul qilindi va yozuv yangilandi');
      onUpdated();
    } catch (error) {
      showError(error.message || 'Arizani qabul qilishda xatolik');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptDelete = async () => {
    setProcessing(true);
    try {
      await tab.api.update(ariza.id || ariza._id, {
        status: 'accepted',
        action: 'delete',
      });
      showSuccess('Ariza qabul qilindi va yozuv o\'chirildi');
      onUpdated();
    } catch (error) {
      showError(error.message || 'Arizani qabul qilishda xatolik');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const reason = rejectionReason.trim();
    if (!reason) {
      showError('Rad etish sababi kiritilishi shart');
      return;
    }
    setProcessing(true);
    try {
      await tab.api.update(ariza.id || ariza._id, {
        status: 'rejected',
        rejectionReason: reason,
      });
      showSuccess('Ariza rad etildi');
      onUpdated();
    } catch (error) {
      showError(error.message || 'Arizani rad etishda xatolik');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ marginTop: 0 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Ariza tafsilotlari</h3>
            <span
              className={`inline-flex mt-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${getStatusBadgeClass(ariza.status)}`}
            >
              {getStatusLabel(ariza.status)}
            </span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <Close sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Ariza ID" value={ariza.id || ariza._id} />
            <DetailRow label="Yuborilgan sana" value={formatDateTime(ariza.createdAt)} />
            <DetailRow label="Omborchi" value={formatPerson(ariza.omborchi)} />
            <DetailRow label="Omborchi telefoni" value={ariza.omborchi?.phone} />
            {ariza.actionTaken && (
              <DetailRow label="Amal" value={getActionTakenLabel(ariza.actionTaken)} />
            )}
            {ariza.processedAt && (
              <DetailRow label="Qayta ishlangan sana" value={formatDateTime(ariza.processedAt)} />
            )}
            {ariza.rejectionReason && (
              <div className="sm:col-span-2">
                <DetailRow label="Rad etish sababi" value={ariza.rejectionReason} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-800">
              {tab.id === 'kirim' ? 'Kirim' : 'Chiqim'} ma&apos;lumotlari
            </p>
            {isTransferKirim && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Transfer kirim — tahrirlash va o&apos;chirish mumkin emas.
              </p>
            )}
            {record ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailRow label="Maxsulot" value={record.product?.name} />
                <DetailRow label="Ombor" value={record.ombor?.name} />
                {tab.id === 'chiqim' && (
                  <DetailRow label="Manzil ombor" value={record.recipientOmbor?.name} />
                )}
                <DetailRow label="Mashina raqami" value={record.truckNumber} />
                <DetailRow label="Sof og'irlik" value={formatWeight(record.netWeight)} />
                <DetailRow label="Umumiy og'irlik" value={formatWeight(record.grossWeight)} />
                <DetailRow label="Tara og'irligi" value={formatWeight(record.tareWeight)} />
                {tab.id === 'chiqim' && (
                  <>
                    <DetailRow label="Chiqim holati" value={record.status} />
                    <DetailRow label="Izoh" value={record.notes || '-'} />
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Bog&apos;langan yozuv topilmadi</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">Omborchi izohi</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{ariza.note || '-'}</p>
          </div>

          {processable && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-800">Admin amallari</p>

              {ariza.status === 'pending' && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleReviewing}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RateReview sx={{ fontSize: 18 }} />
                  Ko&apos;rib chiqilmoqda
                </button>
              )}

              <div className="flex flex-wrap gap-2">
                {allowUpdate && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => setActionMode(actionMode === 'update' ? null : 'update')}
                    className={`px-4 py-2 rounded-xl border inline-flex items-center gap-2 text-sm ${
                      actionMode === 'update'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <Edit sx={{ fontSize: 16 }} />
                    Qabul — tahrirlash
                  </button>
                )}
                {allowDelete && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => setActionMode(actionMode === 'delete' ? null : 'delete')}
                    className={`px-4 py-2 rounded-xl border inline-flex items-center gap-2 text-sm ${
                      actionMode === 'delete'
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <Delete sx={{ fontSize: 16 }} />
                    Qabul — o&apos;chirish
                  </button>
                )}
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setActionMode(actionMode === 'reject' ? null : 'reject')}
                  className={`px-4 py-2 rounded-xl border inline-flex items-center gap-2 text-sm ${
                    actionMode === 'reject'
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <Cancel sx={{ fontSize: 16 }} />
                  Rad etish
                </button>
              </div>

              {!allowUpdate && !allowDelete && isTransferKirim && (
                <p className="text-xs text-slate-500">
                  Faqat rad etish yoki ko&apos;rib chiqilmoqda holatiga o&apos;tkazish mumkin.
                </p>
              )}

              {actionMode === 'update' && allowUpdate && (
                <form onSubmit={handleAcceptUpdate} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Maxsulot</label>
                    <CustomSelect
                      value={updateForm.product}
                      onChange={(value) => setUpdateForm((p) => ({ ...p, product: value }))}
                      options={maxsulotOptions}
                      placeholder="Maxsulot"
                      searchable
                      allowClear={false}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Mashina raqami</label>
                    <input
                      value={updateForm.truckNumber}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, truckNumber: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Ombor</label>
                    <CustomSelect
                      value={updateForm.omborId}
                      onChange={(value) => setUpdateForm((p) => ({ ...p, omborId: value }))}
                      options={omborOptions}
                      placeholder="Ombor"
                      searchable
                      allowClear={false}
                    />
                  </div>
                  {tab.id === 'chiqim' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Manzil ombor</label>
                      <CustomSelect
                        value={updateForm.recipientOmborId}
                        onChange={(value) => setUpdateForm((p) => ({ ...p, recipientOmborId: value }))}
                        options={omborOptions}
                        placeholder="Manzil ombor"
                        searchable
                        allowClear={false}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Umumiy og&apos;irlik (kg)</label>
                    <input
                      type="number"
                      value={updateForm.grossWeight}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, grossWeight: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tara og&apos;irligi (kg)</label>
                    <input
                      type="number"
                      value={updateForm.tareWeight}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, tareWeight: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    />
                  </div>
                  {tab.id === 'chiqim' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Izoh</label>
                      <textarea
                        value={updateForm.notes}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, notes: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm resize-none"
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={processing}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <CheckCircle sx={{ fontSize: 18 }} />
                      Tahrirlashni tasdiqlash
                    </button>
                  </div>
                </form>
              )}

              {actionMode === 'delete' && allowDelete && (
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 space-y-3">
                  <p className="text-sm text-rose-800">
                    {tab.id === 'kirim' ? 'Kirim' : 'Chiqim'} yozuvi butunlay o&apos;chiriladi. Davom etasizmi?
                  </p>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleAcceptDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Delete sx={{ fontSize: 18 }} />
                    O&apos;chirishni tasdiqlash
                  </button>
                </div>
              )}

              {actionMode === 'reject' && (
                <form onSubmit={handleReject} className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Rad etish sababi</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      required
                      placeholder="Sababni yozing..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Cancel sx={{ fontSize: 18 }} />
                    Rad etishni tasdiqlash
                  </button>
                </form>
              )}
            </div>
          )}
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

const Arizalar = () => {
  const { showError } = useSnackbar();
  const [activeTab, setActiveTab] = useState('kirim');
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState(null);
  const [selectedAriza, setSelectedAriza] = useState(null);
  const [omborchilar, setOmborchilar] = useState([]);
  const [omborlar, setOmborlar] = useState([]);
  const [maxsulotlar, setMaxsulotlar] = useState([]);

  const tab = TABS.find((t) => t.id === activeTab) || TABS[0];

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

  const loadOptions = useCallback(async () => {
    const results = await Promise.allSettled([
      omborchiAPI.getAll(),
      omborAPI.getAll(),
      maxsulotAPI.getAll(),
    ]);
    if (results[0].status === 'fulfilled') setOmborchilar(results[0].value?.data || []);
    if (results[1].status === 'fulfilled') setOmborlar(results[1].value?.data || []);
    if (results[2].status === 'fulfilled') setMaxsulotlar(results[2].value?.data || []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: appliedFilters.page,
        limit: appliedFilters.limit,
      };
      if (appliedFilters.status) params.status = appliedFilters.status;
      if (appliedFilters.omborchiId) params.omborchiId = appliedFilters.omborchiId;

      const result = await tab.api.getAll(params);
      setResponse(result);
    } catch (error) {
      showError(error.message || 'Arizalarni olib bo\'lmadi');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, showError, tab.api]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setAppliedFilters((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({ ...prev, page: 1 }));
    setSelectedAriza(null);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters, page: 1 });
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setAppliedFilters((prev) => ({ ...prev, page }));
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleArizaUpdated = async () => {
    setSelectedAriza(null);
    await loadData();
  };

  const openAriza = async (ariza) => {
    try {
      const fresh = await tab.api.getById(ariza.id || ariza._id);
      setSelectedAriza(fresh?.data ?? fresh);
    } catch (error) {
      showError(error.message || 'Arizani ochib bo\'lmadi');
    }
  };

  const items = response?.data || [];
  const pagination = response?.pagination;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Arizalar</h2>
        <p className="text-sm text-slate-500 mt-1">
          Omborchilar yuborgan kirim va chiqim arizalarini ko&apos;rib chiqish va qayta ishlash.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="overflow-x-auto flex-1 min-w-0">
            <div className="flex gap-1 min-w-max sm:min-w-0 sm:flex-wrap">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            <Refresh sx={{ fontSize: 18 }} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </div>
        <p className="px-2 sm:px-3 pb-2 text-xs text-slate-500">{tab.hint}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Holat</label>
            <CustomSelect
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              options={STATUS_OPTIONS}
              placeholder="Barcha holatlar"
              searchable={false}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Omborchi</label>
            <CustomSelect
              value={filters.omborchiId}
              onChange={(value) => setFilters((prev) => ({ ...prev, omborchiId: value }))}
              options={omborchiOptions}
              placeholder="Barchasi"
              emptyText="Omborchi topilmadi"
              searchable
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Har sahifada</label>
            <CustomSelect
              value={filters.limit}
              onChange={(value) => setFilters((prev) => ({ ...prev, limit: Number(value) }))}
              options={LIMIT_OPTIONS}
              placeholder="20"
              searchable={false}
              allowClear={false}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Qo&apos;llash
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Arizalar topilmadi</div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {items.map((ariza) => (
                <div key={ariza.id || ariza._id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${getStatusBadgeClass(ariza.status)}`}
                      >
                        {getStatusLabel(ariza.status)}
                      </span>
                      <p className="text-sm font-medium text-slate-900 mt-2">
                        {formatPerson(ariza.omborchi)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(ariza.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{ariza.note}</p>
                  <p className="text-xs text-slate-500">
                    {getRecordLabel(ariza[tab.recordKey], tab.id)}
                  </p>
                  <button
                    type="button"
                    onClick={() => openAriza(ariza)}
                    className="w-full px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center justify-center gap-1.5 text-sm"
                  >
                    <Visibility sx={{ fontSize: 16 }} />
                    {canProcessAriza(ariza) ? 'Ko\'rib chiqish' : 'Ko\'rish'}
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-3">Sana</th>
                    <th className="py-3 pr-3">Omborchi</th>
                    <th className="py-3 pr-3">{tab.id === 'kirim' ? 'Kirim' : 'Chiqim'}</th>
                    <th className="py-3 pr-3">Izoh</th>
                    <th className="py-3 pr-3">Holat</th>
                    <th className="py-3 pr-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((ariza) => (
                    <tr key={ariza.id || ariza._id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="py-3 pr-3 text-slate-700 whitespace-nowrap">
                        {formatDateTime(ariza.createdAt)}
                      </td>
                      <td className="py-3 pr-3 text-slate-800">{formatPerson(ariza.omborchi)}</td>
                      <td className="py-3 pr-3 text-slate-700 max-w-[220px] truncate">
                        {getRecordLabel(ariza[tab.recordKey], tab.id)}
                      </td>
                      <td className="py-3 pr-3 text-slate-600 max-w-[200px] truncate">{ariza.note}</td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${getStatusBadgeClass(ariza.status)}`}
                        >
                          {getStatusLabel(ariza.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openAriza(ariza)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1"
                        >
                          <Visibility sx={{ fontSize: 16 }} />
                          {canProcessAriza(ariza) ? 'Ko\'rib chiqish' : 'Ko\'rish'}
                        </button>
                      </td>
                    </tr>
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

      {selectedAriza && (
        <ArizaProcessModal
          ariza={selectedAriza}
          tab={tab}
          omborOptions={omborOptions}
          maxsulotOptions={maxsulotOptions}
          onClose={() => setSelectedAriza(null)}
          onUpdated={handleArizaUpdated}
        />
      )}
    </div>
  );
};

export default Arizalar;
