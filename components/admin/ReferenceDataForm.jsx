'use client';
import { useState } from 'react';

const TYPES = ['province', 'invoice_type', 'buyer_type', 'tax_rate', 'hs_code', 'sale_type', 'document_type', 'uom', 'sro_schedule'];

const empty = { type: 'province', label: '', value: '', status: 'active' };

export default function ReferenceDataForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(initialData || empty);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

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
      <h3 className="form-section-title">{initialData ? 'Edit Item' : 'Add New Item'}</h3>
      {errors.length > 0 && <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
      <div className="form-grid">
        <div className="form-group">
          <label>Type <span className="required">*</span></label>
          <select className="select" value={form.type} onChange={(e) => set('type', e.target.value)} required>
            {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Label <span className="required">*</span></label>
          <input className="input" value={form.label} onChange={(e) => set('label', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Value <span className="required">*</span></label>
          <input className="input" value={form.value} onChange={(e) => set('value', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" className="button button-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
