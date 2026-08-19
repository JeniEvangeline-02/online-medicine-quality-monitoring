import { ShieldAlert } from 'lucide-react';
import styles from './RiskPanel.module.css';

const RiskPanel = () => {
  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Quality Risk Intelligence</h3>
      
      <div className={styles.contentGrid}>
        <div className={styles.matrixContainer}>
          <div className={styles.matrixYAxis}>LIKELIHOOD</div>
          
          <div className={styles.matrixGrid}>
            {/* High Likelihood */}
            <div className={styles.axisLabel}>High</div>
            <div className={`${styles.cell} ${styles.cellWarning}`}></div>
            <div className={`${styles.cell} ${styles.cellCritical}`}>
              <div className={styles.riskDot} title="AMX-2026-119"></div>
            </div>
            <div className={`${styles.cell} ${styles.cellCritical}`}></div>
            
            {/* Medium Likelihood */}
            <div className={styles.axisLabel}>Med</div>
            <div className={`${styles.cell} ${styles.cellLow}`}></div>
            <div className={`${styles.cell} ${styles.cellWarning}`}>
              <div className={styles.riskDot} title="Storage B-12"></div>
            </div>
            <div className={`${styles.cell} ${styles.cellCritical}`}></div>
            
            {/* Low Likelihood */}
            <div className={styles.axisLabel}>Low</div>
            <div className={`${styles.cell} ${styles.cellLow}`}></div>
            <div className={`${styles.cell} ${styles.cellLow}`}></div>
            <div className={`${styles.cell} ${styles.cellWarning}`}></div>
            
            {/* X Axis Labels */}
            <div className={styles.cornerSpace}></div>
            <div className={styles.axisLabelX}>Low</div>
            <div className={styles.axisLabelX}>Med</div>
            <div className={styles.axisLabelX}>High</div>
          </div>
          
          <div className={styles.matrixXAxis}>IMPACT</div>
        </div>

        <div className={styles.activeRiskCard}>
          <div className={styles.riskHeader}>
            <ShieldAlert size={18} className={styles.criticalIcon} />
            <h4>HIGH RISK IDENTIFIED</h4>
          </div>
          
          <div className={styles.riskDetail}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Batch:</span>
              <span className={styles.detailValue}>AMX-2026-119</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Reason:</span>
              <span className={styles.detailValue}>Repeated dissolution failures</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Action:</span>
              <span className={styles.detailAction}>Quality review required</span>
            </div>
          </div>
          
          <button className={styles.reviewBtn}>Initiate Review Protocol</button>
        </div>
      </div>
    </div>
  );
};

export default RiskPanel;
