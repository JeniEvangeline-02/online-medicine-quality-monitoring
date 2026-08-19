import { AlertTriangle, Clock, ShieldCheck, Info } from 'lucide-react';
import styles from './ExpiryIntelligence.module.css';

const batches = [
  { id: 'PCM-0421', status: 'critical', pos: 15 },
  { id: 'AMX-0119', status: 'attention', pos: 45 },
  { id: 'IBU-0088', status: 'attention', pos: 70 },
  { id: 'DOX-0234', status: 'stable', pos: 120 },
  { id: 'AZI-0542', status: 'stable', pos: 160 },
  { id: 'CVP-0111', status: 'long', pos: 220 },
];

const ExpiryIntelligence = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Expiry Intelligence</h3>
        <button className={styles.actionBtn}>View Detailed Report</button>
      </div>
      
      <div className={styles.timelineContainer}>
        <div className={styles.nowLabel}>
          <span>NOW</span>
          <div className={styles.nowLine}></div>
        </div>
        
        <div className={styles.timeline}>
          {/* Zones */}
          <div className={`${styles.zone} ${styles.zoneCritical}`}>
            <span className={styles.zoneLabel}>
              <AlertTriangle size={12} /> Critical &lt; 30d
            </span>
          </div>
          <div className={`${styles.zone} ${styles.zoneAttention}`}>
            <span className={styles.zoneLabel}>
              <Clock size={12} /> Attention 30-90d
            </span>
          </div>
          <div className={`${styles.zone} ${styles.zoneStable}`}>
            <span className={styles.zoneLabel}>
              <Info size={12} /> Stable 90-180d
            </span>
          </div>
          <div className={`${styles.zone} ${styles.zoneLong}`}>
            <span className={styles.zoneLabel}>
              <ShieldCheck size={12} /> Long Shelf Life &gt; 180d
            </span>
          </div>
          
          {/* Batch Points */}
          <div className={styles.batchPoints}>
            {batches.map(batch => (
              <div 
                key={batch.id} 
                className={`${styles.batchPoint} ${styles[batch.status]}`}
                style={{ left: `${(batch.pos / 240) * 100}%` }}
                title={batch.id}
              >
                <div className={styles.batchTooltip}>{batch.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiryIntelligence;
