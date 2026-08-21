import { useState, useEffect, useRef } from 'react';
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
  Activity,
  AlertTriangle,
  Loader2,
  Sparkles,
  Pill,
  Thermometer,
  Truck,
  ScanLine,
  Beaker,
  Shield
} from 'lucide-react';

/* ─── Demo role presets ─── */
const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    label: 'System Admin',
    email: 'admin@pharma.com',
    gradient: 'from-teal-600 to-teal-700',
    hoverGradient: 'hover:from-teal-700 hover:to-teal-800',
    ring: 'ring-teal-500/30',
  },
  {
    role: 'QUALITY_INSPECTOR',
    label: 'Quality Auditor',
    email: 'inspector@pharma.com',
    gradient: 'from-emerald-600 to-emerald-700',
    hoverGradient: 'hover:from-emerald-700 hover:to-emerald-800',
    ring: 'ring-emerald-500/30',
  },
  {
    role: 'SUPPLIER',
    label: 'Vendor Portal',
    email: 'supplier@pharma.com',
    gradient: 'from-cyan-600 to-cyan-700',
    hoverGradient: 'hover:from-cyan-700 hover:to-cyan-800',
    ring: 'ring-cyan-500/30',
  },
  {
    role: 'HOSPITAL',
    label: 'Pharmacy Ward',
    email: 'hospital@pharma.com',
    gradient: 'from-slate-600 to-slate-700',
    hoverGradient: 'hover:from-slate-700 hover:to-slate-800',
    ring: 'ring-slate-500/30',
  },
];

/* ─── Feature cards data ─── */
const FEATURE_CARDS = [
  {
    icon: FlaskConical,
    title: 'Lab Testing',
    subtitle: 'Automated Assay',
    glow: 'teal',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-300',
  },
  {
    icon: FileCheck2,
    title: 'Compliance',
    subtitle: 'Rule Engine',
    glow: 'emerald',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-300',
  },
  {
    icon: Microscope,
    title: 'AI Risk Scan',
    subtitle: 'Anomaly Sensor',
    glow: 'cyan',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-300',
  },
];

