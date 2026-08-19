import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Zap,
  Microscope,
  Scale,
  Truck,
  Boxes,
  Factory,
  Building,
  Warehouse,
  Container,
  Lock,
  AlertTriangle,
  Wrench,
  ScrollText,
  FileCheck,
  AlertCircle
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'quality_summary', label: 'Executive Quality Summary', icon: Zap, desc: 'Overarching hospital quality, excursion index & containment briefing' },
  { id: 'quality_testing', label: 'Laboratory Quality Testing', icon: Microscope, desc: 'Detailed lab test executions, observed parameters and pass/fail logs' },
  { id: 'compliance', label: 'Compliance & Rule Evaluations', icon: Scale, desc: 'Automated evaluation findings, rule failures & non-compliance decisions' },
  { id: 'incoming_supply', label: 'Incoming Supplies & Receipts', icon: Truck, desc: 'Shipment deliveries, receiving inspection and initial quality classification' },
  { id: 'batch_quality', label: 'Batch Quality Dossiers', icon: Boxes, desc: 'Batch production records, shelf-life, testing dossiers and release status' },
  { id: 'supplier_performance', label: 'Supplier Performance Scorecards', icon: Factory, desc: 'Vendor delivery volume, defect ratios and quality ratings' },
  { id: 'manufacturer', label: 'Manufacturer Registry & Portfolio', icon: Building, desc: 'Approved manufacturer catalog, registration validity and product lines' },
  { id: 'storage_monitoring', label: 'Cold Storage Telemetry & Excursions', icon: Warehouse, desc: 'Temperature & humidity compliance records per storage location' },
  { id: 'transport_monitoring', label: 'Transport In-Transit Integrity', icon: Container, desc: 'Vehicle temperature logs, transit excursions and delivery conditions' },
  { id: 'quarantine', label: 'Quarantine & Containment Register', icon: Lock, desc: 'Isolated batch registry, root-cause investigations and disposal logs' },
  { id: 'recall', label: 'Product Recall & Field Retrieval', icon: AlertTriangle, desc: 'Active recall campaigns, affected batches and retrieval velocity' },
  { id: 'corrective_action', label: 'Corrective Actions (CAPA) Log', icon: Wrench, desc: 'CAPA registry, retest protocols, due dates and resolution sign-offs' },
  { id: 'audit', label: 'System Audit Trail & Access Logs', icon: ScrollText, desc: 'Immutable chronological change logs and user action audit records' },
];

export default function ReportCenter() {
  const { token, currentUser } = useAuth();
  const [selectedReport, setSelectedReport] = useState('quality_summary');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet(`/reports/${selectedReport}/preview`, token);
      setReportData(data);
    } catch (err) {
      setError(err.detail || 'Failed to generate report preview');
    } finally {
      setLoading(false);
    }
  }, [selectedReport, token]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    window.open(`${API_BASE_URL}/reports/${selectedReport}/export/csv`, '_blank');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
            Clinical Documentation Hub
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Pharmaceutical Report Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate, preview, audit and export certified compliance documentation and laboratory dossiers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 border border-slate-200 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-teal-200" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-xs font-medium flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Report Selector + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Catalog */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-2 print:hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 mb-1">
            <FileCheck className="w-4 h-4 text-teal-700" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Available Reports ({REPORT_TYPES.length})
            </h2>
          </div>

          <div className="space-y-1 max-h-[640px] overflow-y-auto pr-1">
            {REPORT_TYPES.map((r) => {
              const IconComp = r.icon;
              const isSelected = selectedReport === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-900 text-white shadow-md'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-teal-700'
                  }`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-snug">{r.label}</div>
                    <div className={`text-[11px] mt-0.5 leading-tight ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                      {r.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Preview Document */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs print:p-0 print:border-none print:shadow-none min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-400 text-xs font-semibold gap-3">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span>Generating structured clinical report...</span>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-teal-800 uppercase tracking-widest">
                    {reportData.hospital_name || 'PharmaQ Hospital Network'}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {reportData.title}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-4 flex-wrap">
                    <span>Generated: <strong>{reportData.generated_at}</strong></span>
                    <span>Auditor: <strong>{currentUser?.full_name || 'Chief Quality Officer'}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-mono text-slate-400">DOC REF: PHARMA-REP-{selectedReport.toUpperCase()}</div>
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>AUTHENTICATED RECORD</span>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                <span>Total Findings / Records: <strong className="text-slate-900 font-mono text-sm">{reportData.total_records}</strong></span>
                <span className="text-slate-500 hidden sm:inline">Classification: Controlled Hospital Quality Document</span>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 uppercase">
                    <tr>
                      {reportData.headers.map((h) => (
                        <th key={h} className="px-3.5 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {reportData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={reportData.headers.length} className="py-8 text-center text-slate-400">
                          No matching records found for this report scope.
                        </td>
                      </tr>
                    ) : (
                      reportData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} className="px-3.5 py-2.5 font-mono text-[11px]">
                              {val !== null && val !== undefined ? String(val) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Compliance Sign-Off Area */}
              <div className="pt-8 border-t border-slate-200 mt-8 grid grid-cols-2 gap-8 text-xs text-slate-500">
                <div>
                  <div className="font-bold text-slate-700 mb-6">Prepared by (Quality Auditor):</div>
                  <div className="border-b border-slate-300 w-48 mb-1" />
                  <div>Signature &amp; Stamp</div>
                </div>
                <div>
                  <div className="font-bold text-slate-700 mb-6">Approved by (Chief Pharmacist):</div>
                  <div className="border-b border-slate-300 w-48 mb-1" />
                  <div>Signature &amp; Stamp</div>
                </div>
              </div>

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
