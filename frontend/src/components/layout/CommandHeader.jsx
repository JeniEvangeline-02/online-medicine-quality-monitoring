import { Bell, RefreshCw, User, ShieldCheck } from 'lucide-react';
import styles from './CommandHeader.module.css';

const CommandHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.titleWrapper}>
          <ShieldCheck className={styles.titleIcon} size={28} />
          <div>
            <h1 className={styles.title}>Product Quality Intelligence</h1>
            <p className={styles.subtitle}>Real-time pharmaceutical safety & compliance monitoring</p>
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>System Time</span>
          <span className={styles.infoValue}>18 Aug 2026, 18:35</span>
        </div>
        
        <div className={styles.divider}></div>
        
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Last Sync</span>
          <span className={styles.infoValueWithIcon}>
            <RefreshCw size={14} className={styles.spinIcon} />
            Live
          </span>
        </div>
        
        <div className={styles.divider}></div>

        <button className={styles.iconButton} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.badge}>3</span>
        </button>

        <button className={styles.profileButton} aria-label="User Profile">
          <div className={styles.avatar}>
            <User size={18} />
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>Dr. A. Kumar</span>
            <span className={styles.profileRole}>Chief Inspector</span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default CommandHeader;
