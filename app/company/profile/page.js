'use client';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import styles from '../../../components/portal/PortalProfile.module.css';

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPw.length < 8) {
      setMsg({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Failed to change password' });
      } else {
        setMsg({ type: 'success', text: 'Password changed successfully' });
        setCurrentPw('');
        setNewPw('');
      }
    } catch (error) {
      setMsg({ type: 'error', text: error.message || 'Unable to change your password. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
        <div className="page-header">
          <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Your accountant account, company, and security settings.</p></div>
        </div>

        <div className={styles.grid}>
        <div className="form-card">
          <div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{user?.fullName?.trim()?.[0]?.toUpperCase() || 'A'}</span><div><h2>{user?.fullName || 'Accountant'}</h2><span>Accountant</span><p>{user?.companyName}</p></div></div>
          <h3 className="form-section-title">Account Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <p style={{ padding: '0.5rem 0', color: 'var(--color-text)' }}>{user?.fullName}</p>
            </div>
            <div className="form-group">
              <label>Email</label>
              <p style={{ padding: '0.5rem 0', color: 'var(--color-text)' }}>{user?.email}</p>
            </div>
            <div className="form-group">
              <label>Role</label>
              <p style={{ padding: '0.5rem 0', color: 'var(--color-text)' }}>Accountant</p>
            </div>
            <div className="form-group">
              <label>Company</label>
              <p style={{ padding: '0.5rem 0', color: 'var(--color-text)' }}>{user?.companyName || '—'}</p>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section-title">Change Password</h3>
          <p className={styles.hint}>Choose a strong password with at least eight characters.</p>
          {msg.text && <div className={`alert alert-${msg.type}`} role={msg.type === 'error' ? 'alert' : 'status'}>{msg.text}</div>}
          <form onSubmit={handlePasswordChange} aria-busy={saving}>
            <div className={styles.passwordFields}>
              <div className="form-group">
                <label htmlFor="accountant-current-password">Current Password <span className="required">*</span></label>
                <input id="accountant-current-password" className="input" type="password" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required disabled={saving} />
              </div>
              <div className="form-group">
                <label htmlFor="accountant-new-password">New Password <span className="required">*</span></label>
                <input id="accountant-new-password" className="input" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} disabled={saving} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Change Password'}</button>
            </div>
          </form>
        </div>
        </div>
      </div>
  );
}
