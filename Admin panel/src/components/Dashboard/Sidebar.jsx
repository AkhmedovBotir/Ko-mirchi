import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import {
  Dashboard as DashboardIcon,
  People,
  Warehouse,
  Person,
  Inventory2,
  Menu as MenuIcon,
  ChevronLeft,
  Close,
  Logout,
  BarChart,
  Assignment,
} from '@mui/icons-material';
import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarContent = ({ expanded, onNavigate, onClose }) => {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const handleNav = (path) => {
    navigate(path);
    onNavigate?.();
  };

  const isDashboardActive = useMemo(() => location.pathname === '/dashboard', [location.pathname]);
  const isAdminsActive = useMemo(() => location.pathname.startsWith('/dashboard/admins'), [location.pathname]);
  const isOmborlarActive = useMemo(() => location.pathname.startsWith('/dashboard/omborlar'), [location.pathname]);
  const isOmborchilarActive = useMemo(() => location.pathname.startsWith('/dashboard/omborchilar'), [location.pathname]);
  const isMaxsulotlarActive = useMemo(() => location.pathname.startsWith('/dashboard/maxsulotlar'), [location.pathname]);
  const isStatistikaActive = useMemo(() => location.pathname.startsWith('/dashboard/statistika'), [location.pathname]);
  const isArizalarActive = useMemo(() => location.pathname.startsWith('/dashboard/arizalar'), [location.pathname]);

  const displayName = useMemo(() => {
    return (
      admin?.fullName ||
      admin?.fullname ||
      [admin?.firstName, admin?.lastName].filter(Boolean).join(' ').trim() ||
      admin?.username ||
      'Admin'
    );
  }, [admin]);

  const navItemClass = (active) =>
    `flex items-center ${expanded ? 'space-x-3' : 'justify-center'} p-3 cursor-pointer rounded-xl transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const NavItem = ({ active, onClick, icon: Icon, label }) => (
    <div className="mx-2 mb-1">
      <motion.div whileHover={{ x: expanded ? 4 : 0 }} className="rounded-lg">
        <div onClick={onClick} className={navItemClass(active)}>
          <Icon className="flex-shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium truncate text-sm"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {expanded && admin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-b border-slate-800"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-semibold">
              {(displayName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-slate-100">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{admin.role}</p>
            </div>
          </div>
        </motion.div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <NavItem
            active={isDashboardActive}
            onClick={() => handleNav('/dashboard')}
            icon={DashboardIcon}
            label="Dashboard"
          />
        </motion.div>

        {admin?.role === 'general' && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <NavItem
              active={isAdminsActive}
              onClick={() => handleNav('/dashboard/admins')}
              icon={People}
              label="Adminlar"
            />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <NavItem
            active={isOmborlarActive}
            onClick={() => handleNav('/dashboard/omborlar')}
            icon={Warehouse}
            label="Omborlar"
          />
        </motion.div>

        {admin?.role === 'general' && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <NavItem
              active={isOmborchilarActive}
              onClick={() => handleNav('/dashboard/omborchilar')}
              icon={Person}
              label="Omborchilar"
            />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <NavItem
            active={isMaxsulotlarActive}
            onClick={() => handleNav('/dashboard/maxsulotlar')}
            icon={Inventory2}
            label="Maxsulotlar"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <NavItem
            active={isStatistikaActive}
            onClick={() => handleNav('/dashboard/statistika')}
            icon={BarChart}
            label="Statistika"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <NavItem
            active={isArizalarActive}
            onClick={() => handleNav('/dashboard/arizalar')}
            icon={Assignment}
            label="Arizalar"
          />
        </motion.div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <motion.div whileHover={{ x: expanded ? 4 : 0 }} className="rounded-xl">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${expanded ? 'space-x-3 justify-start' : 'justify-center'} p-3 rounded-xl transition-colors bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200`}
          >
            <Logout className="flex-shrink-0" />
            <AnimatePresence>
              {expanded && (
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
};

const Sidebar = () => {
  const { isOpen, setIsOpen, isMobile, isDrawerOpen, closeDrawer } = useSidebar();

  useEffect(() => {
    if (isMobile && isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, isDrawerOpen]);

  const handleMobileNavigate = () => {
    if (isMobile) closeDrawer();
  };

  if (isMobile) {
    return (
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 h-screen w-[min(288px,85vw)] bg-slate-900 text-white shadow-2xl z-[70] border-r border-slate-800"
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-100">Admin Panel</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeDrawer}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    aria-label="Menyuni yopish"
                  >
                    <Close />
                  </motion.button>
                </div>
                <SidebarContent expanded onNavigate={handleMobileNavigate} onClose={closeDrawer} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{
        width: isOpen ? '288px' : '84px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-slate-900 text-white h-screen fixed left-0 top-0 shadow-xl z-50 border-r border-slate-800 hidden md:block"
    >
      <div className="flex flex-col h-full">
        <div className={`p-4 border-b border-slate-800 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.h2
                key="title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-lg font-semibold whitespace-nowrap text-slate-100"
              >
                Admin Panel
              </motion.h2>
            ) : null}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label={isOpen ? 'Sidebarni yig‘ish' : 'Sidebarni ochish'}
          >
            {isOpen ? <ChevronLeft /> : <MenuIcon />}
          </motion.button>
        </div>

        <SidebarContent expanded={isOpen} />
      </div>
    </motion.div>
  );
};

export default Sidebar;
