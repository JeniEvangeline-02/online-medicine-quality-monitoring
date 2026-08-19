import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiPut } from '../services/api';

export default function Profile() {
  const { currentUser, accessToken, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');
    try {
      await apiPut('/auth/profile', { full_name: fullName }, accessToken);
      await refreshUser();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.detail || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const roleColor = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    QUALITY_INSPECTOR: 'bg-teal-100 text-teal-800 border-teal-200',
    SUPPLIER: 'bg-blue-100 text-blue-800 border-blue-200',
    HOSPITAL: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }[currentUser?.role] || 'bg-gray-100 text-gray-700';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your account information.</p>

      {/* Account Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-teal-700 flex items-center justify-center text-white text-xl font-bold">
            {currentUser?.full_name?.[0] || '?'}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-lg">{currentUser?.full_name}</div>
            <div className="text-gray-500 text-sm">{currentUser?.email}</div>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${roleColor}`}>
              {currentUser?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Account Status</div>
            <div className={`font-semibold ${currentUser?.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
              {currentUser?.is_active ? '● Active' : '● Inactive'}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Access Level</div>
            <div className="font-semibold text-gray-800">{currentUser?.role?.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Update Profile</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={currentUser?.email || ''} disabled
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed after registration.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input value={currentUser?.role?.replace('_', ' ') || ''} disabled
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Role changes must be performed by an administrator.</p>
          </div>

          {message && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">✓ {message}</div>}
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {error}</div>}

          <button type="submit" disabled={loading}
            className="py-3 px-6 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
