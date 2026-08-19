import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPut } from '../services/api';

const SEVERITY_COLORS = {
  LOW: 'bg-blue-100 text-blue-700 border-blue-300',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 border-red-300',
};

const STATUS_COLORS = {
  UNREAD: 'bg-red-100 text-red-700',
  ACKNOWLEDGED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
};

export default function AlertCenter() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterStatus) params.append('status', filterStatus);
      params.append('limit', '100');
      const data = await apiGet(`/alerts?${params}`, token);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.detail || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [token, filterSeverity, filterStatus]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleAcknowledge = async (id) => {
    try {
      await apiPut(`/alerts/${id}/acknowledge`, {}, token);
      loadAlerts();
    } catch (e) {
      setError(e.detail || 'Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id) => {
    try {
      await apiPut(`/alerts/${id}/resolve?resolution_notes=${encodeURIComponent(resolveNotes || 'Resolved')}`, {}, token);
      setResolvingId(null);
      setResolveNotes('');
      loadAlerts();
    } catch (e) {
      setError(e.detail || 'Failed to resolve alert');
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read || a.status === 'UNREAD').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const ackCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time critical events, temperature excursions, quarantine triggers & recalls
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <span>🔄</span> Refresh Feed
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: alerts.length, icon: '🔔', color: 'bg-blue-50 border-blue-200 text-blue-800' },
          { label: 'Unread / New', value: unreadCount, icon: '🚨', color: 'bg-red-50 border-red-200 text-red-800' },
          { label: 'Active Critical', value: criticalCount, icon: '🔥', color: 'bg-orange-50 border-orange-200 text-orange-800' },
          { label: 'Acknowledged', value: ackCount, icon: '👁️', color: 'bg-purple-50 border-purple-200 text-purple-800' },
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

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-200 flex-wrap">
        <div>
          <label className="text-xs font-semibold text-gray-500 mr-2">Severity:</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Severities</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mr-2">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            {['UNREAD', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            Loading alerts…
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-semibold text-gray-700">No alerts match your current filter</p>
            <p className="text-xs text-gray-400 mt-1">Supply chain conditions and compliance are running smoothly.</p>
          </div>
        ) : (
          alerts.map((al) => (
            <div
              key={al.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                al.severity === 'CRITICAL'
                  ? 'border-red-300 shadow-sm shadow-red-100'
                  : al.severity === 'HIGH'
                  ? 'border-orange-300'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                  <span className="text-2xl mt-0.5">
                    {al.severity === 'CRITICAL'
                      ? '🚨'
                      : al.alert_type === 'STORAGE_EXCURSION'
                      ? '🌡️'
                      : al.alert_type === 'TRANSPORT_EXCURSION'
                      ? '🚚'
                      : al.alert_type === 'RECALL'
                      ? '⚠️'
                      : al.alert_type === 'QUARANTINE'
                      ? '🔒'
                      : '🔔'}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{al.title}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                          SEVERITY_COLORS[al.severity] || 'bg-gray-100'
                        }`}
                      >
                        {al.severity}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                          STATUS_COLORS[al.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {al.status || 'UNREAD'}
                      </span>
                      {al.alert_type && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {al.alert_type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{al.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                      <span>🕒 {new Date(al.created_at).toLocaleString('en-IN')}</span>
                      {al.related_batch_id && <span>📦 Batch #{al.related_batch_id}</span>}
                      {al.entity_type && (
                        <span>
                          🔗 {al.entity_type} {al.entity_id ? `#${al.entity_id}` : ''}
                        </span>
                      )}
                      {al.resolution_notes && (
                        <span className="text-emerald-600 italic">"Resolved: {al.resolution_notes}"</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {al.status === 'UNREAD' && (
                    <button
                      onClick={() => handleAcknowledge(al.id)}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Acknowledge
                    </button>
                  )}
                  {al.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setResolvingId(al.id)}
                      className="text-xs bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {resolvingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-2">Resolve Alert #{resolvingId}</h2>
            <p className="text-xs text-gray-500 mb-4">Enter corrective action or resolution summary:</p>
            <textarea
              rows={3}
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="e.g., Temperature normalized, retested batch PASSED, corrective action CA-001 created..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setResolvingId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(resolvingId)}
                className="px-4 py-2 bg-emerald-700 text-white text-sm rounded-lg font-medium hover:bg-emerald-800"
              >
                Confirm Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
