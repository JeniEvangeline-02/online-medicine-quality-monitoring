import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiDel } from '../services/api';
import {
  Badge, Paginator, Loading, EmptyState, ErrorAlert,
  PageHeader, SearchBar, Modal, Field, Input, Select, Textarea, SubmitButton
} from '../components/ui';

export default function ComplianceRuleLibrary() {
  const { token, hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);

  const [rules, setRules] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    rule_code: '',
    rule_name: '',
    description: '',
    rule_type: 'PRODUCT_REGISTRATION',
    severity: 'HIGH',
    is_active: true
  };
  const [form, setForm] = useState(initialForm);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = new URLSearchParams({ page, page_size: 15 });
      if (search) params.append('search', search);
      if (filterType) params.append('rule_type', filterType);
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterStatus !== '') params.append('is_active', filterStatus);

      const res = await apiGet(`/compliance/rules?${params.toString()}`, token);
      setRules(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      setError(err.detail || 'Failed to load compliance rules library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [page, search, filterType, filterSeverity, filterStatus]);

  const handleOpenCreate = () => {
    setSelectedRule(null);
    setForm(initialForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (r) => {
    setSelectedRule(r);
    setForm({
      rule_code: r.rule_code,
      rule_name: r.rule_name,
      description: r.description || '',
      rule_type: r.rule_type,
      severity: r.severity,
      is_active: r.is_active
    });
    setFormOpen(true);
  };

  const handleOpenView = (r) => {
    setSelectedRule(r);
    setViewOpen(true);
  };

  const handleToggleStatus = async (r) => {
    if (!isAdmin) return;
    const action = r.is_active ? 'Deactivate' : 'Activate';
    if (!window.confirm(`${action} rule "${r.rule_code}: ${r.rule_name}"?`)) return;

    try {
      if (r.is_active) {
        await apiDel(`/compliance/rules/${r.id}`, token);
      } else {
        await apiPut(`/compliance/rules/${r.id}`, { is_active: true }, token);
      }
      fetchRules();
    } catch (err) {
      alert(err.detail || 'Failed to update rule status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedRule) {
        await apiPut(`/compliance/rules/${selectedRule.id}`, form, token);
      } else {
        await apiPost('/compliance/rules', form, token);
      }
      setFormOpen(false);
      fetchRules();
    } catch (err) {
      alert(err.detail || 'Failed to save compliance rule.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="COMPLIANCE RULE LIBRARY"
        subtitle="Automated regulatory standards, mandatory criteria, and severity weighting configuration"
        action={
          isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <span>➕</span> Add Compliance Rule
            </button>
          )
        }
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search rule code, name, description..." />
        </div>
        <div>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Rule Types</option>
            <option value="PRODUCT_REGISTRATION">Product Registration</option>
            <option value="BATCH_VALIDATION">Batch Validation</option>
            <option value="EXPIRY_VALIDATION">Expiry Validation</option>
            <option value="CERTIFICATE_VALIDATION">Certificate Validation</option>
            <option value="QUALITY_VALIDATION">Quality Validation</option>
            <option value="SUPPLIER_VALIDATION">Supplier Validation</option>
            <option value="RECALL_VALIDATION">Recall Validation</option>
            <option value="STORAGE_VALIDATION">Storage Validation</option>
            <option value="TRANSPORT_VALIDATION">Transport Validation</option>
          </Select>
        </div>
        <div>
          <Select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </Select>
        </div>
        <div>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </Select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <Loading text="Loading Compliance Rules..." />
        ) : rules.length === 0 ? (
          <EmptyState
            icon="⚖️"
            title="No Compliance Rules Found"
            message="Configure regulatory criteria to govern automated acceptance and quarantine determinations."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Rule Code</th>
                  <th className="px-5 py-3.5">Rule Name & Objective</th>
                  <th className="px-5 py-3.5">Rule Type</th>
                  <th className="px-5 py-3.5 text-center">Severity</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-teal-800 whitespace-nowrap">
                      {r.rule_code}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{r.rule_name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{r.description}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {r.rule_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          r.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : r.severity === 'HIGH'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : r.severity === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge status={r.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(r)}
                          className="px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(r)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                                r.is_active
                                  ? 'text-red-600 hover:bg-red-50 border-red-200'
                                  : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                              }`}
                            >
                              {r.is_active ? 'Deactivate' : 'Activate'}
                            </button>
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

      {/* View Modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Compliance Rule Details" size="md">
        {selectedRule && (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 font-semibold uppercase">Rule Code</div>
                <div className="text-lg font-mono font-bold text-teal-900">{selectedRule.rule_code}</div>
              </div>
              <Badge status={selectedRule.is_active ? 'ACTIVE' : 'INACTIVE'} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <div className="text-xs text-gray-400 uppercase font-semibold">Rule Name</div>
                <div className="font-bold text-gray-900">{selectedRule.rule_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Rule Type</div>
                <div className="font-mono text-xs text-gray-700">{selectedRule.rule_type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Severity Weight</div>
                <div className="font-bold text-rose-700">{selectedRule.severity}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Description</div>
                <div className="text-xs text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedRule.description || 'No description provided.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit / Create Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selectedRule ? 'Edit Compliance Rule' : 'Add Compliance Rule'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Rule Code" required hint="e.g. R-EXP-02">
              <Input
                value={form.rule_code}
                onChange={(e) => setForm({ ...form, rule_code: e.target.value })}
                placeholder="R-XXXX-XX"
                required
                disabled={!!selectedRule}
              />
            </Field>
            <Field label="Rule Type" required>
              <Select
                value={form.rule_type}
                onChange={(e) => setForm({ ...form, rule_type: e.target.value })}
              >
                <option value="PRODUCT_REGISTRATION">PRODUCT_REGISTRATION</option>
                <option value="BATCH_VALIDATION">BATCH_VALIDATION</option>
                <option value="EXPIRY_VALIDATION">EXPIRY_VALIDATION</option>
                <option value="CERTIFICATE_VALIDATION">CERTIFICATE_VALIDATION</option>
                <option value="QUALITY_VALIDATION">QUALITY_VALIDATION</option>
                <option value="SUPPLIER_VALIDATION">SUPPLIER_VALIDATION</option>
                <option value="RECALL_VALIDATION">RECALL_VALIDATION</option>
                <option value="STORAGE_VALIDATION">STORAGE_VALIDATION</option>
                <option value="TRANSPORT_VALIDATION">TRANSPORT_VALIDATION</option>
              </Select>
            </Field>
            <div className="col-span-2">
              <Field label="Rule Name" required>
                <Input
                  value={form.rule_name}
                  onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
                  placeholder="Descriptive name of the regulatory rule"
                  required
                />
              </Field>
            </div>
            <Field label="Severity Weight" required hint="CRITICAL failures immediately REJECT supplies">
              <Select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="CRITICAL">CRITICAL (Immediate REJECT)</option>
                <option value="HIGH">HIGH (High Risk / Reject or Strict Quarantine)</option>
                <option value="MEDIUM">MEDIUM (Quarantine Investigation)</option>
                <option value="LOW">LOW (Informational / Minor deduction)</option>
              </Select>
            </Field>
            <Field label="Rule Status">
              <Select
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
              >
                <option value="true">Active (Evaluated by Engine)</option>
                <option value="false">Inactive (Bypassed during evaluation)</option>
              </Select>
            </Field>
            <div className="col-span-2">
              <Field label="Rule Description & Pharmacopoeial Basis">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain why this rule exists and its regulatory compliance mandate..."
                />
              </Field>
            </div>
          </div>

          <SubmitButton loading={submitting}>
            {selectedRule ? 'Update Compliance Rule' : 'Save Compliance Rule'}
          </SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
