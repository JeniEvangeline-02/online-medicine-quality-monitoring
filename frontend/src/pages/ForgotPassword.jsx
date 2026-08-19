import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // NOTE: Password reset email delivery requires a configured mail service.
      // This endpoint is a stub — implement with SendGrid/SES in production.
      // For development, the reset token will be logged server-side.
      await apiPost('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      // Always show the same message to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <Link to="/login" className="text-teal-600 hover:text-teal-800 text-sm mb-6 inline-block">← Back to Sign In</Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your registered email address and we will send you a reset link.
        </p>

        {sent ? (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-sm">
            <div className="font-semibold mb-1">Check your inbox</div>
            If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            <div className="mt-3 text-xs text-teal-600">
              Note: In development mode, reset tokens are logged to the server console.
              Production deployment requires a configured email service (e.g. SendGrid, AWS SES).
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-all">
              {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</> : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
