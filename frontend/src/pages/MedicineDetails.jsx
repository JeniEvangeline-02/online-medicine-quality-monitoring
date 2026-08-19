import { CheckCircle2, ShieldCheck, Thermometer, Activity, Package, FlaskConical, FileText } from 'lucide-react';
import styles from './MedicineDetails.module.css';

const MedicineDetails = () => {
  return (
    <div className={styles.pageContainer}>
      
      <div className={styles.headerSection}>
        <div className={styles.productIcon}>
          <Package size={48} className={styles.iconPrimary} />
        </div>
        <div className={styles.productInfo}>
          <h1 className={styles.productTitle}>PARACETAMOL 500 MG</h1>
          <div className={styles.metaRow}>
            <span>Generic: Paracetamol</span>
            <span className={styles.dot}>•</span>
            <span>Manufacturer: ABC Pharmaceuticals</span>
            <span className={styles.dot}>•</span>
            <span className={styles.batchLabel}>Batch: PCM-2026-00421</span>
          </div>
        </div>
        <div className={styles.statusBadge}>
          <CheckCircle2 size={16} />
          APPROVED
        </div>
      </div>

      <div className={styles.sectionsGrid}>
        
        {/* Quality Profile */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <Activity size={18} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>QUALITY PROFILE</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.profileMetric}>
              <span className={styles.metricLabel}>Overall Quality Score</span>
              <span className={styles.metricValue}>99.2%</span>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.profileMetric}>
              <span className={styles.metricLabel}>Risk Assessment</span>
              <span className={styles.metricValueSafe}>LOW RISK</span>
            </div>
          </div>
        </div>

        {/* Test History */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <FlaskConical size={18} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>TEST HISTORY</h3>
          </div>
          <div className={styles.cardContent}>
            <ul className={styles.historyList}>
              <li>
                <span className={styles.date}>14 Aug 2026</span>
                <span className={styles.event}>Final QC Release</span>
                <span className={styles.statusPass}>PASS</span>
              </li>
              <li>
                <span className={styles.date}>13 Aug 2026</span>
                <span className={styles.event}>Dissolution Test</span>
                <span className={styles.statusPass}>PASS</span>
              </li>
              <li>
                <span className={styles.date}>12 Aug 2026</span>
                <span className={styles.event}>Purity Assay</span>
                <span className={styles.statusPass}>PASS</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Storage History */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <Thermometer size={18} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>STORAGE HISTORY</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.storageStats}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Avg Temp</span>
                <span className={styles.statValue}>5.4°C</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Excursions</span>
                <span className={styles.statValue}>0</span>
              </div>
            </div>
            <p className={styles.storageNote}>Maintained continuous cold chain 2°C - 8°C since manufacturing.</p>
          </div>
        </div>

        {/* Certification */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <ShieldCheck size={18} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>CERTIFICATION</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.certItem}>
              <FileText size={16} className={styles.certIcon} />
              <div className={styles.certInfo}>
                <span className={styles.certName}>GMP Certificate</span>
                <span className={styles.certId}>GMP-IN-2026-992</span>
              </div>
              <span className={styles.certStatus}>Valid</span>
            </div>
            <div className={styles.certItem}>
              <FileText size={16} className={styles.certIcon} />
              <div className={styles.certInfo}>
                <span className={styles.certName}>COA (Cert of Analysis)</span>
                <span className={styles.certId}>COA-PCM-00421</span>
              </div>
              <span className={styles.certStatus}>Valid</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MedicineDetails;
