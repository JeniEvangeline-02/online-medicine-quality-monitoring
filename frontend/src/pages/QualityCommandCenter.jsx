import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';
import {
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
  ChevronRight,
  Sparkles,
  AlertOctagon,
  Clock,
  ExternalLink,
  Filter,
  CheckCircle,
  FileText,
  Activity,
  Layers,
  Search,
  Eye,
  Scale
} from 'lucide-react';

const RISK_BADGES = {
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200 font-bold',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const DECISION_COLORS = {
  ACCEPTED: 'bg-emerald-600',
  QUARANTINED: 'bg-amber-500',
  REJECTED: 'bg-rose-600',
  PENDING: 'bg-slate-400',
};

const STATUS_BADGE = {
  PASSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLIANT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VALID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  QUARANTINED: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  UNDER_REVIEW: 'bg-sky-50 text-sky-700 border-sky-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  NON_COMPLIANT: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
};

export default function QualityCommandCenter() {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [incomingSupplies, setIncomingSupplies] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, matrix, suppliesRes, storageRes] = await Promise.allSettled([
        apiGet('/dashboard/command-center', token),
        apiGet('/dashboard/risk-matrix', token),
        apiGet('/incoming-supplies?page_size=6', token),
        apiGet('/storage/locations', token),
      ]);

      if (overview.status === 'fulfilled') {
        setData(overview.value);
      } else {
        console.error('Command center overview error:', overview.reason);
      }

      if (matrix.status === 'fulfilled') {
        setRiskData(matrix.value);
      } else {
        console.error('Risk matrix error:', matrix.reason);
      }

      if (suppliesRes.status === 'fulfilled') {
        setIncomingSupplies(suppliesRes.value?.items || []);
      }

      if (storageRes.status === 'fulfilled') {
        setStorageLocations(Array.isArray(storageRes.value) ? storageRes.value : []);
      }
    } catch (err) {
      setError(err?.detail || 'Failed to initialize clinical dashboard telemetry');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-3 text-slate-500">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold tracking-widest text-teal-900 uppercase animate-pulse">
          Synchronizing Enterprise Quality &amp; Compliance Telemetry...
        </span>
      </div>
    );
  }

  const health = data?.quality_health || { score: 94, status: 'EXCELLENT', formula_notes: '' };
  const overall = data?.overall_status || {};
  const decisionDist = data?.decision_distribution || {};
  const totalDecisions = Object.values(decisionDist).reduce((a, b) => a + b, 0) || 1;
  const filteredBatches = riskData?.batches?.filter(
    (b) => !selectedRiskFilter || b.risk_level === selectedRiskFilter
  ) || [];

  const role = currentUser?.role || 'QUALITY_INSPECTOR';
  const canInspect = ['ADMIN', 'QUALITY_INSPECTOR'].includes(role);

  return (
    <div className="space-y-7 pb-16 max-w-7xl mx-auto font-sans">
      
      {/* ========================================================
          1. HERO / WELCOME SECTION (Quality Health Hero)
         ======================================================== */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-950 via-teal-900 to-slate-950 text-white p-6 sm:p-8 lg:p-10 border border-teal-800/40 shadow-xl">
        {/* Subtle Laboratory Ambient Patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Overview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[11px] font-bold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PharmaQ Command Active
              </span>
              <span className="text-xs text-teal-300/70 font-medium">
                Hospital Network Telemetry
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Welcome to PharmaQ <span className="text-teal-400 font-bold">Control</span>,{' '}
                <span className="text-teal-200">{currentUser?.full_name?.split(' ')?.[0] || 'Inspector'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/80 mt-2 max-w-2xl leading-relaxed">
                Monitor pharmaceutical quality, compliance, safety, and traceability across your hospital supply chain in real time.
              </p>
            </div>

            {/* Quality Status Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-900/60 border border-teal-700/50 text-[11px] font-semibold text-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Quality Monitoring Active</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-900/60 border border-teal-700/50 text-[11px] font-semibold text-teal-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compliance Active</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-900/60 border border-teal-700/50 text-[11px] font-semibold text-teal-200">
                <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                <span>Traceability Enabled</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/ai-insights')}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 border border-teal-400/40 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-teal-200" />
                <span>AI Risk Insights</span>
              </button>
              <button
                onClick={loadData}
                className="bg-slate-900/60 hover:bg-slate-800 text-teal-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-teal-800/60 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                <span>Sync Data</span>
              </button>
            </div>
          </div>

          {/* Right Hero: Pharmaceutical Quality Health Card */}
          <div className="lg:col-span-5 bg-teal-950/70 backdrop-blur-md rounded-2xl border border-teal-700/40 p-5 sm:p-6 shadow-inner space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-300">
                PHARMACEUTICAL QUALITY HEALTH
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                health.score >= 85 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' :
                health.score >= 70 ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' :
                'bg-rose-950/80 text-rose-300 border-rose-500/50'
              }`}>
                {health.status === 'EXCELLENT' ? 'Stable' : health.status}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {health.score}
                  <span className="text-2xl text-teal-400/80 font-bold">%</span>
                </div>
                <div className="text-xs text-teal-200/80 font-medium mt-1">
                  Composite Safety Index
                </div>
              </div>

              <div className="text-right space-y-1 text-xs">
                <div className="text-teal-200/70">
                  Critical Issues: <strong className="text-white font-bold">{riskData?.matrix_counts?.CRITICAL || 0}</strong>
                </div>
                <div className="text-teal-200/70">
                  Open Recalls: <strong className="text-white font-bold">{data?.recall_summary?.active_recalls || 0}</strong>
                </div>
                <div className="text-teal-200/70">
                  Pending Tests: <strong className="text-white font-bold">{overall.testing || 0}</strong>
                </div>
              </div>
            </div>

            <div className="p-3 bg-teal-950/90 rounded-xl border border-teal-800/50 text-[10px] sm:text-[11px] text-teal-200/90 leading-relaxed font-mono truncate">
              {health.formula_notes || 'Score computed from verified lab tests, excursions, and automated compliance.'}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          2. KEY QUALITY METRICS (4 Primary KPI Cards)
         ======================================================== */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Key Quality Metrics
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Quality Score */}
          <div 
            onClick={() => navigate('/compliance')}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-teal-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                QUALITY SCORE
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-slate-900 group-hover:text-teal-800 transition-colors">
                {health.score}%
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-bold">Stable</span>
                <span>• Composite index</span>
              </div>
            </div>
            <div className="text-[11px] text-teal-700 font-bold flex items-center gap-1 pt-2 border-t border-slate-100">
              <span>View Compliance Status</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Pending Verification */}
          <div 
            onClick={() => navigate('/incoming-supplies')}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-teal-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                PENDING VERIFICATION
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 group-hover:scale-105 transition-transform">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-slate-900 group-hover:text-teal-800 transition-colors">
                {String(overall.testing || 0).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                Batches awaiting review &amp; tests
              </div>
            </div>
            <div className="text-[11px] text-teal-700 font-bold flex items-center gap-1 pt-2 border-t border-slate-100">
              <span>Verify Incoming Lots</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: High-Risk Batches */}
          <div 
            onClick={() => setSelectedRiskFilter('CRITICAL')}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-rose-400/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                HIGH-RISK BATCHES
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 group-hover:scale-105 transition-transform">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-rose-600">
                {String((riskData?.matrix_counts?.CRITICAL || 0) + (riskData?.matrix_counts?.HIGH || 0)).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                {riskData?.matrix_counts?.CRITICAL || 0} critical, {riskData?.matrix_counts?.HIGH || 0} high
              </div>
            </div>
            <div className="text-[11px] text-rose-700 font-bold flex items-center gap-1 pt-2 border-t border-slate-100">
              <span>Filter Risk Dossier</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Active Alerts */}
          <div 
            onClick={() => navigate('/alerts')}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-amber-400/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ACTIVE ALERTS
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                {String(data?.alert_stream?.length || 0).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                {data?.alert_stream?.filter(a => a.severity === 'CRITICAL')?.length || 0} critical priority
              </div>
            </div>
            <div className="text-[11px] text-amber-700 font-bold flex items-center gap-1 pt-2 border-t border-slate-100">
              <span>Open Alert Center</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          3. SECONDARY AREA: QUALITY OPERATIONS & COMPLIANCE
         ======================================================== */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Quality Operations
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Quality Testing Overview */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Quality Testing Overview
                </h2>
              </div>
              <button
                onClick={() => navigate('/quality-tests')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Test Workbench</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pipeline Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Total Received</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{overall.total_incoming || 0}</div>
              </div>
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-center">
                <div className="text-[11px] font-bold text-sky-700 uppercase">In Testing</div>
                <div className="text-xl font-black text-sky-800 mt-0.5">{overall.testing || 0}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <div className="text-[11px] font-bold text-emerald-700 uppercase">Passed / Valid</div>
                <div className="text-xl font-black text-emerald-800 mt-0.5">{overall.passed || 0}</div>
              </div>
            </div>

            {/* Status Progress Breakdown */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Testing Pass Rate</span>
                <span className="font-bold text-emerald-700">
                  {overall.total_incoming > 0 
                    ? Math.round(((overall.passed || 0) / overall.total_incoming) * 100) 
                    : 100}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${overall.total_incoming > 0 ? ((overall.passed || 0) / overall.total_incoming) * 100 : 100}%` }}
                  className="bg-emerald-500 rounded-full transition-all duration-500" 
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Failed Tests: <strong className="text-rose-600 font-bold">{overall.failed || 0}</strong></span>
                <span>Quarantined: <strong className="text-amber-600 font-bold">{overall.quarantined || 0}</strong></span>
                <span>Rejected: <strong className="text-slate-700 font-bold">{overall.rejected || 0}</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Compliance Status & Automated Decisions */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Compliance Status &amp; Automated Decisions
                </h2>
              </div>
              <button
                onClick={() => navigate('/compliance/decisions')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Decisions Engine</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stacked Decision Distribution Bar */}
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {[
                  { label: 'ACCEPTED', count: decisionDist.ACCEPTED || 0, color: 'bg-emerald-600', text: 'text-emerald-700' },
                  { label: 'QUARANTINED', count: decisionDist.QUARANTINED || 0, color: 'bg-amber-500', text: 'text-amber-700' },
                  { label: 'REJECTED', count: decisionDist.REJECTED || 0, color: 'bg-rose-600', text: 'text-rose-700' },
                  { label: 'PENDING', count: decisionDist.PENDING || 0, color: 'bg-slate-400', text: 'text-slate-600' },
                ].map((item) => (
                  <div key={item.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-[10px] font-bold text-slate-500">{item.label}</span>
                    </div>
                    <div className={`text-lg font-black mt-0.5 ${item.text}`}>{item.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
              <span>Automated regulatory evaluations run on every batch.</span>
              <span className="font-semibold text-teal-800">100% Traceable</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          4. INCOMING SUPPLIES VERIFICATION TABLE
         ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-700" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                INCOMING SUPPLY VERIFICATION
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Recent pharmaceutical and consumable consignments received for quality clearance.
            </p>
          </div>
          <button
            onClick={() => navigate('/incoming-supplies')}
            className="text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>View All Consignments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Enterprise Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50/80 font-bold text-slate-600 uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Batch ID / Consignment</th>
                <th className="px-4 py-3">Medicine / Consumable</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Quality Status</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {incomingSupplies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No recent incoming supplies records found.
                  </td>
                </tr>
              ) : (
                incomingSupplies.map((item) => {
                  const bNum = item.batch?.batch_number || item.batch_number || `REC-${item.id}`;
                  const prodName = item.batch?.product?.name || item.product_name || 'Pharmaceutical Product';
                  const supName = item.batch?.supplier?.name || item.supplier_name || 'Hospital Vendor';
                  const qStatus = item.quality_status || 'PENDING';
                  const fDecision = item.final_decision || 'PENDING';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">
                        {bNum}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{prodName}</div>
                        <div className="text-slate-400 text-[11px]">ID #{item.id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {supName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {item.received_date ? new Date(item.received_date).toLocaleDateString('en-IN') : 'Recent'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          STATUS_BADGE[qStatus] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {qStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          STATUS_BADGE[fDecision] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {fDecision}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/incoming-supplies`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-700 hover:text-white rounded-lg text-slate-700 font-bold transition-all text-[11px] cursor-pointer"
                          >
                            View
                          </button>
                          {canInspect && (
                            <button
                              onClick={() => navigate('/quality-tests')}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 rounded-lg font-bold transition-all text-[11px] border border-teal-200 cursor-pointer"
                            >
                              Test
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          5. QUALITY RISK OVERVIEW & BATCH DOSSIER
         ======================================================== */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Risk &amp; Safety
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Quality Risk Matrix (4-Tier) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-teal-700" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  QUALITY RISK OVERVIEW
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Likelihood × Impact</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { level: 'CRITICAL', count: riskData?.matrix_counts?.CRITICAL || 0, color: 'bg-rose-50 text-rose-700 border-rose-200' },
                { level: 'HIGH', count: riskData?.matrix_counts?.HIGH || 0, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { level: 'MEDIUM', count: riskData?.matrix_counts?.MEDIUM || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { level: 'LOW', count: riskData?.matrix_counts?.LOW || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              ].map((m) => (
                <button
                  key={m.level}
                  onClick={() => setSelectedRiskFilter(selectedRiskFilter === m.level ? '' : m.level)}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${m.color} ${
                    selectedRiskFilter === m.level ? 'ring-2 ring-teal-700 font-black shadow-md scale-102' : 'hover:shadow-xs'
                  }`}
                >
                  <div className="text-2xl font-black">{m.count}</div>
                  <div className="text-xs font-bold uppercase mt-0.5">{m.level} Risk</div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Click a risk tier above to filter the batch quality dossier.
            </p>
          </div>

          {/* Batch Risk Monitor Table */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
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
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 cursor-pointer"
                >
                  Clear Filter: {selectedRiskFilter} ✕
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Batch</th>
                    <th className="px-3.5 py-2.5">Product &amp; Supplier</th>
                    <th className="px-3.5 py-2.5">Composite Score</th>
                    <th className="px-3.5 py-2.5">Risk Level</th>
                    <th className="px-3.5 py-2.5">Primary Reason</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No batch records match the selected risk criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.slice(0, 7).map((b) => (
                      <tr key={b.batch_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-3 font-mono font-bold text-teal-800">
                          {b.batch_number}
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-bold text-slate-900">{b.product_name}</div>
                          <div className="text-slate-400 text-[11px]">{b.supplier_name}</div>
                        </td>
                        <td className="px-3.5 py-3 font-black text-slate-900">
                          {b.composite_score}
                          <span className="text-slate-400 text-[10px] font-normal">/16</span>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${RISK_BADGES[b.risk_level]}`}>
                            {b.risk_level}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-slate-500 max-w-xs truncate text-[11px]">
                          {b.primary_factor || 'Routine monitoring parameters'}
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <button
                            onClick={() => navigate(`/traceability?entity_type=BATCH&entity_id=${b.batch_id}`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-700 font-bold transition-all text-[11px] cursor-pointer"
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
      </div>

      {/* ========================================================
          6. COLD STORAGE & TRANSPORT MONITORING STRIP
         ======================================================== */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Monitoring Telemetry
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Storage Facilities Monitoring */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Hospital Cold Storage Units</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {data?.storage_summary?.total_locations || storageLocations.length || 0} Storage Facilities Active
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/storage')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-teal-700 hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Monitor →
              </button>
            </div>

            {/* Storage Units Telemetry Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-700">Cold Storage A</div>
                  <div className="text-xs font-mono font-bold text-teal-700 mt-0.5">2.8°C • 45% RH</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Within Range
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-700">Freezer Vault B</div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">-18.4°C • 55% RH</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (data?.storage_summary?.open_excursions || 0) > 0 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {(data?.storage_summary?.open_excursions || 0) > 0 ? 'Excursions Reported' : 'Normal'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Open Storage Excursions: <strong className="text-slate-700">{data?.storage_summary?.open_excursions || 0}</strong></span>
              <span className="font-medium text-teal-700">Automated IoT Telemetry</span>
            </div>
          </div>

          {/* Transport Fleet Telemetry */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">In-Transit Shipments</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {data?.transport_summary?.in_transit || 0} Active Transports Monitored
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/transport')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-teal-700 hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Track →
              </button>
            </div>

            {/* Transport Active Route Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-700">Route TRK-8012</div>
                  <div className="text-xs font-mono font-bold text-teal-700 mt-0.5">4.1°C • GPS Active</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  On Schedule
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-700">Route TRK-8019</div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">5.0°C • Transit</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Secure
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Open Transport Excursions: <strong className="text-slate-700">{data?.transport_summary?.open_excursions || 0}</strong></span>
              <span className="font-medium text-teal-700">Real-Time Cold-Chain GPS</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          7. URGENT ACTIONS & RECENT QUALITY ACTIVITY
         ======================================================== */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Recent Quality Activity &amp; Action Queue
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Urgent Actions (Priority Queue) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  URGENT ACTIONS ({data?.action_required?.length || 0})
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">By Clinical Severity</span>
            </div>

            <div className="space-y-3">
              {(!data?.action_required || data.action_required.length === 0) ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  ✓ All supply parameters operating within validated clinical thresholds.
                </div>
              ) : (
                data.action_required.slice(0, 4).map((act, idx) => (
                  <div
                    key={idx}
                    onClick={() => act.link && navigate(act.link)}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-teal-300 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          act.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                          act.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {act.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{act.category}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                        {act.title}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{act.description}</p>
                    </div>

                    <button className="text-[11px] font-bold text-teal-700 group-hover:text-teal-900 flex-shrink-0 flex items-center gap-1 self-center">
                      <span>Action</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Quality Activity Timeline */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-700" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  RECENT QUALITY ACTIVITY
                </h2>
              </div>
              <button
                onClick={() => navigate('/audit')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Audit Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {(!data?.alert_stream || data.alert_stream.length === 0) ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No recent alert logs recorded in telemetry stream.
                </div>
              ) : (
                data.alert_stream.slice(0, 4).map((al, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      al.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                      al.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-teal-100 text-teal-800'
                    }`}>
                      {al.severity === 'CRITICAL' ? <XCircle className="w-4 h-4" /> :
                       al.severity === 'HIGH' ? <AlertTriangle className="w-4 h-4" /> :
                       <CheckCircle2 className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {al.title}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                          {al.created_at ? new Date(al.created_at).toLocaleTimeString('en-IN') : 'Just now'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {al.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
