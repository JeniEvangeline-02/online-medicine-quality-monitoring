import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';
import {
  Badge, Loading, EmptyState, ErrorAlert,
  PageHeader, Select, Modal, Field, Textarea, SubmitButton
} from '../components/ui';

export default function ComplianceDecisionDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['ADMIN']);
  const canEvaluate = hasRole(['ADMIN', 'QUALITY_INSPECTOR']);

  const supplyIdParam = searchParams.get('supply_id');

  const [supplies, setSupplies] = useState([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState(supplyIdParam || '');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Override Modal
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState('ACCEPTED');
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  // Fetch available supplies for dropdown
  const fetchAvailableSupplies = async () => {
    try {
      const res = await apiGet('/incoming-supplies?page_size=50', token);
      setSupplies(res.items || []);
      if (!selectedSupplyId && res.items?.length > 0) {
        setSelectedSupplyId(res.items[0].id);
        setSearchParams({ supply_id: res.items[0].id });
      }
    } catch (e) {
      console.error('Failed to load supplies dropdown', e);
    }
  };

  useEffect(() => {
    fetchAvailableSupplies();
  }, []);

  useEffect(() => {
    if (selectedSupplyId) {
      loadProfile(selectedSupplyId);
    }
  }, [selectedSupplyId]);

  const loadProfile = async (sId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/compliance/decision/${sId}`, token);
      setProfile(data);
    } catch (err) {
      setError(err.detail || 'Failed to load compliance decision profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!selectedSupplyId) return;
    setEvaluating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiPost(`/compliance/evaluate/${selectedSupplyId}`, {}, token);
      setSuccessMessage(`Automated Compliance Evaluation Executed: ${res.final_decision} (Score: ${res.compliance_score}%)`);
      loadProfile(selectedSupplyId);
    } catch (err) {
      setError(err.detail || 'Evaluation execution failed.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('A valid regulatory justification is required for manual override.');
      return;
    }
    setSubmittingOverride(true);
    try {
      await apiPost(`/compliance/override/${selectedSupplyId}`, {
        new_decision: overrideDecision,
        reason: overrideReason
      }, token);

      setOverrideOpen(false);
      setOverrideReason('');
      setSuccessMessage('Administrator manual override recorded successfully in audit trail.');
      loadProfile(selectedSupplyId);
    } catch (err) {
      alert(err.detail || 'Manual override failed.');
    } finally {
      setSubmittingOverride(false);
    }
  };

  const getDecisionTheme = (decision) => {
    switch (decision) {
      case 'ACCEPTED':
        return {
          bg: 'bg-emerald-900 text-white border-emerald-700',
          badge: 'bg-emerald-500 text-white',
          title: 'ACCEPTED — APPROVED FOR HEALTHCARE DISTRIBUTION',
          desc: 'Supply has met all pharmacopoeial quality and regulatory criteria.',
          icon: '✅'
        };
      case 'QUARANTINED':
        return {
          bg: 'bg-amber-900 text-white border-amber-700',
          badge: 'bg-amber-500 text-slate-900 font-black',
          title: 'QUARANTINED — UNDER REGULATORY INVESTIGATION',
          desc: 'Supply is held in quarantine due to pending verifications or warnings. Strictly prohibited from dispensing.',
          icon: '🔒'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-950 text-white border-rose-800',
          badge: 'bg-rose-600 text-white',
          title: 'REJECTED — CRITICAL NON-COMPLIANCE DETECTED',
          desc: 'Supply has failed mandatory safety or quality standards. Return to manufacturer or schedule destruction.',
          icon: '⛔'
        };
      default:
        return {
          bg: 'bg-slate-900 text-white border-slate-700',
          badge: 'bg-slate-600 text-white',
          title: 'PENDING COMPLIANCE EVALUATION',
          desc: 'Supply is awaiting automated regulatory compliance evaluation.',
          icon: '⏳'
        };
    }
  };

  const theme = getDecisionTheme(profile?.final_decision);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AUTOMATED QUALITY DECISION"
        subtitle="Deterministic regulatory compliance profile, multi-rule risk evaluation, and automated release determination"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/compliance')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 shadow-sm transition-all"
            >
              ← Compliance Control
            </button>
            {canEvaluate && (
              <button
                onClick={handleRunEvaluation}
                disabled={evaluating || loading}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <span>⚡</span> {evaluating ? 'Evaluating Engine…' : 'Re-run Evaluation Engine'}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setOverrideOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                🛠️ Admin Override
              </button>
            )}
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

      {/* Supply Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-lg">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Target Incoming Delivery
          </label>
          <Select
            value={selectedSupplyId}
            onChange={(e) => {
              setSelectedSupplyId(e.target.value);
              setSearchParams({ supply_id: e.target.value });
            }}
          >
            <option value="">Select an Incoming Supply...</option>
            {supplies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.receiving_id} — Batch: {s.batch?.batch_number} ({s.final_decision || 'PENDING'})
              </option>
            ))}
          </Select>
        </div>

        {profile && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-gray-400 font-bold">DECISION SOURCE:</span>{' '}
              <span className="font-bold text-teal-800">{profile.decision_source}</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-gray-400 font-bold">SEVERITY:</span>{' '}
              <span className="font-bold text-rose-700">{profile.decision_severity}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Loading text="Loading Compliance Profile..." />
      ) : !profile ? (
        <EmptyState
          icon="⚖️"
          title="Select a Supply to View Compliance Profile"
          message="Choose an incoming supply from the selector above to review its automated regulatory decision."
        />
      ) : (
        <div className="space-y-6">
          {/* Main Decision Banner */}
          <div className={`p-6 rounded-3xl border shadow-lg ${theme.bg} space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{theme.icon}</span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-300">
                    Final Automated Regulatory Decision
                  </div>
                  <h2 className="text-xl font-black tracking-tight">{theme.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs uppercase font-bold text-slate-300">Compliance Score</div>
                  <div className="text-2xl font-mono font-black">{Math.round(profile.compliance_score)}%</div>
                </div>
                <span className={`px-4 py-1.5 rounded-2xl text-sm font-black uppercase tracking-wider ${theme.badge}`}>
                  {profile.final_decision}
                </span>
              </div>
            </div>

            <div className="p-4 bg-black/20 rounded-2xl border border-white/10 space-y-1">
              <div className="text-xs text-slate-300 uppercase font-bold tracking-wider">Decision Justification</div>
              <p className="text-sm font-medium text-white/95 leading-relaxed">
                "{profile.decision_reason}"
              </p>
            </div>
          </div>

          {/* Key Identification Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <div className="text-xs text-gray-400 font-bold uppercase">Product & Registration</div>
              <div className="font-bold text-gray-900 text-sm">{profile.product_name}</div>
              <div className="text-xs font-mono text-teal-700 font-semibold">{profile.product_code}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <div className="text-xs text-gray-400 font-bold uppercase">Batch Number</div>
              <div className="font-mono font-bold text-gray-900 text-base">{profile.batch_number}</div>
              <div className="text-xs text-gray-500">Expiry: {profile.expiry_status}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <div className="text-xs text-gray-400 font-bold uppercase">Supplier Status</div>
              <div className="font-bold text-gray-900 text-sm">{profile.supplier_name}</div>
              <div className="text-xs text-gray-500">Authorization: {profile.supplier_status}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <div className="text-xs text-gray-400 font-bold uppercase">Quality Test State</div>
              <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Badge status={profile.quality_result} />
              </div>
              <div className="text-xs text-gray-500">Certificates: {profile.certificate_status}</div>
            </div>
          </div>

          {/* Compliance Checks Evaluation Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Automated Regulatory Rule Evaluations
                </h3>
                <p className="text-xs text-gray-500">
                  Individual rule results executed by the backend Compliance Engine
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400">
                {profile.evaluations?.length || 0} Rules Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Rule Code</th>
                    <th className="px-6 py-3.5">Rule Check</th>
                    <th className="px-6 py-3.5">Observed Input</th>
                    <th className="px-6 py-3.5">Expected State</th>
                    <th className="px-6 py-3.5 text-center">Result</th>
                    <th className="px-6 py-3.5 text-center">Severity</th>
                    <th className="px-6 py-3.5">Evaluation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profile.evaluations?.map((ev, idx) => {
                    const isFail = ev.evaluation_result === 'FAIL';
                    const isWarn = ev.evaluation_result === 'WARNING';
                    const isRev = ev.evaluation_result === 'REVIEW';
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isFail
                            ? 'bg-rose-50/70'
                            : isWarn
                            ? 'bg-amber-50/50'
                            : isRev
                            ? 'bg-sky-50/40'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-teal-800">
                          {ev.rule?.rule_code || ev.rule_code}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900">
                          {ev.rule?.rule_name || ev.rule_name || ev.rule_type}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-700">
                          {ev.input_value || '—'}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-500">
                          {ev.expected_value || '—'}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <Badge status={ev.evaluation_result} />
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              ev.rule?.severity === 'CRITICAL' || ev.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : ev.rule?.severity === 'HIGH' || ev.severity === 'HIGH'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ev.rule?.severity || ev.severity || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-700">
                          {ev.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Regulatory Decision Timeline
            </h3>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pt-2 pb-1 text-xs">
              <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-32">
                <span className="text-base mb-1">🚚</span>
                <span className="font-bold text-gray-800">Supply Received</span>
                <span className="text-gray-400 text-xs">Intake Logged</span>
              </div>
              <div className="text-gray-300 font-bold text-sm">→</div>
              <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-32">
                <span className="text-base mb-1">🧪</span>
                <span className="font-bold text-gray-800">Quality Tested</span>
                <span className="font-mono text-teal-700 text-xs font-bold">{profile.quality_result}</span>
              </div>
              <div className="text-gray-300 font-bold text-sm">→</div>
              <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-32">
                <span className="text-base mb-1">⚖️</span>
                <span className="font-bold text-gray-800">Rules Evaluated</span>
                <span className="text-gray-500 text-xs">{profile.evaluations?.length || 0} Rules Checked</span>
              </div>
              <div className="text-gray-300 font-bold text-sm">→</div>
              <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-32">
                <span className="text-base mb-1">⚡</span>
                <span className="font-bold text-gray-800">Decision Engine</span>
                <span className="text-gray-500 text-xs">Score: {Math.round(profile.compliance_score)}%</span>
              </div>
              <div className="text-gray-300 font-bold text-sm">→</div>
              <div className={`flex flex-col items-center text-center p-3 rounded-xl border min-w-36 ${theme.bg}`}>
                <span className="text-base mb-1">{theme.icon}</span>
                <span className="font-black">{profile.final_decision}</span>
                <span className="text-xs text-slate-300">Official Determination</span>
              </div>
            </div>
          </div>

          {/* Decision Audit History Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Decision History & Audit Trail
                </h3>
                <p className="text-xs text-gray-500">
                  Immutable record of automated engine decisions and authorized administrator overrides
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Decision</th>
                    <th className="px-6 py-3.5">Score</th>
                    <th className="px-6 py-3.5">Source / Mode</th>
                    <th className="px-6 py-3.5">Decided By</th>
                    <th className="px-6 py-3.5">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profile.decision_history?.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-gray-500">
                        {new Date(h.decided_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5 font-bold">
                        <Badge status={h.decision} />
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-gray-700">
                        {h.compliance_score !== null ? `${Math.round(h.compliance_score)}%` : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        {h.is_automated ? (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded font-semibold">
                            🤖 AUTOMATED ENGINE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded font-semibold">
                            🛠️ MANUAL OVERRIDE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-600">
                        {h.user?.full_name || (h.is_automated ? 'Compliance Engine' : `User #${h.decided_by}`)}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-700">
                        {h.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Manual Override Modal */}
      <Modal open={overrideOpen} onClose={() => setOverrideOpen(false)} title="Administrator Manual Override" size="md">
        <form onSubmit={handleOverrideSubmit} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
            ⚠️ <strong>Regulatory Notice:</strong> Manual overrides are strictly logged in the audit trail with your identity and explicit justification (`is_automated = false`).
          </div>

          <Field label="Override Target Decision" required>
            <Select value={overrideDecision} onChange={(e) => setOverrideDecision(e.target.value)}>
              <option value="ACCEPTED">ACCEPTED (Force Release for Distribution)</option>
              <option value="QUARANTINED">QUARANTINED (Hold for Investigation)</option>
              <option value="REJECTED">REJECTED (Designate Non-compliant / Destroy)</option>
            </Select>
          </Field>

          <Field label="Mandatory Justification & Authorization Reference" required hint="e.g. Special Dispensation Directive #MOH-2026-44">
            <Textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="State the official regulatory justification for overriding the automated compliance decision..."
              required
            />
          </Field>

          <SubmitButton loading={submittingOverride}>
            Confirm Administrator Override
          </SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
