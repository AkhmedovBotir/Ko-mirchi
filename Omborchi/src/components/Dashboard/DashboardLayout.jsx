import { Outlet, useLocation } from 'react-router-dom';
import {
  Inventory2,
  Outbox,
  Inbox,
  BarChart,
  Menu as MenuIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import OmborSwitcher from './OmborSwitcher';
import StockBalanceBadge from './StockBalanceBadge';
import { useSidebar } from '../../contexts/SidebarContext';

const DashboardLayout = () => {
  const { isOpen, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();

  const isKirimlarPage =
    location.pathname === '/dashboard/kirimlar' ||
    location.pathname === '/dashboard' ||
    location.pathname === '/dashboard/';
  const isKelayotganKirimlarPage = location.pathname.startsWith('/dashboard/kelayotgan-kirimlar');
  const isChiqimlarPage = location.pathname.startsWith('/dashboard/chiqimlar');
  const isStatistikaPage = location.pathname.startsWith('/dashboard/statistika');

  const title = isKirimlarPage
    ? 'Kirimlar'
    : isKelayotganKirimlarPage
        ? 'Kelayotgan kirimlar'
        : isChiqimlarPage
          ? 'Chiqimlar'
          : isStatistikaPage
            ? 'Statistika'
            : 'Dashboard';

  const subtitle = isKirimlarPage
    ? "Omborchining kirim ma'lumotlari"
    : isKelayotganKirimlarPage
        ? "Boshqa omborchilardan kelayotgan kirimlarni qabul yoki bekor qilish"
        : isChiqimlarPage
          ? "Ombordan chiqim va oluvchi ma'lumotlari"
          : isStatistikaPage
            ? "Kirim, chiqim va transferlar bo'yicha umumiy tarix"
            : "Boshqaruv panelining asosiy bo'limi";

  const HeaderIcon = isChiqimlarPage
    ? Outbox
    : isKelayotganKirimlarPage
      ? Inbox
      : isStatistikaPage
        ? BarChart
        : Inventory2;

  const mainMarginLeft = isMobile ? 0 : isOpen ? 288 : 84;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100">
      <Sidebar />
      <main
        className="flex flex-col flex-1 min-w-0 h-full overflow-hidden transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: mainMarginLeft }}
      >
        <header className="shrink-0 z-40 px-3 sm:px-4 md:px-6 py-2 sm:py-4 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-stretch sm:items-center gap-1.5 sm:gap-3 min-w-0">
            {isMobile && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="shrink-0 self-center p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                aria-label="Menyuni ochish"
              >
                <MenuIcon fontSize="small" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                <HeaderIcon fontSize="small" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-slate-900 truncate leading-tight">{title}</h1>
                <p className="text-xs text-slate-500 truncate">{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-1 sm:flex-none items-stretch gap-1.5 sm:gap-2 min-w-0">
              <StockBalanceBadge />
              <OmborSwitcher />
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
