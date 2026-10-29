'use client';

import { environment, environmentLabel, statusLabel } from './reporting';
import styles from './Supervisor.module.css';

export function EnvironmentBadge({ value }) {
  return <span className={`${styles.environment} ${styles[environment(value)]}`}>{environmentLabel(value)}</span>;
}

export function SubmissionStatus({ value }) {
  return <span className={`status-badge ${value || 'pending'}`}>{statusLabel(value)}</span>;
}

export function LoadState({ loading, error, retry, label = 'Loading report…' }) {
  if (loading) return <div className={styles.state} role="status" aria-live="polite">{label}</div>;
  if (!error) return null;
  return (
    <div className={`alert alert-error ${styles.error}`} role="alert">
      <p>{error}</p>
      <button type="button" className="button button-sm button-secondary" onClick={retry}>Try again</button>
    </div>
  );
}

export function Pagination({ total, page, setPage, pageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return (
    <div className="table-pagination">
      <p className="pagination-summary" aria-live="polite">Showing {total ? start + 1 : 0}–{Math.min(start + pageSize, total)} of {total}</p>
      {totalPages > 1 && (
        <nav className="pagination-controls" aria-label="Report pages">
          <button type="button" className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="pagination-page">Page {page} of {totalPages}</span>
          <button type="button" className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}
    </div>
  );
}
