'use client';
import { useState, useEffect } from 'react';
import FbrSuccessModal from '../../../components/company/FbrSuccessModal';

export default function FbrRecordsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadReceipts() {
    const res = await fetch('/api/fbr/receipts');
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

  const fmt = (d) => (d ? new Date(d).toLocaleString('en-PK') : '—');

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">FBR Records</h1>
          <p className="page-subtitle">Receipts returned by the FBR gateway</p>
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

      {loading ? (
        <div className="loading-spinner"><p>Loading…</p></div>
      ) : (
        <div className="table-wrapper">
          {receipts.length === 0 ? (
            <div className="table-empty">
              <h3>No FBR records yet</h3>
              <p>Send a test submission to see a receipt appear here.</p>
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
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
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
    </div>
  );
}
