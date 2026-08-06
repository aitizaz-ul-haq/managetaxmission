'use client';
import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './SubmissionViewModal.module.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-PK') : '—');
const show = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : show(v);
};

function Field({ label, value, span }) {
  return (
    <div className={`detail-item ${span ? 'detail-span-2' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{show(value)}</span>
    </div>
  );
}

/**
 * Full invoice breakdown (seller, buyer, line items) reconstructed from the
 * payload sent to FBR; shown on screen and in the printed record.
 */
function InvoiceDetails({ inv, reference, fbrItems }) {
  const items = Array.isArray(inv.items) ? inv.items : [];
  const statusByRow = {};
  (fbrItems || []).forEach((s) => {
    statusByRow[String(s.itemSNo)] = s;
  });

  return (
    <>
      <div className="detail-section">
        <div className="detail-section-title">Invoice Details</div>
        <div className="detail-grid">
          <Field label="FBR Invoice Number" value={reference} />
          <Field label="Invoice Type" value={inv.invoiceType} />
          <Field label="Invoice Date" value={inv.invoiceDate} />
          <Field label="Invoice Ref No" value={inv.invoiceRefNo} />
          <Field label="Scenario ID" value={inv.scenarioId} />
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Seller</div>
        <div className="detail-grid">
          <Field label="Business Name" value={inv.sellerBusinessName} />
          <Field label="NTN / CNIC" value={inv.sellerNTNCNIC} />
          <Field label="Province" value={inv.sellerProvince} />
          <Field label="Address" value={inv.sellerAddress} span />
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Buyer</div>
        <div className="detail-grid">
          <Field label="Business Name" value={inv.buyerBusinessName} />
          <Field label="NTN / CNIC" value={inv.buyerNTNCNIC} />
          <Field label="Registration Type" value={inv.buyerRegistrationType} />
          <Field label="Province" value={inv.buyerProvince} />
          <Field label="Address" value={inv.buyerAddress} span />
        </div>
      </div>

      {items.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">Line Items</div>
          <div className="table-wrapper">
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>HS Code</th>
                  <th>Description</th>
                  <th>Sale Type</th>
                  <th>Rate</th>
                  <th>UoM</th>
                  <th>Qty</th>
                  <th>Value (Excl. ST)</th>
                  <th>Sales Tax</th>
                  <th>Further Tax</th>
                  <th>Total Value</th>
                  <th>FBR Invoice No</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const st = statusByRow[String(i + 1)] || {};
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{show(it.hsCode)}</td>
                      <td>{show(it.productDescription)}</td>
                      <td>{show(it.saleType)}</td>
                      <td>{show(it.rate)}</td>
                      <td>{show(it.uoM)}</td>
                      <td>{show(it.quantity)}</td>
                      <td>{money(it.valueSalesExcludingST)}</td>
                      <td>{money(it.salesTaxApplicable)}</td>
                      <td>{money(it.furtherTax)}</td>
                      <td>{money(it.totalValues)}</td>
                      <td>{show(st.invoiceNo)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default function ReceiptViewModal({ open, onClose, receipt }) {
  const { user } = useAuth();
  const printRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  if (!open || !receipt) return null;

  const r = receipt;
  const reference =
    r.fbrResponse?.reference || r.fbrResponse?.invoiceNumber || r.requestId || '—';

  const inv = r.invoicePayload || {};
  const fbrItems =
    r.fbrResponse?.validationResponse?.invoiceStatuses ||
    r.fbrResponse?.invoiceStatuses ||
    [];

  async function downloadPdf() {
    const el = printRef.current;
    if (!el || pdfBusy) return;
    setPdfBusy(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      el.classList.add(styles.pdfCapture);
      // Let the browser paint the now-visible document before capturing.
      await new Promise((resolve) => setTimeout(resolve, 50));
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `FBR-Invoice-${reference}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(el)
        .save();
    } finally {
      if (printRef.current) printRef.current.classList.remove(styles.pdfCapture);
      setPdfBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" style={{ alignItems: 'center' }} onClick={onClose}>
      <div className={`modal ${styles.modal} print-area`} onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header no-print ${styles.header}`}>
          <h2>FBR Invoice</h2>
          <div className={styles.headerActions}>
            <button className="button button-sm button-secondary" onClick={() => window.print()}>
              Print
            </button>
            <button
              className="button button-sm button-secondary"
              onClick={downloadPdf}
              disabled={pdfBusy}
            >
              {pdfBusy ? 'Generating…' : 'Download PDF'}
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

            <InvoiceDetails inv={inv} reference={reference} fbrItems={fbrItems} />

            <div className="detail-section">
              <div className="detail-section-title">FBR Response</div>
              <pre className={styles.jsonBlock}>
                {JSON.stringify(r.fbrResponse ?? r.rawEnvelope ?? {}, null, 2)}
              </pre>
            </div>
          </div>

          {/* Print-only document (also captured for PDF download) */}
          <div className={styles.printBody} ref={printRef}>
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

            <InvoiceDetails inv={inv} reference={reference} fbrItems={fbrItems} />

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
