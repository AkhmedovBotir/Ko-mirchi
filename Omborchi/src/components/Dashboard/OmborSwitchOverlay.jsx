import { AnimatePresence, motion } from 'framer-motion';
import { Warehouse } from '@mui/icons-material';
import { useOmbor } from '../../contexts/OmborContext';

const OmborSwitchOverlay = () => {
  const { switching, switchingOmborName } = useOmbor();

  return (
    <AnimatePresence>
      {switching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/55 backdrop-blur-[3px] px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="ombor-switch-title"
          aria-busy="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 sm:p-8 text-center"
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <Warehouse sx={{ fontSize: 28 }} className="text-indigo-600 animate-pulse" />
            </div>

            <div className="mx-auto mb-4 w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />

            <h2 id="ombor-switch-title" className="text-base sm:text-lg font-semibold text-slate-900">
              Ombor ma&apos;lumotlari almashtirilmoqda
            </h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {switchingOmborName ? (
                <>
                  <span className="font-medium text-indigo-600">{switchingOmborName}</span> ombori
                  uchun ma&apos;lumotlar yuklanmoqda. Iltimos, kuting...
                </>
              ) : (
                <>Tanlangan ombor uchun ma&apos;lumotlar yuklanmoqda. Iltimos, kuting...</>
              )}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OmborSwitchOverlay;
