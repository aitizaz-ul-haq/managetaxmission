'use client';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

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
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
        </div>

        <div className="form-card">
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
              <p style={{ padding: '0.5rem 0', color: 'var(--color-text)' }}>Company User</p>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section-title">Change Password</h3>
          {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handlePasswordChange}>
            <div className="form-grid">
              <div className="form-group">
                <label>Current Password <span className="required">*</span></label>
                <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>New Password <span className="required">*</span></label>
                <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Change Password'}</button>
            </div>
          </form>
        </div>
      </div>
  );
}
