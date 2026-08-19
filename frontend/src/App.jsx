import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Phase 2 Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Phase 3 Pages
import ManufacturerRegistry from './pages/ManufacturerRegistry';
import SupplierRegistry from './pages/SupplierRegistry';
import ProductCatalog from './pages/ProductCatalog';
import BatchIntelligence from './pages/BatchIntelligence';
import IncomingSupplyControl from './pages/IncomingSupplyControl';

// Phase 4 Pages
import QualityStandardLibrary from './pages/QualityStandardLibrary';
import SampleControl from './pages/SampleControl';
import QualityTestWorkbench from './pages/QualityTestWorkbench';
import QualityTestHistory from './pages/QualityTestHistory';

// Phase 5 Pages
import ComplianceControl from './pages/ComplianceControl';
import ComplianceDecisionDetail from './pages/ComplianceDecisionDetail';
import ComplianceRuleLibrary from './pages/ComplianceRuleLibrary';
import CertificateRegistry from './pages/CertificateRegistry';

// Phase 6 Pages
import TraceabilityTimeline from './pages/TraceabilityTimeline';
import StorageMonitor from './pages/StorageMonitor';
import TransportTracker from './pages/TransportTracker';
import QuarantineManager from './pages/QuarantineManager';
import RecallManager from './pages/RecallManager';
import CorrectiveActions from './pages/CorrectiveActions';
import AlertCenter from './pages/AlertCenter';

// Phase 7 Pages
import QualityCommandCenter from './pages/QualityCommandCenter';
import AnalyticsCenter from './pages/AnalyticsCenter';
import ReportCenter from './pages/ReportCenter';

// Phase 8 Pages
import AIInsightCenter from './pages/AIInsightCenter';

// Placeholder for future phases
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="text-4xl">🚧</div>
    <div className="text-center">
      <h2 className="text-xl font-bold text-gray-700">{title}</h2>
      <p className="text-gray-400 text-sm mt-1">This module will be implemented in a future phase.</p>
    </div>
  </div>
);

const Protected = ({ children }) => (
  <ProtectedRoute><MainLayout>{children}</MainLayout></ProtectedRoute>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Phase 7: Professional Quality Command Center */}
          <Route path="/" element={<Protected><Navigate to="/dashboard" replace /></Protected>} />
          <Route path="/dashboard" element={<Protected><QualityCommandCenter /></Protected>} />
          <Route path="/quality-command-center" element={<Protected><QualityCommandCenter /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />

          {/* Phase 3: Core business modules */}
          <Route path="/manufacturers" element={<Protected><ManufacturerRegistry /></Protected>} />
          <Route path="/suppliers" element={<Protected><SupplierRegistry /></Protected>} />
          <Route path="/medicines" element={<Protected><ProductCatalog /></Protected>} />
          <Route path="/consumables" element={<Protected><ProductCatalog /></Protected>} />
          <Route path="/products" element={<Protected><ProductCatalog /></Protected>} />
          <Route path="/batches" element={<Protected><BatchIntelligence /></Protected>} />
          <Route path="/incoming-supplies" element={<Protected><IncomingSupplyControl /></Protected>} />

          {/* Phase 4: Quality Testing Foundation */}
          <Route path="/quality-standards" element={<Protected><QualityStandardLibrary /></Protected>} />
          <Route path="/quality-samples" element={<Protected><SampleControl /></Protected>} />
          <Route path="/quality-tests" element={<Protected><QualityTestWorkbench /></Protected>} />
          <Route path="/quality-history" element={<Protected><QualityTestHistory /></Protected>} />

          {/* Phase 5: Compliance Engine + Automated Quality Decision */}
          <Route path="/compliance" element={<Protected><ComplianceControl /></Protected>} />
          <Route path="/compliance/decisions" element={<Protected><ComplianceDecisionDetail /></Protected>} />
          <Route path="/compliance/rules" element={<Protected><ComplianceRuleLibrary /></Protected>} />
          <Route path="/certificates" element={<Protected><CertificateRegistry /></Protected>} />

          {/* Phase 6: Traceability, Storage, Transport, Quarantine, Recalls, CAPA, Alerts */}
          <Route path="/traceability" element={<Protected><TraceabilityTimeline /></Protected>} />
          <Route path="/storage" element={<Protected><StorageMonitor /></Protected>} />
          <Route path="/transport" element={<Protected><TransportTracker /></Protected>} />
          <Route path="/quarantine" element={<Protected><QuarantineManager /></Protected>} />
          <Route path="/recalls" element={<Protected><RecallManager /></Protected>} />
          <Route path="/corrective-actions" element={<Protected><CorrectiveActions /></Protected>} />
          <Route path="/alerts" element={<Protected><AlertCenter /></Protected>} />

          {/* Phase 7 & 8: Analytics, Report & AI Intelligence Centers */}
          <Route path="/analytics" element={<Protected><AnalyticsCenter /></Protected>} />
          <Route path="/reports" element={<Protected><ReportCenter /></Protected>} />
          <Route path="/ai-insights" element={<Protected><AIInsightCenter /></Protected>} />

          {/* Remaining placeholders */}
          {['/users', '/audit', '/settings'].map(path => (
            <Route key={path} path={path} element={
              <Protected>
                <ComingSoon title={path.slice(1).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
              </Protected>
            } />
          ))}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