/* ─── Floating particle component ─── */
function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.05,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-teal-400"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main Login Component ─── */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const emailRef = useRef(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      setLoginSuccess(true);
      setTimeout(() => navigate(from, { replace: true }), 600);
    } catch (err) {
      setError(
        err.detail || 'Invalid email or password. Please verify your credentials.'
      );
      setLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setForm({ email: acc.email, password: 'adminpassword123' });
    setSelectedRole(acc.role);
    setError('');
  };

  /* Auto-focus email on mount */
  useEffect(() => {
    const timer = setTimeout(() => emailRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Global keyframe styles */}
      <style>{`
        @keyframes float-particle {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(12px, -18px) scale(1.3); }
          100% { transform: translate(-8px, 14px) scale(0.8); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
          50% { box-shadow: 0 0 20px 4px rgba(20, 184, 166, 0.15); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes success-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .login-card-enter {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .feature-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .demo-btn-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.25);
        }
        .input-focus-ring {
          transition: all 0.2s ease;
        }
        .input-focus-ring:focus {
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
        }
        .cta-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
        .success-animation {
          animation: success-pulse 0.5s ease-out;
        }
        .illustration-float {
          animation: float-particle 8s ease-in-out infinite alternate;
        }
      `}</style>

      <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/30 flex items-center justify-center p-3 sm:p-4 lg:p-8">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #0d9488 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* ─── Main Card Container ─── */}
        <div className="login-card-enter relative w-full max-w-[1120px] bg-white rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] border border-slate-200/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
          {/* ════════════════════════════════════════════════════════════ */}
          {/* LEFT VISUAL / BRANDING SECTION                             */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 relative bg-gradient-to-br from-[#0a3d3d] via-[#0d4f4a] to-[#063333] p-6 sm:p-8 lg:p-10 xl:p-12 text-white flex flex-col justify-between overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[100px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[80px] pointer-events-none translate-y-1/4 -translate-x-1/4" />
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-400/8 rounded-full blur-[60px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

            {/* Dot grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #5eead4 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Floating particles */}
            <FloatingParticles />

            {/* ── Top: Brand Header ── */}
            <div className="relative z-10">
              {/* Logo */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-400 p-[2px] shadow-lg shadow-teal-500/20">
                  <div className="w-full h-full bg-[#0a3d3d] rounded-[14px] flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-teal-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-extrabold text-[26px] tracking-tight text-white leading-none">
                    PharmaQ
                  </span>
                  <span className="text-teal-400 font-semibold text-[26px] tracking-tight italic leading-none">
                    Control
                  </span>
                </div>
              </div>

              {/* Badge + Heading + Description */}
              <div className="mt-7 space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/25 text-teal-300 text-[11px] font-bold tracking-[0.08em] uppercase">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  Enterprise Quality Intelligence
                </div>
                <h1 className="text-[28px] sm:text-[32px] lg:text-[36px] font-extrabold text-white tracking-tight leading-[1.15]">
                  Pharmaceutical Quality &amp; Compliance Platform
                </h1>
                <p className="text-teal-100/70 text-[13px] sm:text-sm leading-relaxed max-w-lg">
                  Intelligent quality monitoring for medicines and consumables —
                  from incoming lot testing to cold-chain traceability and
                  automated release decisions.
                </p>
              </div>
            </div>

            {/* ── Middle: Pharmaceutical Illustration ── */}
            <div className="relative z-10 my-4 lg:my-5 flex items-center justify-center">
              <div className="relative w-full max-w-[440px]">
                {/* Glow behind image */}
                <div className="absolute inset-0 bg-gradient-to-t from-teal-500/10 to-transparent rounded-2xl blur-xl" />
                <img
                  src="/pharma-illustration.jpg"
                  alt="Pharmaceutical quality monitoring illustration showing laboratory, supply chain, compliance, and cold-chain monitoring"
                  className="relative w-full h-auto rounded-2xl border border-teal-600/20 shadow-2xl illustration-float"
                  style={{ maxHeight: '220px', objectFit: 'cover' }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a3d3d]/60 via-transparent to-transparent rounded-2xl" />
              </div>
            </div>

            {/* ── Feature Cards Row ── */}
            <div className="relative z-10">
              <div className="bg-[#0d3533]/70 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-teal-700/30 shadow-xl">
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                  {FEATURE_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.title}
                        className="feature-card-hover bg-[#0a2e2c]/60 rounded-xl p-3 sm:p-3.5 border border-teal-600/25 flex flex-col items-center text-center transition-all duration-300 cursor-default"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconColor} mb-2`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-white leading-tight">
                          {card.title}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-teal-200/60 mt-0.5 leading-tight">
                          {card.subtitle}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Validation & version strip */}
                <div className="mt-3.5 pt-3 border-t border-teal-800/50 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-teal-300/80 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>21 CFR Part 11 &amp; GMP Validated</span>
                  </div>
                  <span className="font-mono text-teal-400/70 text-[10px] bg-teal-900/60 px-2 py-0.5 rounded border border-teal-700/40">
                    v2.0.0
                  </span>
                </div>
              </div>
            </div>

            {/* ── Bottom Footer ── */}
            <div className="relative z-10 mt-4 text-[11px] text-teal-300/40 flex items-center justify-between">
              <span>© 2026 PharmaQ Control</span>
              <span>Hospital Quality Operations</span>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* RIGHT LOGIN FORM SECTION                                    */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between bg-white relative">
            {/* Success overlay */}
            {loginSuccess && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center success-animation rounded-r-[28px]">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-slate-900">
                  Authentication Successful
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Redirecting to Command Center...
                </p>
              </div>
            )}

            <div className="max-w-[380px] mx-auto w-full space-y-5 flex-1 flex flex-col justify-center">
              {/* ── Header ── */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-[26px] font-black text-slate-900 tracking-tight leading-tight">
                  Sign In to Platform
                </h2>
                <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                  Enter your credentials to access the Hospital Quality Command
                  Center
                </p>
              </div>

              {/* ── Quick Demo Access Panel ── */}
              <div
                className="animate-slide-up p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/80 space-y-3"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-[0.1em]">
                    Quick Demo Access
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">
                    1-Click Auto Fill
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillDemo(acc)}
                      className={`demo-btn-hover group px-3 py-2.5 rounded-xl text-[12px] font-bold text-white bg-gradient-to-r ${acc.gradient} ${acc.hoverGradient} transition-all duration-200 text-left flex items-center justify-between shadow-sm cursor-pointer ${
                        selectedRole === acc.role
                          ? `ring-2 ${acc.ring} ring-offset-1`
                          : ''
                      }`}
                    >
                      <span>{acc.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Login Form ── */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 animate-slide-up"
                style={{ animationDelay: '0.3s' }}
              >
                {/* Email field */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-[0.1em] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`w-[16px] h-[16px] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                        emailFocused ? 'text-teal-600' : 'text-slate-400'
                      }`}
                    />
                    <input
                      ref={emailRef}
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="admin@pharma.com"
                      className="input-focus-ring w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-[0.1em]">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      className={`w-[16px] h-[16px] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                        passwordFocused ? 'text-teal-600' : 'text-slate-400'
                      }`}
                    />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••••••"
                      className="input-focus-ring w-full pl-10 pr-12 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-[16px] h-[16px]" />
                      ) : (
                        <Eye className="w-[16px] h-[16px]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="animate-fade-in p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[12px] font-medium flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || loginSuccess}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 mt-1 cursor-pointer ${
                    loginSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-teal-700 via-teal-800 to-teal-700 hover:from-teal-600 hover:via-teal-700 hover:to-teal-600 text-white shadow-teal-900/20 hover:shadow-teal-700/30 disabled:opacity-60'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : loginSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authenticated</span>
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

            {/* ── Bottom: Register Link ── */}
            <div
              className="animate-slide-up pt-5 mt-4 text-center text-[13px] text-slate-500 border-t border-slate-100"
              style={{ animationDelay: '0.4s' }}
            >
              Need access to the clinical registry?{' '}
              <Link
                to="/register"
                className="font-bold text-teal-700 hover:text-teal-900 transition-colors underline underline-offset-2 decoration-teal-300/50 hover:decoration-teal-600"
              >
                Register an Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
