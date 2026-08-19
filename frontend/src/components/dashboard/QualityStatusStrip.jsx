import styles from './QualityStatusStrip.module.css';

const QualityStatusStrip = () => {
  const statuses = [
    { label: 'QUALITY CONTROL', status: 'Operational', type: 'positive' },
    { label: 'TESTING', status: '24 Samples Active', type: 'info' },
    { label: 'STORAGE', status: 'Within Limits', type: 'positive' },
    { label: 'RECALL', status: '2 Active', type: 'warning' },
    { label: 'CERTIFICATION', status: '98.4% Valid', type: 'positive' },
  ];

  return (
    <div className={styles.stripContainer}>
      {statuses.map((item, index) => (
        <div key={index} className={styles.statusBlock}>
          <div className={styles.label}>{item.label}</div>
          <div className={`${styles.status} ${styles[item.type]}`}>
            <span className={styles.indicator}></span>
            {item.status}
          </div>
          {index < statuses.length - 1 && <div className={styles.divider}></div>}
        </div>
      ))}
    </div>
  );
};

export default QualityStatusStrip;
