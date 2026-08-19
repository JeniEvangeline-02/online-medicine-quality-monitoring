import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../services/useApi';
import { useAuth } from '../context/AuthContext';
import {
  Badge, Loading, EmptyState, ErrorAlert, PageHeader,
  SearchBar, Paginator, Modal, Field, Input, Select, SubmitButton
} from '../components/ui';

const EXPIRY_COLORS = { SAFE: 'text-emerald-600', EXPIRING_SOON: 'text-amber-600', URGENT: 'text-orange-600', EXPIRED: 'text-red-600' };

function BatchForm({ onSave, onClose, products, manufacturers, suppliers }) {
  const api = useApi();
  const [form, setForm] = useState({
    batch_number: '', product_id: '', manufacturer_id: '', supplier_id: '',
    manufacturing_date: '', expiry_date: '', quantity: '', unit: 'tablets',
    storage_requirement: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill storage when product is selected
  const handleProductChange = (id) => {
    set('product_id', id);
    const p = products.find(p => p.id === parseInt(id));
    if (p) {
      set('storage_requirement', p.storage_requirement || '');
      set('unit', p.product_type === 'MEDICINE' ? 'tablets' : 'units');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        product_id: parseInt(form.product_id),
        manufacturer_id: parseInt(form.manufacturer_id),
        supplier_id: parseInt(form.supplier_id),
        quantity: parseFloat(form.quantity),
      };
      await api.post('/batches', payload);
      onSave();
    } catch (err) { setError(err.detail || 'Batch creation failed.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠️ {error}</div>}

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Batch Identity</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Batch Number" required>
            <Input value={form.batch_number} onChange={e => set('batch_number', e.target.value)} required placeholder="BATCH-2026-XXXX" />
          </Field>
          <Field label="Product" required>
            <Select value={form.product_id} onChange={e => handleProductChange(e.target.value)} required>
              <option value="">Select product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.product_code})</option>)}
            </Select>
          </Field>
          <Field label="Manufacturer" required>
            <Select value={form.manufacturer_id} onChange={e => set('manufacturer_id', e.target.value)} required>
              <option value="">Select manufacturer</option>
              {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="Supplier" required>
            <Select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} required>
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dates & Quantity</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Manufacturing Date" required>
            <Input type="date" value={form.manufacturing_date} onChange={e => set('manufacturing_date', e.target.value)} required />
          </Field>
          <Field label="Expiry Date" required>
            <Input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} required />
          </Field>
          <Field label="Quantity" required>
            <Input type="number" min="1" step="any" value={form.quantity} onChange={e => set('quantity', e.target.value)} required placeholder="e.g., 1000" />
          </Field>
          <Field label="Unit" required>
            <Input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="tablets, units, boxes" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Storage Requirement">
            <Input value={form.storage_requirement} onChange={e => set('storage_requirement', e.target.value)} placeholder="Auto-filled from product" />
          </Field>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading}>Register Batch</SubmitButton></div>
      </div>
    </form>
  );
}

