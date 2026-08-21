import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';
import {
  Search,
  X,
  Boxes,
  Pill,
  Building2,
  Truck,
  AlertOctagon,
  Bell,
  ArrowRight,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

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
    }, 250);

    return () => clearTimeout(timer);
  }, [query, token]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  const hasResults = results && Object.values(results).some((arr) => arr && arr.length > 0);

  return (
    <div 
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[82vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/90">
          <Search className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search batches, medicines, consumables, suppliers, alerts..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] text-slate-400 bg-white rounded-md border border-slate-200 shadow-2xs font-mono">
            ESC
          </kbd>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs font-semibold gap-2.5">
              <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span>Scanning pharmaceutical database...</span>
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-3 text-teal-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Quick Global Database Search</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Type any batch number, medicine code, supplier name, alert keyword, or recall identifier.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {['BTH-', 'Paracetamol', 'MEDSUPPLY', 'Cold Storage', 'Quarantine'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setQuery(chip)}
                    className="text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors font-mono"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p className="text-sm font-semibold text-slate-600 mb-1">No matching records found</p>
              <p>No results matching &ldquo;<span className="font-bold text-slate-800">{query}</span>&rdquo; in active database.</p>
            </div>
          )}

          {!loading && results && (
            <div className="space-y-4">
              {/* Batches */}
              {results.batches && results.batches.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <Boxes className="w-3.5 h-3.5 text-teal-600" />
                    <span>Batches ({results.batches.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.batches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelect(b.link)}
                        className="w-full text-left p-3 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 flex items-center justify-between transition-all group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 font-mono group-hover:text-teal-900">
                            {b.title}
                          </div>
                          {b.product && <div className="text-[11px] text-slate-400">{b.product}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {b.quality || 'BATCH'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Medicines & Consumables */}
              {results.products && results.products.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>Medicines &amp; Consumables ({results.products.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelect(p.link)}
                        className="w-full text-left p-3 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 flex items-center justify-between transition-all group"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">{p.title}</span>
                          {p.code && <span className="text-[11px] text-slate-400 ml-2 font-mono">{p.code}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-semibold border border-teal-100">
                            {p.type || 'PRODUCT'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers */}
              {results.suppliers && results.suppliers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Suppliers ({results.suppliers.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.suppliers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelect(s.link)}
                        className="w-full text-left p-3 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 flex items-center justify-between transition-all group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900">{s.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.reg}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Supplies */}
              {results.incoming_supplies && results.incoming_supplies.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <Truck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Incoming Supplies ({results.incoming_supplies.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.incoming_supplies.map((is) => (
                      <button
                        key={is.id}
                        onClick={() => handleSelect(is.link)}
                        className="w-full text-left p-3 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 flex items-center justify-between transition-all group"
                      >
                        <span className="text-xs font-bold text-slate-800 font-mono group-hover:text-teal-900">{is.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {is.decision || 'PENDING'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recalls */}
              {results.recalls && results.recalls.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                    <span>Recalls ({results.recalls.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.recalls.map((rc) => (
                      <button
                        key={rc.id}
                        onClick={() => handleSelect(rc.link)}
                        className="w-full text-left p-3 rounded-xl bg-red-50/50 hover:bg-red-50 border border-red-100 flex items-center justify-between transition-all group"
                      >
                        <span className="text-xs font-bold text-red-900 font-mono">{rc.title}</span>
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                          {rc.severity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerts */}
              {results.alerts && results.alerts.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>Alerts &amp; Excursions ({results.alerts.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.alerts.map((al) => (
                      <button
                        key={al.id}
                        onClick={() => handleSelect(al.link)}
                        className="w-full text-left p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 flex items-center justify-between transition-all group"
                      >
                        <span className="text-xs font-bold text-slate-800">{al.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">
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
          <span className="text-[11px]">Navigate using mouse or click results</span>
          <button 
            onClick={onClose} 
            className="hover:text-slate-800 font-semibold text-xs px-2 py-1 rounded hover:bg-slate-200/50 transition-colors"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
