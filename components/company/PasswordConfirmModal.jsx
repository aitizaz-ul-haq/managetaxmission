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
  // Keep the field read-only until the user focuses it. Browsers skip
  // autofill/credential suggestions on read-only inputs, so the password
  // manager never pops up on this re-auth field. Combined with
  // autoComplete="new-password" and a non-credential name below, Chrome will
  // not offer or fill any saved username/password here.
  const [readOnly, setReadOnly] = useState(true);

  if (!open) return null;

  function handleConfirm() {
    if (!password) return;
    onConfirm(password);
  }

  function handleClose() {
    setPassword('');
    setReadOnly(true);
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
            {/*
              Decoy fields absorb any browser autofill so the real password
              box below is never targeted. They are off-screen (not display:none,
              which Chrome ignores for autofill) and not focusable.
            */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
              readOnly
            />
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
              readOnly
            />
            <input
              className="input"
              type="password"
              name="mtm-delete-confirm"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              readOnly={readOnly}
              value={password}
              onFocus={() => setReadOnly(false)}
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
