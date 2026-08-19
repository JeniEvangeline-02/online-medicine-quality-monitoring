import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiGet(`/search/global?q=${encodeURIComponent(query.trim())}`, token);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, token]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  const hasResults = results && Object.values(results).some((arr) => arr && arr.length > 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <span className="text-xl text-slate-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Global Search: Batches, Medicines, Suppliers, Recalls, Alerts, Supplies..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-base font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 text-sm">
              ✕
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-slate-400 bg-white rounded border border-slate-200 shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              Searching pharmaceutical database...
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-10 text-slate-400 text-sm">
              <p className="font-medium text-slate-600 mb-1">Quick Search</p>
              <p className="text-xs">Type a batch number, product code, supplier name or recall ID</p>
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No matching records found for "<span className="font-semibold text-slate-700">{query}</span>"
            </div>
          )}

          {!loading && results && (
            <div className="space-y-4">
              {results.batches && results.batches.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>📦</span> Batches
                  </h3>
                  <div className="space-y-1">
                    {results.batches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelect(b.link)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-teal-50 flex items-center justify-between transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-800 font-mono">{b.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          {b.quality}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.products && results.products.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>💊</span> Products & Medicines
                  </h3>
                  <div className="space-y-1">
                    {results.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelect(p.link)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-teal-50 flex items-center justify-between transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-800">{p.title}</span>
                        <span className="text-xs text-slate-500">{p.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.suppliers && results.suppliers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🏭</span> Suppliers
                  </h3>
                  <div className="space-y-1">
                    {results.suppliers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelect(s.link)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-teal-50 flex items-center justify-between transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-800">{s.title}</span>
                        <span className="text-xs text-slate-500 font-mono">{s.reg}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.incoming_supplies && results.incoming_supplies.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🚚</span> Incoming Supplies
                  </h3>
                  <div className="space-y-1">
                    {results.incoming_supplies.map((is) => (
                      <button
                        key={is.id}
                        onClick={() => handleSelect(is.link)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-teal-50 flex items-center justify-between transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-800 font-mono">{is.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {is.decision}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.recalls && results.recalls.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>⚠️</span> Recalls
                  </h3>
                  <div className="space-y-1">
                    {results.recalls.map((rc) => (
                      <button
                        key={rc.id}
                        onClick={() => handleSelect(rc.link)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-red-50 flex items-center justify-between transition-colors"
                      >
                        <span className="text-sm font-medium text-red-900 font-mono">{rc.title}</span>
                        <span className="text-xs font-bold text-red-600">{rc.severity}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.alerts && results.alerts.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🔔</span> Alerts & Excursions
                  </h3>
                  <div className="space-y-1">
                    {results.alerts.map((al) => (
                      <button
                        key={al.id}
                        onClick={() => handleSelect(al.link)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-amber-50 flex items-center justify-between transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-800">{al.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                          {al.severity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <button onClick={onClose} className="hover:text-slate-800 font-medium">
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
