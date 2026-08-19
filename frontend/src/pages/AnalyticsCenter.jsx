import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';
import {
  BarChart3,
  Microscope,
  Scale,
  Factory,
  Pill,
  Warehouse,
  Container,
  AlertTriangle,
  Calendar,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  FileCheck
} from 'lucide-react';

export default function AnalyticsCenter() {
  const { token } = useAuth();
  const [tab, setTab] = useState('quality');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [qualityData, setQualityData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [supplierData, setSupplierData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [storageData, setStorageData] = useState(null);
  const [transportData, setTransportData] = useState(null);
  const [recallData, setRecallData] = useState(null);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'quality') {
        const q = await apiGet(`/analytics/quality?days=${days}`, token);
        setQualityData(q);
      } else if (tab === 'compliance') {
        const c = await apiGet(`/analytics/compliance?days=${days}`, token);
        setComplianceData(c);
      } else if (tab === 'suppliers') {
        const s = await apiGet('/analytics/suppliers', token);
        setSupplierData(Array.isArray(s) ? s : []);
      } else if (tab === 'products') {
        const p = await apiGet('/analytics/products', token);
        setProductData(Array.isArray(p) ? p : []);
      } else if (tab === 'storage') {
        const st = await apiGet('/analytics/storage', token);
        setStorageData(st);
      } else if (tab === 'transport') {
        const tr = await apiGet('/analytics/transport', token);
        setTransportData(tr);
      } else if (tab === 'recalls') {
        const rc = await apiGet('/analytics/recalls', token);
        setRecallData(rc);
      }
    } catch (err) {
      setError(err.detail || 'Failed to fetch analytics dataset');
    } finally {
      setLoading(false);
    }
  }, [tab, days, token]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
            Quality Operations &amp; Intelligence
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Pharmaceutical Analytics Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated trends across laboratory tests, compliance evaluations, cold-chain telemetry, and vendor performance
          </p>
        </div>

        {/* Time Window Selector */}
        {['quality', 'compliance'].includes(tab) && (
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            {[
              { label: '7D', val: 7 },
              { label: '30D', val: 30 },
              { label: '90D', val: 90 },
              { label: '1 Year', val: 365 },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => setDays(t.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  days === t.val
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Domain Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'quality', label: 'Laboratory Quality', icon: Microscope },
          { id: 'compliance', label: 'Compliance & Rules', icon: Scale },
          { id: 'suppliers', label: 'Supplier Scorecards', icon: Factory },
          { id: 'products', label: 'Product Profiles', icon: Pill },
          { id: 'storage', label: 'Cold Storage', icon: Warehouse },
          { id: 'transport', label: 'Transport In-Transit', icon: Container },
          { id: 'recalls', label: 'Recall Velocity', icon: AlertTriangle },
        ].map((t) => {
          const IconComp = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-teal-950 shadow-xs border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Analytics View Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-xs min-h-[420px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-xs font-semibold gap-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span>Aggregating multi-dimensional clinical telemetry...</span>
          </div>
        ) : tab === 'quality' && qualityData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="text-xs text-slate-500 font-bold uppercase">Total Lab Tests</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{qualityData.summary.total_tests}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="text-xs text-emerald-700 font-bold uppercase">Pass Rate</div>
                <div className="text-3xl font-black text-emerald-800 mt-1">{qualityData.summary.pass_rate}%</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="text-xs text-red-700 font-bold uppercase">Failed Tests</div>
                <div className="text-3xl font-black text-red-800 mt-1">{qualityData.summary.failed_tests}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="text-xs text-amber-700 font-bold uppercase">Critical Defects</div>
                <div className="text-3xl font-black text-amber-800 mt-1">{qualityData.summary.critical_failures}</div>
              </div>
            </div>

            {/* Time-Series Daily Trend Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Daily Laboratory Quality Trends ({days} Days)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Total Tests</th>
                      <th className="px-4 py-2.5">Passed</th>
                      <th className="px-4 py-2.5">Failed</th>
                      <th className="px-4 py-2.5">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {qualityData.trend.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{row.date}</td>
                        <td className="px-4 py-3 font-semibold">{row.total}</td>
                        <td className="px-4 py-3 text-emerald-700 font-bold">{row.passed}</td>
                        <td className="px-4 py-3 text-red-600 font-bold">{row.failed}</td>
                        <td className="px-4 py-3 font-mono font-bold">{row.pass_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : tab === 'compliance' && complianceData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="text-xs text-slate-500 font-bold uppercase">Evaluations</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{complianceData.evaluations.total}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="text-xs text-emerald-700 font-bold uppercase">Compliance Rate</div>
                <div className="text-3xl font-black text-emerald-800 mt-1">{complianceData.evaluations.compliance_rate}%</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="text-xs text-amber-700 font-bold uppercase">Rule Warnings</div>
                <div className="text-3xl font-black text-amber-800 mt-1">{complianceData.evaluations.warnings}</div>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
                <div className="text-xs text-teal-700 font-bold uppercase">Valid Certificates</div>
                <div className="text-3xl font-black text-teal-800 mt-1">{complianceData.certificates.valid}</div>
              </div>
            </div>

            {/* Top Failed Rules Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Top Failed Compliance Rules
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Rule Code</th>
                      <th className="px-4 py-2.5">Rule Name</th>
                      <th className="px-4 py-2.5">Severity</th>
                      <th className="px-4 py-2.5">Violations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complianceData.top_failed_rules.length === 0 ? (
                      <tr><td colSpan={4} className="py-6 text-center text-slate-400">Zero rule failures recorded.</td></tr>
                    ) : (
                      complianceData.top_failed_rules.map((rf) => (
                        <tr key={rf.rule_code} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-teal-800">{rf.rule_code}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{rf.rule_name}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">{rf.severity}</span></td>
                          <td className="px-4 py-3 font-black text-red-700">{rf.failure_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : tab === 'suppliers' ? (
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              Supplier Performance Scorecards
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                  <tr>
                    {['Supplier Name', 'Total Deliveries', 'Accepted', 'Rejected', 'Defect Rate', 'Rating'].map((h) => (
                      <th key={h} className="px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierData.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                      <td className="px-4 py-3 font-semibold">{s.total_supplies}</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">{s.accepted_supplies}</td>
                      <td className="px-4 py-3 text-red-600 font-bold">{s.rejected_supplies}</td>
                      <td className="px-4 py-3 font-mono font-bold">{s.defect_rate}%</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-extrabold text-[11px]">{s.quality_rating}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'products' ? (
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              Product Quality &amp; Defect Vulnerability
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                  <tr>
                    {['Product Code', 'Name', 'Category', 'Total Batches', 'Failures', 'Defect Rate'].map((h) => (
                      <th key={h} className="px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">{p.product_code}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.category}</td>
                      <td className="px-4 py-3 font-semibold">{p.total_batches}</td>
                      <td className="px-4 py-3 text-red-600 font-bold">{p.failed_batches}</td>
                      <td className="px-4 py-3 font-mono font-bold">{p.defect_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'storage' && storageData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="text-xs text-slate-500 font-bold uppercase">Total Facilities</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{storageData.total_locations}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="text-xs text-emerald-700 font-bold uppercase">Normal Telemetry</div>
                <div className="text-3xl font-black text-emerald-800 mt-1">{storageData.normal_locations}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="text-xs text-amber-700 font-bold uppercase">Active Excursions</div>
                <div className="text-3xl font-black text-amber-800 mt-1">{storageData.active_excursions}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="text-xs text-red-700 font-bold uppercase">Critical Units</div>
                <div className="text-3xl font-black text-red-800 mt-1">{storageData.critical_locations}</div>
              </div>
            </div>
          </div>
        ) : tab === 'transport' && transportData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="text-xs text-slate-500 font-bold uppercase">Monitored Shipments</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{transportData.summary.total_shipments}</div>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
                <div className="text-xs text-teal-700 font-bold uppercase">Active In-Transit</div>
                <div className="text-3xl font-black text-teal-800 mt-1">{transportData.summary.in_transit}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="text-xs text-amber-700 font-bold uppercase">Transit Excursions</div>
                <div className="text-3xl font-black text-amber-800 mt-1">{transportData.summary.excursions_logged}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="text-xs text-emerald-700 font-bold uppercase">Integrity Index</div>
                <div className="text-3xl font-black text-emerald-800 mt-1">{transportData.summary.integrity_rate}%</div>
              </div>
            </div>
          </div>
        ) : tab === 'recalls' && recallData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="text-xs text-slate-500 font-bold uppercase">Total Directives</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{recallData.summary.total_recalls}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="text-xs text-red-700 font-bold uppercase">Active Campaigns</div>
                <div className="text-3xl font-black text-red-800 mt-1">{recallData.summary.active_recalls}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="text-xs text-emerald-700 font-bold uppercase">Completed Recalls</div>
                <div className="text-3xl font-black text-emerald-800 mt-1">{recallData.summary.completed_recalls}</div>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
                <div className="text-xs text-teal-700 font-bold uppercase">Containment Velocity</div>
                <div className="text-3xl font-black text-teal-800 mt-1">{recallData.summary.average_containment_percent}%</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}
