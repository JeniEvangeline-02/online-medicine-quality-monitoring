import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  FlaskConical, 
  Microscope, 
  FileCheck2,
  Activity
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', label: 'System Admin', email: 'admin@pharma.com', color: 'border-teal-600 bg-teal-50 text-teal-900' },
  { role: 'QUALITY_INSPECTOR', label: 'Quality Auditor', email: 'inspector@pharma.com', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  { role: 'SUPPLIER', label: 'Vendor Portal', email: 'supplier@pharma.com', color: 'border-cyan-600 bg-cyan-50 text-cyan-900' },
  { role: 'HOSPITAL', label: 'Pharmacy Ward', email: 'hospital@pharma.com', color: 'border-slate-600 bg-slate-50 text-slate-900' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.detail || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => {
    setForm({ email, password: 'adminpassword123' });
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 lg:p-8">
      {/* Main Container */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ── LEFT VISUAL SECTION (Inspired by Reference Art) ──────────────── */}
        <div className="lg:col-span-7 relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 p-8 lg:p-12 text-white flex flex-col justify-between overflow-hidden">
          {/* Organic Teal / Turquoise Flow Background Shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/30 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/4" />
          <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg flex items-center justify-center">
                <div className="w-full h-full bg-teal-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-teal-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-white">PharmaQ</span>
                <span className="text-teal-400 font-semibold text-2xl tracking-tight ml-1">Control</span>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold tracking-wide uppercase">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Enterprise Quality Intelligence
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Pharmaceutical Quality &amp; Compliance Platform
              </h1>
              <p className="text-teal-100/80 text-sm lg:text-base leading-relaxed max-w-lg">
                Intelligent quality monitoring for medicines and consumables — from incoming lot testing to cold-chain traceability and automated release decisions.
              </p>
            </div>
          </div>

          {/* Reference-Inspired Pharmaceutical Illustration */}
          <div className="relative z-10 my-6 flex items-center justify-center">
            <div className="relative w-full max-w-md bg-teal-950/60 backdrop-blur-md rounded-2xl p-6 border border-teal-700/40 shadow-xl">
              
              {/* Illustration Grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-teal-900/60 rounded-xl p-3 border border-teal-600/30 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300 mb-2">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white">Lab Testing</span>
                  <span className="text-[11px] text-teal-200/70 mt-0.5">Automated Assay</span>
                </div>

                <div className="bg-teal-900/60 rounded-xl p-3 border border-teal-600/30 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 mb-2">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white">Compliance</span>
                  <span className="text-[11px] text-emerald-200/70 mt-0.5">Rule Engine</span>
                </div>

                <div className="bg-teal-900/60 rounded-xl p-3 border border-teal-600/30 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-2">
                    <Microscope className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white">AI Risk Scan</span>
                  <span className="text-[11px] text-cyan-200/70 mt-0.5">Anomaly Sensor</span>
                </div>
              </div>

              {/* Verified Batch Quality Stamp */}
              <div className="mt-4 pt-4 border-t border-teal-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-teal-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>21 CFR Part 11 &amp; GMP Validated</span>
                </div>
                <span className="font-mono text-teal-400 text-[11px] bg-teal-900/80 px-2 py-0.5 rounded border border-teal-700">
                  v2.0.0
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 text-xs text-teal-300/60 flex items-center justify-between">
            <span>© 2026 PharmaQ Control</span>
            <span>Hospital Quality Operations</span>
          </div>
        </div>

        {/* ── RIGHT LOGIN FORM SECTION ──────────────────────────── */}
        <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Sign In to Platform
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to access the Hospital Quality Command Center
              </p>
            </div>

            {/* Quick Demo Access (1-Click Fill) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Quick Demo Access
                </span>
                <span className="text-[11px] text-teal-700 font-medium">1-Click Auto Fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between hover:shadow-sm ${acc.color}`}
                  >
                    <span>{acc.label}</span>
                    <span className="text-[10px] opacity-70">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="officer@hospital.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-teal-700 hover:text-teal-900">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Command Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Register Link */}
          <div className="pt-6 text-center text-xs text-slate-500 border-t border-slate-100">
            Need access to the clinical registry?{' '}
            <Link to="/register" className="font-bold text-teal-700 hover:text-teal-900">
              Register an Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
