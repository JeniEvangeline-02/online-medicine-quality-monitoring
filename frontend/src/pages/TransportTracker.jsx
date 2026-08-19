import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';

const STATUS_COLORS = {
  PLANNED: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-amber-100 text-amber-700',
  ARRIVED: 'bg-emerald-100 text-emerald-700',
  DELAYED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  NORMAL: 'bg-emerald-100 text-emerald-700',
  WARNING: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
  OPEN: 'bg-red-100 text-red-700',
  RESOLVED: 'bg-gray-100 text-gray-500',
};

export default function TransportTracker() {
  const { token } = useAuth();
  const [tab, setTab] = useState('transports');
  const [transports, setTransports] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [excursions, setExcursions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [tForm, setTForm] = useState({
    transport_id: '', batch_id: '', supplier_id: '', source_location: '',
    destination_location: '', vehicle_number: '', carrier_name: '',
    departure_time: '', expected_arrival: '', temperature_min_required: '',
    temperature_max_required: '', notes: '',
  });
  const [mForm, setMForm] = useState({
    transport_id: '', recorded_temperature: '', recorded_humidity: '',
    recorded_at: new Date().toISOString().slice(0, 16), location_at_time: '', notes: '',
  });
  const [eForm, setEForm] = useState({
    transport_id: '', batch_id: '', parameter: 'TEMPERATURE',
    expected_min: '', expected_max: '', observed_value: '',
    severity: 'WARNING', start_time: new Date().toISOString().slice(0, 16), notes: '',
  });
  const [statusUpdate, setStatusUpdate] = useState({ id: null, status: '', actual_arrival: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ts, ms, es] = await Promise.all([
        apiGet('/transport?limit=100', token),
        apiGet('/transport/monitoring/records?limit=50', token),
        apiGet('/transport/excursions/list', token),
      ]);
      setTransports(Array.isArray(ts) ? ts : []);
      setMonitoring(Array.isArray(ms) ? ms : []);
      setExcursions(Array.isArray(es) ? es : []);
    } catch (e) { setError(e.detail || 'Failed to load transport data'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submitTransport = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/transport', {
        ...tForm,
        batch_id: tForm.batch_id ? Number(tForm.batch_id) : null,
        supplier_id: tForm.supplier_id ? Number(tForm.supplier_id) : null,
        temperature_min_required: tForm.temperature_min_required ? Number(tForm.temperature_min_required) : null,
        temperature_max_required: tForm.temperature_max_required ? Number(tForm.temperature_max_required) : null,
        departure_time: tForm.departure_time ? new Date(tForm.departure_time).toISOString() : null,
        expected_arrival: tForm.expected_arrival ? new Date(tForm.expected_arrival).toISOString() : null,
      }, token);
      setShowModal(null);
      load();
    } catch (e) { setError(e.detail || 'Failed to create transport'); }
  };

  const submitMonitoring = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/transport/monitoring', {
        transport_id: Number(mForm.transport_id),
        recorded_temperature: mForm.recorded_temperature ? Number(mForm.recorded_temperature) : null,
        recorded_humidity: mForm.recorded_humidity ? Number(mForm.recorded_humidity) : null,
        recorded_at: new Date(mForm.recorded_at).toISOString(),
        location_at_time: mForm.location_at_time,
        notes: mForm.notes,
      }, token);
      setShowModal(null);
      load();
    } catch (e) { setError(e.detail || 'Failed to record monitoring'); }
  };

  const submitExcursion = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/transport/excursions', {
        transport_id: Number(eForm.transport_id),
        batch_id: eForm.batch_id ? Number(eForm.batch_id) : null,
        parameter: eForm.parameter,
        expected_min: eForm.expected_min ? Number(eForm.expected_min) : null,
        expected_max: eForm.expected_max ? Number(eForm.expected_max) : null,
        observed_value: Number(eForm.observed_value),
        severity: eForm.severity,
        start_time: new Date(eForm.start_time).toISOString(),
        notes: eForm.notes,
      }, token);
      setShowModal(null);
      load();
    } catch (e) { setError(e.detail || 'Failed to report excursion'); }
  };

  const updateStatus = async () => {
    try {
      await apiPut(`/transport/${statusUpdate.id}`, {
        status: statusUpdate.status || undefined,
        actual_arrival: statusUpdate.actual_arrival ? new Date(statusUpdate.actual_arrival).toISOString() : undefined,
        notes: statusUpdate.notes || undefined,
      }, token);
      setStatusUpdate({ id: null, status: '', actual_arrival: '', notes: '' });
      load();
    } catch (e) { setError(e.detail || 'Failed to update status'); }
  };

  const openCount = excursions.filter(e => e.status === 'OPEN').length;
  const inTransit = transports.filter(t => t.status === 'IN_TRANSIT').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Cold-chain monitoring during shipment and delivery</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => setShowModal('transport')} className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-lg text-sm font-medium">＋ New Transport</button>
          <button onClick={() => setShowModal('monitoring')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">📝 Log Reading</button>
          <button onClick={() => setShowModal('excursion')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium">⚠️ Report Excursion</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          ⚠️ {error} <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Transports', value: transports.length, icon: '🚚', color: 'bg-blue-50 border-blue-200 text-blue-800' },
          { label: 'In Transit', value: inTransit, icon: '🔄', color: 'bg-amber-50 border-amber-200 text-amber-800' },
          { label: 'Monitoring Records', value: monitoring.length, icon: '🌡️', color: 'bg-teal-50 border-teal-200 text-teal-800' },
          { label: 'Open Excursions', value: openCount, icon: '🚨', color: 'bg-red-50 border-red-200 text-red-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color} flex items-center gap-3`}>
            <div className="text-3xl">{s.icon}</div>
            <div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs font-medium opacity-70">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['transports', 'monitoring', 'excursions'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> Loading…
          </div>
        ) : tab === 'transports' ? (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              {['Transport ID', 'Batch', 'Carrier', 'Route', 'Departure', 'Expected Arrival', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {transports.length === 0
                ? <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No transports recorded yet.</td></tr>
                : transports.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-teal-700">{t.transport_id}</td>
                    <td className="px-4 py-3 text-sm">{t.batch_id || '—'}</td>
                    <td className="px-4 py-3 text-sm">{t.carrier_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.source_location || '—'} → {t.destination_location || '—'}</td>
                    <td className="px-4 py-3 text-xs">{t.departure_time ? new Date(t.departure_time).toLocaleString('en-IN') : '—'}</td>
                    <td className="px-4 py-3 text-xs">{t.expected_arrival ? new Date(t.expected_arrival).toLocaleString('en-IN') : '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[t.status] || 'bg-gray-100'}`}>{t.status}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setStatusUpdate({ id: t.id, status: t.status, actual_arrival: '', notes: '' })}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-700">Update</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : tab === 'monitoring' ? (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              {['Transport ID', 'Recorded At', 'Temp (°C)', 'Humidity (%)', 'Location', 'Status', 'Notes'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {monitoring.length === 0
                ? <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No monitoring records yet.</td></tr>
                : monitoring.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{m.transport_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(m.recorded_at).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm font-mono">{m.recorded_temperature ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono">{m.recorded_humidity ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{m.location_at_time || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[m.overall_status] || 'bg-gray-100'}`}>{m.overall_status}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.notes || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              {['Transport', 'Batch', 'Parameter', 'Observed', 'Expected', 'Severity', 'Status', 'Started'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {excursions.length === 0
                ? <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No excursions recorded.</td></tr>
                : excursions.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{ex.transport_id}</td>
                    <td className="px-4 py-3 text-sm">{ex.batch_id || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{ex.parameter}</td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-red-600">{ex.observed_value}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{ex.expected_min ?? '—'} – {ex.expected_max ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${ex.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{ex.severity}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[ex.status] || 'bg-gray-100'}`}>{ex.status}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(ex.start_time).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">
                {showModal === 'transport' ? '＋ New Transport' : showModal === 'monitoring' ? '📝 Log Reading' : '⚠️ Report Excursion'}
              </h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {showModal === 'transport' && (
              <form onSubmit={submitTransport} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Transport ID *</label>
                    <input required value={tForm.transport_id} onChange={e => setTForm(f => ({ ...f, transport_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Batch ID</label>
                    <input type="number" value={tForm.batch_id} onChange={e => setTForm(f => ({ ...f, batch_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Carrier Name</label>
                    <input value={tForm.carrier_name} onChange={e => setTForm(f => ({ ...f, carrier_name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Number</label>
                    <input value={tForm.vehicle_number} onChange={e => setTForm(f => ({ ...f, vehicle_number: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Source Location</label>
                    <input value={tForm.source_location} onChange={e => setTForm(f => ({ ...f, source_location: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
                    <input value={tForm.destination_location} onChange={e => setTForm(f => ({ ...f, destination_location: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Departure Time</label>
                    <input type="datetime-local" value={tForm.departure_time} onChange={e => setTForm(f => ({ ...f, departure_time: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Expected Arrival</label>
                    <input type="datetime-local" value={tForm.expected_arrival} onChange={e => setTForm(f => ({ ...f, expected_arrival: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Temp Min Required (°C)</label>
                    <input type="number" step="0.1" value={tForm.temperature_min_required} onChange={e => setTForm(f => ({ ...f, temperature_min_required: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Temp Max Required (°C)</label>
                    <input type="number" step="0.1" value={tForm.temperature_max_required} onChange={e => setTForm(f => ({ ...f, temperature_max_required: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea rows={2} value={tForm.notes} onChange={e => setTForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg font-medium hover:bg-teal-800">Create Transport</button>
                </div>
              </form>
            )}

            {showModal === 'monitoring' && (
              <form onSubmit={submitMonitoring} className="p-6 space-y-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Transport ID (numeric) *</label>
                  <input required type="number" value={mForm.transport_id} onChange={e => setMForm(f => ({ ...f, transport_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Temperature (°C)</label>
                    <input type="number" step="0.1" value={mForm.recorded_temperature} onChange={e => setMForm(f => ({ ...f, recorded_temperature: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Humidity (%)</label>
                    <input type="number" step="0.1" value={mForm.recorded_humidity} onChange={e => setMForm(f => ({ ...f, recorded_humidity: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Recorded At *</label>
                    <input required type="datetime-local" value={mForm.recorded_at} onChange={e => setMForm(f => ({ ...f, recorded_at: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Location at Time</label>
                    <input value={mForm.location_at_time} onChange={e => setMForm(f => ({ ...f, location_at_time: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input value={mForm.notes} onChange={e => setMForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg font-medium hover:bg-blue-800">Record Reading</button>
                </div>
              </form>
            )}

            {showModal === 'excursion' && (
              <form onSubmit={submitExcursion} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Transport ID *</label>
                    <input required type="number" value={eForm.transport_id} onChange={e => setEForm(f => ({ ...f, transport_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Batch ID</label>
                    <input type="number" value={eForm.batch_id} onChange={e => setEForm(f => ({ ...f, batch_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Parameter *</label>
                    <select value={eForm.parameter} onChange={e => setEForm(f => ({ ...f, parameter: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option>TEMPERATURE</option><option>HUMIDITY</option>
                    </select></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Severity *</label>
                    <select value={eForm.severity} onChange={e => setEForm(f => ({ ...f, severity: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option>WARNING</option><option>CRITICAL</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Min Expected</label>
                    <input type="number" step="0.1" value={eForm.expected_min} onChange={e => setEForm(f => ({ ...f, expected_min: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Max Expected</label>
                    <input type="number" step="0.1" value={eForm.expected_max} onChange={e => setEForm(f => ({ ...f, expected_max: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Observed *</label>
                    <input required type="number" step="0.1" value={eForm.observed_value} onChange={e => setEForm(f => ({ ...f, observed_value: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
                  <input required type="datetime-local" value={eForm.start_time} onChange={e => setEForm(f => ({ ...f, start_time: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input value={eForm.notes} onChange={e => setEForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg font-medium hover:bg-amber-700">Report Excursion</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Status Update Inline Modal */}
      {statusUpdate.id && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Update Transport Status</h2>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={statusUpdate.status} onChange={e => setStatusUpdate(s => ({ ...s, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {['PLANNED', 'IN_TRANSIT', 'ARRIVED', 'DELAYED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Actual Arrival</label>
              <input type="datetime-local" value={statusUpdate.actual_arrival} onChange={e => setStatusUpdate(s => ({ ...s, actual_arrival: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input value={statusUpdate.notes} onChange={e => setStatusUpdate(s => ({ ...s, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStatusUpdate({ id: null, status: '', actual_arrival: '', notes: '' })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={updateStatus} className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg font-medium hover:bg-teal-800">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
