import { FlaskConical, Download, CheckCircle, Beaker } from 'lucide-react';
import styles from './QualityTestReport.module.css';

const QualityTestReport = () => {
  return (
    <div className={styles.pageContainer}>
      
      <div className={styles.reportHeader}>
        <div className={styles.headerTop}>
          <div className={styles.titleWrapper}>
            <FlaskConical size={24} className={styles.iconPrimary} />
            <h1 className={styles.pageTitle}>QUALITY CONTROL REPORT</h1>
          </div>
          <button className={styles.downloadBtn}>
            <Download size={16} />
            Download PDF
          </button>
        </div>

        <div className={styles.headerDetails}>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Sample ID</span>
            <span className={styles.detailValue}>QC-2026-00981</span>
          </div>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Product</span>
            <span className={styles.detailValue}>Paracetamol 500mg</span>
          </div>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Batch</span>
            <span className={styles.detailValue}>PCM-2026-00421</span>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.testTable}>
          <thead>
            <tr>
              <th>TEST PARAMETER</th>
              <th>STANDARD</th>
              <th>OBSERVED</th>
              <th>RESULT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className={styles.paramCell}>
                  <Beaker size={14} className={styles.paramIcon} />
                  Purity
                </div>
              </td>
              <td>≥98%</td>
              <td className={styles.observed}>99.2%</td>
              <td>
                <span className={styles.resultPass}><CheckCircle size={14} /> PASS</span>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.paramCell}>
                  <Beaker size={14} className={styles.paramIcon} />
                  Dissolution
                </div>
              </td>
              <td>≥85%</td>
              <td className={styles.observed}>92.4%</td>
              <td>
                <span className={styles.resultPass}><CheckCircle size={14} /> PASS</span>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.paramCell}>
                  <Beaker size={14} className={styles.paramIcon} />
                  Weight
                </div>
              </td>
              <td>495–505mg</td>
              <td className={styles.observed}>500mg</td>
              <td>
                <span className={styles.resultPass}><CheckCircle size={14} /> PASS</span>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.paramCell}>
                  <Beaker size={14} className={styles.paramIcon} />
                  Hardness
                </div>
              </td>
              <td>{'>'}60N</td>
              <td className={styles.observed}>82N</td>
              <td>
                <span className={styles.resultPass}><CheckCircle size={14} /> PASS</span>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.paramCell}>
                  <Beaker size={14} className={styles.paramIcon} />
                  Friability
                </div>
              </td>
              <td>{'<'}1.0%</td>
              <td className={styles.observed}>0.3%</td>
              <td>
                <span className={styles.resultPass}><CheckCircle size={14} /> PASS</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.reportFooter}>
        <div className={styles.overallResult}>
          <span className={styles.overallLabel}>OVERALL RESULT</span>
          <div className={styles.overallPass}>
            <CheckCircle size={20} />
            PASSED
          </div>
        </div>

        <div className={styles.signatures}>
          <div className={styles.signBlock}>
            <span className={styles.signLabel}>Reviewed by:</span>
            <span className={styles.signName}>Dr. A. Kumar, Quality Inspector</span>
          </div>
          <div className={styles.signBlock}>
            <span className={styles.signLabel}>Date:</span>
            <span className={styles.signValue}>18 Aug 2026</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default QualityTestReport;
