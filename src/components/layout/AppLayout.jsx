import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Handshake, Globe, Gavel, ShoppingBag, User, Bell, LogOut, Menu, X, PanelLeft, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../api/services';
import coBrotherLogo from '../../assets/Cobrother_Green.png';
import TechnologyIcon from '../../assets/CoCreation.png';
import CommunityIcon from '../../assets/CoBrother_profileW.png';
import AnimatedLogoutButton from '../common/AnimatedLogoutButton';
import CurrencyDropdown from '../common/CurrencyDropdown';
import LanguageDropdown from '../common/LanguageDropdown';
import HomeFooter from '../common/HomeFooter';
import BackButton from '../common/BackButton';
import { getAppBackTarget } from '../../utils/appNavigation';

const sidebarItems = [
  { icon: Home, labelKey: 'dashboard', to: '/dashboard', isImage: false },
  { icon: Handshake, labelKey: 'coVentures', to: '/ventures', isImage: false },
  { icon: Globe, labelKey: 'domains', to: '/domains', isImage: false },
  { icon: TechnologyIcon, labelKey: 'technology', to: '/cocreation', isImage: true },
  { icon: CommunityIcon, labelKey: 'disruptor', to: '/community', isImage: true },
  { icon: Gavel, labelKey: 'auctions', to: '/auctions', isImage: false },
  { icon: ShoppingBag, labelKey: 'purchases', to: '/purchases', isImage: false },
];

const adminNavItem = { icon: Shield, labelKey: 'navAdminPanel', to: '/admin', isImage: false, adminAccent: true };

function isAdminUser(user) {
  const roleUpper = (user?.role ?? '').toString().toUpperCase();
  return roleUpper === 'ADMIN' || roleUpper === 'ROLE_ADMIN';
}

function getNavItems(user) {
  if (!isAdminUser(user)) return sidebarItems;
  const purchasesIdx = sidebarItems.findIndex((item) => item.to === '/purchases');
  const insertAt = purchasesIdx >= 0 ? purchasesIdx + 1 : sidebarItems.length;
  return [...sidebarItems.slice(0, insertAt), adminNavItem, ...sidebarItems.slice(insertAt)];
}

