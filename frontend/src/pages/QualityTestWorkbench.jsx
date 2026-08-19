import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';
import {
  Badge, Loading, EmptyState, ErrorAlert,
  PageHeader, Field, Input, Select, Textarea
} from '../components/ui';

export default function QualityTestWorkbench() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, hasRole, currentUser } = useAuth();
  const canTest = hasRole(['ADMIN', 'QUALITY_INSPECTOR']);

  const sampleIdParam = searchParams.get('sample_id');
  const testIdParam = searchParams.get('test_id');

  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState(sampleIdParam || '');
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form observed values map: { standard_id: observed_value_string }
  const [observedValues, setObservedValues] = useState({});
  const [remarks, setRemarks] = useState('');
  const [labReport, setLabReport] = useState('');

  // Fetch list of available samples for selection dropdown
  const fetchAvailableSamples = async () => {
    try {
      const res = await apiGet('/quality-samples?page_size=50', token);
      setSamples(res.items || []);
    } catch (e) {
      console.error('Failed to load samples dropdown', e);
    }
  };

  useEffect(() => {
    fetchAvailableSamples();
  }, []);

  // When selectedSampleId or testIdParam changes, load or start test
  useEffect(() => {
    if (testIdParam) {
      loadTestById(testIdParam);
    } else if (selectedSampleId) {
      startOrLoadTestForSample(selectedSampleId);
    }
  }, [selectedSampleId, testIdParam]);

  const loadTestById = async (tId) => {
    setLoading(true);
    setError(null);
    try {
      const testData = await apiGet(`/quality-tests/${tId}`, token);
      setTest(testData);
      setSelectedSampleId(testData.sample_id);
      populateForm(testData);
    } catch (err) {
      setError(err.detail || 'Failed to load quality test.');
    } finally {
      setLoading(false);
    }
  };

  const startOrLoadTestForSample = async (sId) => {
    setLoading(true);
    setError(null);
    try {
      // POST /quality-tests will return the existing in-progress test or create a new one
      const testData = await apiPost('/quality-tests', { sample_id: parseInt(sId, 10) }, token);
      setTest(testData);
      populateForm(testData);
    } catch (err) {
      setError(err.detail || 'Failed to initialize test workbench.');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (testData) => {
    const vals = {};
    if (testData.test_results) {
      testData.test_results.forEach((r) => {
        vals[r.quality_standard_id] = r.observed_value !== null ? r.observed_value : '';
      });
    }
    setObservedValues(vals);
    setRemarks(testData.remarks || '');
    setLabReport(testData.laboratory_report || '');
  };

  const handleObservedValueChange = (standardId, val) => {
    if (test?.is_completed) return;
    setObservedValues((prev) => ({
      ...prev,
      [standardId]: val
    }));
  };

  const handleSaveDraft = async () => {
    if (!test) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const resultsPayload = Object.entries(observedValues).map(([stdId, val]) => ({
        quality_standard_id: parseInt(stdId, 10),
        observed_value: val
      }));

      const updated = await apiPut(`/quality-tests/${test.id}`, {
        results: resultsPayload,
        remarks: remarks,
        laboratory_report: labReport
      }, token);

      setTest(updated);
      populateForm(updated);
      setSuccessMessage('Draft test results saved successfully.');
    } catch (err) {
      setError(err.detail || 'Failed to save test draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteTest = async () => {
    if (!test) return;
    if (!window.confirm('Are you sure you want to finalize and COMPLETE this quality test? Once completed, results become official and read-only.')) return;

    setCompleting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const resultsPayload = Object.entries(observedValues).map(([stdId, val]) => ({
        quality_standard_id: parseInt(stdId, 10),
        observed_value: val
      }));

      const finalized = await apiPost(`/quality-tests/${test.id}/complete`, {
        results: resultsPayload,
        remarks: remarks,
        laboratory_report: labReport
      }, token);

      setTest(finalized);
      populateForm(finalized);
      setSuccessMessage(`Quality testing officially completed! Overall Result: ${finalized.overall_result}`);
    } catch (err) {
      setError(err.detail || 'Failed to complete quality test.');
    } finally {
      setCompleting(false);
    }
  };

  const handleRetest = async () => {
    if (!test || !window.confirm('Initialize a new controlled RETEST for this sample? A new test ID will be generated.')) return;
    setLoading(true);
    try {
      const newTest = await apiPost('/quality-tests', { sample_id: test.sample_id }, token);
      setTest(newTest);
      populateForm(newTest);
      setSuccessMessage(`New Retest initiated (ID: #${newTest.id}).`);
    } catch (err) {
      setError(err.detail || 'Failed to initiate retest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QUALITY TEST WORKBENCH"
        subtitle="Laboratory testing interface, analytical parameter evaluation, and quality determination"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/quality-history')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 shadow-sm transition-all"
            >
              📜 Test History
            </button>
            {test?.is_completed && canTest && (
              <button
                onClick={handleRetest}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                🔄 Start Retest
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

      {/* Top Selector / Sample Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Select Sample to Test
            </label>
            <Select
              value={selectedSampleId}
              onChange={(e) => {
                setSelectedSampleId(e.target.value);
                setSearchParams({ sample_id: e.target.value });
              }}
            >
              <option value="">Choose a Quality Sample...</option>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sample_code} — {s.batch?.product?.name || `Batch ${s.batch?.batch_number}`} ({s.status})
                </option>
              ))}
            </Select>
          </div>

          {test && (
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs text-gray-400 font-semibold uppercase">Overall Result</div>
                <div className="text-lg font-black tracking-wide">
                  <Badge status={test.overall_result} label={test.overall_result} />
                </div>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <div className="text-xs text-gray-400 font-semibold uppercase">Test State</div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${test.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                  {test.is_completed ? '🔒 COMPLETED (READ-ONLY)' : '🧪 IN PROGRESS'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Specimen Clinical Information Bar */}
        {test && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 uppercase font-semibold">Sample Code:</span>
              <div className="font-mono font-bold text-teal-900 text-sm mt-0.5">
                {test.quality_sample?.sample_code || `Sample #${test.sample_id}`}
              </div>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-semibold">Product Name:</span>
              <div className="font-bold text-gray-900 text-sm mt-0.5">
                {test.batch?.product?.name || '—'}
              </div>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-semibold">Batch Number:</span>
              <div className="font-mono font-semibold text-gray-800 text-sm mt-0.5">
                {test.batch?.batch_number || `Batch #${test.batch_id}`}
              </div>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-semibold">Lead Inspector:</span>
              <div className="font-medium text-gray-800 text-sm mt-0.5">
                {test.inspector?.full_name || currentUser?.full_name}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Loading text="Loading test parameters and active standards..." />
      ) : !test ? (
        <EmptyState
          icon="🔬"
          title="Select a Sample to Open Laboratory Workbench"
          message="Choose a quality sample from the intake dropdown above or from Sample Control."
        />
      ) : (
        <div className="space-y-6">
          {/* Read Only Notice if Completed */}
          {test.is_completed && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="font-bold text-sm">Official Laboratory Test Completed</div>
                  <div className="text-xs text-slate-300">
                    This test record is locked and immutable for audit traceability. To perform another round of testing, initiate a Retest.
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-mono">
                  Finalized: {new Date(test.test_date || test.updated_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* Test Parameters Evaluation Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Required Quality Parameters
                </h2>
                <p className="text-xs text-gray-500">
                  Enter observed laboratory measurements against configured pharmacopoeial standards
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400">
                {test.test_results?.length || 0} Parameters Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Parameter</th>
                    <th className="px-6 py-3.5">Expected Standard</th>
                    <th className="px-6 py-3.5 w-64">Observed Value</th>
                    <th className="px-6 py-3.5">Unit</th>
                    <th className="px-6 py-3.5 text-center">Param Result</th>
                    <th className="px-6 py-3.5 text-center">Criticality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {test.test_results?.map((r) => {
                    const std = r.quality_standard;
                    const isCritical = std?.is_critical;
                    const isFailed = r.result === 'FAIL';
                    const isPassed = r.result === 'PASS';

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          isFailed && isCritical
                            ? 'bg-rose-50/60'
                            : isFailed
                            ? 'bg-red-50/30'
                            : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          <div>{std?.parameter_name}</div>
                          <div className="text-xs text-gray-400 font-normal">
                            {std?.testing_method || std?.standard_reference || 'Standard Method'}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-gray-700">
                          {std?.parameter_type === 'NUMERIC' ? (
                            <span className="font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                              {std.minimum_value} – {std.maximum_value}
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              {std?.expected_value}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {std?.parameter_type === 'BOOLEAN' ? (
                            <Select
                              value={observedValues[std?.id] || ''}
                              onChange={(e) => handleObservedValueChange(std?.id, e.target.value)}
                              disabled={test.is_completed}
                              className="font-mono text-xs font-bold"
                            >
                              <option value="">Select Observed State</option>
                              <option value="TRUE">TRUE (Confirmed / Intact)</option>
                              <option value="FALSE">FALSE (Failed / Breach)</option>
                            </Select>
                          ) : (
                            <Input
                              type={std?.parameter_type === 'NUMERIC' ? 'number' : 'text'}
                              step="any"
                              value={observedValues[std?.id] || ''}
                              onChange={(e) => handleObservedValueChange(std?.id, e.target.value)}
                              placeholder={`Enter observed ${std?.parameter_name}`}
                              disabled={test.is_completed}
                              className={`font-mono text-sm font-semibold ${
                                isFailed ? 'border-red-400 bg-red-50/50 text-red-900' : ''
                              }`}
                            />
                          )}
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {std?.unit || '—'}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <Badge status={r.result || 'PENDING'} />
                        </td>

                        <td className="px-6 py-4 text-center">
                          {isCritical ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                isFailed
                                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span>⚡</span> CRITICAL
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Standard</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test Metadata & Laboratory Report */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Laboratory Documentation & Analyst Remarks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Laboratory Report Document Reference / URL" hint="Certificate of Analysis document link or file reference">
                <Input
                  value={labReport}
                  onChange={(e) => setLabReport(e.target.value)}
                  placeholder="e.g. LAB-REPORT-2026-0819.pdf"
                  disabled={test.is_completed}
                />
              </Field>
              <Field label="Inspector Analysis Remarks" hint="Observations, deviations, or investigation notes">
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter detailed laboratory analysis observations..."
                  disabled={test.is_completed}
                />
              </Field>
            </div>
          </div>

          {/* Action Buttons */}
          {!test.is_completed && canTest && (
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || completing}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-gray-700 font-semibold rounded-xl border border-gray-300 text-sm shadow-sm transition-all flex items-center gap-2"
              >
                {saving ? 'Saving Draft…' : '💾 SAVE TEST DRAFT'}
              </button>
              <button
                type="button"
                onClick={handleCompleteTest}
                disabled={saving || completing}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
              >
                {completing ? 'Evaluating & Finalizing…' : '✅ COMPLETE TEST'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
