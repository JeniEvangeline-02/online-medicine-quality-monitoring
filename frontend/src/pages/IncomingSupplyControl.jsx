import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../services/useApi';
import { useAuth } from '../context/AuthContext';
import {
  Badge, Loading, EmptyState, ErrorAlert, PageHeader,
  SearchBar, Paginator, Modal, Field, Input, Select, SubmitButton
} from '../components/ui';

function ReceiveSupplyForm({ onSave, onClose, batches }) {
  const api = useApi();
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    batch_id: '', hospital_id: currentUser?.id || 1,
    quantity_received: '', received_date: new Date().toISOString().split('T')[0],
    receiving_location: '', transport_status: 'GOOD', storage_status: 'ADEQUATE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { ...form, batch_id: parseInt(form.batch_id), quantity_received: parseFloat(form.quantity_received), hospital_id: parseInt(form.hospital_id) };
      const res = await api.post('/incoming-supplies', payload);
      setSuccess(res);
    } catch (err) { setError(err.detail || 'Failed to record supply.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="text-center py-6 space-y-4">
      <div className="text-5xl">✅</div>
      <div>
        <div className="text-lg font-bold text-gray-900">Supply Received</div>
        <div className="text-sm text-gray-500 mt-1">Receiving ID: <span className="font-mono font-semibold text-teal-700">{success.receiving_id}</span></div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <div className="font-semibold mb-1">⏳ Next Stage: Awaiting Quality Evaluation</div>
        <div>This supply has been received and identified. It is now awaiting quality testing and compliance evaluation before use approval.</div>
      </div>
      <WorkflowTracker />
      <button onClick={() => { onSave(); }} className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm">
        Done
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠️ {error}</div>}

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Product & Batch</div>
        <Field label="Select Batch" required>
          <Select value={form.batch_id} onChange={e => set('batch_id', e.target.value)} required>
            <option value="">Select a registered batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batch_number} — {b.product?.name || `Product #${b.product_id}`} (Exp: {b.expiry_date})
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Receiving Details</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity Received" required>
            <Input type="number" min="1" step="any" value={form.quantity_received} onChange={e => set('quantity_received', e.target.value)} required placeholder="e.g., 500" />
          </Field>
          <Field label="Received Date" required>
            <Input type="date" value={form.received_date} onChange={e => set('received_date', e.target.value)} required />
          </Field>
          <Field label="Receiving Location">
            <Input value={form.receiving_location} onChange={e => set('receiving_location', e.target.value)} placeholder="e.g., Ward A Storage" />
          </Field>
          <Field label="Transport Status">
            <Select value={form.transport_status} onChange={e => set('transport_status', e.target.value)}>
              <option>GOOD</option><option>DAMAGED</option><option>SUSPECT</option>
            </Select>
          </Field>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        ⚠️ Receiving a supply does <strong>not</strong> mean it is approved for use. Quality testing and compliance evaluation are required before this supply can be dispensed.
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading}>Record Incoming Supply</SubmitButton></div>
      </div>
    </form>
  );
}

