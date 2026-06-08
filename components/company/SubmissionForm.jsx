'use client';
import { useReducer, useEffect, useState } from 'react';
import { submissionFormReducer, initialFormState } from './submissionFormReducer';
import InvoiceItemsEditor from './InvoiceItemsEditor';
import TotalsCard from './TotalsCard';
import ValidationErrors from './ValidationErrors';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PROVINCES = ['Islamabad','Punjab','Sindh','KPK','Balochistan','AJK','Gilgit-Baltistan'];

export default function SubmissionForm({ draftData, submissionId, onSaved }) {
  const [state, dispatch] = useReducer(
    submissionFormReducer,
    draftData || initialFormState,
    (init) => init
  );
  const [refData, setRefData] = useState({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [preparingPayload, setPreparingPayload] = useState(false);
  const [success, setSuccess] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Auto-populate seller fields from company profile on new submissions
  useEffect(() => {
    if (draftData) return; // editing existing draft — don't overwrite
    fetch('/api/company/profile')
      .then((r) => r.json())
      .then(({ company }) => {
        if (!company) return;
        dispatch({ type: 'SET_FIELD', field: 'sellerBusinessName', value: company.legalName || company.companyName || '' });
        dispatch({ type: 'SET_FIELD', field: 'sellerNTN', value: company.ntn || '' });
        dispatch({ type: 'SET_FIELD', field: 'sellerProvince', value: company.province || '' });
        dispatch({ type: 'SET_FIELD', field: 'sellerAddress', value: company.address || '' });
      })
      .catch(() => {}); // silently ignore if profile not available
  }, [draftData]);

  // Recalculate totals whenever itemList length changes (add/remove)
  useEffect(() => {
    dispatch({ type: 'RECALCULATE_TOTALS' });
  }, [state.itemList.length]);

  // Load reference data
  useEffect(() => {
    const types = ['invoice_type', 'buyer_type', 'hs_code', 'uom', 'sale_type', 'province'];
    Promise.all(
      types.map((t) =>
        fetch(`/api/reference-data?type=${t}`)
          .then((r) => r.json())
          .then((d) => ({ type: t, data: d.data || [] }))
      )
    ).then((results) => {
      const map = {};
      results.forEach(({ type, data }) => { map[type] = data; });
      setRefData(map);
    });
  }, []);

  const set = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  async function saveDraft() {
    setSaving(true);
    setGlobalError('');
    try {
      const url = submissionId ? `/api/company/submissions/${submissionId}` : '/api/company/submissions';
      const method = submissionId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, status: 'draft' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSuccess('Draft saved successfully');
      if (onSaved) onSaved(data.submission);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function validate() {
    if (!submissionId) {
      setGlobalError('Save the draft first before validating');
      return;
    }
    setValidating(true);
    setGlobalError('');
    try {
      // First save latest state
      await fetch(`/api/company/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      // Then validate
      const res = await fetch(`/api/company/submissions/${submissionId}/validate`, { method: 'POST' });
      const data = await res.json();
      dispatch({ type: 'SET_VALIDATION_ERRORS', errors: data.errors || [] });
      if (data.valid) {
        setSuccess('Submission validated successfully');
        if (onSaved) onSaved(data.submission);
      } else {
        setGlobalError('Validation failed. Please fix the errors below.');
      }
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setValidating(false);
    }
  }

  async function preparePayload() {
    if (!submissionId) return;
    setPreparingPayload(true);
    setGlobalError('');
    try {
      const res = await fetch(`/api/company/submissions/${submissionId}/prepare-payload`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Payload prepared. Submission is ready.');
      if (onSaved) onSaved(data.submission);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setPreparingPayload(false);
    }
  }

  const invoiceTypes = refData.invoice_type || [];
  const buyerTypes = refData.buyer_type || [];
  const provinceOptions = (refData.province || []).map((p) => p.value);
  const allProvinces = provinceOptions.length ? provinceOptions : PROVINCES;

  return (
    <div>
      {success && <div className="alert alert-success">{success}</div>}
      {globalError && <div className="alert alert-error">{globalError}</div>}
      <ValidationErrors errors={state.validationErrors} />

      {/* Tax Period */}
      <div className="form-card">
        <h3 className="form-section-title">Tax Period</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Month <span className="required">*</span></label>
            <select className="select" value={state.taxPeriodMonth} onChange={(e) => set('taxPeriodMonth', Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Year <span className="required">*</span></label>
            <input className="input" type="number" value={state.taxPeriodYear} onChange={(e) => set('taxPeriodYear', Number(e.target.value))} min="2020" max="2099" required />
          </div>
          <div className="form-group">
            <label>Submission Type</label>
            <input className="input" value={state.submissionType} disabled />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="form-card">
        <h3 className="form-section-title">Invoice Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Invoice Type <span className="required">*</span></label>
            {invoiceTypes.length > 0 ? (
              <select className="select" value={state.invoiceType} onChange={(e) => set('invoiceType', e.target.value)} required>
                <option value="">Select Type</option>
                {invoiceTypes.map((t) => <option key={t._id} value={t.value}>{t.label}</option>)}
              </select>
            ) : (
              <input className="input" value={state.invoiceType} onChange={(e) => set('invoiceType', e.target.value)} placeholder="e.g. Sale Invoice" required />
            )}
          </div>
          <div className="form-group">
            <label>Invoice Date <span className="required">*</span></label>
            <input className="input" type="date" value={state.invoiceDate} onChange={(e) => set('invoiceDate', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Invoice Number <span className="required">*</span></label>
            <input className="input" value={state.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} placeholder="e.g. INV-2026-0001" required />
          </div>
        </div>
      </div>

      {/* Seller Details */}
      <div className="form-card">
        <h3 className="form-section-title">Seller Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Business Name <span className="required">*</span></label>
            <input className="input" value={state.sellerBusinessName} onChange={(e) => set('sellerBusinessName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>NTN <span className="required">*</span></label>
            <input className="input" value={state.sellerNTN} onChange={(e) => set('sellerNTN', e.target.value)} placeholder="e.g. 1234567-8" required />
          </div>
          <div className="form-group">
            <label>Province <span className="required">*</span></label>
            <select className="select" value={state.sellerProvince} onChange={(e) => set('sellerProvince', e.target.value)} required>
              <option value="">Select Province</option>
              {allProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Address <span className="required">*</span></label>
            <textarea className="textarea" value={state.sellerAddress} onChange={(e) => set('sellerAddress', e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Buyer Details */}
      <div className="form-card">
        <h3 className="form-section-title">Buyer Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Business Name <span className="required">*</span></label>
            <input className="input" value={state.buyerBusinessName} onChange={(e) => set('buyerBusinessName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>NTN <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>(or CNIC)</span></label>
            <input className="input" value={state.buyerNTN} onChange={(e) => set('buyerNTN', e.target.value)} placeholder="e.g. 8765432-1" />
          </div>
          <div className="form-group">
            <label>CNIC <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>(or NTN)</span></label>
            <input className="input" value={state.buyerCNIC} onChange={(e) => set('buyerCNIC', e.target.value)} placeholder="e.g. 12345-1234567-1" />
          </div>
          <div className="form-group">
            <label>Province <span className="required">*</span></label>
            <select className="select" value={state.buyerProvince} onChange={(e) => set('buyerProvince', e.target.value)} required>
              <option value="">Select Province</option>
              {allProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Buyer Type</label>
            {buyerTypes.length > 0 ? (
              <select className="select" value={state.buyerType} onChange={(e) => set('buyerType', e.target.value)}>
                <option value="">Select Type</option>
                {buyerTypes.map((t) => <option key={t._id} value={t.value}>{t.label}</option>)}
              </select>
            ) : (
              <input className="input" value={state.buyerType} onChange={(e) => set('buyerType', e.target.value)} />
            )}
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Address <span className="required">*</span></label>
            <textarea className="textarea" value={state.buyerAddress} onChange={(e) => set('buyerAddress', e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="form-card">
        <h3 className="form-section-title">Invoice Items</h3>
        <InvoiceItemsEditor items={state.itemList} dispatch={dispatch} refData={refData} />
      </div>

      {/* Totals */}
      <TotalsCard
        totalSaleValue={state.totalSaleValue}
        totalTaxAmount={state.totalTaxAmount}
        totalBillAmount={state.totalBillAmount}
      />

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="button button-ghost" onClick={saveDraft} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button type="button" className="button button-primary" onClick={validate} disabled={validating || !submissionId}>
          {validating ? 'Validating…' : 'Validate'}
        </button>
        {submissionId && (
          <button type="button" className="button button-success" onClick={preparePayload} disabled={preparingPayload}>
            {preparingPayload ? 'Preparing…' : 'Prepare Payload'}
          </button>
        )}
      </div>
    </div>
  );
}
