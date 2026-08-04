'use client';
import { useState, useEffect, useMemo } from 'react';
import FbrSuccessModal from '../../../components/company/FbrSuccessModal';
import ReceiptViewModal from '../../../components/company/ReceiptViewModal';
import PasswordConfirmModal from '../../../components/company/PasswordConfirmModal';

export default function FbrRecordsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');

  const [viewing, setViewing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function loadReceipts() {
    const res = await fetch('/api/fbr/receipts', { cache: 'no-store' });
    const data = await res.json();
    setReceipts(data.receipts || []);
  }

  useEffect(() => {
    loadReceipts().finally(() => setLoading(false));
  }, []);

  async function handleTestSubmit() {
    setSending(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/fbr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useExample: true }),
      });
      const data = await res.json();
      if (data.success) {
        setLastReceipt(data.receipt);
        setModalOpen(true);
      } else {
        setErrorMsg(
          data?.envelope?.error?.message || 'Submission failed. Check the bridge connection.'
        );
      }
      await loadReceipts();
    } catch (err) {
      setErrorMsg(err?.message || 'Network error contacting the server.');
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete(password) {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/fbr/receipts/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setDeleteTarget(null);
      // Re-fetch the authoritative list so the table always reflects the DB
      // (never a stale optimistic guess).
      await loadReceipts();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const fmt = (d) => (d ? new Date(d).toLocaleString('en-PK') : '—');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter((r) => {
      const reference = r.fbrResponse?.reference || r.fbrResponse?.invoiceNumber || r.errorCode || '';
      const status = r.success ? 'success' : 'failed';
      const received = fmt(r.receivedAt || r.createdAt);
      return [r.submissionId, r.action, status, r.environment, reference, received]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [receipts, search]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">FBR Invoices</h1>
          <p className="page-subtitle">FBR invoices confirming your tax submissions were received</p>
        </div>
        <button
          className="button button-primary"
          onClick={handleTestSubmit}
          disabled={sending}
        >
          {sending ? 'Submitting…' : 'Send Test Submission'}
        </button>
      </div>

      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ marginBottom: '1rem', maxWidth: '360px' }}>
        <input
          className="input"
          type="search"
          name="fbr-invoice-filter"
          autoComplete="off"
          placeholder="Filter by submission, status, reference, date…"
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
              <h3>{receipts.length === 0 ? 'No FBR invoices yet' : 'No matches found'}</h3>
              <p>
                {receipts.length === 0
                  ? 'Send a test submission to see an FBR invoice appear here.'
                  : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Submission ID</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Environment</th>
                  <th>Reference</th>
                  <th>Received</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id}>
                    <td><code>{r.submissionId || '—'}</code></td>
                    <td>{r.action}</td>
                    <td>
                      <span className={`status-badge ${r.success ? 'submitted' : 'failed'}`}>
                        {r.success ? 'success' : 'failed'}
                        {r.mock ? ' (mock)' : ''}
                      </span>
                    </td>
                    <td>{r.environment || '—'}</td>
                    <td>
                      {r.fbrResponse?.reference ||
                        r.fbrResponse?.invoiceNumber ||
                        r.errorCode ||
                        '—'}
                    </td>
                    <td>{fmt(r.receivedAt || r.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="button button-sm button-secondary" onClick={() => setViewing(r)}>
                          View
                        </button>
                        <button
                          className="button button-sm button-danger"
                          onClick={() => { setDeleteError(''); setDeleteTarget(r); }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <FbrSuccessModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        receipt={lastReceipt}
      />

      <ReceiptViewModal open={!!viewing} onClose={() => setViewing(null)} receipt={viewing} />

      <PasswordConfirmModal
        open={!!deleteTarget}
        title="Delete FBR Invoice"
        message="This permanently deletes the FBR invoice. Enter your password to confirm."
        loading={deleting}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
