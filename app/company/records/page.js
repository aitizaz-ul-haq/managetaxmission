'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SubmissionViewModal from '../../../components/company/SubmissionViewModal';
import PasswordConfirmModal from '../../../components/company/PasswordConfirmModal';

export default function CompanyRecordsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [viewing, setViewing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function loadSubmissions() {
    const res = await fetch('/api/company/submissions');
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
      setSubmissions((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const fmtMoney = (n) => (n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });
  const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-PK') : '—');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submitted;
    return submitted.filter((s) => {
      const buyer = s.buyerBusinessName || s.itemList?.[0]?.buyerBusinessName || '';
      const buyerId = s.buyerNTN || s.buyerCNIC || s.itemList?.[0]?.buyerNTN || s.itemList?.[0]?.buyerCNIC || '';
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
                {filtered.map((s) => {
                  const buyer = s.buyerBusinessName || s.itemList?.[0]?.buyerBusinessName || '—';
                  const buyerId =
                    s.buyerNTN || s.buyerCNIC || s.itemList?.[0]?.buyerNTN || s.itemList?.[0]?.buyerCNIC || '—';
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
