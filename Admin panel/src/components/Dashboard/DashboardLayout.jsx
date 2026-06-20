import { Outlet, useLocation } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  Dashboard,
  AdminPanelSettings,
  People,
  Warehouse,
  Person,
  Inventory2,
  Menu as MenuIcon,
  BarChart,
  Assignment,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';

const DashboardLayout = () => {
  const { isOpen, isMobile, toggleDrawer } = useSidebar();
  const { admin } = useAuth();
  const location = useLocation();
  const displayName =
    admin?.fullName ||
    admin?.fullname ||
    [admin?.firstName, admin?.lastName].filter(Boolean).join(' ').trim() ||
    admin?.name ||
    admin?.username ||
    'Admin';
  const isAdminsPage = location.pathname.startsWith('/dashboard/admins');
  const isOmborlarPage = location.pathname.startsWith('/dashboard/omborlar');
  const isOmborchilarPage = location.pathname.startsWith('/dashboard/omborchilar');
  const isMaxsulotlarPage = location.pathname.startsWith('/dashboard/maxsulotlar');
  const isStatistikaPage = location.pathname.startsWith('/dashboard/statistika');
  const isArizalarPage = location.pathname.startsWith('/dashboard/arizalar');
  const title = isAdminsPage
    ? 'Adminlar'
    : isOmborlarPage
      ? 'Omborlar'
      : isOmborchilarPage
        ? 'Omborchilar'
        : isMaxsulotlarPage
          ? 'Maxsulotlar'
          : isStatistikaPage
            ? 'Statistika'
            : isArizalarPage
              ? 'Arizalar'
            : 'Dashboard';
  const subtitle = isAdminsPage
    ? 'General admin uchun CRUD boshqaruvi'
    : isOmborlarPage
      ? 'Omborlar uchun CRUD boshqaruvi'
      : isOmborchilarPage
        ? 'Omborchilar uchun CRUD va biriktirish boshqaruvi'
        : isMaxsulotlarPage
          ? 'Maxsulotlar uchun CRUD boshqaruvi'
          : isStatistikaPage
            ? 'Kirim, chiqim va transferlar statistikasi'
            : isArizalarPage
              ? 'Omborchilar arizalarini ko\'rib chiqish va qayta ishlash'
            : 'Modern minimal boshqaruv paneli';

  const PageIcon = isAdminsPage
    ? People
    : isOmborlarPage
      ? Warehouse
      : isOmborchilarPage
        ? Person
        : isMaxsulotlarPage
          ? Inventory2
          : isStatistikaPage
            ? BarChart
            : isArizalarPage
              ? Assignment
            : Dashboard;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <Motion.main
        animate={{
          marginLeft: isMobile ? 0 : isOpen ? '288px' : '84px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 h-screen overflow-y-auto w-full min-w-0"
      >
        <div className="sticky top-0 z-40 px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {isMobile && (
                <button
                  type="button"
                  onClick={toggleDrawer}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
                  aria-label="Menyuni ochish"
                >
                  <MenuIcon fontSize="small" />
                </button>
              )}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                <PageIcon fontSize="small" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 truncate">{title}</h1>
                <p className="text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 bg-white border border-slate-200 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
                {(displayName || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight hidden sm:block min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[80px] sm:max-w-[140px] md:max-w-none">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 truncate">{admin?.role || 'admin'}</p>
              </div>
              <AdminPanelSettings className="text-slate-400 hidden sm:block" fontSize="small" />
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
