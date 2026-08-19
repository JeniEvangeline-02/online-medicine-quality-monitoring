import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';

const statusColor = {
  NORMAL: 'bg-emerald-100 text-emerald-700',
  WARNING: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-gray-100 text-gray-500',
};

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`rounded-xl p-4 border ${color} flex items-center gap-4`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs font-medium opacity-70">{label}</div>
      </div>
    </div>
  );
}

export default function StorageMonitor() {
  const { token } = useAuth();
  const [tab, setTab] = useState('locations');
  const [locations, setLocations] = useState([]);
  const [readings, setReadings] = useState([]);
  const [excursions, setExcursions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(null); // 'location' | 'reading' | 'excursion'
  const [resolving, setResolving] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const [locForm, setLocForm] = useState({ name: '', location_code: '', minimum_temperature: '', maximum_temperature: '', minimum_humidity: '', maximum_humidity: '', status: 'ACTIVE' });
  const [readForm, setReadForm] = useState({ storage_location_id: '', recorded_temperature: '', recorded_humidity: '', recorded_at: new Date().toISOString().slice(0, 16), source: 'MANUAL', batch_id: '', notes: '' });
  const [excForm, setExcForm] = useState({ storage_location_id: '', batch_id: '', parameter: 'TEMPERATURE', expected_min: '', expected_max: '', observed_value: '', severity: 'WARNING', start_time: new Date().toISOString().slice(0, 16), notes: '' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [locs, recs, excs] = await Promise.all([
        apiGet('/storage/locations', token),
        apiGet('/storage/monitoring?limit=50', token),
        apiGet('/storage/excursions', token),
      ]);
      setLocations(Array.isArray(locs) ? locs : []);
      setReadings(Array.isArray(recs) ? recs : []);
      setExcursions(Array.isArray(excs) ? excs : []);
    } catch (e) { setError(e.detail || 'Failed to load storage data'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const submitLocation = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/storage/locations', {
        ...locForm,
        minimum_temperature: locForm.minimum_temperature ? Number(locForm.minimum_temperature) : null,
        maximum_temperature: locForm.maximum_temperature ? Number(locForm.maximum_temperature) : null,
        minimum_humidity: locForm.minimum_humidity ? Number(locForm.minimum_humidity) : null,
        maximum_humidity: locForm.maximum_humidity ? Number(locForm.maximum_humidity) : null,
      }, token);
      setShowModal(null);
      loadAll();
    } catch (e) { setError(e.detail || 'Failed to create location'); }
  };

  const submitReading = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/storage/monitoring', {
        storage_location_id: Number(readForm.storage_location_id),
        recorded_temperature: readForm.recorded_temperature ? Number(readForm.recorded_temperature) : null,
        recorded_humidity: readForm.recorded_humidity ? Number(readForm.recorded_humidity) : null,
        recorded_at: new Date(readForm.recorded_at).toISOString(),
        source: readForm.source,
        batch_id: readForm.batch_id ? Number(readForm.batch_id) : null,
        notes: readForm.notes,
      }, token);
      setShowModal(null);
      loadAll();
    } catch (e) { setError(e.detail || 'Failed to record reading'); }
  };

  const submitExcursion = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/storage/excursions', {
        storage_location_id: Number(excForm.storage_location_id),
        batch_id: excForm.batch_id ? Number(excForm.batch_id) : null,
        parameter: excForm.parameter,
        expected_min: excForm.expected_min ? Number(excForm.expected_min) : null,
        expected_max: excForm.expected_max ? Number(excForm.expected_max) : null,
        observed_value: Number(excForm.observed_value),
        severity: excForm.severity,
        start_time: new Date(excForm.start_time).toISOString(),
        notes: excForm.notes,
      }, token);
      setShowModal(null);
      loadAll();
    } catch (e) { setError(e.detail || 'Failed to report excursion'); }
  };

  const resolveExcursion = async (id) => {
    try {
      await apiPut(`/storage/excursions/${id}/resolve`, { resolution_notes: resolveNotes }, token);
      setResolving(null);
      setResolveNotes('');
      loadAll();
    } catch (e) { setError(e.detail || 'Failed to resolve excursion'); }
  };

  const openExcursions = excursions.filter(e => e.status === 'OPEN').length;
  const criticalReadings = readings.filter(r => r.overall_status === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storage Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Cold room and storage unit temperature & humidity tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal('reading')} className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">📝 Log Reading</button>
          <button onClick={() => setShowModal('excursion')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">⚠️ Report Excursion</button>
          <button onClick={() => setShowModal('location')} className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">＋ Location</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Locations" value={locations.length} icon="🗄️" color="bg-blue-50 border-blue-200 text-blue-800" />
        <StatCard label="Readings (Recent 50)" value={readings.length} icon="🌡️" color="bg-teal-50 border-teal-200 text-teal-800" />
        <StatCard label="Open Excursions" value={openExcursions} icon="⚠️" color="bg-amber-50 border-amber-200 text-amber-800" />
        <StatCard label="Critical Readings" value={criticalReadings} icon="🚨" color="bg-red-50 border-red-200 text-red-800" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['locations', 'readings', 'excursions'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : tab === 'locations' ? (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>{['Code', 'Name', 'Temp Range (°C)', 'Humidity Range (%)', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {locations.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No locations defined. Add one above.</td></tr>
              ) : locations.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-4 py-3 text-sm font-mono text-teal-700">{l.location_code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{l.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.minimum_temperature ?? '—'} to {l.maximum_temperature ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.minimum_humidity ?? '—'} to {l.maximum_humidity ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${l.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : tab === 'readings' ? (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>{['Date/Time', 'Location', 'Temp (°C)', 'Humidity (%)', 'Temp Status', 'Overall', 'Notes'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {readings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No readings recorded yet.</td></tr>
              ) : readings.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.recorded_at).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm">{r.storage_location_id}</td>
                  <td className="px-4 py-3 text-sm font-mono">{r.recorded_temperature ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono">{r.recorded_humidity ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[r.temperature_status] || 'bg-gray-100 text-gray-500'}`}>{r.temperature_status}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[r.overall_status] || 'bg-gray-100 text-gray-500'}`}>{r.overall_status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>{['Parameter', 'Location', 'Observed', 'Expected Range', 'Severity', 'Status', 'Started', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {excursions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No excursions recorded.</td></tr>
              ) : excursions.map(ex => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{ex.parameter}</td>
                  <td className="px-4 py-3 text-sm">{ex.storage_location_id}</td>
                  <td className="px-4 py-3 text-sm font-mono font-bold text-red-600">{ex.observed_value}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{ex.expected_min ?? '—'} – {ex.expected_max ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${ex.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{ex.severity}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[ex.status] || 'bg-gray-100'}`}>{ex.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(ex.start_time).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    {ex.status === 'OPEN' && (
                      <button onClick={() => setResolving(ex.id)} className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700">Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {showModal === 'location' ? '＋ Add Storage Location' : showModal === 'reading' ? '📝 Log Monitoring Reading' : '⚠️ Report Storage Excursion'}
              </h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {showModal === 'location' && (
              <form onSubmit={submitLocation} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input required value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Location Code *</label>
                    <input required value={locForm.location_code} onChange={e => setLocForm(f => ({ ...f, location_code: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Min Temp (°C)</label>
                    <input type="number" step="0.1" value={locForm.minimum_temperature} onChange={e => setLocForm(f => ({ ...f, minimum_temperature: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Max Temp (°C)</label>
                    <input type="number" step="0.1" value={locForm.maximum_temperature} onChange={e => setLocForm(f => ({ ...f, maximum_temperature: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Min Humidity (%)</label>
                    <input type="number" step="0.1" value={locForm.minimum_humidity} onChange={e => setLocForm(f => ({ ...f, minimum_humidity: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Max Humidity (%)</label>
                    <input type="number" step="0.1" value={locForm.maximum_humidity} onChange={e => setLocForm(f => ({ ...f, maximum_humidity: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg font-medium hover:bg-teal-800">Create Location</button>
                </div>
              </form>
            )}

            {showModal === 'reading' && (
              <form onSubmit={submitReading} className="p-6 space-y-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Storage Location ID *</label>
                  <input required type="number" value={readForm.storage_location_id} onChange={e => setReadForm(f => ({ ...f, storage_location_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Temperature (°C)</label>
                    <input type="number" step="0.1" value={readForm.recorded_temperature} onChange={e => setReadForm(f => ({ ...f, recorded_temperature: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Humidity (%)</label>
                    <input type="number" step="0.1" value={readForm.recorded_humidity} onChange={e => setReadForm(f => ({ ...f, recorded_humidity: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Recorded At *</label>
                    <input required type="datetime-local" value={readForm.recorded_at} onChange={e => setReadForm(f => ({ ...f, recorded_at: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Batch ID</label>
                    <input type="number" value={readForm.batch_id} onChange={e => setReadForm(f => ({ ...f, batch_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input value={readForm.notes} onChange={e => setReadForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg font-medium hover:bg-teal-800">Record Reading</button>
                </div>
              </form>
            )}

            {showModal === 'excursion' && (
              <form onSubmit={submitExcursion} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Location ID *</label>
                    <input required type="number" value={excForm.storage_location_id} onChange={e => setExcForm(f => ({ ...f, storage_location_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Batch ID</label>
                    <input type="number" value={excForm.batch_id} onChange={e => setExcForm(f => ({ ...f, batch_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Parameter *</label>
                    <select value={excForm.parameter} onChange={e => setExcForm(f => ({ ...f, parameter: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="TEMPERATURE">TEMPERATURE</option><option value="HUMIDITY">HUMIDITY</option>
                    </select></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Severity *</label>
                    <select value={excForm.severity} onChange={e => setExcForm(f => ({ ...f, severity: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="WARNING">WARNING</option><option value="CRITICAL">CRITICAL</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Min Expected</label>
                    <input type="number" step="0.1" value={excForm.expected_min} onChange={e => setExcForm(f => ({ ...f, expected_min: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Max Expected</label>
                    <input type="number" step="0.1" value={excForm.expected_max} onChange={e => setExcForm(f => ({ ...f, expected_max: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Observed *</label>
                    <input required type="number" step="0.1" value={excForm.observed_value} onChange={e => setExcForm(f => ({ ...f, observed_value: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
                  <input required type="datetime-local" value={excForm.start_time} onChange={e => setExcForm(f => ({ ...f, start_time: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input value={excForm.notes} onChange={e => setExcForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg font-medium hover:bg-amber-700">Report Excursion</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolving && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-4">Resolve Excursion #{resolving}</h2>
            <textarea rows={3} value={resolveNotes} onChange={e => setResolveNotes(e.target.value)}
              placeholder="Describe the resolution steps taken…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setResolving(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => resolveExcursion(resolving)} className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg font-medium hover:bg-teal-800">Confirm Resolved</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
