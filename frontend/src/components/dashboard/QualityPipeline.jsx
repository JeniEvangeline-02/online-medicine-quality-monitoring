import { CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import styles from './QualityPipeline.module.css';

const pipelineStages = [
  { id: 1, name: 'SAMPLE RECEIVED', count: 124, time: '2h avg', status: 'completed' },
  { id: 2, name: 'IDENTIFICATION', count: 86, time: '4h avg', status: 'completed' },
  { id: 3, name: 'LAB TESTING', count: 42, time: '24h avg', status: 'active' },
  { id: 4, name: 'RESULT ANALYSIS', count: 18, time: '6h avg', status: 'pending' },
  { id: 5, name: 'QUALITY REVIEW', count: 8, time: '12h avg', status: 'pending' },
  { id: 6, name: 'APPROVAL', count: 156, time: '1h avg', status: 'pending' }
];

const QualityPipeline = () => {
  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Quality Testing Pipeline</h3>
      
      <div className={styles.pipeline}>
        {pipelineStages.map((stage, index) => (
          <div key={stage.id} className={`${styles.stage} ${styles[stage.status]}`}>
            <div className={styles.node}>
              {stage.status === 'completed' && <CheckCircle2 size={24} className={styles.iconCompleted} />}
              {stage.status === 'active' && <CircleDashed size={24} className={styles.iconActive} />}
              {stage.status === 'pending' && <div className={styles.iconPending}></div>}
            </div>
            
            <div className={styles.content}>
              <div className={styles.stageName}>{stage.name}</div>
              <div className={styles.metrics}>
                <span className={styles.count}>{stage.count} batches</span>
                <span className={styles.time}><Clock size={10} /> {stage.time}</span>
              </div>
            </div>

            {index < pipelineStages.length - 1 && (
              <div className={`${styles.connector} ${styles[stage.status]}`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityPipeline;
