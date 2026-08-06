'use client';
import { useState } from 'react';

const PROVINCES = ['Islamabad', 'Punjab', 'Sindh', 'KPK', 'Balochistan', 'AJK', 'Gilgit-Baltistan'];

const emptyBranch = { name: '', address: '', principalActivity: '' };

const emptyAccountant = { fullName: '', email: '', phone: '', password: '', status: 'active' };
const emptySupervisor = { fullName: '', email: '', phone: '', status: 'active' };

const emptyForm = {
  registrationNo: '', referenceNo: '',
  salesTaxRegistered: false, salesTaxRegisteredDate: '',
  category: '', ppRegIncNo: '', registeredOn: '', taxOffice: '',
  incomeTaxStatus: '', salesTaxStatus: '',
  companyName: '', legalName: '', ntn: '', strn: '', province: '',
  email: '', cell: '', address: '',
  fbrSandboxToken: '',
  branches: [{ ...emptyBranch }],
  accountant: { ...emptyAccountant },
  supervisor: { ...emptySupervisor },
  status: 'active',
  settings: { defaultInvoiceType: '', defaultTaxRate: 0, allowSubmission: true },
};

export default function CompanyForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    if (!initialData) return emptyForm;
    return {
      ...emptyForm,
      ...initialData,
      branches:
        Array.isArray(initialData.branches) && initialData.branches.length
          ? initialData.branches
          : [{ ...emptyBranch }],
      accountant: { ...emptyAccountant, ...(initialData.accountant || {}), password: '' },
      supervisor: { ...emptySupervisor, ...(initialData.supervisor || {}) },
      settings: { ...emptyForm.settings, ...(initialData.settings || {}) },
    };
  });
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initialData);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setSetting = (field, value) =>
    setForm((p) => ({ ...p, settings: { ...p.settings, [field]: value } }));

  const setAccountant = (field, value) =>
    setForm((p) => ({ ...p, accountant: { ...p.accountant, [field]: value } }));
  const setSupervisor = (field, value) =>
    setForm((p) => ({ ...p, supervisor: { ...p.supervisor, [field]: value } }));

  const setBranch = (index, field, value) =>
    setForm((p) => ({
      ...p,
      branches: p.branches.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }));
  const addBranch = () =>
    setForm((p) => ({ ...p, branches: [...p.branches, { ...emptyBranch }] }));
  const removeBranch = (index) =>
    setForm((p) => ({
      ...p,
      branches: p.branches.filter((_, i) => i !== index),
    }));

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
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Cell</label>
            <input className="input" value={form.cell} onChange={(e) => set('cell', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Address <span className="required">*</span></label>
            <textarea className="textarea" value={form.address} onChange={(e) => set('address', e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-section-title">FBR Registration Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Registration No</label>
            <input className="input" value={form.registrationNo} onChange={(e) => set('registrationNo', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Reference No</label>
            <input className="input" value={form.referenceNo} onChange={(e) => set('referenceNo', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Registered for Sales Tax</label>
            <select className="select" value={form.salesTaxRegistered ? 'yes' : 'no'}
              onChange={(e) => set('salesTaxRegistered', e.target.value === 'yes')}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sales Tax Registered w.e.f.</label>
            <input className="input" value={form.salesTaxRegisteredDate} onChange={(e) => set('salesTaxRegisteredDate', e.target.value)} placeholder="e.g. 18-APR-22" />
          </div>
          <div className="form-group">
            <label>PP/REG/INC No.</label>
            <input className="input" value={form.ppRegIncNo} onChange={(e) => set('ppRegIncNo', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Registered On</label>
            <input className="input" value={form.registeredOn} onChange={(e) => set('registeredOn', e.target.value)} placeholder="e.g. 22-OCT-2021" />
          </div>
          <div className="form-group">
            <label>Tax Office</label>
            <input className="input" value={form.taxOffice} onChange={(e) => set('taxOffice', e.target.value)} placeholder="e.g. CTO ISLAMABAD" />
          </div>
          <div className="form-group">
            <label>Income Tax Status</label>
            <input className="input" value={form.incomeTaxStatus} onChange={(e) => set('incomeTaxStatus', e.target.value)} placeholder="e.g. Active" />
          </div>
          <div className="form-group">
            <label>Sales Tax Status</label>
            <input className="input" value={form.salesTaxStatus} onChange={(e) => set('salesTaxStatus', e.target.value)} placeholder="e.g. OPERATIVE" />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Category</label>
            <textarea className="textarea" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Company formed and registered under the Companies Ordinance, 1984…" />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>FBR Sandbox Token</label>
            <input className="input" value={form.fbrSandboxToken} onChange={(e) => set('fbrSandboxToken', e.target.value.trim())} placeholder="Token issued by FBR for this company's NTN" autoComplete="off" />
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-section-header">
          <h3 className="form-section-title">Business / Branches</h3>
          <button type="button" className="button button-ghost" onClick={addBranch}>
            + Add Branch
          </button>
        </div>
        {form.branches.map((branch, i) => (
          <div key={i} className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Business / Branch Name</label>
              <input className="input" value={branch.name} onChange={(e) => setBranch(i, 'name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Principal Activity</label>
              <input className="input" value={branch.principalActivity} onChange={(e) => setBranch(i, 'principalActivity', e.target.value)} placeholder="e.g. 890111-Other service activities" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Business / Branch Address</label>
              <textarea className="textarea" value={branch.address} onChange={(e) => setBranch(i, 'address', e.target.value)} />
            </div>
            {form.branches.length > 1 && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <button type="button" className="button button-ghost" onClick={() => removeBranch(i)}>
                  Remove Branch
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="form-card">
        <h3 className="form-section-title">Personnel</h3>

        <div className="form-subsection">
          <h4 className="form-subsection-title">Accountant</h4>
          <p className="form-subsection-hint">Works on the company&apos;s tax submissions and logs in to the dashboard.</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input className="input" value={form.accountant.fullName} onChange={(e) => setAccountant('fullName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input className="input" type="email" value={form.accountant.email} onChange={(e) => setAccountant('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="input" value={form.accountant.phone} onChange={(e) => setAccountant('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>
                {isEdit ? 'New Password (leave blank to keep)' : 'Login Password'}
                {!isEdit && <span className="required"> *</span>}
              </label>
              <input
                className="input"
                type="password"
                value={form.accountant.password || ''}
                onChange={(e) => setAccountant('password', e.target.value)}
                required={!isEdit}
                minLength={!isEdit ? 8 : undefined}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        <div className="form-subsection">
          <h4 className="form-subsection-title">Supervisor</h4>
          <p className="form-subsection-hint">Reporting contact only — does not log in to the application.</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input className="input" value={form.supervisor.fullName} onChange={(e) => setSupervisor('fullName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input className="input" type="email" value={form.supervisor.email} onChange={(e) => setSupervisor('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="input" value={form.supervisor.phone} onChange={(e) => setSupervisor('phone', e.target.value)} />
            </div>
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
