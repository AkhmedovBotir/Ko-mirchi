import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Warehouse, Refresh } from '@mui/icons-material';
import { authAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';

const Omborlarim = () => {
  const { showError } = useSnackbar();
  const [ombors, setOmbors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getOmborchiOmbors();
      setOmbors(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      showError(error.message || "Omborlarni yuklab bo'lmadi");
      setOmbors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Omborlarim</h2>
        <p className="text-sm text-slate-500 mt-1">Sizga biriktirilgan omborlar ro'yxati.</p>
        <div className="mt-4">
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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Warehouse className="text-indigo-600" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Biriktirilgan omborlar</h3>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Yuklanmoqda...</p>
        ) : ombors.length === 0 ? (
          <p className="text-sm text-slate-500">Sizga biriktirilgan omborlar topilmadi.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ombors.map((ombor) => (
              <li
                key={ombor._id || ombor.id}
                className="flex items-center gap-3 py-3 sm:py-4 first:pt-0 last:pb-0"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                  <Warehouse sx={{ fontSize: 22 }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                    {ombor.name || "Noma'lum ombor"}
                  </p>
                  {ombor.createdAt && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Qo'shilgan: {new Date(ombor.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
};

export default Omborlarim;
