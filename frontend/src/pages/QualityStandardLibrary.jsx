import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiDel } from '../services/api';
import {
  Badge, Paginator, Loading, EmptyState, ErrorAlert,
  PageHeader, SearchBar, Modal, Field, Input, Select, Textarea, SubmitButton
} from '../components/ui';

export default function QualityStandardLibrary() {
  const { token, hasRole } = useAuth();
  const canEdit = hasRole(['ADMIN', 'QUALITY_INSPECTOR']);

  const [standards, setStandards] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCritical, setFilterCritical] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    product_id: '',
    parameter_name: '',
    parameter_type: 'NUMERIC',
    unit: '',
    minimum_value: '',
    maximum_value: '',
    expected_value: '',
    testing_method: '',
    is_critical: false,
    standard_reference: '',
    is_active: true
  };
  const [form, setForm] = useState(initialForm);

  const fetchStandards = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = new URLSearchParams({ page, page_size: 15 });
      if (search) params.append('search', search);
      if (filterProduct) params.append('product_id', filterProduct);
      if (filterType) params.append('parameter_type', filterType);
      if (filterCritical !== '') params.append('is_critical', filterCritical);
      if (filterStatus !== '') params.append('is_active', filterStatus);

      const res = await apiGet(`/quality-standards?${params.toString()}`, token);
      setStandards(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      setError(err.detail || 'Failed to load quality standards library.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiGet('/products?page_size=100', token);
      setProducts(res.items || []);
    } catch (e) {
      console.error('Failed to load products for dropdown', e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchStandards();
  }, [page, search, filterProduct, filterType, filterCritical, filterStatus]);

  const handleOpenCreate = () => {
    setSelectedStandard(null);
    setForm(initialForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (std) => {
    setSelectedStandard(std);
    setForm({
      product_id: std.product_id,
      parameter_name: std.parameter_name,
      parameter_type: std.parameter_type || 'NUMERIC',
      unit: std.unit || '',
      minimum_value: std.minimum_value !== null ? std.minimum_value : '',
      maximum_value: std.maximum_value !== null ? std.maximum_value : '',
      expected_value: std.expected_value || '',
      testing_method: std.testing_method || '',
      is_critical: std.is_critical,
      standard_reference: std.standard_reference || '',
      is_active: std.is_active
    });
    setFormOpen(true);
  };

  const handleOpenView = (std) => {
    setSelectedStandard(std);
    setViewOpen(true);
  };

  const handleDeactivate = async (std) => {
    if (!window.confirm(`Deactivate standard "${std.parameter_name}" for ${std.product?.name}?`)) return;
    try {
      await apiDel(`/quality-standards/${std.id}`, token);
      fetchStandards();
    } catch (err) {
      alert(err.detail || 'Failed to deactivate standard.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        product_id: parseInt(form.product_id, 10),
        minimum_value: form.parameter_type === 'NUMERIC' && form.minimum_value !== '' ? parseFloat(form.minimum_value) : null,
        maximum_value: form.parameter_type === 'NUMERIC' && form.maximum_value !== '' ? parseFloat(form.maximum_value) : null,
        unit: form.parameter_type === 'NUMERIC' ? form.unit : null,
        expected_value: form.parameter_type !== 'NUMERIC' ? form.expected_value : null,
      };

      if (selectedStandard) {
        await apiPut(`/quality-standards/${selectedStandard.id}`, payload, token);
      } else {
        await apiPost('/quality-standards', payload, token);
      }
      setFormOpen(false);
      fetchStandards();
    } catch (err) {
      alert(err.detail || 'Failed to save quality standard.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QUALITY STANDARD LIBRARY"
        subtitle="Configured testing requirements for medicines and medical consumables"
        action={
          canEdit && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <span>➕</span> Configure Standard
            </button>
          )
        }
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search parameter name..." />
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
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="NUMERIC">Numeric</option>
            <option value="QUALITATIVE">Qualitative</option>
            <option value="BOOLEAN">Boolean</option>
          </Select>
        </div>
        <div>
          <Select value={filterCritical} onChange={(e) => setFilterCritical(e.target.value)}>
            <option value="">All Criticality</option>
            <option value="true">Critical Only</option>
            <option value="false">Non-Critical</option>
          </Select>
        </div>
        <div>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <Loading text="Loading Quality Standards..." />
        ) : standards.length === 0 ? (
          <EmptyState
            icon="🔬"
            title="No Quality Standards Found"
            message="Configure product-specific acceptance criteria and analytical test methods."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Parameter</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Unit</th>
                  <th className="px-5 py-3.5">Acceptable Range / Spec</th>
                  <th className="px-5 py-3.5">Testing Method</th>
                  <th className="px-5 py-3.5 text-center">Critical</th>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standards.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      <div>{s.product?.name || `Product #${s.product_id}`}</div>
                      <div className="text-xs text-gray-400 font-mono">{s.product?.product_code}</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">
                      {s.parameter_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={s.parameter_type} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">
                      {s.unit || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                      {s.parameter_type === 'NUMERIC' ? (
                        <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {s.minimum_value} – {s.maximum_value} {s.unit}
                        </span>
                      ) : (
                        <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Expected: {s.expected_value}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs max-w-xs truncate">
                      {s.testing_method || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {s.is_critical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span>⚡</span> CRITICAL
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Standard</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {s.standard_reference || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge status={s.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(s)}
                          className="px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            {s.is_active && (
                              <button
                                onClick={() => handleDeactivate(s)}
                                className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                              >
                                Deactivate
                              </button>
                            )}
                          </>
                        )}
                      </div>
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

      {/* View Standard Modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Quality Standard Details" size="md">
        {selectedStandard && (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 font-semibold uppercase">Product</div>
                <div className="text-base font-bold text-gray-900">{selectedStandard.product?.name}</div>
                <div className="text-xs font-mono text-gray-500">{selectedStandard.product?.product_code}</div>
              </div>
              <Badge status={selectedStandard.is_active ? 'ACTIVE' : 'INACTIVE'} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Parameter Name</div>
                <div className="font-semibold text-gray-800">{selectedStandard.parameter_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Type</div>
                <Badge status={selectedStandard.parameter_type} />
              </div>
              <div className="col-span-2 p-3 bg-teal-50/60 rounded-xl border border-teal-100">
                <div className="text-xs text-teal-800 uppercase font-semibold mb-1">Acceptance Criteria</div>
                {selectedStandard.parameter_type === 'NUMERIC' ? (
                  <div className="text-base font-mono font-bold text-teal-900">
                    {selectedStandard.minimum_value} – {selectedStandard.maximum_value} {selectedStandard.unit}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-teal-900">
                    Exact Match Required: <span className="font-mono">{selectedStandard.expected_value}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Testing Method</div>
                <div className="text-gray-700">{selectedStandard.testing_method || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Standard Reference</div>
                <div className="text-gray-700">{selectedStandard.standard_reference || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Criticality</div>
                <div className="font-semibold text-gray-800">
                  {selectedStandard.is_critical ? '⚡ Critical Parameter (Fails Overall Test)' : 'Standard Parameter'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal (Create / Edit) */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selectedStandard ? 'Edit Quality Standard' : 'Configure New Quality Standard'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Product */}
          <div>
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">
              1. Product Identification
            </h3>
            <Field label="Target Product" required>
              <Select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                required
              >
                <option value="">Select a Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.product_code}) - {p.product_type}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Section 2: Test Parameter */}
          <div>
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">
              2. Test Parameter Definition
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Parameter Name" required hint="e.g. Assay, pH, Sterility Confirmed, Dissolution">
                <Input
                  value={form.parameter_name}
                  onChange={(e) => setForm({ ...form, parameter_name: e.target.value })}
                  placeholder="Enter parameter name"
                  required
                />
              </Field>
              <Field label="Parameter Type" required>
                <Select
                  value={form.parameter_type}
                  onChange={(e) => setForm({ ...form, parameter_type: e.target.value })}
                >
                  <option value="NUMERIC">Numeric (Quantitative Range)</option>
                  <option value="QUALITATIVE">Qualitative (Text Match)</option>
                  <option value="BOOLEAN">Boolean (Pass/Fail Flag)</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* Section 3: Acceptance Criteria (Dynamic based on Type) */}
          <div>
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">
              3. Acceptance Criteria & Specifications
            </h3>
            {form.parameter_type === 'NUMERIC' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-teal-50/40 p-4 rounded-xl border border-teal-100">
                <Field label="Minimum Allowed Value" required>
                  <Input
                    type="number"
                    step="any"
                    value={form.minimum_value}
                    onChange={(e) => setForm({ ...form, minimum_value: e.target.value })}
                    placeholder="e.g. 95.0"
                    required
                  />
                </Field>
                <Field label="Maximum Allowed Value" required>
                  <Input
                    type="number"
                    step="any"
                    value={form.maximum_value}
                    onChange={(e) => setForm({ ...form, maximum_value: e.target.value })}
                    placeholder="e.g. 105.0"
                    required
                  />
                </Field>
                <Field label="Measurement Unit" hint="e.g. %, pH, mg, mL">
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g. %"
                  />
                </Field>
              </div>
            ) : form.parameter_type === 'BOOLEAN' ? (
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100">
                <Field label="Expected Boolean Value" required hint="Must match during testing">
                  <Select
                    value={form.expected_value}
                    onChange={(e) => setForm({ ...form, expected_value: e.target.value })}
                    required
                  >
                    <option value="">Select Expected State</option>
                    <option value="TRUE">TRUE (Confirmed / Intact / Passed)</option>
                    <option value="FALSE">FALSE (Not Observed)</option>
                  </Select>
                </Field>
              </div>
            ) : (
              <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                <Field label="Expected Qualitative Value" required hint="Exact text specification match">
                  <Input
                    value={form.expected_value}
                    onChange={(e) => setForm({ ...form, expected_value: e.target.value })}
                    placeholder="e.g. White crystalline powder, Clear colorless solution"
                    required
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Section 4: Test Method & Standard Reference */}
          <div>
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">
              4. Analytical Methodology & Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Testing Method" hint="e.g. HPLC USP <621>, Potentiometry, Visual">
                <Input
                  value={form.testing_method}
                  onChange={(e) => setForm({ ...form, testing_method: e.target.value })}
                  placeholder="Analytical method"
                />
              </Field>
              <Field label="Standard Reference" hint="e.g. IP 2022, USP 43-NF 38, ISO 11607">
                <Input
                  value={form.standard_reference}
                  onChange={(e) => setForm({ ...form, standard_reference: e.target.value })}
                  placeholder="Pharmacopoeia / Standard Reference"
                />
              </Field>
            </div>
          </div>

          {/* Section 5: Risk Classification */}
          <div>
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">
              5. Risk Classification & Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Critical Parameter" hint="If failed, immediately forces overall test to FAIL">
                <Select
                  value={form.is_critical ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, is_critical: e.target.value === 'true' })}
                >
                  <option value="false">No (Standard parameter)</option>
                  <option value="true">Yes (Critical parameter - strict enforcement)</option>
                </Select>
              </Field>
              <Field label="Active Status">
                <Select
                  value={form.is_active ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                >
                  <option value="true">Active (Used in quality tests)</option>
                  <option value="false">Inactive (Historical reference only)</option>
                </Select>
              </Field>
            </div>
          </div>

          <SubmitButton loading={submitting}>
            {selectedStandard ? 'Update Quality Standard' : 'Save Quality Standard'}
          </SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
