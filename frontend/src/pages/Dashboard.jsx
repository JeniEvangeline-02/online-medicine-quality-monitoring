import { useAuth } from '../context/AuthContext';

const ROLE_CONFIG = {
  ADMIN: { color: 'bg-purple-500', label: 'Administrator' },
  QUALITY_INSPECTOR: { color: 'bg-teal-500', label: 'Quality Inspector' },
  SUPPLIER: { color: 'bg-blue-500', label: 'Supplier' },
  HOSPITAL: { color: 'bg-emerald-500', label: 'Hospital' },
};

const STATS = [
  { label: 'Batches Monitored', value: '—', icon: '📦', note: 'Phase 3' },
  { label: 'Quality Tests', value: '—', icon: '🔬', note: 'Phase 4' },
  { label: 'Compliance Score', value: '—', icon: '⚖️', note: 'Phase 5' },
  { label: 'Active Alerts', value: '—', icon: '🔔', note: 'Phase 5' },
];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const role = currentUser?.role || '';
  const config = ROLE_CONFIG[role] || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {currentUser?.full_name?.[0] || '?'}
          </div>
          <div>
            <div className="text-teal-200 text-sm">Welcome back</div>
            <div className="text-xl font-bold">{currentUser?.full_name}</div>
            <div className={`inline-flex items-center gap-1.5 mt-1 text-xs px-2 py-0.5 rounded-full bg-white/20`}>
              <span className={`w-2 h-2 rounded-full ${config.color}`} />
              {config.label}
            </div>
          </div>
        </div>
      </div>

      {/* Phase Status Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <span className="text-amber-500 text-lg">🏗️</span>
        <div>
          <div className="font-semibold text-amber-800 text-sm">Phase 2 Complete — Authentication Active</div>
          <div className="text-amber-700 text-xs mt-0.5">
            The Quality Command Center and operational modules will be available in Phase 3 onwards.
            Your role-based access is fully configured.
          </div>
        </div>
      </div>

      {/* Stats Grid (Placeholder) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-300">{s.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
            <div className="text-xs text-gray-400">Available in {s.note}</div>
          </div>
        ))}
      </div>

      {/* Role Permissions Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Your Access Permissions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ['Command Center', ['ADMIN','QUALITY_INSPECTOR','HOSPITAL'].includes(role)],
            ['Quality Testing', ['ADMIN','QUALITY_INSPECTOR'].includes(role)],
            ['Compliance Management', ['ADMIN','QUALITY_INSPECTOR'].includes(role)],
            ['Incoming Supplies', ['ADMIN','HOSPITAL','QUALITY_INSPECTOR'].includes(role)],
            ['Supply Chain Management', ['ADMIN','SUPPLIER','QUALITY_INSPECTOR'].includes(role)],
            ['User Management', role === 'ADMIN'],
            ['Audit Trail', role === 'ADMIN'],
            ['Analytics & Reports', ['ADMIN','QUALITY_INSPECTOR'].includes(role)],
          ].map(([label, allowed]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`text-base ${allowed ? 'text-emerald-500' : 'text-gray-300'}`}>
                {allowed ? '✓' : '✕'}
              </span>
              <span className={allowed ? 'text-gray-800' : 'text-gray-400'}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
