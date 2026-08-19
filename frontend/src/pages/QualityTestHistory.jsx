import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';
import {
  Badge, Paginator, Loading, EmptyState, ErrorAlert,
  PageHeader, SearchBar, Select
} from '../components/ui';

export default function QualityTestHistory() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterResult, setFilterResult] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = new URLSearchParams({ page, page_size: 15 });
      if (search) params.append('search', search);
      if (filterProduct) params.append('product_id', filterProduct);
      if (filterResult) params.append('overall_result', filterResult);

      const res = await apiGet(`/quality-tests?${params.toString()}`, token);
      setTests(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      setError(err.detail || 'Failed to load test history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiGet('/products?page_size=100', token);
      setProducts(res.items || []);
    } catch (e) {
      console.error('Failed to load products', e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchTests();
  }, [page, search, filterProduct, filterResult]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="QUALITY TEST HISTORY"
        subtitle="Historical laboratory test logs, analytical batch quality reports, and compliance audit records"
        action={
          <button
            onClick={() => navigate('/quality-tests')}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <span>🔬</span> Test Workbench
          </button>
        }
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search test ID, sample, batch..." />
        </div>
        <div>
          <Select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}>
            <option value="">All Overall Results</option>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
            <option value="REVIEW">REVIEW</option>
            <option value="PENDING">PENDING</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <Loading text="Loading test history..." />
        ) : tests.length === 0 ? (
          <EmptyState
            icon="📜"
            title="No Quality Test Records Found"
            message="Perform quality testing on collected samples to view historical test reports."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Test ID</th>
                  <th className="px-5 py-3.5">Sample Code</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Lead Inspector</th>
                  <th className="px-5 py-3.5">Test Date</th>
                  <th className="px-5 py-3.5 text-center">Overall Result</th>
                  <th className="px-5 py-3.5 text-center">State</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                      #{t.id}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-teal-800">
                      {t.quality_sample?.sample_code || `SMP-${t.sample_id}`}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-800">
                      {t.batch?.batch_number || `Batch #${t.batch_id}`}
                    </td>
                    <td className="px-5 py-3.5 text-gray-800">
                      {t.batch?.product?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {t.inspector?.full_name || `Inspector #${t.inspector_id}`}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(t.test_date || t.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge status={t.overall_result} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                        {t.is_completed ? 'COMPLETED' : 'IN PROGRESS'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/quality-tests?test_id=${t.id}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-gray-100">
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
