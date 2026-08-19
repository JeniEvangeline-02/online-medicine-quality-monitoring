import { TrendingUp, Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import styles from './DashboardHero.module.css';

const DashboardHero = () => {
  return (
    <div className={styles.heroContainer}>
      <div className={styles.mainIndexCard}>
        <h2 className={styles.sectionTitle}>QUALITY HEALTH INDEX</h2>
        
        <div className={styles.gaugeContainer}>
          <svg viewBox="0 0 100 50" className={styles.gaugeSvg}>
            <path className={styles.gaugeBg} d="M 10 50 A 40 40 0 0 1 90 50" fill="none" strokeWidth="8" strokeLinecap="round" />
            <path className={styles.gaugeFill} d="M 10 50 A 40 40 0 0 1 85 20" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray="125.6" strokeDashoffset="10" />
          </svg>
          <div className={styles.gaugeContent}>
            <span className={styles.gaugeValue}>94.8</span>
            <span className={styles.gaugeStatus}>GOOD / STABLE</span>
          </div>
        </div>
        
        <div className={styles.trendContainer}>
          <TrendingUp size={16} className={styles.trendIcon} />
          <span>2.4% from previous period</span>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>PASS RATE</span>
            <CheckCircle2 size={16} className={styles.positiveIcon} />
          </div>
          <div className={styles.metricValue}>96.2%</div>
          <div className={styles.metricSparkline}>
            <div className={styles.sparklineBar} style={{ height: '60%' }}></div>
            <div className={styles.sparklineBar} style={{ height: '80%' }}></div>
            <div className={styles.sparklineBar} style={{ height: '70%' }}></div>
            <div className={styles.sparklineBar} style={{ height: '90%' }}></div>
            <div className={styles.sparklineBar} style={{ height: '95%' }}></div>
            <div className={styles.sparklineBar} style={{ height: '96%' }}></div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>FAILURE RATE</span>
            <AlertTriangle size={16} className={styles.criticalIcon} />
          </div>
          <div className={styles.metricValue}>2.1%</div>
          <div className={styles.metricSparkline}>
            <div className={styles.sparklineBarCritical} style={{ height: '30%' }}></div>
            <div className={styles.sparklineBarCritical} style={{ height: '40%' }}></div>
            <div className={styles.sparklineBarCritical} style={{ height: '20%' }}></div>
            <div className={styles.sparklineBarCritical} style={{ height: '35%' }}></div>
            <div className={styles.sparklineBarCritical} style={{ height: '25%' }}></div>
            <div className={styles.sparklineBarCritical} style={{ height: '21%' }}></div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>UNDER REVIEW</span>
            <Clock size={16} className={styles.warningIcon} />
          </div>
          <div className={styles.metricValue}>1.7%</div>
          <div className={styles.metricSparkline}>
            <div className={styles.sparklineBarWarning} style={{ height: '40%' }}></div>
            <div className={styles.sparklineBarWarning} style={{ height: '30%' }}></div>
            <div className={styles.sparklineBarWarning} style={{ height: '50%' }}></div>
            <div className={styles.sparklineBarWarning} style={{ height: '45%' }}></div>
            <div className={styles.sparklineBarWarning} style={{ height: '20%' }}></div>
            <div className={styles.sparklineBarWarning} style={{ height: '17%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
