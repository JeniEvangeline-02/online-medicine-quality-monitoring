import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';
import {
  Badge, Paginator, Loading, EmptyState, ErrorAlert,
  PageHeader, SearchBar, Modal, Field, Input, Select, SubmitButton
} from '../components/ui';

export default function CertificateRegistry() {
  const { token, hasRole } = useAuth();
  const canVerify = hasRole(['ADMIN', 'QUALITY_INSPECTOR']);
  const canCreate = hasRole(['ADMIN', 'QUALITY_INSPECTOR', 'SUPPLIER']);

  const [certificates, setCertificates] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const initialCreateForm = {
    certificate_number: '',
    product_id: '',
    batch_id: '',
    certificate_type: 'COA',
    issuer: '',
    issue_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    document_path: '',
    verification_status: 'PENDING'
  };
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [verifyStatus, setVerifyStatus] = useState('VALID');

  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = new URLSearchParams({ page, page_size: 15 });
      if (search) params.append('search', search);
      if (filterType) params.append('certificate_type', filterType);
      if (filterStatus) params.append('verification_status', filterStatus);

      const res = await apiGet(`/certificates?${params.toString()}`, token);
      setCertificates(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      setError(err.detail || 'Failed to load certificates registry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [prodRes, batchRes] = await Promise.all([
        apiGet('/products?page_size=100', token),
        apiGet('/batches?page_size=100', token)
      ]);
      setProducts(prodRes.items || []);
      setBatches(batchRes.items || []);
    } catch (e) {
      console.error('Failed to load dropdown items', e);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [page, search, filterType, filterStatus]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...createForm,
        product_id: createForm.product_id ? parseInt(createForm.product_id, 10) : null,
        batch_id: createForm.batch_id ? parseInt(createForm.batch_id, 10) : null,
        issue_date: createForm.issue_date ? new Date(createForm.issue_date).toISOString() : null,
        expiry_date: createForm.expiry_date ? new Date(createForm.expiry_date).toISOString() : null
      };

      await apiPost('/certificates', payload, token);
      setCreateOpen(false);
      fetchCertificates();
    } catch (err) {
      alert(err.detail || 'Failed to register certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedCert) return;
    setSubmitting(true);
    try {
      await apiPut(`/certificates/${selectedCert.id}`, { verification_status: verifyStatus }, token);
      setVerifyOpen(false);
      fetchCertificates();
    } catch (err) {
      alert(err.detail || 'Failed to update certificate verification status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CERTIFICATE REGISTRY"
        subtitle="Regulatory certificates, Certificate of Analysis (COA), GMP credentials, and ISO verification"
        action={
          canCreate && (
            <button
              onClick={() => {
                setCreateForm(initialCreateForm);
                setCreateOpen(true);
              }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <span>📜</span> Upload / Register Certificate
            </button>
          )
        }
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search certificate number, issuer..." />
        </div>
        <div>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Certificate Types</option>
            <option value="COA">Certificate of Analysis (COA)</option>
            <option value="GMP">GMP Certification</option>
            <option value="ISO">ISO 13485 / Quality System</option>
            <option value="IMPORT_LICENSE">Import License</option>
            <option value="REGISTRATION">Drug Registration Certificate</option>
          </Select>
        </div>
        <div>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Verification Statuses</option>
            <option value="VALID">VALID</option>
            <option value="EXPIRING">EXPIRING</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="INVALID">INVALID</option>
            <option value="PENDING">PENDING</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <Loading text="Loading Certificates Registry..." />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon="📜"
            title="No Certificates Found"
            message="Register manufacturer COA or regulatory certificates to fulfill mandatory compliance checks."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Certificate No</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Issuer</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-teal-800">
                      {c.certificate_number}
                    </td>
                    <td className="px-5 py-3.5 text-gray-800">
                      {c.product?.name || (c.product_id ? `Product #${c.product_id}` : 'All Batches')}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                      {c.batch?.batch_number || (c.batch_id ? `Batch #${c.batch_id}` : 'General / Product-level')}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {c.certificate_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {c.issuer || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {c.issue_date ? new Date(c.issue_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge status={c.verification_status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {canVerify && (
                        <button
                          onClick={() => {
                            setSelectedCert(c);
                            setVerifyStatus(c.verification_status || 'VALID');
                            setVerifyOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors"
                        >
                          Verify Status
                        </button>
                      )}
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

      {/* Verify Modal */}
      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="Verify Regulatory Certificate" size="sm">
        {selectedCert && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><span className="text-gray-400 font-semibold uppercase">Cert No:</span> <span className="font-mono font-bold text-gray-900">{selectedCert.certificate_number}</span></div>
              <div><span className="text-gray-400 font-semibold uppercase">Type:</span> <span className="font-bold text-gray-800">{selectedCert.certificate_type}</span></div>
              <div><span className="text-gray-400 font-semibold uppercase">Issuer:</span> <span className="text-gray-700">{selectedCert.issuer || '—'}</span></div>
            </div>

            <Field label="Set Official Verification Status" required>
              <Select value={verifyStatus} onChange={(e) => setVerifyStatus(e.target.value)}>
                <option value="VALID">VALID (Verified Authentic & Active)</option>
                <option value="EXPIRING">EXPIRING (Approaching Expiration Window)</option>
                <option value="EXPIRED">EXPIRED (Expired Document)</option>
                <option value="INVALID">INVALID (Failed Authentication / Tampered)</option>
                <option value="PENDING">PENDING (Awaiting Authority Verification)</option>
              </Select>
            </Field>

            <SubmitButton loading={submitting}>
              Update Verification Record
            </SubmitButton>
          </form>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Register Certificate / COA Document" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Certificate Number" required hint="e.g. COA-2026-PCM001">
              <Input
                value={createForm.certificate_number}
                onChange={(e) => setCreateForm({ ...createForm, certificate_number: e.target.value })}
                placeholder="Unique Certificate Identification"
                required
              />
            </Field>
            <Field label="Certificate Type" required>
              <Select
                value={createForm.certificate_type}
                onChange={(e) => setCreateForm({ ...createForm, certificate_type: e.target.value })}
              >
                <option value="COA">Certificate of Analysis (COA)</option>
                <option value="GMP">GMP Certificate</option>
                <option value="ISO">ISO Quality System</option>
                <option value="IMPORT_LICENSE">Import License</option>
                <option value="REGISTRATION">Drug Registration Certificate</option>
              </Select>
            </Field>
            <Field label="Associated Product" hint="Product scope">
              <Select
                value={createForm.product_id}
                onChange={(e) => setCreateForm({ ...createForm, product_id: e.target.value })}
              >
                <option value="">Select a Product (Optional)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.product_code})</option>
                ))}
              </Select>
            </Field>
            <Field label="Associated Batch" hint="Specific batch (leave empty for general)">
              <Select
                value={createForm.batch_id}
                onChange={(e) => setCreateForm({ ...createForm, batch_id: e.target.value })}
              >
                <option value="">Select a Batch (Optional)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.batch_number}</option>
                ))}
              </Select>
            </Field>
            <Field label="Issuing Authority / Laboratory" hint="e.g. CDSCO, Apex Quality Assurance Labs">
              <Input
                value={createForm.issuer}
                onChange={(e) => setCreateForm({ ...createForm, issuer: e.target.value })}
                placeholder="Issuer organization"
              />
            </Field>
            <Field label="Document File Path / Link" hint="e.g. certificates/COA-2026.pdf">
              <Input
                value={createForm.document_path}
                onChange={(e) => setCreateForm({ ...createForm, document_path: e.target.value })}
                placeholder="Document file reference"
              />
            </Field>
            <Field label="Issue Date">
              <Input
                type="date"
                value={createForm.issue_date}
                onChange={(e) => setCreateForm({ ...createForm, issue_date: e.target.value })}
              />
            </Field>
            <Field label="Expiry Date">
              <Input
                type="date"
                value={createForm.expiry_date}
                onChange={(e) => setCreateForm({ ...createForm, expiry_date: e.target.value })}
              />
            </Field>
          </div>

          <SubmitButton loading={submitting}>
            Save & Register Certificate
          </SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
