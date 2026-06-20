import { Outlet, useLocation } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import {
  Inventory2,
  Outbox,
  Inbox,
  BarChart,
  Warehouse,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';

const DashboardLayout = () => {
  const { isOpen, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();

  const isHomePage = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
  const isKirimlarPage = location.pathname === '/dashboard/kirimlar';
  const isKelayotganKirimlarPage = location.pathname.startsWith('/dashboard/kelayotgan-kirimlar');
  const isChiqimlarPage = location.pathname.startsWith('/dashboard/chiqimlar');
  const isStatistikaPage = location.pathname.startsWith('/dashboard/statistika');
  const isOmborlarimPage = location.pathname.startsWith('/dashboard/omborlarim');

  const title = isHomePage
    ? 'Bosh sahifa'
    : isKirimlarPage
      ? 'Kirimlar'
      : isKelayotganKirimlarPage
        ? 'Kelayotgan kirimlar'
        : isChiqimlarPage
          ? 'Chiqimlar'
          : isStatistikaPage
            ? 'Statistika'
            : isOmborlarimPage
              ? 'Omborlarim'
              : 'Dashboard';

  const subtitle = isHomePage
    ? "Omborchi boshqaruv panelining asosiy ko'rinishi"
    : isKirimlarPage
      ? "Omborchining kirim ma'lumotlari"
      : isKelayotganKirimlarPage
        ? "Boshqa omborchilardan kelayotgan kirimlarni qabul yoki bekor qilish"
        : isChiqimlarPage
          ? "Ombordan chiqim va oluvchi ma'lumotlari"
          : isStatistikaPage
            ? "Kirim, chiqim va transferlar bo'yicha umumiy tarix"
            : isOmborlarimPage
              ? "Sizga biriktirilgan omborlar ro'yxati"
              : "Boshqaruv panelining asosiy bo'limi";

  const HeaderIcon = isHomePage
    ? DashboardIcon
    : isChiqimlarPage
      ? Outbox
      : isKelayotganKirimlarPage
        ? Inbox
        : isStatistikaPage
          ? BarChart
          : isOmborlarimPage
            ? Warehouse
            : Inventory2;

  const mainMarginLeft = isMobile ? 0 : isOpen ? 288 : 84;

  return (
    <div className="flex min-h-[100dvh] bg-slate-100">
      <Sidebar />
      <Motion.main
        animate={{ marginLeft: mainMarginLeft }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 min-h-[100dvh] w-full min-w-0 overflow-y-auto overflow-x-hidden"
      >
        <div className="sticky top-0 z-30 px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 min-w-0">
            {isMobile && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="shrink-0 p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                aria-label="Menyuni ochish"
              >
                <MenuIcon fontSize="small" />
              </button>
            )}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <HeaderIcon fontSize="small" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-slate-900 truncate">{title}</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-1">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </div>
      </Motion.main>
    </div>
  );
};

export default DashboardLayout;
