// Shared status badge component
const STATUS_STYLES = {
  ACTIVE:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  INACTIVE:     'bg-gray-100 text-gray-600 border-gray-200',
  SUSPENDED:    'bg-red-100 text-red-800 border-red-200',
  PENDING:      'bg-amber-100 text-amber-800 border-amber-200',
  PASSED:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  FAILED:       'bg-red-100 text-red-800 border-red-200',
  PASS:         'bg-emerald-100 text-emerald-800 border-emerald-200',
  FAIL:         'bg-red-100 text-red-800 border-red-200',
  WARNING:      'bg-amber-100 text-amber-800 border-amber-200',
  REVIEW:       'bg-amber-100 text-amber-800 border-amber-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLIANT:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  NON_COMPLIANT:'bg-red-100 text-red-800 border-red-200',
  ACCEPTED:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  QUARANTINED:  'bg-amber-100 text-amber-800 border-amber-200',
  REJECTED:     'bg-red-100 text-red-800 border-red-200',
  NOT_RECALLED: 'bg-gray-100 text-gray-500 border-gray-200',
  RECALLED:     'bg-red-100 text-red-800 border-red-200',
  SAFE:         'bg-emerald-100 text-emerald-800 border-emerald-200',
  EXPIRING_SOON:'bg-amber-100 text-amber-800 border-amber-200',
  URGENT:       'bg-orange-100 text-orange-800 border-orange-200',
  EXPIRED:      'bg-red-100 text-red-800 border-red-200',
  MEDICINE:     'bg-teal-100 text-teal-800 border-teal-200',
  CONSUMABLE:   'bg-blue-100 text-blue-800 border-blue-200',
  
  // Phase 4 additions
  COLLECTED:      'bg-cyan-100 text-cyan-800 border-cyan-200',
  UNDER_TEST:     'bg-indigo-100 text-indigo-800 border-indigo-200',
  TEST_COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
  IN_PROGRESS:    'bg-sky-100 text-sky-800 border-sky-200',
  COMPLETED:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  CRITICAL:       'bg-rose-100 text-rose-800 border-rose-200',
  NUMERIC:        'bg-blue-50 text-blue-700 border-blue-200',
  QUALITATIVE:    'bg-purple-50 text-purple-700 border-purple-200',
  BOOLEAN:        'bg-amber-50 text-amber-700 border-amber-200',
  // Phase 5 additions — Certificates & Compliance
  VALID:          'bg-emerald-100 text-emerald-800 border-emerald-200',
  EXPIRING:       'bg-amber-100 text-amber-800 border-amber-200',
  INVALID:        'bg-red-100 text-red-800 border-red-200',
  AUTOMATED:      'bg-teal-100 text-teal-800 border-teal-200',
  MANUAL_OVERRIDE:'bg-purple-100 text-purple-800 border-purple-200',
  UNKNOWN:        'bg-gray-100 text-gray-500 border-gray-200',
};

export const Badge = ({ status, label }) => {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {label || status?.replace(/_/g, ' ')}
    </span>
  );
};

// Paginator component
export const Paginator = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
          Previous
        </button>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
          Next
        </button>
      </div>
    </div>
  );
};

// Loading spinner
export const Loading = ({ text = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-teal-700">
    <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin mb-3" />
    <p className="text-sm font-medium">{text}</p>
  </div>
);

// Empty state
export const EmptyState = ({ icon = '📋', title, message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
    <p className="text-sm text-gray-400 max-w-sm">{message}</p>
  </div>
);

// Error state
export const ErrorAlert = ({ message, onDismiss }) => (
  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
    <span className="text-lg mt-0.5">⚠️</span>
    <div className="flex-1">
      <div className="font-semibold text-sm">Error</div>
      <div className="text-sm mt-0.5">{message}</div>
    </div>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-500 hover:text-red-700 text-lg">×</button>
    )}
  </div>
);

// Page header
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// Search + filter bar
export const SearchBar = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
    />
  </div>
);

// Modal
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

// Form field
export const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

export const Input = ({ className = '', ...props }) => (
  <input className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${className}`} {...props} />
);

export const Select = ({ className = '', children, ...props }) => (
  <select className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${className}`} {...props}>
    {children}
  </select>
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none ${className}`} rows={3} {...props} />
);

export const SubmitButton = ({ loading, children }) => (
  <button type="submit" disabled={loading}
    className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
    {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : children}
  </button>
);
