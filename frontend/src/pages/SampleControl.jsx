import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';
import {
  Badge, Paginator, Loading, EmptyState, ErrorAlert,
  PageHeader, SearchBar, Modal, Field, Input, Select, Textarea, SubmitButton
} from '../components/ui';

export default function SampleControl() {
  const { token, hasRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const canCollect = hasRole(['ADMIN', 'QUALITY_INSPECTOR']);

  const [samples, setSamples] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [collectOpen, setCollectOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    incoming_supply_id: '',
    batch_id: '',
    collection_date: new Date().toISOString().slice(0, 16),
    sample_quantity: '',
    unit: 'UNITS',
    sample_condition: 'Good condition, original manufacturer seal intact',
    notes: ''
  };
  const [form, setForm] = useState(initialForm);
  const [selectedSupplyDetails, setSelectedSupplyDetails] = useState(null);

  const fetchSamples = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = new URLSearchParams({ page, page_size: 15 });
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);

      const res = await apiGet(`/quality-samples?${params.toString()}`, token);
      setSamples(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      setError(err.detail || 'Failed to load samples.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplies = async () => {
    try {
      const res = await apiGet('/incoming-supplies?page_size=100', token);
      setSupplies(res.items || []);
    } catch (e) {
      console.error('Failed to load incoming supplies', e);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  useEffect(() => {
    fetchSamples();
  }, [page, search, filterStatus]);

  const handleSupplyChange = (supplyId) => {
    const supply = supplies.find((s) => s.id === parseInt(supplyId, 10));
    setSelectedSupplyDetails(supply || null);
    setForm({
      ...form,
      incoming_supply_id: supplyId,
      batch_id: supply ? supply.batch_id : ''
    });
  };

  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        incoming_supply_id: parseInt(form.incoming_supply_id, 10),
        batch_id: parseInt(form.batch_id, 10),
        collection_date: new Date(form.collection_date).toISOString(),
        sample_quantity: parseFloat(form.sample_quantity),
        unit: form.unit,
        sample_condition: form.sample_condition,
        status: 'COLLECTED'
      };

      const res = await apiPost('/quality-samples', payload, token);
      setCollectOpen(false);
      fetchSamples();
      // Ask user if they want to proceed directly to testing
      if (window.confirm(`Sample ${res.sample_code} collected successfully! Start quality test now?`)) {
        navigate(`/quality-tests?sample_id=${res.id}`);
      }
    } catch (err) {
      alert(err.detail || 'Failed to record sample collection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartTest = (sample) => {
    navigate(`/quality-tests?sample_id=${sample.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SAMPLE CONTROL"
        subtitle="Sample custody tracking, clinical specimen intake, and laboratory dispatch"
        action={
          canCollect && (
            <button
              onClick={() => {
                setForm(initialForm);
                setSelectedSupplyDetails(null);
                setCollectOpen(true);
              }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <span>🧪</span> Collect Sample
            </button>
          )
        }
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search sample code, batch number..." />
        </div>
        <div>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Sample Statuses</option>
            <option value="COLLECTED">COLLECTED</option>
            <option value="UNDER_TEST">UNDER TEST</option>
            <option value="TEST_COMPLETED">TEST COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <Loading text="Loading Quality Samples..." />
        ) : samples.length === 0 ? (
          <EmptyState
            icon="🧪"
            title="No Quality Samples Recorded"
            message="Collect samples from incoming deliveries to begin structured laboratory quality testing."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Sample Code</th>
                  <th className="px-5 py-3.5">Receiving ID</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Collected By</th>
                  <th className="px-5 py-3.5">Collection Date</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {samples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-teal-800">
                      {s.sample_code}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                      {s.incoming_supply?.receiving_id || `Supply #${s.incoming_supply_id}`}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-gray-900">
                      {s.batch?.batch_number || `Batch #${s.batch_id}`}
                    </td>
                    <td className="px-5 py-3.5 text-gray-800">
                      {s.batch?.product?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {s.collector?.full_name || `User #${s.collected_by}`}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(s.collection_date).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-700">
                      {s.sample_quantity} {s.unit}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge status={s.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {canCollect && (
                        <button
                          onClick={() => handleStartTest(s)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <span>🔬</span> {s.status === 'TEST_COMPLETED' ? 'View/Retest' : 'Test Workbench'}
                        </button>
                      )}
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

      {/* Collect Sample Modal */}
      <Modal open={collectOpen} onClose={() => setCollectOpen(false)} title="Collect Quality Testing Sample" size="lg">
        <form onSubmit={handleCollectSubmit} className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">
              1. Incoming Supply & Batch Source
            </h3>
            <Field label="Incoming Delivery" required hint="Select received delivery to sample from">
              <Select
                value={form.incoming_supply_id}
                onChange={(e) => handleSupplyChange(e.target.value)}
                required
              >
                <option value="">Select an Incoming Supply</option>
                {supplies.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.receiving_id} — Batch: {sup.batch?.batch_number} (Qty: {sup.quantity_received})
                  </option>
                ))}
              </Select>
            </Field>

            {selectedSupplyDetails && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 font-semibold uppercase">Batch ID:</span>{' '}
                  <span className="font-mono font-bold text-gray-800">{selectedSupplyDetails.batch?.batch_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold uppercase">Location:</span>{' '}
                  <span className="text-gray-800">{selectedSupplyDetails.receiving_location || 'Quarantine Depot'}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">
              2. Sampling Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Collection Date & Time" required>
                <Input
                  type="datetime-local"
                  value={form.collection_date}
                  onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
                  required
                />
              </Field>
              <Field label="Collector (Authorized Inspector)">
                <Input
                  value={currentUser?.full_name || 'Current Inspector'}
                  disabled
                  className="bg-slate-50 text-gray-600 font-medium"
                />
              </Field>
              <Field label="Sample Quantity" required>
                <Input
                  type="number"
                  step="any"
                  value={form.sample_quantity}
                  onChange={(e) => setForm({ ...form, sample_quantity: e.target.value })}
                  placeholder="e.g. 10"
                  required
                />
              </Field>
              <Field label="Sample Unit" required>
                <Select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  <option value="TABLETS">TABLETS</option>
                  <option value="CAPSULES">CAPSULES</option>
                  <option value="VIALS">VIALS</option>
                  <option value="AMPOULES">AMPOULES</option>
                  <option value="PIECES">PIECES</option>
                  <option value="STRIPS">STRIPS</option>
                  <option value="BOXES">BOXES</option>
                  <option value="BOTTLES">BOTTLES</option>
                  <option value="UNITS">UNITS</option>
                </Select>
              </Field>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">
              3. Sample Condition & Chain of Custody
            </h3>
            <Field label="Sample Physical Condition" hint="Check packaging, seals, temperature indicator">
              <Input
                value={form.sample_condition}
                onChange={(e) => setForm({ ...form, sample_condition: e.target.value })}
                placeholder="e.g. Intact, sealed in sterile container"
              />
            </Field>
          </div>

          <SubmitButton loading={submitting}>
            Confirm Sample Collection & Intake
          </SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