export default function AppLayout({ children }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navItems = getNavItems(user);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) return saved === 'true';
      return window.innerWidth < 1280;
    }
    return false;
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const backTarget = getAppBackTarget(location.pathname);
  
  const firstName = user?.firstname || user?.firstName || user?.name || user?.email?.split('@')[0] || 'User';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch unread count on mount
  useEffect(() => {
    const fetchCount = () =>
      notificationAPI
        .getUnreadCount()
        .then(({ data }) => setUnreadCount(data.count))
        .catch(() => {});

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const handleBellOpen = async () => {
    if (!bellOpen) {
      try {
        const { data } = await notificationAPI.getRecent();
        setNotifications(Array.isArray(data) ? data : []);
      } catch {}
    }
    setBellOpen((v) => !v);
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await notificationAPI.markOneRead(notification.id);
      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setBellOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      className="h-screen overflow-y-auto overflow-x-hidden bg-gray-50"
      data-app-layout-scroll
    >
      <div className="app-layout-workspace flex w-full items-stretch">
      {/* Desktop Left Sidebar — workspace only; ends above full-width footer */}
      <aside
        className={`app-layout-sidebar hidden lg:flex bg-[#0f0f1a] flex-col flex-shrink-0 self-stretch transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo & Collapse Toggle */}
        <div className={`p-4 border-b border-white/10 flex items-center ${sidebarCollapsed ? 'justify-start' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center">
              <img src={coBrotherLogo} alt="CoBrother" className="brand-nav-logo" />
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="group relative w-10 h-10 rounded-xl bg-[#1e293b] border border-gray-600 text-gray-300 hover:text-white hover:bg-[#334155] hover:border-gray-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] active:scale-95 transition-all duration-200 flex items-center justify-center"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft 
              size={22} 
              className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} 
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            const accent = item.adminAccent;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-all duration-200 ${
                  accent
                    ? active
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-400/30'
                      : 'text-amber-400/90 hover:bg-amber-500/15 hover:text-amber-200 border border-transparent'
                    : active
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                title={sidebarCollapsed ? t(item.labelKey) : ''}
              >
                {item.isImage ? (
                  <img src={item.icon} alt={t(item.labelKey)} className={`w-5 h-5 object-contain brightness-0 invert ${active ? 'opacity-100' : 'opacity-70'}`} />
                ) : (
                  <Icon size={20} className={accent ? (active ? 'text-amber-300' : 'text-amber-400/80') : active ? 'text-indigo-400' : ''} />
                )}
                {!sidebarCollapsed && <span className="font-medium text-sm">{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions - Home, Notification, Update Profile, Logout */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all`}
            title={sidebarCollapsed ? t('Home') : ''}
          >
            <Home size={20} />
            {!sidebarCollapsed && <span className="font-medium text-sm">{t('Home')}</span>}
          </Link>
          <button 
            onClick={handleBellOpen}
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all w-full relative`}
            title={sidebarCollapsed ? t('notifications') : ''}
          >
            <Bell size={20} />
            {!sidebarCollapsed && <span className="font-medium text-sm">{t('notifications')}</span>}
            {unreadCount > 0 && (
              <span className={`bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <Link
            to="/complete-profile"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all`}
            title={sidebarCollapsed ? t('updateProfile') : ''}
          >
            <User size={20} />
            {!sidebarCollapsed && <span className="font-medium text-sm">{t('updateProfile')}</span>}
          </Link>
<div className={`flex ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3'} py-2`}>            <AnimatedLogoutButton onClick={() => setShowLogoutConfirm(true)} label={t('logout')} />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-[#0f0f1a] z-50 flex flex-col">
            {/* Mobile Logo */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <Link to="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
                <img src={coBrotherLogo} alt="CoBrother" className="h-8 w-auto" />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                const accent = item.adminAccent;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      accent
                        ? active
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-400/30'
                          : 'text-amber-400/90 hover:bg-amber-500/15 hover:text-amber-200'
                        : active
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.isImage ? (
                      <img src={item.icon} alt={t(item.labelKey)} className={`w-5 h-5 object-contain ${active ? 'opacity-100' : 'opacity-70'}`} />
                    ) : (
                      <Icon size={20} className={accent ? (active ? 'text-amber-300' : 'text-amber-400/80') : active ? 'text-indigo-400' : ''} />
                    )}
                    <span className="font-medium text-sm">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-white/10 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <Home size={20} />
                <span className="font-medium text-sm">{t('Home')}</span>
              </Link>
              <button 
                onClick={handleBellOpen}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all w-full"
              >
                <Bell size={20} />
                <span className="font-medium text-sm">{t('notifications')}</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <Link
                to="/complete-profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <User size={20} />
{!sidebarCollapsed && <span className="font-medium text-sm">Update Profile</span>}
</Link>

<div className={`flex ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3'} py-2`}>
  <AnimatedLogoutButton onClick={() => setShowLogoutConfirm(true)} label="Logout" />
</div>

</div>
</aside>
        </>
      )}

      {/* Main column: header + page content (footer is outside workspace) */}
      <div className="app-layout-main-column flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-white px-4 py-4 lg:px-8 flex items-center justify-between relative">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 shrink-0"
            >
              <Menu size={24} />
            </button>

            {backTarget && (
              <BackButton to={backTarget.to} label={backTarget.label} className="shrink-0" />
            )}

            <Link to="/" className="lg:hidden flex items-center shrink-0">
              <img src={coBrotherLogo} alt="CoBrother" className="brand-nav-logo" />
            </Link>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <LanguageDropdown variant="light" />
            <CurrencyDropdown variant="light" />
            {/* Working Bell Icon with Notification Panel */}
            <div className="relative" ref={bellRef}>
              <button 
                onClick={handleBellOpen}
                className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {bellOpen && (
                <div className="absolute top-full right-0 mt-2 w-[360px] bg-white border border-gray-200 rounded-xl shadow-2xl z-[1000] overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-sm text-gray-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        className="text-xs text-gray-500 hover:text-gray-700"
                        onClick={handleMarkAllRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[380px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                            {notification.type?.includes('VENTURE') ? '🤝' : 
                             notification.type?.includes('DOMAIN') ? '🌐' : 
                             notification.type?.includes('AUCTION') ? '🔨' : '🔔'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 mb-0.5">
                              {notification.title}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {notification.message}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {timeAgo(notification.createdAt)}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setBellOpen(false)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{firstName}</p>
                <p className="text-xs text-gray-500">{user?.role || 'USER'}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="app-layout-scroll-body flex flex-1 flex-col bg-gray-50 min-w-0">
          <div className="app-main-content min-w-0 max-w-[100%] flex-1 p-4 sm:p-5 lg:p-6 xl:p-8">
            {children}
          </div>
        </div>
      </div>
      </div>

      <div className="app-layout-footer-spacer h-16 shrink-0 lg:h-24" aria-hidden="true" />

      <HomeFooter />

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 text-sm mb-6">Are you sure you want to logout?</p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                className="w-full sm:flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <AnimatedLogoutButton onClick={handleLogout} label="Logout" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