function WorkflowTracker({ supply }) {
  const isTested = ['PASSED', 'FAILED', 'REVIEW'].includes(supply?.quality_status);
  const isTesting = supply?.quality_status === 'TESTING' || supply?.quality_status === 'UNDER_REVIEW';

  const steps = [
    { key: 'received', label: 'Supply Received', done: true, current: false },
    { key: 'sample', label: 'Sample Collected', done: isTesting || isTested, current: isTesting },
    { key: 'test', label: 'Test Created', done: isTesting || isTested, current: isTesting },
    { key: 'params', label: 'Parameters Tested', done: isTested, current: isTesting },
    { key: 'quality', label: `Quality: ${supply?.quality_status || 'PENDING'}`, done: isTested, current: false, status: supply?.quality_status },
    { key: 'compliance', label: 'Pending Compliance', done: false, current: false },
  ];

  return (
    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                step.status === 'PASSED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : step.status === 'FAILED'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : step.done
                  ? 'bg-teal-100 text-teal-800 border border-teal-200'
                  : step.current
                  ? 'bg-sky-100 text-sky-800 border border-sky-300 animate-pulse'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              {step.done ? '✓' : step.current ? '⏳' : '○'} {step.label}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-4 h-0.5 ${
                  step.done && steps[i + 1].done ? 'bg-teal-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SupplyDetail({ supply, onClose }) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canTest = hasRole(['ADMIN', 'QUALITY_INSPECTOR']);

  const getQualityStatusLabel = (status) => {
    switch (status) {
      case 'PASSED':
        return 'QUALITY PASSED — Ready for Compliance';
      case 'FAILED':
        return 'QUALITY FAILED — Non-conformance detected';
      case 'TESTING':
        return 'QUALITY TEST IN PROGRESS';
      case 'REVIEW':
        return 'QUALITY UNDER INVESTIGATION';
      default:
        return 'AWAITING QUALITY TEST';
    }
  };

  return (
    <div className="space-y-5">
      <WorkflowTracker supply={supply} />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-50 rounded-xl p-4 col-span-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Supply Identification</div>
          <div className="flex flex-wrap gap-6">
            <div><span className="text-gray-400">Receiving ID:</span> <span className="font-mono font-bold text-teal-700">{supply.receiving_id}</span></div>
            <div><span className="text-gray-400">Batch ID:</span> <span className="font-mono">#{supply.batch_id}</span></div>
            <div><span className="text-gray-400">Received:</span> <span className="font-medium">{typeof supply.received_date === 'string' ? supply.received_date.slice(0, 10) : supply.received_date}</span></div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantity</div>
          <div className="text-2xl font-bold text-gray-900">{supply.quantity_received?.toLocaleString()}</div>
          <div className="text-xs text-gray-400">units received</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</div>
          <div className="font-medium text-gray-800">{supply.receiving_location || 'Quarantine Area'}</div>
          <div className="text-xs text-gray-400 mt-1">Transport: {supply.transport_status || 'VERIFIED'}</div>
        </div>
      </div>

      {/* Quality Status Section */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
          Laboratory Quality Status
        </div>
        <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-gray-900">{getQualityStatusLabel(supply.quality_status)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Final Decision: PENDING (Requires Phase 5 Compliance)</div>
          </div>
          <Badge status={supply.quality_status || 'PENDING'} />
        </div>

        {canTest && (
          <button
            onClick={() => {
              onClose();
              navigate(`/quality-samples`);
            }}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>🔬</span> START / MANAGE QUALITY TEST
          </button>
        )}
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status Overview</div>
        {[
          ['Quality Status', supply.quality_status],
          ['Compliance Status', supply.compliance_status],
          ['Final Decision', supply.final_decision],
        ].map(([label, val]) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <Badge status={val} />
          </div>
        ))}
      </div>

      <button onClick={onClose} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Close</button>
    </div>
  );
}

export default function IncomingSupplyControl() {
  const api = useApi();
  const { currentUser } = useAuth();
  const canReceive = ['ADMIN', 'HOSPITAL', 'QUALITY_INSPECTOR'].includes(currentUser?.role);

  const [data, setData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/batches?page=1&page_size=200').then(r => setBatches(r.items || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, page_size: 20 });
      if (search) params.set('search', search);
      if (qualityFilter) params.set('quality_status', qualityFilter);
      setData(await api.get(`/incoming-supplies?${params}`));
    } catch (e) { setError(e.detail || 'Failed to load.'); }
    finally { setLoading(false); }
  }, [page, search, qualityFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incoming Supply Control"
        subtitle="Hospital supply receiving, identification, and quality journey tracking"
        action={canReceive && (
          <button onClick={() => setModal('receive')}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-all">
            + Receive New Supply
          </button>
        )}
      />

      {/* Workflow overview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Supply Quality Journey</div>
        <WorkflowTracker />
        <p className="text-xs text-gray-400 mt-1">Phase 3: Receiving & Identification complete. Quality Testing and Compliance pending Phase 4 & 5.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="flex-1"><SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by receiving ID…" /></div>
          <select value={qualityFilter} onChange={e => { setQualityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">All Quality Status</option>
            {['PENDING','PASSED','FAILED','UNDER_REVIEW'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : error ? (
          <div className="p-4"><ErrorAlert message={error} onDismiss={() => setError('')} /></div>
        ) : !data?.items?.length ? (
          <EmptyState icon="🚚" title="No incoming supplies yet" message="No hospital supply records have been created. Use 'Receive New Supply' to record an incoming shipment." />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>{['Receiving ID', 'Batch', 'Quantity', 'Received', 'Location', 'Quality', 'Compliance', 'Decision', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelected(s); setModal('detail'); }}>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-teal-700">{s.receiving_id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">#{s.batch_id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.quantity_received?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.received_date}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.receiving_location || '—'}</td>
                      <td className="px-4 py-3"><Badge status={s.quality_status} /></td>
                      <td className="px-4 py-3"><Badge status={s.compliance_status} /></td>
                      <td className="px-4 py-3"><Badge status={s.final_decision} /></td>
                      <td className="px-4 py-3 text-teal-600 text-xs hover:underline">View →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Paginator page={page} totalPages={data.total_pages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>

      <Modal open={modal === 'receive'} onClose={() => setModal(null)} title="Receive New Supply" size="lg">
        <ReceiveSupplyForm batches={batches} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'detail' && !!selected} onClose={() => { setModal(null); setSelected(null); }}
        title={`Supply Journey — ${selected?.receiving_id}`} size="lg">
        {selected && <SupplyDetail supply={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      </Modal>
    </div>
  );
}
