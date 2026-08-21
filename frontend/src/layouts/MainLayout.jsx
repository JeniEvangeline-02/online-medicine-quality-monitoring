import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearchModal from '../components/GlobalSearchModal';
import {
  LayoutDashboard,
  Bell,
  Pill,
  Syringe,
  Boxes,
  Truck,
  Building2,
  Microscope,
  Scale,
  Zap,
  Network,
  Warehouse,
  Container,
  Lock,
  AlertOctagon,
  Wrench,
  Bot,
  BarChart3,
  FileSpreadsheet,
  Users,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  ShieldCheck,
  Menu,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const NAV = [
  {
    group: 'MAIN',
    items: [
      { 
        label: 'Command Center', 
        path: '/dashboard', 
        icon: LayoutDashboard, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL', 'SUPPLIER'] 
      },
    ],
  },
  {
    group: 'SUPPLY & INVENTORY',
    items: [
      { 
        label: 'Medicines', 
        path: '/medicines', 
        icon: Pill, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL'] 
      },
      { 
        label: 'Consumables', 
        path: '/consumables', 
        icon: Syringe, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL'] 
      },
      { 
        label: 'Incoming Supplies', 
        path: '/incoming-supplies', 
        icon: Truck, 
        roles: ['ADMIN', 'HOSPITAL', 'QUALITY_INSPECTOR'] 
      },
      { 
        label: 'Batches', 
        path: '/batches', 
        icon: Boxes, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL', 'SUPPLIER'] 
      },
      { 
        label: 'Suppliers', 
        path: '/suppliers', 
        icon: Building2, 
        roles: ['ADMIN', 'SUPPLIER', 'QUALITY_INSPECTOR'] 
      },
    ],
  },
  {
    group: 'QUALITY & COMPLIANCE',
    items: [
      { 
        label: 'Quality Testing', 
        path: '/quality-tests', 
        icon: Microscope, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR'] 
      },
      { 
        label: 'Compliance', 
        path: '/compliance', 
        icon: Scale, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL', 'SUPPLIER'] 
      },
      { 
        label: 'Decisions', 
        path: '/compliance/decisions', 
        icon: Zap, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL', 'SUPPLIER'] 
      },
    ],
  },
  {
    group: 'MONITORING',
    items: [
      { 
        label: 'Traceability', 
        path: '/traceability', 
        icon: Network, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL'] 
      },
      { 
        label: 'Storage Monitoring', 
        path: '/storage', 
        icon: Warehouse, 
        roles: ['ADMIN', 'HOSPITAL', 'QUALITY_INSPECTOR'] 
      },
      { 
        label: 'Transport Monitoring', 
        path: '/transport', 
        icon: Container, 
        roles: ['ADMIN', 'SUPPLIER', 'QUALITY_INSPECTOR', 'HOSPITAL'] 
      },
      { 
        label: 'Alerts', 
        path: '/alerts', 
        icon: Bell, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL'] 
      },
    ],
  },
  {
    group: 'SAFETY',
    items: [
      { 
        label: 'Quarantine', 
        path: '/quarantine', 
        icon: Lock, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR'] 
      },
      { 
        label: 'Recalls', 
        path: '/recalls', 
        icon: AlertOctagon, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL'] 
      },
      { 
        label: 'Corrective Actions', 
        path: '/corrective-actions', 
        icon: Wrench, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR'] 
      },
    ],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { 
        label: 'AI Risk Insights', 
        path: '/ai-insights', 
        icon: Bot, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL', 'SUPPLIER'] 
      },
      { 
        label: 'Analytics', 
        path: '/analytics', 
        icon: BarChart3, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL', 'SUPPLIER'] 
      },
      { 
        label: 'Reports', 
        path: '/reports', 
        icon: FileSpreadsheet, 
        roles: ['ADMIN', 'QUALITY_INSPECTOR', 'HOSPITAL', 'SUPPLIER'] 
      },
    ],
  },
  {
    group: 'ADMINISTRATION',
    items: [
      { 
        label: 'Users', 
        path: '/users', 
        icon: Users, 
        roles: ['ADMIN'] 
      },
      { 
        label: 'Audit Logs', 
        path: '/audit', 
        icon: ScrollText, 
        roles: ['ADMIN'] 
      },
    ],
  },
];

