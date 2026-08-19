import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../services/useApi';
import { useAuth } from '../context/AuthContext';
import {
  Badge, Loading, EmptyState, ErrorAlert, PageHeader,
  SearchBar, Paginator, Modal, Field, Input, Select, Textarea, SubmitButton
} from '../components/ui';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

function SupplierForm({ initial, onSave, onClose }) {
  const api = useApi();
  const [form, setForm] = useState(initial || { name: '', registration_number: '', contact_person: '', email: '', phone: '', address: '', status: 'ACTIVE' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!initial?.id;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (isEdit) await api.put(`/suppliers/${initial.id}`, form);
      else await api.post('/suppliers', form);
      onSave();
    } catch (err) { setError(err.detail || 'Save failed.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Supplier Name" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g., PharmaLink Distributors" />
        </Field>
        <Field label="Registration Number" required>
          <Input value={form.registration_number} onChange={e => set('registration_number', e.target.value)} required placeholder="SUP-XXXXX" disabled={isEdit} />
        </Field>
        <Field label="Contact Person">
          <Input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Address">
        <Textarea value={form.address} onChange={e => set('address', e.target.value)} />
      </Field>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading}>{isEdit ? 'Update Supplier' : 'Add Supplier'}</SubmitButton></div>
      </div>
    </form>
  );
}

export default function SupplierRegistry() {
  const api = useApi();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, page_size: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      setData(await api.get(`/suppliers?${params}`));
    } catch (e) { setError(e.detail || 'Failed to load.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Archive or delete this supplier?')) return;
    try { await api.delete(`/suppliers/${id}`); load(); }
    catch (e) { alert(e.detail || 'Failed.'); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Supply Partner Registry"
        subtitle="Authorized medicine and consumable supply partners"
        action={isAdmin && (
          <button onClick={() => { setSelected(null); setModal('add'); }}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-all">
            + Add Supplier
          </button>
        )}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="flex-1"><SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or registration…" /></div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : error ? (
          <div className="p-4"><ErrorAlert message={error} onDismiss={() => setError('')} /></div>
        ) : !data?.items?.length ? (
          <EmptyState icon="🚚" title="No suppliers found" message="No supply partners match your criteria." />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>{['Supplier', 'Registration', 'Contact', 'Phone', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.address}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.registration_number}</td>
                      <td className="px-4 py-3 text-gray-700">{s.contact_person || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.phone || '—'}</td>
                      <td className="px-4 py-3"><Badge status={s.status} /></td>
                      <td className="px-4 py-3">
                        {isAdmin && <div className="flex gap-2">
                          <button onClick={() => { setSelected(s); setModal('edit'); }}
                            className="text-xs px-2.5 py-1 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50">Edit</button>
                          <button onClick={() => handleDelete(s.id)}
                            className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Archive</button>
                        </div>}
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

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <SupplierForm initial={modal === 'edit' ? selected : null}
          onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
