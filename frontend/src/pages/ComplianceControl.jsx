import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';
import {
  Badge, Paginator, Loading, EmptyState, ErrorAlert,
  PageHeader, SearchBar, Select
} from '../components/ui';

export default function ComplianceControl() {
  const { token, hasRole } = useAuth();
  const navigate = useNavigate();
  const canEvaluate = hasRole(['ADMIN', 'QUALITY_INSPECTOR']);

  const [supplies, setSupplies] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDecision, setFilterDecision] = useState('');

  const fetchSupplies = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = new URLSearchParams({ page, page_size: 15 });
      if (search) params.append('search', search);
      if (filterDecision) params.append('final_decision', filterDecision);

      const res = await apiGet(`/incoming-supplies?${params.toString()}`, token);
      setSupplies(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      setError(err.detail || 'Failed to load incoming supplies compliance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, [page, search, filterDecision]);

  const handleRunEvaluation = async (supplyId) => {
    setEvaluatingId(supplyId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiPost(`/compliance/evaluate/${supplyId}`, {}, token);
      setSuccessMessage(`Automated compliance evaluation completed for ${res.receiving_id}: ${res.final_decision} (Score: ${res.compliance_score}%)`);
      fetchSupplies();
    } catch (err) {
      setError(err.detail || 'Failed to execute automated compliance evaluation.');
    } finally {
      setEvaluatingId(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="COMPLIANCE CONTROL"
        subtitle="Automated regulatory compliance evaluation, risk engine determination, and release decisioning"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/compliance/rules')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>⚖️</span> Rule Library
            </button>
            <button
              onClick={() => navigate('/certificates')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>📜</span> Certificates
            </button>
          </div>
        }
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search receiving ID, batch, location..." />
        </div>
        <div>
          <Select value={filterDecision} onChange={(e) => setFilterDecision(e.target.value)}>
            <option value="">All Regulatory Decisions</option>
            <option value="ACCEPTED">ACCEPTED (Approved for Distribution)</option>
            <option value="QUARANTINED">QUARANTINED (Under Investigation)</option>
            <option value="REJECTED">REJECTED (Critical Non-compliance)</option>
            <option value="PENDING">PENDING (Awaiting Evaluation)</option>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <Loading text="Loading Compliance Records..." />
        ) : supplies.length === 0 ? (
          <EmptyState
            icon="⚖️"
            title="No Supplies Pending Compliance"
            message="Incoming supplies awaiting regulatory evaluation will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Receiving ID</th>
                  <th className="px-5 py-3.5">Batch / Product</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5 text-center">Quality Status</th>
                  <th className="px-5 py-3.5 text-center">Compliance Score</th>
                  <th className="px-5 py-3.5 text-center">Final Decision</th>
                  <th className="px-5 py-3.5">Decision Reason</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {supplies.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-teal-900 whitespace-nowrap">
                      {s.receiving_id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{s.batch?.product?.name || `Product #${s.batch?.product_id}`}</div>
                      <div className="font-mono text-xs text-gray-500">{s.batch?.batch_number}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {s.batch?.supplier?.name || `Supplier #${s.batch?.supplier_id}`}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge status={s.quality_status || 'PENDING'} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {s.compliance_score !== null && s.compliance_score !== undefined ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getScoreColor(s.compliance_score)}`}>
                          {Math.round(s.compliance_score)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge status={s.final_decision || 'PENDING'} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs truncate">
                      {s.decision_reason || 'Awaiting automated evaluation'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEvaluate && (
                          <button
                            onClick={() => handleRunEvaluation(s.id)}
                            disabled={evaluatingId === s.id}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 rounded-lg shadow-sm transition-all"
                          >
                            {evaluatingId === s.id ? 'Evaluating…' : '⚡ Evaluate'}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/compliance/decisions?supply_id=${s.id}`)}
                          className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                        >
                          View Decision →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-gray-100">
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
