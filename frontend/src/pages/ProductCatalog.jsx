import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../services/useApi';
import { useAuth } from '../context/AuthContext';
import {
  Badge, Loading, EmptyState, ErrorAlert, PageHeader,
  SearchBar, Paginator, Modal, Field, Input, Select, Textarea, SubmitButton
} from '../components/ui';

const MEDICINE_CATEGORIES = ['Analgesic','Antibiotic','Antiviral','Antihistamine','Antihypertensive','Antidiabetic','Cardiovascular','Gastrointestinal','Other'];
const CONSUMABLE_CATEGORIES = ['Surgical Supplies','Protective Equipment','Injection Equipment','Diagnostic Consumables','Wound Care','Catheters','Infection Control','Other'];
const DOSAGE_FORMS = ['Tablet','Capsule','Syrup','Injection','Cream','Ointment','Drops','Inhaler','Patch','Solution','Suspension'];
const STATUS_OPTIONS = ['ACTIVE','INACTIVE','SUSPENDED'];

function ProductForm({ initial, onSave, onClose, manufacturers }) {
  const api = useApi();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial || {
    product_code: '', name: '', generic_name: '', category: '',
    product_type: 'MEDICINE', dosage_form: '', strength: '',
    description: '', manufacturer_id: '', registration_number: '',
    storage_requirement: '', status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const categories = form.product_type === 'MEDICINE' ? MEDICINE_CATEGORIES : CONSUMABLE_CATEGORIES;

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { ...form, manufacturer_id: parseInt(form.manufacturer_id) };
      if (isEdit) await api.put(`/products/${initial.id}`, payload);
      else await api.post('/products', payload);
      onSave();
    } catch (err) { setError(err.detail || 'Save failed.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Product Identity</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Product Code" required>
            <Input value={form.product_code} onChange={e => set('product_code', e.target.value)} required disabled={isEdit} placeholder="MED-001 or CON-001" />
          </Field>
          <Field label="Product Type" required>
            <Select value={form.product_type} onChange={e => set('product_type', e.target.value)}>
              <option value="MEDICINE">Medicine</option>
              <option value="CONSUMABLE">Consumable</option>
            </Select>
          </Field>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Medical Information</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Product Name" required>
            <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g., Paracetamol 500mg" />
          </Field>
          <Field label="Generic Name">
            <Input value={form.generic_name} onChange={e => set('generic_name', e.target.value)} placeholder="e.g., Acetaminophen" />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          {form.product_type === 'MEDICINE' && <>
            <Field label="Dosage Form">
              <Select value={form.dosage_form} onChange={e => set('dosage_form', e.target.value)}>
                <option value="">Select form</option>
                {DOSAGE_FORMS.map(d => <option key={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Strength">
              <Input value={form.strength} onChange={e => set('strength', e.target.value)} placeholder="e.g., 500mg, 10mg/5ml" />
            </Field>
          </>}
        </div>
        <div className="mt-4">
          <Field label="Description">
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief product description" />
          </Field>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Manufacturer & Registration</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Manufacturer" required>
            <Select value={form.manufacturer_id} onChange={e => set('manufacturer_id', e.target.value)} required>
              <option value="">Select manufacturer</option>
              {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="Registration Number">
            <Input value={form.registration_number} onChange={e => set('registration_number', e.target.value)} placeholder="REG-XXXXX" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Storage Requirement">
            <Input value={form.storage_requirement} onChange={e => set('storage_requirement', e.target.value)} placeholder="e.g., Store below 25°C" />
          </Field>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading}>{isEdit ? 'Update Product' : 'Add Product'}</SubmitButton></div>
      </div>
    </form>
  );
}

export default function ProductCatalog() {
  const api = useApi();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [data, setData] = useState(null);
  const [manufacturers, setManufacturers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/manufacturers?page=1&page_size=100').then(r => setManufacturers(r.items || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, page_size: 20 });
      if (search) params.set('search', search);
      if (typeFilter) params.set('product_type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      setData(await api.get(`/products?${params}`));
    } catch (e) { setError(e.detail || 'Failed to load.'); }
    finally { setLoading(false); }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Archive or delete this product?')) return;
    try { await api.delete(`/products/${id}`); load(); }
    catch (e) { alert(e.detail || 'Failed.'); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pharmaceutical Product Registry"
        subtitle="Central catalog of medicines and medical consumables"
        action={isAdmin && (
          <button onClick={() => { setSelected(null); setModal('add'); }}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-all">
            + Add Product
          </button>
        )}
      />

      {/* Type tabs */}
      <div className="flex gap-2">
        {[['', 'All Products'], ['MEDICINE', '💊 Medicines'], ['CONSUMABLE', '🩺 Consumables']].map(([val, label]) => (
          <button key={val} onClick={() => { setTypeFilter(val); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${typeFilter === val ? 'bg-teal-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="flex-1"><SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search name, code, generic name…" /></div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : error ? (
          <div className="p-4"><ErrorAlert message={error} onDismiss={() => setError('')} /></div>
        ) : !data?.items?.length ? (
          <EmptyState icon="💊" title="No products found" message="No products match your current filters." />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>{['Product', 'Code', 'Type', 'Category', 'Manufacturer', 'Storage', 'Status', isAdmin ? 'Actions' : ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        {p.generic_name && <div className="text-xs text-gray-400">{p.generic_name} {p.strength && `· ${p.strength}`}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.product_code}</td>
                      <td className="px-4 py-3"><Badge status={p.product_type} /></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.category || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.manufacturer?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">{p.storage_requirement || '—'}</td>
                      <td className="px-4 py-3"><Badge status={p.status} /></td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setSelected(p); setModal('edit'); }}
                              className="text-xs px-2.5 py-1 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50">Edit</button>
                            <button onClick={() => handleDelete(p.id)}
                              className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Archive</button>
                          </div>
                        </td>
                      )}
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

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Edit Product' : 'Add Product'} size="xl">
        <ProductForm initial={modal === 'edit' ? selected : null} manufacturers={manufacturers}
          onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
