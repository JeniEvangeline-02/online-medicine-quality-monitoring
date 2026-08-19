import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-red-100 text-red-700',
  PARTIALLY_COMPLETED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-200 text-gray-500',
};
const SEV_COLORS = {
  LOW: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function RecallManager() {
  const { token } = useAuth();
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({ batch_id: '', reason: '', description: '', severity: 'HIGH', instructions: '', recall_date: '' });
  const [upForm, setUpForm] = useState({ status: '', instructions: '', affected_supplies_count: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const data = await apiGet(`/recalls?${params}&limit=100`, token);
      setRecalls(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.detail || 'Failed to load recalls'); }
    finally { setLoading(false); }
  }, [token, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/recalls', {
        batch_id: Number(form.batch_id),
        reason: form.reason,
        description: form.description,
        severity: form.severity,
        instructions: form.instructions,
        recall_date: form.recall_date ? new Date(form.recall_date).toISOString() : undefined,
      }, token);
      setShowAdd(false);
      setForm({ batch_id: '', reason: '', description: '', severity: 'HIGH', instructions: '', recall_date: '' });
      load();
    } catch (e) { setError(e.detail || 'Failed to initiate recall'); }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    try {
      await apiPut(`/recalls/${updating.id}`, {
        status: upForm.status || undefined,
        instructions: upForm.instructions || undefined,
        affected_supplies_count: upForm.affected_supplies_count ? Number(upForm.affected_supplies_count) : undefined,
      }, token);
      setUpdating(null);
      load();
    } catch (e) { setError(e.detail || 'Failed to update recall'); }
  };

  const active = recalls.filter(r => r.status === 'ACTIVE').length;
  const completed = recalls.filter(r => r.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recall Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Initiate, track, and close product recall campaigns</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          ⚠️ Initiate Recall
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
          { label: 'Total Recalls', value: recalls.length, icon: '📋', color: 'bg-slate-50 border-slate-200 text-slate-800' },
          { label: 'Active', value: active, icon: '🚨', color: 'bg-red-50 border-red-200 text-red-800' },
          { label: 'Completed', value: completed, icon: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
          { label: 'Affected Units', value: recalls.reduce((a, r) => a + (r.affected_supplies_count || 0), 0), icon: '📦', color: 'bg-amber-50 border-amber-200 text-amber-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color} flex items-center gap-3`}>
            <div className="text-3xl">{s.icon}</div>
            <div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs font-medium opacity-70">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600">Filter:</label>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All</option>
          {['DRAFT', 'ACTIVE', 'PARTIALLY_COMPLETED', 'COMPLETED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
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
              {['Recall No.', 'Batch', 'Reason', 'Severity', 'Affected', 'Recall Date', 'Status', 'Issued By', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {recalls.length === 0
                ? <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No recalls found.</td></tr>
                : recalls.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono font-bold text-red-700">{r.recall_number}</td>
                    <td className="px-4 py-3 text-sm">{r.batch_id || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${SEV_COLORS[r.severity] || 'bg-gray-100'}`}>{r.severity}</span></td>
                    <td className="px-4 py-3 text-sm font-medium">{r.affected_supplies_count ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.recall_date ? new Date(r.recall_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[r.status] || 'bg-gray-100'}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.issued_by || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setUpdating(r); setUpForm({ status: r.status, instructions: r.instructions || '', affected_supplies_count: r.affected_supplies_count || '' }); }}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">⚠️ Initiate Recall</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={submitCreate} className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Batch ID *</label>
                <input required type="number" value={form.batch_id} onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                <textarea required rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Severity *</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s}>{s}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Recall Date</label>
                  <input type="datetime-local" value={form.recall_date} onChange={e => setForm(f => ({ ...f, recall_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
                <textarea rows={2} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Return to pharmacy, quarantine immediately…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-700 text-white text-sm rounded-lg font-medium hover:bg-red-800">Initiate Recall</button>
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
              <h2 className="font-bold text-gray-900">Update — {updating.recall_number}</h2>
              <button onClick={() => setUpdating(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={submitUpdate} className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={upForm.status} onChange={e => setUpForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {['DRAFT', 'ACTIVE', 'PARTIALLY_COMPLETED', 'COMPLETED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Affected Supplies Count</label>
                <input type="number" value={upForm.affected_supplies_count} onChange={e => setUpForm(f => ({ ...f, affected_supplies_count: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
                <textarea rows={3} value={upForm.instructions} onChange={e => setUpForm(f => ({ ...f, instructions: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
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
