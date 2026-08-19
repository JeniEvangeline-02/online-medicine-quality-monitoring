import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';

const ENTITY_TYPES = ['BATCH', 'SUPPLY', 'SAMPLE', 'TRANSPORT'];
const EVENT_TYPES = [
  'MANUFACTURED', 'DISPATCHED', 'RECEIVED', 'SAMPLED', 'TESTED',
  'COMPLIANCE_CHECKED', 'ACCEPTED', 'QUARANTINED', 'REJECTED',
  'STORED', 'MOVED', 'TRANSPORT_STARTED', 'TRANSPORT_COMPLETED',
  'RECALLED', 'CORRECTIVE_ACTION', 'DISPOSED',
];

const EVENT_COLORS = {
  MANUFACTURED: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-indigo-100 text-indigo-700',
  RECEIVED: 'bg-teal-100 text-teal-700',
  SAMPLED: 'bg-cyan-100 text-cyan-700',
  TESTED: 'bg-violet-100 text-violet-700',
  COMPLIANCE_CHECKED: 'bg-purple-100 text-purple-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  QUARANTINED: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  STORED: 'bg-green-100 text-green-700',
  MOVED: 'bg-sky-100 text-sky-700',
  TRANSPORT_STARTED: 'bg-orange-100 text-orange-700',
  TRANSPORT_COMPLETED: 'bg-lime-100 text-lime-700',
  RECALLED: 'bg-red-200 text-red-800',
  CORRECTIVE_ACTION: 'bg-pink-100 text-pink-700',
  DISPOSED: 'bg-gray-200 text-gray-600',
};

export default function TraceabilityTimeline() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({ entity_type: '', entity_id: '', event_type: '' });
  const [form, setForm] = useState({
    entity_type: 'BATCH', entity_id: '', event_type: 'RECEIVED',
    location: '', reference_id: '', remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.entity_id) params.append('entity_id', filters.entity_id);
      if (filters.event_type) params.append('event_type', filters.event_type);
      params.append('limit', '200');
      const data = await apiGet(`/traceability/events?${params}`, token);
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.detail || 'Failed to load traceability events');
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/traceability/events', { ...form, entity_id: Number(form.entity_id) }, token);
      setShowAdd(false);
      setForm({ entity_type: 'BATCH', entity_id: '', event_type: 'RECEIVED', location: '', reference_id: '', remarks: '' });
      load();
    } catch (e) {
      setError(e.detail || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traceability Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">Full lifecycle audit trail for batches, samples, and shipments</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all">
          <span>＋</span> Log Event
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entity Type</label>
            <select value={filters.entity_type} onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All Types</option>
              {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entity ID</label>
            <input type="number" value={filters.entity_id} onChange={e => setFilters(f => ({ ...f, entity_id: e.target.value }))}
              placeholder="e.g. 12" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Event Type</label>
            <select value={filters.event_type} onChange={e => setFilters(f => ({ ...f, event_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All Events</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <span className="text-4xl">🔍</span>
            <span className="text-sm">No traceability events found</span>
          </div>
        ) : (
          <div className="relative px-6 py-4">
            <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-4">
              {events.map((ev, idx) => (
                <div key={ev.id} className="relative flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-teal-300 flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold text-teal-700">
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 hover:border-teal-200 transition-all">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${EVENT_COLORS[ev.event_type] || 'bg-gray-100 text-gray-600'}`}>
                          {ev.event_type}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {ev.entity_type} #{ev.entity_id}
                        </span>
                        {ev.reference_id && (
                          <span className="text-xs text-gray-400">Ref: {ev.reference_id}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(ev.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {ev.location && <div className="text-xs text-gray-500 mt-2">📍 {ev.location}</div>}
                    {ev.remarks && <div className="text-xs text-gray-600 mt-1 italic">"{ev.remarks}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Log Traceability Event</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Entity Type *</label>
                  <select value={form.entity_type} onChange={e => setForm(f => ({ ...f, entity_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Entity ID *</label>
                  <input type="number" required value={form.entity_id} onChange={e => setForm(f => ({ ...f, entity_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Event Type *</label>
                <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Cold Room A, Ward 3…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference ID</label>
                  <input value={form.reference_id} onChange={e => setForm(f => ({ ...f, reference_id: e.target.value }))}
                    placeholder="QR, transport_id…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm rounded-lg font-medium disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Log Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
