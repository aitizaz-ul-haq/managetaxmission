'use client';
import { useState, useEffect } from 'react';

const emptyForm = {
  fullName: '', email: '', password: '', role: 'company_user', companyId: '', status: 'active',
};

export default function UserForm({ initialData, onSave, onCancel, isNew = false }) {
  const [form, setForm] = useState(initialData || emptyForm);
  const [companies, setCompanies] = useState([]);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/companies')
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []));
  }, []);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setErrors(Array.isArray(err) ? err : [err.message]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className="alert alert-error">
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <div className="form-card">
        <h3 className="form-section-title">User Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name <span className="required">*</span></label>
            <input className="input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{isNew ? 'Password' : 'New Password (leave blank to keep)'}{isNew && <span className="required"> *</span>}</label>
            <input className="input" type="password" value={form.password || ''} onChange={(e) => set('password', e.target.value)} required={isNew} minLength={isNew ? 8 : undefined} />
          </div>
          <div className="form-group">
            <label>Role <span className="required">*</span></label>
            <select className="select" value={form.role} onChange={(e) => set('role', e.target.value)} required>
              <option value="company_user">Company User</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          {form.role === 'company_user' && (
            <div className="form-group">
              <label>Assign to Company <span className="required">*</span></label>
              <select className="select" value={form.companyId || ''} onChange={(e) => set('companyId', e.target.value)} required>
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.companyName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Status</label>
            <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save User'}
        </button>
        {onCancel && (
          <button type="button" className="button button-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
