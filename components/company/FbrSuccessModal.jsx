'use client';
import styles from './FbrSuccessModal.module.css';

export default function FbrSuccessModal({ open, onClose, receipt }) {
  if (!open) return null;

  const ref =
    receipt?.fbrResponse?.reference ||
    receipt?.fbrResponse?.invoiceNumber ||
    receipt?.requestId ||
    '—';

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.tickWrap}>
          <svg className={styles.tickSvg} viewBox="0 0 52 52">
            <circle className={styles.tickCircle} cx="26" cy="26" r="24" fill="none" />
            <path className={styles.tickCheck} fill="none" d="M14 27l8 8 16-16" />
          </svg>
        </div>
        <h2 className={styles.title}>Submission Successful</h2>
        <p className={styles.subtitle}>The invoice was accepted by FBR.</p>
        <div className={styles.refBox}>
          <span className={styles.refLabel}>Reference</span>
          <span className={styles.refValue}>{ref}</span>
        </div>
        <button className={styles.btn} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
