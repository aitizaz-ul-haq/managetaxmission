'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './SubmissionViewModal.module.css';

const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });
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

export default function SubmissionViewModal({ open, onClose, submission }) {
  const router = useRouter();
  const { user } = useAuth();
  const modalRef = useRef(null);

  // visibility:hidden (styles/print.css) hides the rest of the page but keeps its
  // layout height, which can still push out a blank extra printed page. Actually
  // remove that content from layout for the duration of print by display:none-ing
  // every sibling along the print area's ancestor chain, then restore afterward.
  useEffect(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return undefined;
    let hidden = [];

    const hideOutsidePrintArea = () => {
      let node = modalEl;
      while (node && node !== document.body) {
        const parent = node.parentElement;
        if (parent) {
          Array.from(parent.children).forEach((sibling) => {
            if (sibling !== node && sibling.style.display !== 'none') {
              hidden.push({ el: sibling, prevDisplay: sibling.style.display });
              sibling.style.display = 'none';
            }
          });
        }
        node = parent;
      }
    };
    const restore = () => {
      hidden.forEach(({ el, prevDisplay }) => {
        el.style.display = prevDisplay;
      });
      hidden = [];
    };

    window.addEventListener('beforeprint', hideOutsidePrintArea);
    window.addEventListener('afterprint', restore);
    return () => {
      window.removeEventListener('beforeprint', hideOutsidePrintArea);
      window.removeEventListener('afterprint', restore);
    };
  }, [open, submission]);

  if (!open || !submission) return null;

  const s = submission;
  const first = (s.itemList && s.itemList[0]) || {};
  const reference =
    s.fbrResponse?.fbrResponse?.reference ||
    s.fbrResponse?.fbrResponse?.invoiceNumber ||
    s.fbrResponse?.requestId ||
    '—';

  return (
    <div className={`modal-backdrop ${styles.backdrop}`} onClick={onClose}>
      <div ref={modalRef} className={`modal ${styles.modal} print-area`} onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header no-print ${styles.header}`}>
          <h2>Submission</h2>
          <div className={styles.headerActions}>
            <button className="button button-sm button-secondary" onClick={() => window.print()}>
              Print
            </button>
            <button
              className="button button-sm button-primary"
              onClick={() => router.push('/company/fbr-records')}
            >
              See invoice from FBR
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className={`print-only ${styles.letterhead}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/taxmissionlogo.png" alt="Manage Taxmission" className={styles.letterheadLogo} />
            <div className={styles.letterheadCompany}>
              {show(s.sellerBusinessName)}
            </div>
          </div>
          <div className={`print-only ${styles.letterheadBar}`} />
          <div className={`print-only ${styles.printTitle}`}>
            <strong>Submission</strong>
            <span>Reference: {reference}</span>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Invoice</div>
            <div className="detail-grid">
              <Field label="Invoice Type" value={first.invoiceType || s.invoiceType} />
              <Field label="Invoice Number" value={first.invoiceNumber || s.invoiceNumber} />
              <Field label="Invoice Date" value={first.invoiceDate || s.invoiceDate} />
              <Field label="Tax Period" value={`${s.taxPeriodMonth}/${s.taxPeriodYear}`} />
              <Field label="Status" value={s.status} />
              <Field label="Submitted At" value={fmtDate(s.submittedAt || s.updatedAt)} />
              <Field label="FBR Reference" value={reference} />
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Seller</div>
            <div className="detail-grid">
              <Field label="Business Name" value={s.sellerBusinessName} />
              <Field label="NTN" value={s.sellerNTN} />
              <Field label="Province" value={s.sellerProvince} />
              <Field label="Address" value={s.sellerAddress} span />
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Buyer</div>
            <div className="detail-grid">
              <Field label="Business Name" value={first.buyerBusinessName || s.buyerBusinessName} />
              <Field label="NTN / CNIC" value={first.buyerNTN || s.buyerNTN} />
              <Field label="Registration Type" value={first.buyerType || s.buyerType} />
              <Field label="Province" value={first.buyerProvince || s.buyerProvince} />
              <Field label="Address" value={first.buyerAddress || s.buyerAddress} />
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Items</div>
            <div className="table-wrapper">
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Description</th>
                    <th>HS Code</th>
                    <th>Qty</th>
                    <th>UoM</th>
                    <th>Unit Price</th>
                    <th>Sale Value</th>
                    <th>Rate</th>
                    <th>Sales Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {(s.itemList || []).map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{show(it.itemDescription)}</td>
                      <td>{show(it.hsCode)}</td>
                      <td>{show(it.quantity)}</td>
                      <td>{show(it.uom)}</td>
                      <td>{fmtMoney(it.unitPrice)}</td>
                      <td>{fmtMoney(it.saleValue)}</td>
                      <td>{show(it.taxRate)}%</td>
                      <td>{fmtMoney(it.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`table-wrapper ${styles.itemsTableSpacer}`}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Extra Tax</th>
                    <th>Further Tax</th>
                    <th>ST Withheld at Source</th>
                    <th>SRO No. / Schedule No.</th>
                    <th>Item S. No.</th>
                  </tr>
                </thead>
                <tbody>
                  {(s.itemList || []).map((it, i) => (
                    <tr key={i}>
                      <td>{fmtMoney(it.extraTax)}</td>
                      <td>{fmtMoney(it.furtherTax)}</td>
                      <td>{fmtMoney(it.stWithheldAtSource)}</td>
                      <td>{show(it.sroScheduleNo)}</td>
                      <td>{show(it.sroItemSerialNo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Totals</div>
            <div className="detail-grid">
              <Field label="Total Sale Value" value={`PKR ${fmtMoney(s.totalSaleValue)}`} />
              <Field label="Total Tax" value={`PKR ${fmtMoney(s.totalTaxAmount)}`} />
              <Field label="Total Bill" value={`PKR ${fmtMoney(s.totalBillAmount)}`} />
            </div>
          </div>

          <div className={`print-only ${styles.printFooter}`}>
            This document was printed by {show(user?.fullName)} on{' '}
            {new Date().toLocaleDateString('en-PK')} at{' '}
            {new Date().toLocaleTimeString('en-PK')}, who is the representative of the
            company {show(user?.companyName || s.sellerBusinessName)}, using Manage
            Taxmission application.
          </div>
        </div>
      </div>
    </div>
  );
}