export default function MainLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile sidebar on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = currentUser?.role || 'QUALITY_INSPECTOR';

  const roleBadgeStyles = {
    ADMIN: 'bg-teal-900/40 text-teal-300 border-teal-600/40',
    QUALITY_INSPECTOR: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40',
    SUPPLIER: 'bg-cyan-900/40 text-cyan-300 border-cyan-600/40',
    HOSPITAL: 'bg-slate-800 text-teal-300 border-slate-700',
  }[role] || 'bg-slate-800 text-slate-300 border-slate-700';

  const roleHeaderBadge = {
    ADMIN: 'bg-teal-50 text-teal-800 border-teal-200',
    QUALITY_INSPECTOR: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    SUPPLIER: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    HOSPITAL: 'bg-slate-100 text-slate-800 border-slate-200',
  }[role] || 'bg-slate-100 text-slate-800 border-slate-200';

  const currentNavLabel = NAV.flatMap(g => g.items).find(i => i.path === location.pathname)?.label || 'Quality Command Center';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 antialiased">
      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-teal-950 via-teal-900 to-slate-950 text-white transition-all duration-300 ease-in-out border-r border-teal-900/40 select-none shadow-2xl lg:shadow-none ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-4 py-4.5 border-b border-teal-800/40 h-16 flex-shrink-0 bg-teal-950/40">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-teal-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-teal-300" />
              </div>
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <div className="font-extrabold text-[15px] tracking-tight text-white leading-none">
                  PHARMAQ <span className="text-teal-400 font-bold">CONTROL</span>
                </div>
                <div className="text-[10px] text-teal-300/80 font-semibold tracking-wider uppercase mt-1 truncate">
                  Quality &amp; Compliance
                </div>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex text-teal-400 hover:text-white p-1.5 rounded-lg hover:bg-teal-800/50 transition-colors flex-shrink-0"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin scrollbar-thumb-teal-800">
          {NAV.map(group => {
            const visibleItems = group.items.filter(item => item.roles.includes(role));
            if (!visibleItems.length) return null;

            return (
              <div key={group.group} className="space-y-1">
                {(!collapsed || mobileOpen) && (
                  <div className="text-[10px] font-bold text-teal-400/60 tracking-wider px-3 uppercase mb-1.5">
                    {group.group}
                  </div>
                )}
                {visibleItems.map(item => {
                  const IconComponent = item.icon;
                  const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed && !mobileOpen ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-teal-700/90 text-white shadow-sm border border-teal-500/40'
                          : 'text-teal-100/70 hover:bg-teal-800/40 hover:text-white'
                      } ${collapsed && !mobileOpen ? 'justify-center px-0' : ''}`}
                    >
                      <IconComponent className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-teal-400'}`} />
                      {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Account & Logout Footer */}
        <div className="border-t border-teal-800/40 p-3 space-y-2 bg-teal-950/60 flex-shrink-0">
          <Link
            to="/profile"
            title={collapsed && !mobileOpen ? currentUser?.full_name || 'User Profile' : undefined}
            className={`flex items-center gap-3 rounded-xl hover:bg-teal-800/40 p-2 transition-all ${
              collapsed && !mobileOpen ? 'justify-center p-1' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-teal-800 border border-teal-600/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-teal-200 shadow-xs">
              {currentUser?.full_name?.[0] || 'U'}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-bold truncate leading-snug">
                  {currentUser?.full_name || 'Hospital User'}
                </div>
                <div className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium mt-0.5 ${roleBadgeStyles}`}>
                  {role.replace('_', ' ')}
                </div>
              </div>
            )}
          </Link>

          <button
            onClick={handleLogout}
            title={collapsed && !mobileOpen ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2 text-teal-300 hover:text-red-300 hover:bg-red-950/40 rounded-xl text-xs font-semibold transition-all ${
              collapsed && !mobileOpen ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-xs z-20 h-16">
          
          {/* Left: Mobile Toggle & Global Search Trigger */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input Box */}
            <div className="w-full max-w-md">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2 bg-slate-100/90 hover:bg-slate-200/70 text-slate-500 rounded-xl text-xs font-medium border border-slate-200 transition-all text-left shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0 truncate">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                  <span className="truncate text-slate-500 group-hover:text-slate-700">
                    Search batches, medicines, suppliers, alerts...
                  </span>
                </div>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400 font-mono flex-shrink-0 shadow-2xs">
                  Ctrl+K
                </kbd>
              </button>
            </div>
          </div>

          {/* Right: Actions, Alerts, User Badge */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* System Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Live</span>
            </div>

            {/* Date Display */}
            <div className="text-xs text-slate-500 font-medium hidden xl:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>

            {/* Alerts Notification Icon */}
            <Link
              to="/alerts"
              className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200/80 transition-all relative"
              title="Alert Center"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            </Link>

            {/* Role Header Badge */}
            <div className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold border ${roleHeaderBadge}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{role.replace('_', ' ')}</span>
            </div>

            {/* User Profile Pill */}
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-teal-800 text-teal-100 flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentUser?.full_name?.[0] || 'U'}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden lg:inline max-w-[120px] truncate">
                {currentUser?.full_name?.split(' ')?.[0] || 'User'}
              </span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
