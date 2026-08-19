import QualityStatusStrip from '../components/dashboard/QualityStatusStrip';
import DashboardHero from '../components/dashboard/DashboardHero';
import LiveMonitor from '../components/dashboard/LiveMonitor';
import QualityPipeline from '../components/dashboard/QualityPipeline';
import StorageMonitor from '../components/dashboard/StorageMonitor';
import ExpiryIntelligence from '../components/dashboard/ExpiryIntelligence';
import RiskPanel from '../components/dashboard/RiskPanel';

const CommandCenter = () => {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <QualityStatusStrip />
      <DashboardHero />
      <LiveMonitor />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <QualityPipeline />
        <StorageMonitor />
      </div>
      
      <ExpiryIntelligence />
      <RiskPanel />
      
    </div>
  );
};

export default CommandCenter;
