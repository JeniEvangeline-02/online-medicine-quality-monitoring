import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../services/useApi';
import { useAuth } from '../context/AuthContext';
import {
  Badge, Loading, EmptyState, ErrorAlert, PageHeader,
  SearchBar, Paginator, Modal, Field, Input, Select, Textarea, SubmitButton
} from '../components/ui';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

function ManufacturerForm({ initial, onSave, onClose }) {
  const api = useApi();
  const [form, setForm] = useState(initial || { name: '', registration_number: '', contact_person: '', email: '', phone: '', address: '', status: 'ACTIVE' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!initial?.id;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (isEdit) await api.put(`/manufacturers/${initial.id}`, form);
      else await api.post('/manufacturers', form);
      onSave();
    } catch (err) { setError(err.detail || 'Save failed.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Manufacturer Name" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g., Cipla Ltd." />
        </Field>
        <Field label="Registration Number" required>
          <Input value={form.registration_number} onChange={e => set('registration_number', e.target.value)} required placeholder="MFG-XXXXX" disabled={isEdit} />
        </Field>
        <Field label="Contact Person">
          <Input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@company.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91-..." />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Address">
        <Textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
      </Field>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading}>{isEdit ? 'Update Manufacturer' : 'Add Manufacturer'}</SubmitButton></div>
      </div>
    </form>
  );
}

export default function ManufacturerRegistry() {
  const api = useApi();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, page_size: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/manufacturers?${params}`);
      setData(res);
    } catch (e) { setError(e.detail || 'Failed to load manufacturers.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Archive or delete this manufacturer?')) return;
    try { await api.delete(`/manufacturers/${id}`); load(); }
    catch (e) { alert(e.detail || 'Delete failed.'); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manufacturer Registry"
        subtitle="Verified pharmaceutical manufacturers and quality sources"
        action={isAdmin && (
          <button onClick={() => { setSelected(null); setModal('add'); }}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
            + Add Manufacturer
          </button>
        )}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or registration…" /></div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <Loading /> : error ? (
          <div className="p-4"><ErrorAlert message={error} onDismiss={() => setError('')} /></div>
        ) : !data?.items?.length ? (
          <EmptyState icon="🏭" title="No manufacturers found" message="No pharmaceutical manufacturers match your search criteria." />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>
                    {['Manufacturer', 'Registration', 'Contact', 'Email', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-400">{m.address}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.registration_number}</td>
                      <td className="px-4 py-3 text-gray-700">{m.contact_person || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.email || '—'}</td>
                      <td className="px-4 py-3"><Badge status={m.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isAdmin && (
                            <>
                              <button onClick={() => { setSelected(m); setModal('edit'); }}
                                className="text-xs px-2.5 py-1 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50">Edit</button>
                              <button onClick={() => handleDelete(m.id)}
                                className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Archive</button>
                            </>
                          )}
                        </div>
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
        title={modal === 'edit' ? 'Edit Manufacturer' : 'Add Manufacturer'} size="lg">
        <ManufacturerForm initial={modal === 'edit' ? selected : null}
          onSave={() => { setModal(null); load(); }}
          onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
