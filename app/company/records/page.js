'use client';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SubmissionViewModal from '../../../components/company/SubmissionViewModal';
import PasswordConfirmModal from '../../../components/company/PasswordConfirmModal';
import PortalFilterBar from '../../../components/portal/PortalFilterBar';

function CompanyRecordsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draftSearch, setDraftSearch] = useState('');
  const [draftStatus, setDraftStatus] = useState('all');
  const [loadError, setLoadError] = useState('');
  const handledRecord = useRef('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const [viewing, setViewing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function loadSubmissions() {
    const res = await fetch('/api/company/submissions', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unable to load submissions.');
    setSubmissions(data.submissions || []);
  }

  useEffect(() => {
    loadSubmissions().catch((error) => setLoadError(error.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const value = params.get('search') || '';
    const status = params.get('status') || 'all';
    setSearch(value);
    setDraftSearch(value);
    setStatusFilter(status);
    setDraftStatus(status);
    setCurrentPage(1);
  }, [params]);

  useEffect(() => {
    const id = params.get('record');
    if (!id || loading || handledRecord.current === id) return;
    handledRecord.current = id;
    const record = submissions.find((item) => item._id === id);
    if (record) setViewing(record);
    else setLoadError('This submission is unavailable. Refresh the list and try again.');
  }, [params, loading, submissions]);

  const visibleSubmissions = useMemo(
    () => submissions
      .filter((s) => ['draft', 'validated', 'ready_for_submission', 'submitted', 'failed'].includes(s.status))
      .sort((a, b) => {
        const aTime = new Date(a.submittedAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.submittedAt || b.updatedAt || 0).getTime();
        return bTime - aTime;
      }),
    [submissions]
  );

  async function confirmDelete(password) {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/company/submissions/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setDeleteTarget(null);
      // Re-fetch the authoritative list so the table always reflects the DB
      // (never a stale optimistic guess).
      await loadSubmissions();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const fmtMoney = (n) => (n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });
  const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-PK') : '—');

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleSubmissions.filter((s) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      if (!matchesStatus) return false;

      const buyer = s.itemList?.[0]?.buyerBusinessName || s.buyerBusinessName || '';
      const buyerId = s.itemList?.[0]?.buyerNTN || s.itemList?.[0]?.buyerCNIC || s.buyerNTN || s.buyerCNIC || '';
      const submittedOn = fmtDate(s.submittedAt || s.updatedAt);
      const period = `${s.taxPeriodMonth}/${s.taxPeriodYear}`;
      const items = String(s.itemList?.length || 0);
      const saleValue = fmtMoney(s.totalSaleValue);
      const taxAmount = fmtMoney(s.totalTaxAmount);
      const total = fmtMoney(s.totalBillAmount);
      const haystack = [buyer, buyerId, submittedOn, period, items, saleValue, taxAmount, total, s.status, s.scenarioId, s.fbrEnvironment]
        .join(' ')
        .toLowerCase();

      if (!q) return true;
      return haystack.includes(q);
    });
  }, [visibleSubmissions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRecords = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submissions</h1>
          <p className="page-subtitle">Manage your company’s drafts, submissions, and tax activity.</p>
        </div>
        <Link href="/company/submissions/new" className="button button-primary">
          + New Submission
        </Link>
      </div>

      <PortalFilterBar label="Filter company submissions" onSubmit={(event) => { event.preventDefault(); setSearch(draftSearch); setStatusFilter(draftStatus); setCurrentPage(1); }}>
        <label htmlFor="company-submission-search">Search submissions
          <input
            id="company-submission-search"
            className="input"
            type="search"
            name="submission-filter"
            autoComplete="off"
            placeholder="Filter by buyer, date, period, or amount…"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
          />
        </label>

        <label htmlFor="company-submission-status">Submission status
          <select
            id="company-submission-status"
            className="select"
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="validated">Validated</option>
            <option value="ready_for_submission">Ready for Submission</option>
            <option value="submitted">Submitted</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <button className="button button-primary" type="submit">Filter</button>
      </PortalFilterBar>

      {loadError && <div className="alert alert-error" role="alert">{loadError}<button type="button" className="button button-secondary button-sm" onClick={() => { setLoadError(''); setLoading(true); loadSubmissions().catch((error) => setLoadError(error.message)).finally(() => setLoading(false)); }}>Try again</button></div>}

      {loading ? (
        <div className="loading-spinner"><p>Loading…</p></div>
      ) : (
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="table-empty">
              <h3>{visibleSubmissions.length === 0 ? 'No submissions yet' : 'No matches found'}</h3>
              <p>
                {visibleSubmissions.length === 0
                  ? 'Save a draft or submit a record to see it here.'
                  : 'Try a different search term or status filter.'}
              </p>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Period</th>
                    <th>Scenario</th>
                    <th>Environment</th>
                    <th>Buyer</th>
                    <th>Buyer NTN/CNIC</th>
                    <th>Items</th>
                    <th>Sale Value</th>
                    <th>Tax Amount</th>
                    <th>Total Bill</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map((s) => {
                    const buyer = s.itemList?.[0]?.buyerBusinessName || s.buyerBusinessName || '—';
                    const buyerId =
                      s.itemList?.[0]?.buyerNTN || s.itemList?.[0]?.buyerCNIC || s.buyerNTN || s.buyerCNIC || '—';
                    const isDraft = s.status === 'draft';
                    return (
                      <tr key={s._id}>
                        <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                        <td>{fmtDate(s.submittedAt || s.updatedAt)}</td>
                        <td>{s.taxPeriodMonth}/{s.taxPeriodYear}</td>
                        <td><span className="status-badge neutral">{s.scenarioId || '—'}</span></td>
                        <td>
                          <span className={`environment-badge ${s.fbrEnvironment || 'sandbox'}`}>
                            {(s.fbrEnvironment || 'sandbox').charAt(0).toUpperCase() + (s.fbrEnvironment || 'sandbox').slice(1)}
                          </span>
                        </td>
                        <td>{buyer}</td>
                        <td>{buyerId}</td>
                        <td>{s.itemList?.length || 0}</td>
                        <td>PKR {fmtMoney(s.totalSaleValue)}</td>
                        <td>PKR {fmtMoney(s.totalTaxAmount)}</td>
                        <td>PKR {fmtMoney(s.totalBillAmount)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="button button-sm button-secondary"
                              onClick={() => {
                                if (isDraft) {
                                  router.push(`/company/submissions/${s._id}`);
                                } else {
                                  setViewing(s);
                                }
                              }}
                            >
                              {isDraft ? 'Continue' : 'View'}
                            </button>
                            <button
                              className="button button-sm button-danger"
                              onClick={() => { setDeleteError(''); setDeleteTarget(s); }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length > PAGE_SIZE && (
                <div className="table-pagination">
                  <div className="pagination-summary">
                    Showing {Math.min(pageStart + 1, filtered.length)}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
                  </div>

                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                    >
                      Previous
                    </button>

                    <span className="pagination-page">
                      Page {safePage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <SubmissionViewModal open={!!viewing} onClose={() => setViewing(null)} submission={viewing} />

      <PasswordConfirmModal
        open={!!deleteTarget}
        title="Delete Submission"
        message="This permanently deletes the submission. Enter your password to confirm."
        loading={deleting}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function CompanyRecordsPage() {
  return <Suspense fallback={<div className="loading-spinner">Loading submissions…</div>}><CompanyRecordsContent /></Suspense>;
}
