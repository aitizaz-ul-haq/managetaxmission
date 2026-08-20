'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SubmissionViewModal from '../../../components/company/SubmissionViewModal';
import PasswordConfirmModal from '../../../components/company/PasswordConfirmModal';

export default function CompanyRecordsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const [viewing, setViewing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function loadSubmissions() {
    const res = await fetch('/api/company/submissions', { cache: 'no-store' });
    const data = await res.json();
    setSubmissions(data.submissions || []);
  }

  useEffect(() => {
    loadSubmissions().finally(() => setLoading(false));
  }, []);

  // Only successfully submitted forms belong here
  const submitted = useMemo(
    () => submissions.filter((s) => s.status === 'submitted'),
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
    const sorted = [...submitted].sort((a, b) => {
      const aTime = new Date(a.submittedAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.submittedAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });

    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((s) => {
      const buyer = s.itemList?.[0]?.buyerBusinessName || s.buyerBusinessName || '';
      const buyerId = s.itemList?.[0]?.buyerNTN || s.itemList?.[0]?.buyerCNIC || s.buyerNTN || s.buyerCNIC || '';
      const submittedOn = fmtDate(s.submittedAt || s.updatedAt);
      const period = `${s.taxPeriodMonth}/${s.taxPeriodYear}`;
      const items = String(s.itemList?.length || 0);
      const saleValue = fmtMoney(s.totalSaleValue);
      const taxAmount = fmtMoney(s.totalTaxAmount);
      const total = fmtMoney(s.totalBillAmount);
      return [buyer, buyerId, submittedOn, period, items, saleValue, taxAmount, total]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [submitted, search]);

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
          <p className="page-subtitle">Successfully submitted submissions</p>
        </div>
        <Link href="/company/submissions/new" className="button button-primary">
          + New Submission
        </Link>
      </div>

      <div style={{ marginBottom: '1rem', maxWidth: '360px' }}>
        <input
          className="input"
          type="search"
          name="submission-filter"
          autoComplete="off"
          placeholder="Filter by buyer, date, period, or amount…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-spinner"><p>Loading…</p></div>
      ) : (
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="table-empty">
              <h3>{submitted.length === 0 ? 'No submissions yet' : 'No matches found'}</h3>
              <p>
                {submitted.length === 0
                  ? 'Submissions appear here once they are successfully submitted to FBR.'
                  : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Submitted</th>
                    <th>Period</th>
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
                    return (
                      <tr key={s._id}>
                        <td>{fmtDate(s.submittedAt || s.updatedAt)}</td>
                        <td>{s.taxPeriodMonth}/{s.taxPeriodYear}</td>
                        <td>{buyer}</td>
                        <td>{buyerId}</td>
                        <td>{s.itemList?.length || 0}</td>
                        <td>PKR {fmtMoney(s.totalSaleValue)}</td>
                        <td>PKR {fmtMoney(s.totalTaxAmount)}</td>
                        <td>PKR {fmtMoney(s.totalBillAmount)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="button button-sm button-secondary" onClick={() => setViewing(s)}>
                              View
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
