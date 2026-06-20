import { motion, AnimatePresence } from 'framer-motion';
import {
  Inventory2,
  Outbox,
  Inbox,
  BarChart,
  Warehouse,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  ChevronLeft,
  Close,
  Logout,
} from '@mui/icons-material';
import { useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Bosh sahifa',
    icon: DashboardIcon,
    isActive: (pathname) => pathname === '/dashboard' || pathname === '/dashboard/',
  },
  {
    path: '/dashboard/kirimlar',
    label: 'Kirimlar',
    icon: Inventory2,
    isActive: (pathname) =>
      pathname.startsWith('/dashboard/kirimlar') && !pathname.startsWith('/dashboard/kelayotgan-kirimlar'),
  },
  {
    path: '/dashboard/kelayotgan-kirimlar',
    label: 'Kelayotgan kirimlar',
    icon: Inbox,
    isActive: (pathname) => pathname.startsWith('/dashboard/kelayotgan-kirimlar'),
  },
  {
    path: '/dashboard/chiqimlar',
    label: 'Chiqimlar',
    icon: Outbox,
    isActive: (pathname) => pathname.startsWith('/dashboard/chiqimlar'),
  },
  {
    path: '/dashboard/statistika',
    label: 'Statistika',
    icon: BarChart,
    isActive: (pathname) => pathname.startsWith('/dashboard/statistika'),
  },
  {
    path: '/dashboard/omborlarim',
    label: 'Omborlarim',
    icon: Warehouse,
    isActive: (pathname) => pathname.startsWith('/dashboard/omborlarim'),
  },
];

const Sidebar = () => {
  const { isOpen, setIsOpen, isMobile, isMobileOpen, closeMobileSidebar, toggleSidebar } = useSidebar();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const showLabels = isMobile || isOpen;

  useEffect(() => {
    if (isMobile) {
      closeMobileSidebar();
    }
  }, [location.pathname, isMobile, closeMobileSidebar]);

  const displayName = useMemo(() => {
    return (
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
      user?.fullName ||
      user?.fullname ||
      user?.username ||
      'Omborchi'
    );
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      closeMobileSidebar();
    }
  };

  const sidebarBody = (
    <div className="flex flex-col h-full">
      <div
        className={`p-4 border-b border-slate-800 flex items-center ${
          showLabels ? 'justify-between' : 'justify-center'
        }`}
      >
        <AnimatePresence mode="wait">
          {showLabels ? (
            <motion.h2
              key="title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-lg font-semibold whitespace-nowrap text-slate-100"
            >
              Omborchi Panel
            </motion.h2>
          ) : null}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isMobile ? closeMobileSidebar : () => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label={isMobile ? 'Menyuni yopish' : isOpen ? 'Sidebarni yig\'ish' : 'Sidebarni ochish'}
        >
          {isMobile ? <Close /> : isOpen ? <ChevronLeft /> : <MenuIcon />}
        </motion.button>
      </div>

      {showLabels && user && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-semibold shrink-0">
              {(displayName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-slate-100">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role || 'omborchi'}</p>
            </div>
          </div>
        </motion.div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(location.pathname);

            return (
              <div key={item.path} className="mx-2 mb-1">
                <motion.div whileHover={{ x: showLabels ? 4 : 0 }} className="rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center ${
                      showLabels ? 'space-x-3' : 'justify-center'
                    } p-3 rounded-xl transition-colors ${
                      active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="flex-shrink-0" />
                    <AnimatePresence>
                      {showLabels && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium truncate text-sm text-left"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <motion.div whileHover={{ x: showLabels ? 4 : 0 }} className="rounded-xl">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center ${
              showLabels ? 'space-x-3 justify-start' : 'justify-center'
            } p-3 rounded-xl transition-colors bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200`}
          >
            <Logout className="flex-shrink-0" />
            <AnimatePresence>
              {showLabels && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  Chiqish
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {isMobileOpen && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileSidebar}
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-[2px] md:hidden"
              aria-label="Menyuni yopish"
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ x: isMobileOpen ? 0 : -288 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed left-0 top-0 w-[min(288px,88vw)] h-[100dvh] z-50 bg-slate-900 text-white shadow-2xl border-r border-slate-800 md:hidden"
        >
          {sidebarBody}
        </motion.aside>
      </>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 288 : 84 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:block fixed left-0 top-0 h-screen bg-slate-900 text-white shadow-xl z-50 border-r border-slate-800"
    >
      {sidebarBody}
    </motion.aside>
  );
};

export default Sidebar;
