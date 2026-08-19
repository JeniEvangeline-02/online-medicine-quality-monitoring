import { NavLink } from 'react-router-dom';
import { Activity, ShieldCheck, Thermometer, ShieldAlert, Package, FlaskConical, Stethoscope, Factory, FileText, LayoutDashboard, Truck, LineChart } from 'lucide-react';
import styles from './SidebarNavigation.module.css';

const NavigationGroup = ({ title, items }) => (
  <div className={styles.navGroup}>
    <h3 className={styles.navTitle}>{title}</h3>
    <ul className={styles.navList}>
      {items.map((item) => (
        <li key={item.path}>
          <NavLink 
            to={item.path} 
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            {item.indicator && <span className={styles.indicatorPulse}></span>}
          </NavLink>
        </li>
      ))}
    </ul>
  </div>
);

const SidebarNavigation = () => {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}><Activity size={24} /></div>
        <div className={styles.logoText}>
          <h2>PharmaQC</h2>
          <span>Intelligence System</span>
        </div>
      </div>

      <div className={styles.navScroll}>
        <NavigationGroup 
          title="MONITOR" 
          items={[
            { path: '/', label: 'Command Center', icon: <LayoutDashboard size={18} />, indicator: true },
            { path: '/live', label: 'Live Quality', icon: <Activity size={18} /> },
            { path: '/alerts', label: 'Alerts', icon: <ShieldAlert size={18} /> },
          ]} 
        />

        <NavigationGroup 
          title="QUALITY" 
          items={[
            { path: '/medicine', label: 'Medicines', icon: <Stethoscope size={18} /> },
            { path: '/consumables', label: 'Consumables', icon: <Package size={18} /> },
            { path: '/batches', label: 'Batches', icon: <Package size={18} /> },
            { path: '/report', label: 'Laboratory Tests', icon: <FlaskConical size={18} /> },
            { path: '/standards', label: 'Quality Standards', icon: <ShieldCheck size={18} /> },
          ]} 
        />

        <NavigationGroup 
          title="SUPPLY CHAIN" 
          items={[
            { path: '/manufacturers', label: 'Manufacturers', icon: <Factory size={18} /> },
            { path: '/suppliers', label: 'Suppliers', icon: <Truck size={18} /> },
            { path: '/storage', label: 'Storage', icon: <Thermometer size={18} /> },
            { path: '/verification', label: 'Traceability (QR)', icon: <Activity size={18} /> },
          ]} 
        />

        <NavigationGroup 
          title="COMPLIANCE" 
          items={[
            { path: '/certificates', label: 'Certificates', icon: <FileText size={18} /> },
            { path: '/recalls', label: 'Recalls', icon: <ShieldAlert size={18} /> },
            { path: '/audit', label: 'Audit Trail', icon: <FileText size={18} /> },
          ]} 
        />
        
        <NavigationGroup 
          title="INTELLIGENCE" 
          items={[
            { path: '/analytics', label: 'Analytics', icon: <LineChart size={18} /> },
            { path: '/risk', label: 'Risk Analysis', icon: <ShieldAlert size={18} /> },
          ]} 
        />
      </div>
    </nav>
  );
};

export default SidebarNavigation;
