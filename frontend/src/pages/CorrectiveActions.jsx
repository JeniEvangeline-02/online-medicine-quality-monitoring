import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';

const STATUS_COLORS = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-200 text-gray-600',
};

const PRIORITY_COLORS = {
  LOW: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const ACTION_TYPES = [
  'INVESTIGATE',
  'QUARANTINE',
  'RETEST',
  'RETURN_TO_SUPPLIER',
  'RECALL',
  'DISPOSE',
  'REPLACE',
  'RELEASE',
];

const REF_TYPES = [
  'STORAGE_EXCURSION',
  'TRANSPORT_EXCURSION',
  'RECALL',
  'QUARANTINE',
];

export default function CorrectiveActions() {
  const { token } = useAuth();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({
    reference_type: 'STORAGE_EXCURSION',
    reference_id: '',
    action_type: 'INVESTIGATE',
    description: '',
    batch_id: '',
    supply_id: '',
    priority: 'MEDIUM',
    due_date: '',
  });

  const [upForm, setUpForm] = useState({
    status: '',
    completion_notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const data = await apiGet(`/corrective-actions?${params}&limit=100`, token);
      setActions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.detail || 'Failed to load corrective actions');
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      await apiPost(
        '/corrective-actions',
        {
          reference_type: form.reference_type,
          reference_id: Number(form.reference_id),
          action_type: form.action_type,
          description: form.description,
          batch_id: form.batch_id ? Number(form.batch_id) : null,
          supply_id: form.supply_id ? Number(form.supply_id) : null,
          priority: form.priority,
          due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        },
        token
      );
      setShowAdd(false);
      setForm({
        reference_type: 'STORAGE_EXCURSION',
        reference_id: '',
        action_type: 'INVESTIGATE',
        description: '',
        batch_id: '',
        supply_id: '',
        priority: 'MEDIUM',
        due_date: '',
      });
      load();
    } catch (e) {
      setError(e.detail || 'Failed to create corrective action');
    }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    try {
      await apiPut(
        `/corrective-actions/${updating.id}`,
        {
          status: upForm.status || undefined,
          completion_notes: upForm.completion_notes || undefined,
        },
        token
      );
      setUpdating(null);
      load();
    } catch (e) {
      setError(e.detail || 'Failed to update action');
    }
  };

  const openCount = actions.filter((a) => a.status === 'OPEN').length;
  const inProgCount = actions.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = actions.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corrective Actions (CAPA)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Resolve excursions, investigation tasks, quality defects & quarantine directives
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <span>＋</span> Log Action (CAPA)
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          ⚠️ {error}{' '}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total CAPA', value: actions.length, icon: '📋', color: 'bg-slate-50 border-slate-200 text-slate-800' },
          { label: 'Open', value: openCount, icon: '🚨', color: 'bg-red-50 border-red-200 text-red-800' },
          { label: 'In Progress', value: inProgCount, icon: '🔄', color: 'bg-amber-50 border-amber-200 text-amber-800' },
          { label: 'Completed', value: completedCount, icon: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color} flex items-center gap-3`}>
            <div className="text-3xl">{s.icon}</div>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium opacity-70">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600">Filter:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />{' '}
            Loading…
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Action Number',
                  'Action Type',
                  'Reference',
                  'Batch / Supply',
                  'Priority',
                  'Status',
                  'Due Date',
                  'Actions',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 text-sm">
                    No corrective actions logged.
                  </td>
                </tr>
              ) : (
                actions.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono font-bold text-teal-700">{a.action_number}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{a.action_type}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {a.reference_type} #{a.reference_id}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {a.batch_id ? `Batch #${a.batch_id}` : a.supply_id ? `Supply #${a.supply_id}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${PRIORITY_COLORS[a.priority] || 'bg-gray-100'}`}>
                        {a.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[a.status] || 'bg-gray-100'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setUpdating(a);
                          setUpForm({
                            status: a.status,
                            completion_notes: a.completion_notes || '',
                          });
                        }}
                        className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">＋ Log Corrective Action (CAPA)</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={submitCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference Type *</label>
                  <select
                    value={form.reference_type}
                    onChange={(e) => setForm((f) => ({ ...f, reference_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {REF_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference ID *</label>
                  <input
                    required
                    type="number"
                    value={form.reference_id}
                    onChange={(e) => setForm((f) => ({ ...f, reference_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Action Type *</label>
                  <select
                    value={form.action_type}
                    onChange={(e) => setForm((f) => ({ ...f, action_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {ACTION_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Batch ID (optional)</label>
                  <input
                    type="number"
                    value={form.batch_id}
                    onChange={(e) => setForm((f) => ({ ...f, batch_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description / Plan</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detail root cause analysis, corrective step, retest requirement..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg font-medium hover:bg-teal-800"
                >
                  Create Action
                </button>
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
              <h2 className="font-bold text-gray-900">Update — {updating.action_number}</h2>
              <button onClick={() => setUpdating(null)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>
            <form onSubmit={submitUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={upForm.status}
                  onChange={(e) => setUpForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Completion Notes</label>
                <textarea
                  rows={3}
                  value={upForm.completion_notes}
                  onChange={(e) => setUpForm((f) => ({ ...f, completion_notes: e.target.value }))}
                  placeholder="Record retest results, final disposal or release clearance..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setUpdating(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg font-medium hover:bg-teal-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