function BatchDetail({ batch, onClose }) {
  const api = useApi();
  const [latestTest, setLatestTest] = useState(null);
  const [loadingTest, setLoadingTest] = useState(true);

  useEffect(() => {
    const fetchLatestTest = async () => {
      setLoadingTest(true);
      try {
        const res = await api.get(`/quality-tests?batch_number=${batch.batch_number}&page_size=1`);
        if (res.items && res.items.length > 0) {
          setLatestTest(res.items[0]);
        } else {
          setLatestTest(null);
        }
      } catch (e) {
        setLatestTest(null);
      } finally {
        setLoadingTest(false);
      }
    };
    fetchLatestTest();
  }, [batch.batch_number]);

  const statusRow = (label, value) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <Badge status={value} />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Batch Identity</div>
          <div className="space-y-1">
            <div><span className="text-gray-400">Batch No:</span> <span className="font-mono font-semibold">{batch.batch_number}</span></div>
            <div><span className="text-gray-400">QR ID:</span> <span className="font-mono text-xs text-teal-700">{batch.qr_identifier}</span></div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Product</div>
          <div className="font-semibold text-gray-800">{batch.product?.name || `Product #${batch.product_id}`}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dates</div>
          <div className="space-y-1">
            <div><span className="text-gray-400">Manufactured:</span> <span className="font-medium">{batch.manufacturing_date}</span></div>
            <div><span className="text-gray-400">Expires:</span> <span className={`font-medium ${EXPIRY_COLORS[batch.expiry_status]}`}>{batch.expiry_date}</span></div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quantity</div>
          <div className="text-xl font-bold text-gray-900">{batch.quantity?.toLocaleString()}</div>
          <div className="text-gray-400 text-xs">{batch.unit}</div>
        </div>
      </div>

      {/* Phase 4 Quality Testing Section */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>🔬 Quality Testing Profile</span>
          {latestTest && <Badge status={latestTest.overall_result} />}
        </div>
        {loadingTest ? (
          <div className="text-xs text-gray-400 py-2">Loading batch laboratory records…</div>
        ) : latestTest ? (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Latest Test ID:</span>
              <span className="font-mono font-bold text-gray-800">#{latestTest.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Sample Specimen:</span>
              <span className="font-mono text-teal-700 font-bold">{latestTest.quality_sample?.sample_code}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Overall Result:</span>
              <span className="font-bold">{latestTest.overall_result}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Testing Date:</span>
              <span className="text-gray-700">{new Date(latestTest.test_date || latestTest.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Lead Inspector:</span>
              <span className="text-gray-700">{latestTest.inspector?.full_name || 'Inspector'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Critical Failures:</span>
              <span className="font-bold text-red-600">
                {latestTest.test_results?.filter(r => r.is_critical_failure).length || 0}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Test Record Status:</span>
              <span className="font-semibold text-gray-800">{latestTest.is_completed ? 'COMPLETED (OFFICIAL)' : 'IN PROGRESS'}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic py-2">
            Quality testing not yet performed.
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status Overview</div>
        {statusRow('Expiry Status', batch.expiry_status)}
        {statusRow('Quality Status', batch.quality_status)}
        {statusRow('Compliance Status', batch.compliance_status)}
        {statusRow('Final Decision', batch.final_decision)}
        {statusRow('Recall Status', batch.recall_status)}
      </div>

      <button onClick={onClose} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Close</button>
    </div>
  );
}

export default function BatchIntelligence() {
  const api = useApi();
  const { currentUser } = useAuth();
  const canCreate = ['ADMIN', 'QUALITY_INSPECTOR'].includes(currentUser?.role);

  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [p, m, s] = await Promise.all([
        api.get('/products?page=1&page_size=100&status=ACTIVE'),
        api.get('/manufacturers?page=1&page_size=100'),
        api.get('/suppliers?page=1&page_size=100'),
      ]);
      setProducts(p.items || []);
      setManufacturers(m.items || []);
      setSuppliers(s.items || []);
    };
    load().catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, page_size: 20 });
      if (search) params.set('search', search);
      if (expiryFilter) params.set('expiry_status', expiryFilter);
      if (qualityFilter) params.set('quality_status', qualityFilter);
      setData(await api.get(`/batches?${params}`));
    } catch (e) { setError(e.detail || 'Failed to load.'); }
    finally { setLoading(false); }
  }, [page, search, expiryFilter, qualityFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Batch Intelligence"
        subtitle="Pharmaceutical batch tracking, traceability, and status monitoring"
        action={canCreate && (
          <button onClick={() => setModal('add')}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-all">
            + Register Batch
          </button>
        )}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48"><SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search batch number…" /></div>
          <select value={expiryFilter} onChange={e => { setExpiryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">All Expiry</option>
            {['SAFE','EXPIRING_SOON','URGENT','EXPIRED'].map(v => <option key={v} value={v}>{v.replace('_',' ')}</option>)}
          </select>
          <select value={qualityFilter} onChange={e => { setQualityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">All Quality</option>
            {['PENDING','PASSED','FAILED','UNDER_REVIEW'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : error ? (
          <div className="p-4"><ErrorAlert message={error} onDismiss={() => setError('')} /></div>
        ) : !data?.items?.length ? (
          <EmptyState icon="📦" title="No batches found" message="No pharmaceutical batches have been registered yet." />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>{['Batch', 'Product', 'Supplier', 'Manufactured', 'Expires', 'Expiry Status', 'Quality', 'Compliance', 'Decision', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelected(b); setModal('detail'); }}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-teal-800">{b.batch_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 text-xs">{b.product?.name || `#${b.product_id}`}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{b.supplier?.name || `#${b.supplier_id}`}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{b.manufacturing_date}</td>
                      <td className={`px-4 py-3 text-xs font-medium ${EXPIRY_COLORS[b.expiry_status]}`}>{b.expiry_date}</td>
                      <td className="px-4 py-3"><Badge status={b.expiry_status} /></td>
                      <td className="px-4 py-3"><Badge status={b.quality_status} /></td>
                      <td className="px-4 py-3"><Badge status={b.compliance_status} /></td>
                      <td className="px-4 py-3"><Badge status={b.final_decision} /></td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-teal-600 hover:underline">View →</span>
                      </td>
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

      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Register New Batch" size="xl">
        <BatchForm products={products} manufacturers={manufacturers} suppliers={suppliers}
          onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'detail' && !!selected} onClose={() => { setModal(null); setSelected(null); }}
        title={`Batch Profile — ${selected?.batch_number}`} size="lg">
        {selected && <BatchDetail batch={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      </Modal>
    </div>
  );
}
