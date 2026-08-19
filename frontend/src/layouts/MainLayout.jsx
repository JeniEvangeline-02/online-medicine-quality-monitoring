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
  Sliders,
  TestTube,
  Microscope,
  History,
  Truck,
  Network,
  Warehouse,
  Container,
  Factory,
  Building,
  Scale,
  Zap,
  BookOpen,
  Award,
  Lock,
  AlertTriangle,
  Wrench,
  Bot,
  BarChart3,
  FileSpreadsheet,
  Users,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  ShieldCheck
} from 'lucide-react';

const NAV = [
  {
    group: 'MONITORING',
    items: [
      { label: 'Quality Command Center', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL','SUPPLIER'] },
      { label: 'Alert Command Center', path: '/alerts', icon: Bell, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL'] },
    ],
  },
  {
    group: 'QUALITY CONTROL',
    items: [
      { label: 'Medicines', path: '/medicines', icon: Pill, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL'] },
      { label: 'Consumables', path: '/consumables', icon: Syringe, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL'] },
      { label: 'Batches', path: '/batches', icon: Boxes, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL'] },
      { label: 'Standard Library', path: '/quality-standards', icon: Sliders, roles: ['ADMIN','QUALITY_INSPECTOR'] },
      { label: 'Sample Control', path: '/quality-samples', icon: TestTube, roles: ['ADMIN','QUALITY_INSPECTOR'] },
      { label: 'Test Workbench', path: '/quality-tests', icon: Microscope, roles: ['ADMIN','QUALITY_INSPECTOR'] },
      { label: 'Test History', path: '/quality-history', icon: History, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL'] },
    ],
  },
  {
    group: 'SUPPLY CHAIN & TRACEABILITY',
    items: [
      { label: 'Incoming Supplies', path: '/incoming-supplies', icon: Truck, roles: ['ADMIN','HOSPITAL','QUALITY_INSPECTOR'] },
      { label: 'Traceability', path: '/traceability', icon: Network, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL'] },
      { label: 'Storage Monitor', path: '/storage', icon: Warehouse, roles: ['ADMIN','HOSPITAL','QUALITY_INSPECTOR'] },
      { label: 'Transport Tracker', path: '/transport', icon: Container, roles: ['ADMIN','SUPPLIER','QUALITY_INSPECTOR','HOSPITAL'] },
      { label: 'Suppliers', path: '/suppliers', icon: Factory, roles: ['ADMIN','SUPPLIER','QUALITY_INSPECTOR'] },
      { label: 'Manufacturers', path: '/manufacturers', icon: Building, roles: ['ADMIN','QUALITY_INSPECTOR'] },
    ],
  },
  {
    group: 'COMPLIANCE & RECALLS',
    items: [
      { label: 'Compliance Control', path: '/compliance', icon: Scale, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL','SUPPLIER'] },
      { label: 'Decision Engine', path: '/compliance/decisions', icon: Zap, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL','SUPPLIER'] },
      { label: 'Rule Library', path: '/compliance/rules', icon: BookOpen, roles: ['ADMIN','QUALITY_INSPECTOR'] },
      { label: 'Certificates', path: '/certificates', icon: Award, roles: ['ADMIN','QUALITY_INSPECTOR','SUPPLIER'] },
      { label: 'Quarantine', path: '/quarantine', icon: Lock, roles: ['ADMIN','QUALITY_INSPECTOR'] },
      { label: 'Recalls', path: '/recalls', icon: AlertTriangle, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL'] },
      { label: 'CAPA Actions', path: '/corrective-actions', icon: Wrench, roles: ['ADMIN','QUALITY_INSPECTOR'] },
    ],
  },
  {
    group: 'INTELLIGENCE & REPORTS',
    items: [
      { label: 'AI Risk Insights', path: '/ai-insights', icon: Bot, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL','SUPPLIER'] },
      { label: 'Analytics Center', path: '/analytics', icon: BarChart3, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL','SUPPLIER'] },
      { label: 'Report Center', path: '/reports', icon: FileSpreadsheet, roles: ['ADMIN','QUALITY_INSPECTOR','HOSPITAL','SUPPLIER'] },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Users', path: '/users', icon: Users, roles: ['ADMIN'] },
      { label: 'Audit Trail', path: '/audit', icon: ScrollText, roles: ['ADMIN'] },
      { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
    ],
  },
];

export default function MainLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = currentUser?.role || '';

  const roleBadgeStyles = {
    ADMIN: 'bg-teal-900/30 text-teal-300 border-teal-700/50',
    QUALITY_INSPECTOR: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
    SUPPLIER: 'bg-cyan-900/30 text-cyan-300 border-cyan-700/50',
    HOSPITAL: 'bg-slate-800 text-slate-300 border-slate-700',
  }[role] || 'bg-slate-800 text-slate-300 border-slate-700';

  const roleHeaderBadge = {
    ADMIN: 'bg-teal-50 text-teal-800 border-teal-200',
    QUALITY_INSPECTOR: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    SUPPLIER: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    HOSPITAL: 'bg-slate-100 text-slate-800 border-slate-200',
  }[role] || 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-20' : 'w-72'} flex-shrink-0 bg-gradient-to-b from-teal-950 via-teal-900 to-slate-950 text-white flex flex-col transition-all duration-300 border-r border-teal-900/40 select-none`}>
        
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-teal-800/40">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-teal-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-extrabold text-base tracking-tight text-white leading-none">
                  PharmaQ <span className="text-teal-400 font-semibold">Control</span>
                </div>
                <div className="text-[10px] text-teal-300/70 font-medium tracking-wide uppercase mt-1 truncate">
                  Quality &amp; Compliance
                </div>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-teal-400 hover:text-white p-1.5 rounded-lg hover:bg-teal-800/50 transition-colors flex-shrink-0"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV.map(group => {
            const visibleItems = group.items.filter(item => item.roles.includes(role));
            if (!visibleItems.length) return null;
            return (
              <div key={group.group} className="space-y-1">
                {!collapsed && (
                  <div className="text-[10px] font-bold text-teal-400/60 tracking-wider px-3 uppercase mb-1.5">
                    {group.group}
                  </div>
                )}
                {visibleItems.map(item => {
                  const IconComponent = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-teal-700/90 text-white shadow-sm border border-teal-500/30'
                          : 'text-teal-100/70 hover:bg-teal-800/40 hover:text-white'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 flex-shrink-0 ${active ? 'text-teal-200' : 'text-teal-400'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Account Footer */}
        <div className="border-t border-teal-800/40 p-3 space-y-2 bg-teal-950/40">
          <Link to="/profile" className="flex items-center gap-3 rounded-xl hover:bg-teal-800/40 p-2 transition-all">
            <div className="w-8 h-8 rounded-lg bg-teal-800 border border-teal-600/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-teal-200">
              {currentUser?.full_name?.[0] || 'U'}
            </div>
            {!collapsed && (
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
            className="w-full flex items-center gap-2 px-3 py-2 text-teal-300 hover:text-red-300 hover:bg-red-950/40 rounded-xl text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                PharmaQ Command System
              </div>
              <div className="text-sm font-bold text-slate-900">
                {NAV.flatMap(g => g.items).find(i => i.path === location.pathname)?.label || 'Quality Command Center'}
              </div>
            </div>

            {/* Quick Search Bar */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-500 rounded-xl text-xs font-medium border border-slate-200 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search batches, products, recalls...</span>
              <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 font-mono">
                Ctrl+K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div className={`text-xs px-2.5 py-1 rounded-full font-bold border ${roleHeaderBadge}`}>
              {role.replace('_', ' ')}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
