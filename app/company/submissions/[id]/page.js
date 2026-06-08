'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SubmissionForm from '../../../../components/company/SubmissionForm';
import PayloadPreview from '../../../../components/company/PayloadPreview';

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch(`/api/company/submissions/${id}`)
      .then((r) => r.json())
      .then((d) => setSubmission(d.submission))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  async function handleSubmitToFbr() {
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const res = await fetch(`/api/company/submissions/${id}/submit`, { method: 'POST' });
      const data = await res.json();
      setSubmitMsg(data.message || 'Done');
      load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-spinner"><p>Loading…</p></div>;
  if (!submission) return <div className="page-content"><p>Submission not found.</p></div>;

  const isEditable = ['draft', 'validated'].includes(submission.status);

  return (
    <div className="page-content">
        <div className="breadcrumb">
          <a href="/company/records">Records</a>
          <span>/</span>
          <span>{submission.invoiceNumber || 'Draft'}</span>
        </div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Submission</h1>
            <p className="page-subtitle">Invoice {submission.invoiceNumber || '—'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className={`status-badge ${submission.status}`}>{submission.status}</span>
            {submission.status === 'ready_for_submission' && (
              <button
                className="button button-primary"
                onClick={handleSubmitToFbr}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit to FBR'}
              </button>
            )}
          </div>
        </div>

        {submitMsg && <div className="alert alert-warning">{submitMsg}</div>}

        {isEditable ? (
          <SubmissionForm
            draftData={submission}
            submissionId={id}
            onSaved={(s) => setSubmission(s)}
          />
        ) : (
          <ReadOnlyView submission={submission} />
        )}

        {submission.fbrPayload && <PayloadPreview payload={submission.fbrPayload} />}
      </div>
  );
}

function ReadOnlyView({ submission }) {
  const fmt = (n) => (n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

  return (
    <>
      <div className="form-card">
        <h3 className="form-section-title">Invoice Details</h3>
        <div className="form-grid">
          <div className="form-group"><label>Type</label><p>{submission.invoiceType}</p></div>
          <div className="form-group"><label>Date</label><p>{submission.invoiceDate}</p></div>
          <div className="form-group"><label>Number</label><p>{submission.invoiceNumber}</p></div>
          <div className="form-group"><label>Period</label><p>{submission.taxPeriodMonth}/{submission.taxPeriodYear}</p></div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-section-title">Seller → Buyer</h3>
        <div className="form-grid">
          <div className="form-group"><label>Seller</label><p>{submission.sellerBusinessName} ({submission.sellerNTN})</p></div>
          <div className="form-group"><label>Buyer</label><p>{submission.buyerBusinessName}</p></div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-section-title">Invoice Items</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>Description</th><th>HS Code</th><th>Qty</th><th>Unit Price</th><th>Sale Value</th><th>Tax %</th><th>Tax Amount</th></tr>
            </thead>
            <tbody>
              {(submission.itemList || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.itemSNo}</td>
                  <td>{item.itemDescription}</td>
                  <td>{item.hsCode}</td>
                  <td>{item.quantity}</td>
                  <td>{fmt(item.unitPrice)}</td>
                  <td>{fmt(item.saleValue)}</td>
                  <td>{item.taxRate}%</td>
                  <td>{fmt(item.taxAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'right', marginTop: '1rem', lineHeight: 2 }}>
          <p>Total Sale Value: <strong>PKR {fmt(submission.totalSaleValue)}</strong></p>
          <p>Total Tax: <strong>PKR {fmt(submission.totalTaxAmount)}</strong></p>
          <p style={{ fontSize: '1.1rem' }}>Total Bill: <strong>PKR {fmt(submission.totalBillAmount)}</strong></p>
        </div>
      </div>
    </>
  );
}
