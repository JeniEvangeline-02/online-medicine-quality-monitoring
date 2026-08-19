import { CheckCircle, ShieldCheck, Thermometer, FileCheck, AlertTriangle } from 'lucide-react';
import styles from './QRVerification.module.css';

const QRVerification = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.verificationCard}>
        <div className={styles.authBanner}>
          <ShieldCheck size={24} />
          <span>AUTHENTICATED PRODUCT</span>
        </div>
        
        <div className={styles.productHeader}>
          <div className={styles.productIcon}>
            <CheckCircle size={32} className={styles.primaryColor} />
          </div>
          <div className={styles.productInfo}>
            <h2>Paracetamol 500mg</h2>
            <p>Generic: Paracetamol</p>
          </div>
        </div>
        
        <div className={styles.metadataGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Batch Number</span>
            <span className={styles.metaValue}>PCM-2026-00421</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Manufacturer</span>
            <span className={styles.metaValue}>ABC Pharmaceuticals</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Mfg Date</span>
            <span className={styles.metaValue}>12 Aug 2026</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Expiry Date</span>
            <span className={styles.metaValue}>11 Aug 2029</span>
          </div>
        </div>
        
        <div className={styles.statusSection}>
          <h3 className={styles.sectionTitle}>QUALITY STATUS</h3>
          
          <div className={styles.statusList}>
            <div className={`${styles.statusItem} ${styles.approved}`}>
              <div className={styles.statusIcon}><CheckCircle size={18} /></div>
              <div className={styles.statusContent}>
                <span className={styles.statusName}>Overall Status</span>
                <span className={styles.statusValue}>APPROVED</span>
              </div>
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}><FileCheck size={18} /></div>
              <div className={styles.statusContent}>
                <span className={styles.statusName}>Testing Status</span>
                <span className={styles.statusValue}>Verified</span>
              </div>
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}><Thermometer size={18} /></div>
              <div className={styles.statusContent}>
                <span className={styles.statusName}>Storage Status</span>
                <span className={styles.statusValue}>Within Requirements</span>
              </div>
            </div>
            
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}><ShieldCheck size={18} /></div>
              <div className={styles.statusContent}>
                <span className={styles.statusName}>Certificate</span>
                <span className={styles.statusValue}>Valid</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerVisual}>
          <div className={styles.visualLine}></div>
          <span className={styles.visualText}>Secured by PharmaQC Intelligence</span>
          <div className={styles.visualLine}></div>
        </div>
      </div>
    </div>
  );
};

export default QRVerification;
