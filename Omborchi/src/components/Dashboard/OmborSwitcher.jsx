import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, KeyboardArrowDown, Warehouse } from '@mui/icons-material';
import { useOmbor } from '../../contexts/OmborContext';
import { getOmborId } from '../../utils/omborUtils';

const triggerClass =
  'w-full h-full min-h-[2.625rem] sm:min-h-[2.75rem] rounded-xl border border-slate-200 pl-8 pr-8 sm:pl-9 sm:pr-9 py-1.5 sm:py-2 bg-slate-50 text-slate-800 text-left outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 transition-colors hover:bg-white flex flex-col justify-center';

const OmborSwitcher = () => {
  const { ombors, selectedOmborId, setSelectedOmborId, loading, hasOmbors, selectedOmbor, switching } =
    useOmbor();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (switching) {
      setIsOpen(false);
    }
  }, [switching]);

  const handleSelect = (omborId) => {
    setSelectedOmborId(omborId);
    setIsOpen(false);
  };

  const placeholder = useMemo(() => {
    if (loading) return '...';
    if (!hasOmbors) return "Ombor yo'q";
    return 'Tanlang';
  }, [loading, hasOmbors]);

  const displayName = selectedOmbor?.name || placeholder;

  const isDisabled = loading || !hasOmbors || switching;

  return (
    <div ref={containerRef} className="relative flex-[1.15] min-w-0 sm:flex-none sm:min-w-[11rem] sm:max-w-[16rem]">
      <Warehouse
        sx={{ fontSize: 16 }}
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none z-10"
      />

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && setIsOpen((prev) => !prev)}
        className={`${triggerClass} ${!hasOmbors ? 'border-amber-200 bg-amber-50 text-amber-700' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Omborni tanlash"
      >
        <span className="block text-xs sm:text-sm font-semibold truncate leading-tight pr-1">
          {displayName}
        </span>
        <span className="block text-[10px] sm:text-[11px] text-slate-500 leading-tight truncate">
          Ombor
        </span>
      </button>

      <KeyboardArrowDown
        sx={{ fontSize: 16 }}
        className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`}
      />

      <AnimatePresence>
        {isOpen && hasOmbors && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-1.5rem,18rem)] sm:w-full sm:min-w-[12rem] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            role="listbox"
            aria-label="Omborlar ro'yxati"
          >
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Ombor tanlash</p>
            </div>
            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
              {ombors.map((ombor) => {
                const id = getOmborId(ombor);
                const isActive = id === String(selectedOmborId);

                return (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(id)}
                    className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex-1 truncate">{ombor.name}</span>
                    {isActive && <Check sx={{ fontSize: 16 }} className="shrink-0 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OmborSwitcher;
