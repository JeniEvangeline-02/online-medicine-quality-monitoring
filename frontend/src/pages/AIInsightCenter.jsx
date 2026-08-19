import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';
import {
  Bot,
  Zap,
  Package,
  Factory,
  Pill,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  TrendingUp,
  Info,
  ChevronRight
} from 'lucide-react';

const RISK_BADGES = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200 font-bold',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200 font-bold',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const ANOMALY_BADGES = {
  QUALITY_ANOMALY: 'bg-purple-50 text-purple-700 border-purple-200',
  STORAGE_ANOMALY: 'bg-blue-50 text-blue-700 border-blue-200',
  TRANSPORT_ANOMALY: 'bg-teal-50 text-teal-700 border-teal-200',
  SUPPLIER_ANOMALY: 'bg-amber-50 text-amber-700 border-amber-200',
  RECALL_ANOMALY: 'bg-red-50 text-red-700 border-red-200',
  COMPLIANCE_ANOMALY: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AIInsightCenter() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const [overview, setOverview] = useState(null);
  const [batchRisks, setBatchRisks] = useState([]);
  const [supplierRisks, setSupplierRisks] = useState([]);
  const [productRisks, setProductRisks] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [earlyWarnings, setEarlyWarnings] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [updatingAnomaly, setUpdatingAnomaly] = useState(null);
  const [anomalyStatus, setAnomalyStatus] = useState('INVESTIGATING');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const data = await apiGet('/ai/overview', token);
        setOverview(data);
      } else if (tab === 'batches') {
        const data = await apiGet('/ai/batches', token);
        setBatchRisks(Array.isArray(data) ? data : []);
      } else if (tab === 'suppliers') {
        const data = await apiGet('/ai/suppliers', token);
        setSupplierRisks(Array.isArray(data) ? data : []);
      } else if (tab === 'products') {
        const data = await apiGet('/ai/products', token);
        setProductRisks(Array.isArray(data) ? data : []);
      } else if (tab === 'anomalies') {
        const data = await apiGet('/ai/anomalies', token);
        setAnomalies(Array.isArray(data) ? data : []);
      } else if (tab === 'warnings') {
        const data = await apiGet('/ai/early-warnings', token);
        setEarlyWarnings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.detail || 'Failed to load AI Intelligence data');
    } finally {
      setLoading(false);
    }
  }, [tab, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await apiPost('/ai/recalculate', {}, token);
      loadData();
    } catch (err) {
      setError(err.detail || 'Failed to trigger recalculation');
    } finally {
      setRecalculating(false);
    }
  };

  const handleUpdateAnomaly = async () => {
    if (!updatingAnomaly) return;
    try {
      await apiPut(
        `/ai/anomalies/${updatingAnomaly.id}/status?status=${anomalyStatus}&resolution_notes=${encodeURIComponent(resolutionNotes)}`,
        {},
        token
      );
      setUpdatingAnomaly(null);
      setResolutionNotes('');
      loadData();
    } catch (err) {
      setError(err.detail || 'Failed to update anomaly status');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-950 text-white rounded-3xl p-6 lg:p-8 border border-teal-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-widest">
            <Bot className="w-4 h-4 text-teal-400" />
            AI Risk Intelligence &amp; Predictive Analytics Engine
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white mt-1">
            Explainable Pharmaceutical Risk Center
          </h1>
          <p className="text-xs text-teal-200/80 mt-1 max-w-2xl leading-relaxed">
            Multi-factor batch scoring, statistical anomaly detection, vendor reliability, and predictive early warnings.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-right text-xs text-teal-300/70 hidden sm:block bg-teal-950/60 px-4 py-2 rounded-2xl border border-teal-700/40">
            <div>Model: <strong className="text-teal-200 font-mono">risk-engine-v1</strong></div>
            <div>Phase 5 Rule Authority: <strong className="text-emerald-400">ACTIVE</strong></div>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 border border-teal-500/40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Analyzing Telemetry...' : 'Run Risk Analysis'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'overview', label: 'Risk Intelligence Overview', icon: Zap },
          { id: 'batches', label: 'Batch Risk Scoring', icon: Package },
          { id: 'suppliers', label: 'Supplier Reliability', icon: Factory },
          { id: 'products', label: 'Product Vulnerability', icon: Pill },
          { id: 'anomalies', label: 'Anomaly Detection Feed', icon: AlertTriangle },
          { id: 'warnings', label: 'Predictive Early Warnings', icon: Sparkles },
        ].map((t) => {
          const IconComponent = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-teal-900 shadow-xs border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-xs min-h-[420px]">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs font-semibold gap-2">
            <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span>Evaluating multi-factor risk models...</span>
          </div>
        ) : tab === 'overview' && overview ? (
          <div className="space-y-6">
            
            {/* KPI Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="text-xs text-slate-500 font-bold uppercase">Average System Risk</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{overview.average_risk_score}/100</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="text-xs text-red-700 font-bold uppercase">Critical-Risk Batches</div>
                <div className="text-3xl font-black text-red-800 mt-1">{overview.critical_risk_batches}</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                <div className="text-xs text-orange-700 font-bold uppercase">High-Risk Batches</div>
                <div className="text-3xl font-black text-orange-800 mt-1">{overview.high_risk_batches}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="text-xs text-amber-700 font-bold uppercase">Active Anomalies</div>
                <div className="text-3xl font-black text-amber-800 mt-1">{overview.open_anomalies_count}</div>
              </div>
            </div>

            {/* Architecture Explainer Notice */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 flex items-start gap-3">
              <Info className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Deterministic Compliance Authority Principle:</strong>
                <p className="mt-0.5 text-teal-900 leading-relaxed">
                  Phase 5 automated regulatory verdicts (<code className="font-bold">ACCEPTED</code>, <code className="font-bold">QUARANTINED</code>, <code className="font-bold">REJECTED</code>) remain strictly authoritative. Phase 8 AI computes multi-factor vulnerability scores and early warnings without overriding regulatory decisions.
                </p>
              </div>
            </div>

            {/* Early Warning Preview Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Active Early Warnings ({overview.early_warnings.length})
              </h3>
              <div className="space-y-3">
                {overview.early_warnings.length === 0 ? (
                  <div className="text-slate-400 text-xs py-6 text-center">
                    No active early warnings detected. Supply chain operating normally.
                  </div>
                ) : (
                  overview.early_warnings.map((w) => (
                    <div key={w.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RISK_BADGES[w.risk_level] || 'bg-slate-100'}`}>
                            {w.risk_level}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{w.title}</span>
                        </div>
                        <p className="text-xs text-slate-600">{w.issue}</p>
                        <div className="text-[11px] text-slate-400">Evidence: {w.evidence}</div>
                        <div className="text-xs text-teal-900 font-semibold pt-1">Advisory: {w.recommended_action}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : tab === 'batches' ? (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Explainable Batch Risk Profiles
            </h3>

            {/* Batch Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['Batch Number', 'Product & Supplier', 'Risk Score', 'Risk Level', 'Confidence', 'Regulatory Decision', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-bold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchRisks.map((b) => (
                    <tr key={b.batch_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">{b.batch_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{b.product_name}</div>
                        <div className="text-slate-400 text-[11px]">{b.supplier_name}</div>
                      </td>
                      <td className="px-4 py-3 font-black text-sm text-slate-900">{b.risk_score}/100</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] border ${RISK_BADGES[b.risk_level]}`}>
                          {b.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {b.confidence_score}%
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">
                        {b.compliance_decision}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedBatch(b)}
                          className="bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-700 px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer"
                        >
                          Explain Risk →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Batch Explainability Modal */}
            {selectedBatch && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 lg:p-8 space-y-5 border border-slate-200">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">AI Explainable Risk Dossier</div>
                      <h2 className="text-xl font-black text-slate-900 mt-0.5">Batch {selectedBatch.batch_number}</h2>
                      <div className="text-xs text-slate-400">{selectedBatch.product_name} ({selectedBatch.supplier_name})</div>
                    </div>
                    <button onClick={() => setSelectedBatch(null)} className="text-slate-400 hover:text-slate-600 p-1">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Calculated Risk Index</div>
                      <div className="text-3xl font-black text-slate-900 mt-0.5">{selectedBatch.risk_score} / 100</div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${RISK_BADGES[selectedBatch.risk_level]}`}>
                      {selectedBatch.risk_level} RISK
                    </span>
                  </div>

                  {/* Factor Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Factor Contributions</h4>
                    <div className="space-y-1.5">
                      {Object.entries(selectedBatch.factors || {}).map(([fact, val]) => (
                        <div key={fact} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-xs">
                          <span className="text-slate-700 font-medium">{fact}</span>
                          <span className="font-mono font-bold text-red-700">+{val} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Natural Language Explanation */}
                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
                    <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider mb-1">AI Reasoning &amp; Justification</h4>
                    <p className="text-xs text-teal-950 leading-relaxed font-medium">{selectedBatch.explanation}</p>
                  </div>

                  {/* Advisory Recommendations */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Advisory Recommendations</h4>
                    <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                      {selectedBatch.recommendations?.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        navigate(`/traceability?entity_type=BATCH&entity_id=${selectedBatch.batch_id}`);
                        setSelectedBatch(null);
                      }}
                      className="px-4 py-2 bg-teal-800 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-all cursor-pointer"
                    >
                      Open Full Traceability →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : tab === 'suppliers' ? (
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              Supplier Risk &amp; Reliability Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['Supplier', 'Deliveries', 'Rejection Rate', 'Risk Score', 'Risk Level', 'Confidence Reason', 'AI Assessment'].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-bold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierRisks.map((s) => (
                    <tr key={s.supplier_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{s.total_supplies}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{s.rejection_rate}%</td>
                      <td className="px-4 py-3 font-black text-slate-900">{s.risk_score}/100</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] border ${RISK_BADGES[s.risk_level]}`}>{s.risk_level}</span></td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{s.confidence_reason}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{s.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'products' ? (
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              Product Vulnerability Assessment
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['Product Code', 'Name', 'Type', 'Total Tests', 'Fail Rate', 'Risk Score', 'Risk Level', 'AI Explanation'].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-bold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productRisks.map((p) => (
                    <tr key={p.product_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">{p.product_code}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.product_type}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{p.total_tests}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{p.fail_rate}%</td>
                      <td className="px-4 py-3 font-black text-slate-900">{p.risk_score}/100</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] border ${RISK_BADGES[p.risk_level]}`}>{p.risk_level}</span></td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{p.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'anomalies' ? (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quality &amp; Supply Chain Anomaly Feed
            </h3>
            <div className="space-y-3">
              {anomalies.map((an) => (
                <div key={an.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ANOMALY_BADGES[an.anomaly_type] || 'bg-slate-100 text-slate-600'}`}>
                        {an.anomaly_type}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RISK_BADGES[an.severity] || 'bg-slate-100'}`}>
                        {an.severity}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-slate-200 text-slate-700">
                        {an.status}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(an.detected_at).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{an.description}</p>
                    {an.evidence && <div className="text-[11px] text-slate-400">Evidence: {an.evidence}</div>}
                    {an.resolution_notes && (
                      <div className="text-xs text-emerald-700 font-medium">Notes: {an.resolution_notes}</div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setUpdatingAnomaly(an);
                      setAnomalyStatus(an.status);
                      setResolutionNotes(an.resolution_notes || '');
                    }}
                    className="text-xs font-bold bg-slate-200 hover:bg-teal-700 hover:text-white text-slate-800 px-3 py-1.5 rounded-xl transition-all flex-shrink-0 cursor-pointer"
                  >
                    Update Status
                  </button>
                </div>
              ))}
            </div>

            {/* Anomaly Status Update Modal */}
            {updatingAnomaly && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-900 text-sm">Update Anomaly #{updatingAnomaly.id}</h3>
                    <button onClick={() => setUpdatingAnomaly(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                    <select
                      value={anomalyStatus}
                      onChange={(e) => setAnomalyStatus(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                    >
                      {['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'].map((st) => (
                        <option key={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Resolution / Notes</label>
                    <textarea
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Detail corrective actions or investigative findings..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setUpdatingAnomaly(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateAnomaly}
                      className="px-4 py-2 bg-teal-800 text-white text-xs font-bold rounded-xl hover:bg-teal-700 cursor-pointer"
                    >
                      Save Status
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Predictive Early Warning Intelligence
            </h3>
            <div className="space-y-3">
              {earlyWarnings.map((w) => (
                <div key={w.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-xs">{w.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RISK_BADGES[w.risk_level]}`}>
                      {w.risk_level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{w.issue}</p>
                  <div className="text-[11px] text-slate-400">Evidence: {w.evidence}</div>
                  <div className="text-xs text-teal-900 font-semibold bg-teal-50 p-2.5 rounded-xl border border-teal-100">
                    Recommended Mitigation: {w.recommended_action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
