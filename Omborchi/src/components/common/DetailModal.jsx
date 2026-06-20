const DetailModal = ({ open, title, rows, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ marginTop: '0' }}>
      <div className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((row) => (
            <div key={row.label} className={row.fullWidth ? 'sm:col-span-2' : ''}>
              <dt className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{row.label}</dt>
              <dd className="text-sm font-medium text-slate-900 mt-1 break-words">{row.value ?? '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
