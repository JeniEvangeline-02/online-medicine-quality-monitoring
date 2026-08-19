import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';
import {
  Activity,
  ShieldCheck,
  RotateCcw,
  Bot,
  AlertTriangle,
  Package,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Lock,
  Boxes,
  Thermometer,
  Truck,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

const RISK_BADGES = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200 font-bold',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200 font-bold',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const DECISION_COLORS = {
  ACCEPTED: 'bg-emerald-600',
  QUARANTINED: 'bg-amber-500',
  REJECTED: 'bg-red-600',
  PENDING: 'bg-slate-400',
};

export default function QualityCommandCenter() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, matrix] = await Promise.all([
        apiGet('/dashboard/command-center', token),
        apiGet('/dashboard/risk-matrix', token),
      ]);
      setData(overview);
      setRiskData(matrix);
    } catch (err) {
      setError(err.detail || 'Failed to load command center data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold tracking-wider text-teal-800 uppercase">
          Initializing Clinical Quality Command Center...
        </span>
      </div>
    );
  }

  const health = data?.quality_health || { score: 100, status: 'EXCELLENT', formula_notes: '' };
  const overall = data?.overall_status || {};
  const decisionDist = data?.decision_distribution || {};
  const totalDecisions = Object.values(decisionDist).reduce((a, b) => a + b, 0) || 1;
  const filteredBatches = riskData?.batches?.filter(
    (b) => !selectedRiskFilter || b.risk_level === selectedRiskFilter
  ) || [];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* 1. Clinical Command Header */}
      <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-950 text-white rounded-3xl p-6 lg:p-8 border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-teal-600/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-widest">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hospital Quality &amp; Supply Command Center
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white mt-1">
              Pharmaceutical Quality Monitoring &amp; Incident Ops
            </h1>
            <p className="text-xs text-teal-200/80 mt-1 max-w-2xl leading-relaxed">
              Real-time automated compliance verification, laboratory testing records, cold-chain telemetry, and containment workflows.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-teal-950/60 backdrop-blur rounded-2xl px-4 py-2.5 border border-teal-700/40 text-right">
              <div className="text-[10px] uppercase font-bold text-teal-300/70">System Status</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {data?.system_status || 'OPERATIONAL'}
              </div>
            </div>

            <div className="bg-teal-950/60 backdrop-blur rounded-2xl px-4 py-2.5 border border-teal-700/40 text-right">
              <div className="text-[10px] uppercase font-bold text-teal-300/70">Last Synchronized</div>
              <div className="text-xs font-mono font-bold text-teal-100 mt-0.5">
                {data?.last_synced ? new Date(data.last_synced).toLocaleTimeString('en-IN') : 'Just now'}
              </div>
            </div>

            <button
              onClick={() => navigate('/ai-insights')}
              className="bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold px-4 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 border border-teal-500/40"
            >
              <Bot className="w-4 h-4 text-teal-200" />
              <span>AI Risk Insights</span>
            </button>

            <button
              onClick={loadData}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 border border-emerald-500/40"
            >
              <RotateCcw className="w-4 h-4 text-emerald-200" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. AI Intelligence Notice Bar */}
      <div className="bg-gradient-to-r from-teal-900 to-cyan-950 text-white rounded-2xl p-4 border border-teal-700/50 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">
              AI Risk Intelligence &amp; Predictive Anomaly Engine Active
            </div>
            <div className="text-xs text-teal-100/90 font-medium">
              Multi-factor vulnerability monitoring continuously scoring batches, cold storage, and transport routes.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-700/40">
            <span className="text-teal-300/70">Critical Risk: </span>
            <strong className="text-red-400 font-bold">{riskData?.matrix_counts?.CRITICAL || 0}</strong>
          </div>
          <div className="text-xs bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-700/40">
            <span className="text-teal-300/70">High Risk: </span>
            <strong className="text-orange-400 font-bold">{riskData?.matrix_counts?.HIGH || 0}</strong>
          </div>
          <button
            onClick={() => navigate('/ai-insights')}
            className="text-xs font-bold bg-white text-teal-950 hover:bg-teal-50 px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Open AI Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Executive Health Score & Decision Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quality Health Score Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Hospital Quality Health Score
              </h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              health.score >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              health.score >= 70 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {health.status}
            </span>
          </div>

          <div className="flex items-center justify-between gap-6 py-2">
            <div>
              <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                {health.score}
                <span className="text-2xl text-slate-400 font-bold">/100</span>
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                Composite Quality Safety Index
              </div>
            </div>

            <div className="text-right space-y-1 text-xs">
              <div className="text-slate-500">Active Recalls: <strong className="text-slate-900">{data?.alert_stream?.length || 0}</strong></div>
              <div className="text-slate-500">Excursion Rate: <strong className="text-slate-900">{data?.storage_health?.excursion_rate || 0}%</strong></div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-mono">
            {health.formula_notes || 'Score computed from verified lab tests, excursions, and automated compliance.'}
          </div>
        </div>

        {/* Phase 5 Automated Decision Engine Distribution */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-700" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Automated Decision Distribution (Phase 5 Engine)
              </h2>
            </div>
            <button
              onClick={() => navigate('/compliance/decisions')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <span>View History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stacked Percentage Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {['ACCEPTED', 'QUARANTINED', 'REJECTED', 'PENDING'].map((dec) => {
                const count = decisionDist[dec] || 0;
                const pct = (count / totalDecisions) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={dec}
                    style={{ width: `${pct}%` }}
                    className={`${DECISION_COLORS[dec]} transition-all duration-500`}
                    title={`${dec}: ${count} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { label: 'ACCEPTED', count: decisionDist.ACCEPTED || 0, color: 'bg-emerald-600', text: 'text-emerald-700' },
                { label: 'QUARANTINED', count: decisionDist.QUARANTINED || 0, color: 'bg-amber-500', text: 'text-amber-700' },
                { label: 'REJECTED', count: decisionDist.REJECTED || 0, color: 'bg-red-600', text: 'text-red-700' },
                { label: 'PENDING', count: decisionDist.PENDING || 0, color: 'bg-slate-400', text: 'text-slate-600' },
              ].map((item) => (
                <div key={item.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
                  </div>
                  <div className={`text-lg font-black mt-1 ${item.text}`}>{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Six Status KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Incoming Supplies', count: overall.total_incoming || 0, path: '/incoming-supplies', icon: Package, color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: 'In Lab Testing', count: overall.testing_in_lab || 0, path: '/quality-tests', icon: FlaskConical, color: 'text-cyan-700', bg: 'bg-cyan-50' },
          { label: 'Passed / Compliant', count: overall.passed || 0, path: '/batches', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Failed Tests', count: overall.failed || 0, path: '/quality-tests', icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-50' },
          { label: 'Quarantined Lots', count: overall.quarantined || 0, path: '/quarantine', icon: Lock, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Rejected Supplies', count: overall.rejected || 0, path: '/compliance/decisions', icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50' },
        ].map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={kpi.label}
              onClick={() => navigate(kpi.path)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-teal-400 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                  {kpi.count}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5 line-clamp-1">
                  {kpi.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Action Required Priority Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Urgent Clinical Action Queue ({data?.action_required?.length || 0})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Prioritized by Clinical Severity</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(!data?.action_required || data.action_required.length === 0) ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs font-medium">
              No urgent actions required. All storage and supply parameters are operating within validated thresholds.
            </div>
          ) : (
            data.action_required.map((act, idx) => (
              <div
                key={idx}
                onClick={() => act.action_url && navigate(act.action_url)}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    act.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                    act.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                    'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {act.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{act.type}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">{act.title}</div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{act.desc}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Risk Matrix & Batch Risk Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 4x4 Risk Matrix */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-teal-700" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Quality Risk Matrix
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Likelihood × Impact</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { level: 'CRITICAL', count: riskData?.matrix_counts?.CRITICAL || 0, color: 'bg-red-50 text-red-700 border-red-200' },
              { level: 'HIGH', count: riskData?.matrix_counts?.HIGH || 0, color: 'bg-orange-50 text-orange-700 border-orange-200' },
              { level: 'MEDIUM', count: riskData?.matrix_counts?.MEDIUM || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { level: 'LOW', count: riskData?.matrix_counts?.LOW || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map((m) => (
              <button
                key={m.level}
                onClick={() => setSelectedRiskFilter(selectedRiskFilter === m.level ? '' : m.level)}
                className={`p-4 rounded-2xl border text-center transition-all ${m.color} ${
                  selectedRiskFilter === m.level ? 'ring-2 ring-teal-600 font-black shadow-md' : 'hover:shadow-xs'
                }`}
              >
                <div className="text-2xl font-black">{m.count}</div>
                <div className="text-xs font-bold uppercase mt-0.5">{m.level} Risk</div>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Click a risk tile above to filter the batch monitor below.
          </p>
        </div>

        {/* Batch Risk Monitor Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-teal-700" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Batch Quality Risk Dossier ({filteredBatches.length})
              </h2>
            </div>
            {selectedRiskFilter && (
              <button
                onClick={() => setSelectedRiskFilter('')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
              >
                Clear Filter: {selectedRiskFilter} ✕
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-3.5 py-2.5">Batch</th>
                  <th className="px-3.5 py-2.5">Product &amp; Supplier</th>
                  <th className="px-3.5 py-2.5">Risk Score</th>
                  <th className="px-3.5 py-2.5">Risk Level</th>
                  <th className="px-3.5 py-2.5">Primary Reason</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No batch records match the selected risk criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.slice(0, 8).map((b) => (
                    <tr key={b.batch_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 font-mono font-bold text-teal-800">
                        {b.batch_number}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-slate-900">{b.product_name}</div>
                        <div className="text-slate-400 text-[11px]">{b.supplier_name}</div>
                      </td>
                      <td className="px-3.5 py-3 font-black text-slate-900">
                        {b.risk_score}/100
                      </td>
                      <td className="px-3.5 py-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] border ${RISK_BADGES[b.risk_level]}`}>
                          {b.risk_level}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-500 max-w-xs truncate text-[11px]">
                        {b.primary_factor}
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <button
                          onClick={() => navigate(`/traceability?entity_type=BATCH&entity_id=${b.batch_id}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-700 font-bold transition-all text-[11px]"
                        >
                          Trace →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 7. Cold Storage & Transport Telemetry Health Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Storage Facility Health */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Hospital Cold Storage Units</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {data?.storage_health?.total_locations || 0} Storage Facilities Active
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Excursions: <strong className="text-amber-600">{data?.storage_health?.excursions || 0}</strong> ({data?.storage_health?.excursion_rate || 0}% deviation rate)
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/storage')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-teal-700 hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            Monitor →
          </button>
        </div>

        {/* Transport Fleet Health */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">In-Transit Shipments</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {data?.transport_health?.active_shipments || 0} Active Shipments Monitored
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Excursions: <strong className="text-amber-600">{data?.transport_health?.shipments_with_excursions || 0}</strong> ({data?.transport_health?.excursion_rate || 0}%)
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/transport')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-teal-700 hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            Track →
          </button>
        </div>

      </div>

    </div>
  );
}
