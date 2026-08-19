import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowLeft,
  ArrowRight,
  Building2,
  Stethoscope,
  FlaskConical
} from 'lucide-react';

const ALLOWED_ROLES = [
  { value: 'QUALITY_INSPECTOR', label: 'Quality Inspector', desc: 'Laboratory testing & compliance audits', icon: FlaskConical },
  { value: 'HOSPITAL', label: 'Hospital Pharmacist', desc: 'Ward dispensing & cold chain management', icon: Stethoscope },
  { value: 'SUPPLIER', label: 'Pharma Supplier', desc: 'Shipment deliveries & batch records', icon: Building2 },
];

const passRequirements = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  number: /[0-9]/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
});

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', role_name: 'QUALITY_INSPECTOR'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const req = passRequirements(form.password);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.'); return;
    }
    if (!Object.values(req).every(Boolean)) {
      setError('Password does not meet the clinical complexity requirements.'); return;
    }
    setLoading(true); setError('');
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-2xl border border-slate-200 text-center max-w-md w-full space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Account Created Successfully</h2>
          <p className="text-xs text-slate-500">
            Your pharmaceutical quality credentials have been registered. Redirecting you to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Informational Sidebar */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-600/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center border border-teal-400/30">
                <ShieldCheck className="w-5 h-5 text-teal-300" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">PharmaQ Control</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Hospital Quality Registration
              </h1>
              <p className="text-xs text-teal-100/80 leading-relaxed">
                Join the centralized pharmaceutical monitoring ecosystem for strict 21 CFR compliance, lot tracking, and automated release.
              </p>
            </div>

            {/* Role Info Cards */}
            <div className="space-y-2.5 pt-2">
              {ALLOWED_ROLES.map((r) => {
                const IconComponent = r.icon;
                const isSelected = form.role_name === r.value;
                return (
                  <div
                    key={r.value}
                    onClick={() => setForm(f => ({ ...f, role_name: r.value }))}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-teal-700/80 border-teal-400 text-white shadow-md'
                        : 'bg-teal-950/40 border-teal-800/60 text-teal-200/80 hover:bg-teal-900/60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300 flex-shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{r.label}</div>
                      <div className="text-[11px] opacity-75">{r.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-teal-300/60 pt-6">
            Admin accounts are reserved for system operations.
          </div>
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Create Clinical Account</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your practitioner / auditor credentials</p>
              </div>
              <Link to="/login" className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    name="full_name"
                    required
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Dr. Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Professional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="s.jenkins@hospital-pharma.org"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      name="confirm_password"
                      type="password"
                      required
                      value={form.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password strength checklist */}
              {form.password && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-1 text-[11px]">
                  {[
                    [req.length, '8+ characters'],
                    [req.upper, 'Uppercase letter'],
                    [req.lower, 'Lowercase letter'],
                    [req.number, 'Number'],
                    [req.special, 'Special symbol'],
                  ].map(([met, label]) => (
                    <span key={label} className={`flex items-center gap-1 ${met ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {met ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Quality Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 text-center text-xs text-slate-500 border-t border-slate-100">
            Already have an active account?{' '}
            <Link to="/login" className="font-bold text-teal-700 hover:text-teal-900">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
