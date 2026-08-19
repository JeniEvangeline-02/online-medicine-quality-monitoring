import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';

const STATUS_COLORS = {
  ACTIVE: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  RELEASED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-gray-200 text-gray-600',
  DISPOSED: 'bg-gray-300 text-gray-700',
};

const SEVERITY_COLORS = {
  LOW: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function QuarantineManager() {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({
    incoming_supply_id: '', batch_id: '', reason: '',
    reason_type: 'Quality Failure', severity: 'MEDIUM', location: '', assigned_to: '',
  });
  const [updateForm, setUpdateForm] = useState({ status: '', resolution_notes: '', location: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const data = await apiGet(`/quarantine?${params}&limit=100`, token);
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.detail || 'Failed to load quarantine records'); }
    finally { setLoading(false); }
  }, [token, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/quarantine', {
        incoming_supply_id: form.incoming_supply_id ? Number(form.incoming_supply_id) : null,
        batch_id: form.batch_id ? Number(form.batch_id) : null,
        reason: form.reason,
        reason_type: form.reason_type,
        severity: form.severity,
        location: form.location,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      }, token);
      setShowAdd(false);
      setForm({ incoming_supply_id: '', batch_id: '', reason: '', reason_type: 'Quality Failure', severity: 'MEDIUM', location: '', assigned_to: '' });
      load();
    } catch (e) { setError(e.detail || 'Failed to create quarantine record'); }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    try {
      await apiPut(`/quarantine/${updating.id}`, {
        status: updateForm.status || undefined,
        resolution_notes: updateForm.resolution_notes || undefined,
        location: updateForm.location || undefined,
      }, token);
      setUpdating(null);
      load();
    } catch (e) { setError(e.detail || 'Failed to update record'); }
  };

  const active = records.filter(r => r.status === 'ACTIVE').length;
  const underReview = records.filter(r => r.status === 'UNDER_REVIEW').length;
  const resolved = records.filter(r => ['RELEASED', 'REJECTED', 'DISPOSED'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quarantine Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Isolate, investigate, and release or dispose quarantined batches</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all">
          🔒 Quarantine Batch
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          ⚠️ {error} <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: records.length, icon: '🗂️', color: 'bg-slate-50 border-slate-200 text-slate-800' },
          { label: 'Active', value: active, icon: '🔒', color: 'bg-red-50 border-red-200 text-red-800' },
          { label: 'Under Review', value: underReview, icon: '🔍', color: 'bg-amber-50 border-amber-200 text-amber-800' },
          { label: 'Resolved', value: resolved, icon: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color} flex items-center gap-3`}>
            <div className="text-3xl">{s.icon}</div>
            <div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs font-medium opacity-70">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600">Filter by status:</label>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Statuses</option>
          {['ACTIVE', 'UNDER_REVIEW', 'RELEASED', 'REJECTED', 'DISPOSED'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> Loading…
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              {['Q Number', 'Batch', 'Reason Type', 'Reason', 'Severity', 'Location', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {records.length === 0
                ? <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No quarantine records found.</td></tr>
                : records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-teal-700 font-semibold">{r.quarantine_number || `#${r.id}`}</td>
                    <td className="px-4 py-3 text-sm">{r.batch_id || r.incoming_supply_id || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.reason_type || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${SEVERITY_COLORS[r.severity] || 'bg-gray-100 text-gray-600'}`}>{r.severity || '—'}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.location || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[r.status] || 'bg-gray-100'}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setUpdating(r); setUpdateForm({ status: r.status, resolution_notes: r.resolution_notes || '', location: r.location || '' }); }}
                        className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700">Update</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">🔒 Quarantine Batch</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={submitCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Batch ID</label>
                  <input type="number" value={form.batch_id} onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Supply ID</label>
                  <input type="number" value={form.incoming_supply_id} onChange={e => setForm(f => ({ ...f, incoming_supply_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                <textarea required rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Reason Type</label>
                  <select value={form.reason_type} onChange={e => setForm(f => ({ ...f, reason_type: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {['Quality Failure', 'Compliance Failure', 'Storage Excursion', 'Transport Excursion', 'Suspect Contamination', 'Pending Investigation', 'Recall'].map(t => <option key={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s}>{s}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Storage Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Quarantine Room B…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700">Quarantine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updating && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Update — {updating.quarantine_number || `#${updating.id}`}</h2>
              <button onClick={() => setUpdating(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={submitUpdate} className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {['ACTIVE', 'UNDER_REVIEW', 'RELEASED', 'REJECTED', 'DISPOSED'].map(s => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input value={updateForm.location} onChange={e => setUpdateForm(f => ({ ...f, location: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Resolution Notes</label>
                <textarea rows={3} value={updateForm.resolution_notes} onChange={e => setUpdateForm(f => ({ ...f, resolution_notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setUpdating(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg font-medium hover:bg-teal-800">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
