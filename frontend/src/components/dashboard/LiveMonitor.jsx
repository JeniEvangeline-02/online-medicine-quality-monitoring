import { Activity, Clock } from 'lucide-react';
import styles from './LiveMonitor.module.css';

const batches = [
  {
    id: 'PCM-2026-00421',
    product: 'Paracetamol 500mg',
    status: 'TESTING',
    metrics: [
      { label: 'Purity', value: 99.2, target: '98%', max: 100 },
      { label: 'Dissolution', value: 92.4, target: '85%', max: 100 },
      { label: 'Weight', value: 500, target: '500mg', max: 505, suffix: 'mg' }
    ],
    lab: 'Central QC Lab',
    updated: '2 min ago'
  },
  {
    id: 'AMX-2026-119',
    product: 'Amoxicillin 250mg',
    status: 'REVIEW',
    metrics: [
      { label: 'Purity', value: 98.1, target: '98%', max: 100 },
      { label: 'Moisture', value: 4.2, target: '<5%', max: 10 },
      { label: 'Weight', value: 251, target: '250mg', max: 260, suffix: 'mg' }
    ],
    lab: 'Microbiology Lab',
    updated: '8 min ago'
  },
  {
    id: 'IBU-2026-088',
    product: 'Ibuprofen 400mg',
    status: 'APPROVED',
    metrics: [
      { label: 'Purity', value: 99.8, target: '99%', max: 100 },
      { label: 'Hardness', value: 85, target: '>80N', max: 100 },
      { label: 'Weight', value: 401, target: '400mg', max: 410, suffix: 'mg' }
    ],
    lab: 'Physical Testing',
    updated: '15 min ago'
  }
];

const ProgressBar = ({ value, max, suffix = '%' }) => {
  const percentage = (value / max) * 100;
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
      <span className={styles.progressValue}>{value}{suffix}</span>
    </div>
  );
};

const LiveMonitor = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Live Quality Monitor</h3>
        <span className={styles.liveIndicator}>
          <span className={styles.pulse}></span>
          Live
        </span>
      </div>

      <div className={styles.scrollArea}>
        {batches.map((batch) => (
          <div key={batch.id} className={styles.monitorCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.batchId}>{batch.id}</div>
                <div className={styles.productName}>{batch.product}</div>
              </div>
              <div className={`${styles.statusBadge} ${styles[batch.status.toLowerCase()]}`}>
                <Activity size={12} />
                {batch.status}
              </div>
            </div>

            <div className={styles.metricsList}>
              {batch.metrics.map((metric, idx) => (
                <div key={idx} className={styles.metricRow}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <ProgressBar value={metric.value} max={metric.max} suffix={metric.suffix} />
                </div>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.footerInfo}>
                <span className={styles.labName}>Laboratory: {batch.lab}</span>
              </div>
              <div className={styles.timeInfo}>
                <Clock size={12} />
                <span>{batch.updated}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveMonitor;
