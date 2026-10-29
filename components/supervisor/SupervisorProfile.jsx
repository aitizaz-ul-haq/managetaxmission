'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import useSupervisorData from './useSupervisorData';
import { LoadState } from './ReportUi';
import { show } from './reporting';
import styles from './Supervisor.module.css';

function Details({ fields }) {
  return <dl className={styles.details}>{fields.map(([label, value, wide]) => <div key={label} className={wide ? styles.wideDetail : ''}><dt>{label}</dt><dd>{show(value)}</dd></div>)}</dl>;
}

export default function SupervisorProfile() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useSupervisorData('/api/supervisor/profile');
  const company = data?.company;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  async function changePassword(event) {
    event.preventDefault();
    setMessage(null);
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Your new password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Your new passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to change your password. Please try again.');
      setMessage({ type: 'success', text: 'Your password has been changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof SyntaxError ? 'The server returned an unexpected response. Please try again.' : err.message || 'Unable to connect. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`page-content ${styles.page}`}>
      <div className={`page-header ${styles.header}`}><div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Your supervisor account and company information.</p></div></div>
      <section className="form-card" aria-labelledby="account-information-title">
        <h2 className="form-section-title" id="account-information-title">Account information</h2>
        <Details fields={[
          ['Full name', user?.fullName],
          ['Email', user?.email],
          ['Role', 'Supervisor'],
        ]} />
      </section>
      <section className="form-card" aria-labelledby="company-information-title">
        <h2 className="form-section-title" id="company-information-title">Company information</h2>
        <LoadState loading={loading} error={error} retry={reload} label="Loading company information…" />
        {!loading && !error && company && <Details fields={[
          ['Company name', company.companyName],
          ['Legal name', company.legalName],
          ['Company status', company.status],
          ['NTN', company.ntn],
          ['STRN', company.strn],
          ['Province', company.province],
          ['Company email', company.email],
          ['Contact number', company.cell],
          ['Tax office', company.taxOffice],
          ['Income tax status', company.incomeTaxStatus],
          ['Sales tax status', company.salesTaxStatus],
          ['Sales tax registered', company.salesTaxRegistered == null ? '—' : company.salesTaxRegistered ? 'Yes' : 'No'],
          ['Address', company.address, true],
        ]} />}
        {!loading && !error && !company && <p className={styles.hint}>Company information is currently unavailable.</p>}
      </section>
      <section className="form-card" aria-labelledby="change-password-title">
        <h2 className="form-section-title" id="change-password-title">Change password</h2>
        {message && <div className={`alert alert-${message.type} ${styles.passwordMessage}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
        <form onSubmit={changePassword} aria-busy={saving}>
          <div className={styles.passwordGrid}>
            <div className="form-group"><label htmlFor="supervisor-current-password">Current password <span className="required">*</span></label><input id="supervisor-current-password" className="input" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required disabled={saving} /></div>
            <div className="form-group"><label htmlFor="supervisor-new-password">New password <span className="required">*</span></label><input id="supervisor-new-password" className="input" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} aria-describedby="supervisor-password-hint" required disabled={saving} /><p className={styles.hint} id="supervisor-password-hint">At least 8 characters.</p></div>
            <div className="form-group"><label htmlFor="supervisor-confirm-password">Confirm new password <span className="required">*</span></label><input id="supervisor-confirm-password" className="input" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required disabled={saving} /></div>
          </div>
          <div className="form-actions"><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Changing password…' : 'Change password'}</button></div>
        </form>
      </section>
    </div>
  );
}
