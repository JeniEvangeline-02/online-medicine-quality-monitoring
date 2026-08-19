import { Thermometer, Droplets, DoorClosed, AlertTriangle } from 'lucide-react';
import styles from './StorageMonitor.module.css';

const StorageMonitor = () => {
  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Cold Chain & Storage Integrity</h3>
      
      <div className={styles.unitsGrid}>
        
        {/* Unit A-04 */}
        <div className={`${styles.unitCard} ${styles.safe}`}>
          <div className={styles.cardHeader}>
            <span className={styles.unitName}>STORAGE UNIT A-04</span>
            <div className={styles.statusBadge}>
              <span className={styles.pulse}></span>
              WITHIN SAFE RANGE
            </div>
          </div>
          
          <div className={styles.mainMetrics}>
            <div className={styles.tempDisplay}>
              <span className={styles.tempValue}>5.8°C</span>
            </div>
            
            <div className={styles.tempVisualizer}>
              <span className={styles.limitLabel}>2°C</span>
              <div className={styles.tempTrack}>
                <div className={styles.safeZone} style={{ left: '10%', right: '10%' }}></div>
                <div className={styles.currentIndicator} style={{ left: '45%' }}></div>
              </div>
              <span className={styles.limitLabel}>8°C</span>
            </div>
          </div>

          <div className={styles.footerMetrics}>
            <div className={styles.footerMetric}>
              <Droplets size={14} className={styles.metricIcon} />
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Humidity</span>
                <span className={styles.metricValue}>48%</span>
              </div>
            </div>
            
            <div className={styles.footerMetric}>
              <DoorClosed size={14} className={styles.metricIcon} />
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Door Status</span>
                <span className={styles.metricValue}>Closed</span>
              </div>
            </div>

            <div className={styles.lastUpdate}>
              Last Sensor Update: 12 sec ago
            </div>
          </div>
        </div>

        {/* Unit B-12 */}
        <div className={`${styles.unitCard} ${styles.warning}`}>
          <div className={styles.cardHeader}>
            <span className={styles.unitName}>STORAGE UNIT B-12</span>
            <div className={`${styles.statusBadge} ${styles.badgeWarning}`}>
              <AlertTriangle size={12} />
              APPROACHING LIMIT
            </div>
          </div>
          
          <div className={styles.mainMetrics}>
            <div className={styles.tempDisplay}>
              <span className={`${styles.tempValue} ${styles.textWarning}`}>7.6°C</span>
            </div>
            
            <div className={styles.tempVisualizer}>
              <span className={styles.limitLabel}>2°C</span>
              <div className={styles.tempTrack}>
                <div className={styles.safeZone} style={{ left: '10%', right: '10%' }}></div>
                <div className={`${styles.currentIndicator} ${styles.indicatorWarning}`} style={{ left: '85%' }}></div>
              </div>
              <span className={styles.limitLabel}>8°C</span>
            </div>
          </div>

          <div className={styles.footerMetrics}>
            <div className={styles.footerMetric}>
              <Droplets size={14} className={styles.metricIcon} />
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Humidity</span>
                <span className={styles.metricValue}>52%</span>
              </div>
            </div>
            
            <div className={styles.footerMetric}>
              <DoorClosed size={14} className={styles.metricIcon} />
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Door Status</span>
                <span className={styles.metricValue}>Closed</span>
              </div>
            </div>

            <div className={styles.lastUpdate}>
              Last Sensor Update: 4 sec ago
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StorageMonitor;
