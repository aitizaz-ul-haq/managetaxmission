'use client';
import { useAuth } from '../../context/AuthContext';
import styles from './SubmissionViewModal.module.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-PK') : '—');
const show = (v) => (v === undefined || v === null || v === '' ? '—' : v);

function Field({ label, value, span }) {
  return (
    <div className={`detail-item ${span ? 'detail-span-2' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{show(value)}</span>
    </div>
  );
}

export default function ReceiptViewModal({ open, onClose, receipt }) {
  const { user } = useAuth();
  if (!open || !receipt) return null;

  const r = receipt;
  const reference =
    r.fbrResponse?.reference || r.fbrResponse?.invoiceNumber || r.requestId || '—';

  const inv = r.invoicePayload || {};

  return (
    <div className="modal-backdrop" style={{ alignItems: 'center' }} onClick={onClose}>
      <div className={`modal ${styles.modal} print-area`} onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header no-print ${styles.header}`}>
          <h2>FBR Invoice</h2>
          <div className={styles.headerActions}>
            <button className="button button-sm button-secondary" onClick={() => window.print()}>
              Print
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div className="modal-body">
          {/* On-screen sections */}
          <div className="no-print">
            <div className="detail-section">
              <div className="detail-section-title">Summary</div>
              <div className="detail-grid">
                <Field label="Submission ID" value={r.submissionId} />
                <Field label="Action" value={r.action} />
                <Field label="Status" value={r.success ? `success${r.mock ? ' (mock)' : ''}` : 'failed'} />
                <Field label="Environment" value={r.environment} />
                <Field label="Reference" value={reference} />
                <Field label="HTTP Status" value={r.httpStatus} />
                <Field label="Request ID" value={r.requestId} span />
                <Field label="Received At" value={fmtDate(r.receivedAt || r.createdAt)} />
              </div>
            </div>

            {!r.success && (r.errorCode || r.errorMessage) && (
              <div className="detail-section">
                <div className="detail-section-title">Error</div>
                <div className="detail-grid">
                  <Field label="Code" value={r.errorCode} />
                  <Field label="Message" value={r.errorMessage} span />
                </div>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-section-title">FBR Response</div>
              <pre className={styles.jsonBlock}>
                {JSON.stringify(r.fbrResponse ?? r.rawEnvelope ?? {}, null, 2)}
              </pre>
            </div>
          </div>

          {/* Print-only document */}
          <div className={styles.printBody}>
            <div className={styles.letterhead}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/taxmissionlogo.png" alt="Manage Taxmission" className={styles.letterheadLogo} />
              <div className={styles.letterheadCompany}>
                {show(inv.sellerBusinessName || user?.companyName)}
              </div>
            </div>
            <div className={styles.letterheadBar} />
            <div className={styles.printTitle}>
              <strong>FBR Invoice</strong>
              <span>Reference: {reference}</span>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Invoice</div>
              <div className="detail-grid">
                <Field label="Invoice Type" value={inv.invoiceType} />
                <Field label="Invoice Ref No" value={inv.invoiceRefNo || reference} />
                <Field label="Invoice Date" value={inv.invoiceDate} />
                <Field label="Scenario ID" value={inv.scenarioId} />
                <Field label="Environment" value={r.environment} />
                <Field label="Received At" value={fmtDate(r.receivedAt || r.createdAt)} />
              </div>
            </div>

            <div className={styles.printFooter}>
              This document was printed by {show(user?.fullName)} on{' '}
              {new Date().toLocaleDateString('en-PK')} at{' '}
              {new Date().toLocaleTimeString('en-PK')}, who is the representative of the
              company {show(user?.companyName || inv.sellerBusinessName)}, using Manage
              Taxmission application.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
