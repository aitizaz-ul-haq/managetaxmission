'use client';
import { useState } from 'react';

const PROVINCES = ['Islamabad', 'Punjab', 'Sindh', 'KPK', 'Balochistan', 'AJK', 'Gilgit-Baltistan'];

const emptyForm = {
  companyName: '', legalName: '', ntn: '', strn: '', province: '',
  address: '', contactPersonName: '', contactPersonEmail: '', contactPersonPhone: '',
  status: 'active',
  settings: { defaultInvoiceType: '', defaultTaxRate: 0, allowSubmission: true },
};

export default function CompanyForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(initialData || emptyForm);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setSetting = (field, value) =>
    setForm((p) => ({ ...p, settings: { ...p.settings, [field]: value } }));

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
        <h3 className="form-section-title">Company Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Company Name <span className="required">*</span></label>
            <input className="input" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Legal Name <span className="required">*</span></label>
            <input className="input" value={form.legalName} onChange={(e) => set('legalName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>NTN <span className="required">*</span></label>
            <input className="input" value={form.ntn} onChange={(e) => set('ntn', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>STRN</label>
            <input className="input" value={form.strn} onChange={(e) => set('strn', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Province <span className="required">*</span></label>
            <select className="select" value={form.province} onChange={(e) => set('province', e.target.value)} required>
              <option value="">Select Province</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Address <span className="required">*</span></label>
            <textarea className="textarea" value={form.address} onChange={(e) => set('address', e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-section-title">Contact Person</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Contact Name <span className="required">*</span></label>
            <input className="input" value={form.contactPersonName} onChange={(e) => set('contactPersonName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Contact Email <span className="required">*</span></label>
            <input className="input" type="email" value={form.contactPersonEmail} onChange={(e) => set('contactPersonEmail', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Contact Phone</label>
            <input className="input" value={form.contactPersonPhone} onChange={(e) => set('contactPersonPhone', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-section-title">Default Settings</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Default Tax Rate (%)</label>
            <input className="input" type="number" min="0" max="100" step="0.01"
              value={form.settings?.defaultTaxRate || 0}
              onChange={(e) => setSetting('defaultTaxRate', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Allow Submission</label>
            <select className="select" value={form.settings?.allowSubmission ? 'yes' : 'no'}
              onChange={(e) => setSetting('allowSubmission', e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Company'}
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
