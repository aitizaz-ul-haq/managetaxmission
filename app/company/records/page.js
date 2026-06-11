'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CompanyRecordsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetch('/api/company/submissions')
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this submission? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/company/submissions/${id}`, { method: 'DELETE' });
      if (res.ok) setSubmissions((prev) => prev.filter((s) => s._id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const fmt = (n) => (n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

  return (
    <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Records</h1>
            <p className="page-subtitle">All your previous submissions</p>
          </div>
          <Link href="/company/submissions/new" className="button button-primary">
            + New Submission
          </Link>
        </div>

        {loading ? (
          <div className="loading-spinner"><p>Loading…</p></div>
        ) : (
          <div className="table-wrapper">
            {submissions.length === 0 ? (
              <div className="table-empty">
                <h3>No submissions yet</h3>
                <p>Create your first submission to get started.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Period</th>
                    <th>Invoice Date</th>
                    <th>Buyer</th>
                    <th>Total Bill</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id}>
                      <td><strong>{s.invoiceNumber || '—'}</strong></td>
                      <td>{s.taxPeriodMonth}/{s.taxPeriodYear}</td>
                      <td>{s.invoiceDate || '—'}</td>
                      <td>{s.buyerBusinessName || '—'}</td>
                      <td>PKR {fmt(s.totalBillAmount)}</td>
                      <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link href={`/company/submissions/${s._id}`} className="button button-sm button-secondary">
                            View
                          </Link>
                          <button
                            className="button button-sm button-danger"
                            onClick={() => handleDelete(s._id)}
                            disabled={deleting === s._id}
                          >
                            {deleting === s._id ? '…' : 'Delete'}
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
      </div>
  );
}
