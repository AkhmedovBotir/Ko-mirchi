import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyboardArrowDown, Scale } from '@mui/icons-material';
import { omborchiChiqimAPI, omborchiDashboardAPI } from '../../services/api';
import { useOmbor } from '../../contexts/OmborContext';
import { getOmborId } from '../../utils/omborUtils';
import { formatWeight, formatWeightAsTon } from '../../utils/formatWeight';

const triggerClass =
  'w-full h-full min-h-[2.625rem] sm:min-h-[2.75rem] rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 pl-8 pr-7 sm:pl-9 sm:pr-8 py-1.5 sm:py-2 text-left outline-none focus:border-emerald-400 hover:bg-emerald-100/80 transition-colors disabled:cursor-not-allowed disabled:opacity-60 flex flex-col justify-center';

const StockBalanceBadge = () => {
  const location = useLocation();
  const { selectedOmborId, switching, loading: omborLoading } = useOmbor();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [omborStock, setOmborStock] = useState({ kg: 0, ton: 0 });
  const [products, setProducts] = useState([]);
  const containerRef = useRef(null);

  const loadStock = useCallback(async () => {
    if (!selectedOmborId) {
      setOmborStock({ kg: 0, ton: 0 });
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [dashboardRes, productsRes] = await Promise.all([
        omborchiDashboardAPI.getDashboard(),
        omborchiChiqimAPI.getOmborProducts(selectedOmborId),
      ]);

      const stock = dashboardRes?.data?.stock;
      const byOmbor = Array.isArray(stock?.byOmbor) ? stock.byOmbor : [];
      const match = byOmbor.find((item) => getOmborId(item.ombor) === String(selectedOmborId));

      if (match) {
        setOmborStock({ kg: Number(match.kg) || 0, ton: Number(match.ton) || 0 });
      } else if (stock?.overall) {
        setOmborStock({
          kg: Number(stock.overall.kg) || 0,
          ton: Number(stock.overall.ton) || 0,
        });
      } else {
        setOmborStock({ kg: 0, ton: 0 });
      }

      const productList = Array.isArray(productsRes?.data) ? productsRes.data : [];
      setProducts(
        productList.filter((item) => {
          const kg = Number(item?.balance?.kg) || 0;
          return kg > 0;
        })
      );
    } catch {
      setOmborStock({ kg: 0, ton: 0 });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOmborId]);

  useEffect(() => {
    if (omborLoading || switching) return;
    loadStock();
  }, [omborLoading, switching, loadStock, location.pathname]);

  useEffect(() => {
    if (isOpen && !loading && !switching) {
      loadStock();
    }
  }, [isOpen]);

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

  const badgeTon = useMemo(
    () => formatWeightAsTon({ kg: omborStock.kg, ton: omborStock.ton }),
    [omborStock]
  );
  const badgeKg = useMemo(() => formatWeight(omborStock.kg), [omborStock]);
  const isDisabled = omborLoading || switching || loading || !selectedOmborId;

  return (
    <div ref={containerRef} className="relative flex-[0.85] min-w-0 sm:flex-none sm:min-w-[9rem]">
      <Scale
        sx={{ fontSize: 16 }}
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none z-10"
      />

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && setIsOpen((prev) => !prev)}
        className={triggerClass}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Mahsulot qoldiqlari"
      >
        <span className="block text-xs sm:text-sm font-semibold truncate leading-tight">
          {loading ? '...' : `${badgeTon} t`}
        </span>
        <span className="block text-[10px] sm:text-[11px] text-emerald-700/90 leading-tight truncate">
          {loading ? '...' : `${badgeKg} kg`}
        </span>
      </button>

      <KeyboardArrowDown
        sx={{ fontSize: 16 }}
        className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-emerald-600/70 pointer-events-none transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 sm:left-auto sm:right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-1.5rem,18rem)] sm:w-[20rem] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            role="dialog"
            aria-label="Qoldiq ro'yxati"
          >
            <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
              {products.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500 text-center">Qoldiq topilmadi</p>
              ) : (
                products.map((item) => {
                  const productId = item.product?._id || item.product?.id || item.product?.name;
                  const productName = item.product?.name || "Noma'lum mahsulot";
                  const origin = item.product?.origin;
                  const ton = formatWeightAsTon({
                    kg: item.balance?.kg,
                    ton: item.balance?.ton,
                  });
                  const kg = formatWeight(item.balance?.kg);

                  return (
                    <div
                      key={productId}
                      className="px-3 py-2.5 flex items-start justify-between gap-3 border-b border-slate-50 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{productName}</p>
                        {origin && <p className="text-xs text-slate-500 truncate mt-0.5">{origin}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-800">{ton} t</p>
                        <p className="text-[11px] text-slate-500">{kg} kg</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockBalanceBadge;
