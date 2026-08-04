'use client';
import { useState } from 'react';

/**
 * Generic password-confirmation modal. Verifies the current user's password
 * server-side (the caller's onConfirm sends the password to a protected
 * endpoint). Used to gate deletions.
 *
 * Props:
 *  - open: boolean
 *  - title, message: strings
 *  - loading: boolean (external, while the delete request is in flight)
 *  - error: string (external error message)
 *  - onCancel: () => void
 *  - onConfirm: (password: string) => void
 */
export default function PasswordConfirmModal({
  open,
  title = 'Confirm Password',
  message = 'Enter your password to continue.',
  loading = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  const [password, setPassword] = useState('');

  if (!open) return null;

  function handleConfirm() {
    if (!password) return;
    onConfirm(password);
  }

  function handleClose() {
    setPassword('');
    onCancel();
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-muted)', fontSize: 'var(--font-base)' }}>
            {message}
          </p>
          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" className="button button-ghost" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="button" className="button button-danger" onClick={handleConfirm} disabled={loading || !password}>
              {loading ? 'Deleting…' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
