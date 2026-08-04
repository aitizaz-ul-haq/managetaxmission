'use client';
import { useReducer, useEffect, useState } from 'react';
import { submissionFormReducer, initialFormState } from './submissionFormReducer';
import TotalsCard from './TotalsCard';
import ValidationErrors from './ValidationErrors';
import FbrSuccessModal from './FbrSuccessModal';

/**
 * FBR FIELD GAPS — form inputs still missing (bridge requires/uses them).
 * The Submission model now stores these, and mapSubmissionToInvoice reads them,
 * but there is no UI to enter them yet. Add form inputs later to avoid FBR
 * rejections when the real submission data is entered manually:
 *
 * Top-level (invoice):
 *  - sellerAddress  -> REQUIRED non-empty. Currently auto-filled from company profile;
 *                      add a visible/editable field if profile may be blank.
 *  - scenarioId     -> optional string on bridge; add a field if FBR needs a value.
 *
 * Per-item:
 *  - fedPayable     -> number, defaults to 0. No column yet.
 *  - discount       -> number, defaults to 0. No column yet.
 *
 * buyerAddress now has a column at the end of the DSI table (after Petroleum Levy).
 *
 * Already captured by the form: invoiceType, invoiceDate, seller* , buyerNTN,
 * buyerBusinessName, buyerProvince, buyerType(->buyerRegistrationType), rate,
 * uoM, quantity, saleValue, taxAmount, fixedNotifiedValue, extraTax, furtherTax,
 * totalValueOfSales, stWithheldAtSource, sroScheduleNo, sroItemSerialNo,
 * itemDescription, invoiceReferenceNo.
 */

const thStyle = {
  border: '1px solid rgba(255,255,255,0.25)',
  padding: '7px 6px',
  textAlign: 'center',
  fontSize: '0.77rem',
  fontWeight: 600,
  verticalAlign: 'middle',
  whiteSpace: 'normal',
  lineHeight: '1.3',
  color: '#fff',
};

const tdStyle = {
  border: '1px solid var(--color-border)',
  padding: '4px',
  verticalAlign: 'middle',
};

const ci = {
  width: '100%',
  minWidth: '96px',
  padding: '4px 6px',
  fontSize: '0.83rem',
  boxSizing: 'border-box',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PROVINCES = ['Islamabad','Punjab','Sindh','KPK','Balochistan','AJK','Gilgit-Baltistan'];
const DOCUMENT_TYPES = ['Sale invoice', 'Credit Note', 'Debit Note', 'STWH'];
const HS_CODES = ['9815.9000', '9816.0000', '9817.0000', '9817.1000'];
const SALE_TYPES = ['Services', 'Services (FED in ST Mode)', 'Goods (FED in ST Mode)', 'Goods at Reduced Rate'];
const RATE_OPTIONS = [{ value: 0, label: '0.00%' }, { value: 1, label: '1%' }, { value: 8, label: '8%' }, { value: 16, label: '16%' }];
const UOM_OPTIONS = ['', 'NO', 'Numbers, pieces, units', 'Pair'];
const SRO_SCHEDULES = ['ICTO TABLE II', 'ICTO TABLE I', 'NINTH SCHEDULE', 'SECTION 49'];
const ITEM_SERIALS = ['1(i)', '1(i)(a)', '100A', '100A((i))'];

/**
 * Safely parse a fetch Response as JSON. An empty or non-JSON body (e.g. a 405
 * from a missing route method, a 500/504 with no body, or the dev server
 * recompiling) would otherwise throw the cryptic
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 * This surfaces the real HTTP status instead.
 */
async function readJson(res) {
  const text = await res.text();
  if (!text) {
    throw new Error(
      `Server returned an empty response (HTTP ${res.status}). Please try again — if it persists, make sure the app and FBR bridge are running.`
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned an unexpected response (HTTP ${res.status}).`);
  }
}

export default function SubmissionForm({ draftData, submissionId, onSaved }) {
  const [state, dispatch] = useReducer(
    submissionFormReducer,
    draftData || initialFormState,
    (init) => init
  );
  const [refData, setRefData] = useState({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [submittingFbr, setSubmittingFbr] = useState(false);
  const [fbrModalOpen, setFbrModalOpen] = useState(false);
  const [fbrReceipt, setFbrReceipt] = useState(null);
  const [success, setSuccess] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [pickedItem, setPickedItem] = useState('');
  const [taxPeriodDate, setTaxPeriodDate] = useState(
    () => `${(draftData || initialFormState).taxPeriodYear}-${String((draftData || initialFormState).taxPeriodMonth).padStart(2, '0')}-01`
  );

  // Auto-populate seller fields from company profile on new submissions
  useEffect(() => {
    if (draftData) return;
    fetch('/api/company/profile')
      .then((r) => r.json())
      .then(({ company }) => {
        if (!company) return;
        dispatch({ type: 'SET_FIELD', field: 'sellerBusinessName', value: company.legalName || company.companyName || '' });
        dispatch({ type: 'SET_FIELD', field: 'sellerNTN', value: company.ntn || '' });
        dispatch({ type: 'SET_FIELD', field: 'sellerProvince', value: company.province || '' });
        dispatch({ type: 'SET_FIELD', field: 'sellerAddress', value: company.address || '' });
        if (company.province) {
          dispatch({ type: 'UPDATE_ITEM', index: 0, field: 'sellerProvince', value: company.province });
        }
      })
      .catch(() => {});
  }, [draftData]);

  // Recalculate totals whenever itemList length changes
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

  // Load saved invoice items
  useEffect(() => {
    fetch('/api/company/invoice-items')
      .then((r) => r.json())
      .then((d) => setSavedItems(d.items || []))
      .catch(() => {});
  }, []);

  const set = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const upd = (index, field, value) => dispatch({ type: 'UPDATE_ITEM', index, field, value });

  function fillMockData() {
    setGlobalError('');
    setSuccess('');
    const today = new Date().toISOString().split('T')[0];
    dispatch({
      type: 'LOAD_DRAFT',
      data: {
        ...state,
        submissionType: 'sales_tax_fed',
        invoiceType: 'Sale invoice',
        invoiceDate: today,
        invoiceNumber: 'INV-MOCK-001',
        sellerBusinessName: state.sellerBusinessName || 'Manage Taxmission Test Seller',
        sellerNTN: state.sellerNTN || '1234567',
        sellerProvince: state.sellerProvince || 'Sindh',
        sellerAddress: state.sellerAddress || 'Office 1, Test Plaza, Karachi',
        buyerBusinessName: 'Test Buyer Pvt Ltd',
        buyerNTN: '7654321',
        buyerProvince: 'Punjab',
        buyerAddress: 'Suite 5, Buyer Tower, Lahore',
        buyerType: 'Registered',
        validationErrors: [],
        itemList: [
          {
            itemSNo: 1,
            buyerNTN: '7654321',
            buyerCNIC: '',
            buyerBusinessName: 'Test Buyer Pvt Ltd',
            buyerType: 'Registered',
            buyerProvince: 'Punjab',
            buyerAddress: 'Suite 5, Buyer Tower, Lahore',
            sellerProvince: state.sellerProvince || 'Sindh',
            invoiceType: 'Sale invoice',
            invoiceNumber: 'INV-MOCK-001',
            invoiceDate: today,
            itemDescription: 'Test product A',
            hsCode: '9815.9000',
            quantity: 1,
            unitPrice: 1000,
            saleValue: 1000,
            taxRate: 16,
            taxAmount: 160,
            uom: 'Numbers, pieces, units',
            saleType: 'Services',
            fixedNotifiedValue: 0,
            extraTax: 0,
            furtherTax: 0,
            totalValueOfSales: 0,
            stWithheldAtSource: 0,
            invoiceReferenceNo: '',
            reasons: '',
            reasonRemarks: '',
            petroleumLevyOn: '',
            sroScheduleNo: 'ICTO TABLE II',
            sroItemSerialNo: '1(i)',
          },
        ],
      },
    });
    dispatch({ type: 'RECALCULATE_TOTALS' });
    setSuccess('Mock data filled. You can now Validate and Submit to FBR.');
  }

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
      const data = await readJson(res);
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
      await fetch(`/api/company/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      const res = await fetch(`/api/company/submissions/${submissionId}/validate`, { method: 'POST' });
      const data = await readJson(res);
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

  async function submitToFbr() {
    setGlobalError('');
    setSubmittingFbr(true);
    try {
      // Persist the latest form state first so the server maps fresh data.
      let sid = submissionId;
      const saveUrl = sid ? `/api/company/submissions/${sid}` : '/api/company/submissions';
      const saveMethod = sid ? 'PUT' : 'POST';
      const saveRes = await fetch(saveUrl, {
        method: saveMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, status: state.status || 'draft' }),
      });
      const saveData = await readJson(saveRes);
      if (!saveRes.ok) throw new Error(saveData.error || 'Save failed');
      sid = sid || saveData.submission?._id;
      if (onSaved) onSaved(saveData.submission);

      const res = await fetch('/api/fbr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionRef: sid }),
      });
      const data = await readJson(res);
      if (data.success) {
        setFbrReceipt(data.receipt);
        setFbrModalOpen(true);
      } else {
        setGlobalError(
          data?.envelope?.error?.message || data?.error || 'FBR submission failed.'
        );
      }
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSubmittingFbr(false);
    }
  }

  const invoiceTypes = refData.invoice_type || [];
  const buyerTypes = refData.buyer_type || [];
  const provinceOptions = (refData.province || []).map((p) => p.value);
  const allProvinces = provinceOptions.length ? provinceOptions : PROVINCES;
  const uomOptions = refData.uom || [];
  const saleTypeOptions = refData.sale_type || [];
  const hsCodeOptions = refData.hs_code || [];

  const validationStatus =
    state.validationErrors.length === 0 && submissionId
      ? 'Valid'
      : state.validationErrors.length > 0
      ? 'Invalid'
      : 'Pending';

  return (
    <div>
      {success && <div className="alert alert-success">{success}</div>}
      {globalError && <div className="alert alert-error">{globalError}</div>}
      <ValidationErrors errors={state.validationErrors} />

      {/* DSI Header — mirrors Excel rows 1–3 */}
      <div className="form-card" style={{ marginBottom: '1rem' }}>
        {/* Row 1: Title + Note */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary)', letterSpacing: '0.5px' }}>
            DOMESTIC SALES INVOICES (DSI)
          </strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', maxWidth: '55%', textAlign: 'right', lineHeight: 1.4 }}>
            Note: Please Provide Registration No. or NTN with Check Digit in invoice entry.
          </span>
        </div>

        {/* Row 2: Seller Reg No + Tax Period */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem' }}>Seller Registration No. <span className="required">*</span></label>
            <input className="input" value={state.sellerNTN} onChange={(e) => set('sellerNTN', e.target.value)} style={{ width: '160px' }} placeholder="e.g. 1234567-8" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem' }}>Tax Period <span className="required">*</span></label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                className="input"
                type="date"
                defaultValue={taxPeriodDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  setTaxPeriodDate(val);
                  const [y, m] = val.split('-');
                  set('taxPeriodYear', Number(y));
                  set('taxPeriodMonth', Number(m));
                }}
                style={{ width: '155px' }}
              />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.5px' }}>
                {taxPeriodDate ? taxPeriodDate.slice(0, 7).replace('-', '') : `${state.taxPeriodYear}${String(state.taxPeriodMonth).padStart(2, '0')}`}
              </span>
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem' }}>Submission Type</label>
            <input className="input" value={state.submissionType} disabled style={{ width: '140px' }} />
          </div>
        </div>

        {/* Row 3: Stats */}
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', padding: '0.4rem 0.75rem', background: 'var(--color-bg-alt, #f5f7fa)', borderRadius: '4px', fontSize: '0.82rem' }}>
          <span>Total Records: <strong>{state.itemList.length}</strong></span>
          <span>Invalid Records: <strong style={{ color: state.validationErrors.length > 0 ? 'var(--color-danger)' : undefined }}>{state.validationErrors.length > 0 ? state.itemList.length : 0}</strong></span>
          <span>Validation Status: <strong style={{ color: validationStatus === 'Valid' ? 'var(--color-success)' : validationStatus === 'Invalid' ? 'var(--color-danger)' : undefined }}>{validationStatus}</strong></span>
        </div>
      </div>

      {/* Saved Items auto-fill — above table */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {savedItems.length > 0 ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Auto fill items for this seller — if you have a new item please save it in invoice items to auto fill here:</label>
            <select
              className="select"
              style={{ minWidth: '200px' }}
              value={pickedItem}
              onChange={(e) => {
                const val = e.target.value;
                setPickedItem(val);
                if (!val) return;
                const picked = savedItems.find((s) => s._id === val);
                if (!picked) return;
                const newIndex = state.itemList.length;
                dispatch({ type: 'ADD_ITEM' });
                // Particulars of Buyers — auto-filled from saved invoice item
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'buyerNTN', value: picked.registrationNo || '' });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'buyerBusinessName', value: picked.itemDescription || '' });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'buyerType', value: picked.type || '' });
                // Seed product / value defaults so the row is submittable (editable by user)
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'sellerProvince', value: state.sellerProvince || '' });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'buyerProvince', value: state.sellerProvince || '' });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'buyerAddress', value: '' });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'itemDescription', value: picked.itemDescription || 'Item' });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'uom', value: 'Numbers, pieces, units' });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'quantity', value: 1 });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'unitPrice', value: 1000 });
                dispatch({ type: 'UPDATE_ITEM', index: newIndex, field: 'taxRate', value: 16 });
                setPickedItem('');
              }}
            >
              <option value="">— pick a saved item —</option>
              {savedItems.map((s) => <option key={s._id} value={s._id}>{s.itemDescription}</option>)}
            </select>
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Auto fill items for this seller — if you have a new item please save it in invoice items to auto fill here.</span>
        )}
      </div>

      {/* DSI Invoice Table — mirrors Excel rows 4–7+ */}
      <div className="form-card" style={{ padding: '0.5rem', overflowX: 'scroll' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '4260px', fontSize: '0.83rem', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ background: 'var(--color-primary)', color: '#fff' }}>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '43px' }}>Sr.</th>
              <th colSpan={3} style={thStyle}>Particulars of Buyers</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '132px' }}>Sale Origination Province of Supplier</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '132px' }}>Destination of Supply</th>
              <th colSpan={4} style={thStyle}>Document</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '108px' }}>Sale Type</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '72px' }}>Rate (%)</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '84px' }}>Quantity</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '96px' }}>UoM</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '114px' }}>Unit Price (PKR)</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '126px' }}>Value of Sales Excluding Sales Tax</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '126px' }}>Sales Tax / FED in ST Mode</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '126px' }}>Fixed / Notified Value or Retail Price / Higher of Actual and Minimum Fixed Value</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '96px' }}>Extra Tax</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '96px' }}>Further Tax</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '126px' }}>Total Value of Sales (In case of PFAD only)</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '126px' }}>ST Withheld at Source</th>
              <th colSpan={2} style={thStyle}>Exemption, Zero &amp; Reduce Rated Reference</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '144px' }}>Invoice Reference No.</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '120px' }}>Reasons</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '132px' }}>Reason Remarks</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '180px' }}>Product Description</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '132px' }}>Petroleum Levy on</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '180px' }}>Buyer Address</th>
              <th rowSpan={2} style={{ ...thStyle, minWidth: '48px' }}></th>
            </tr>
            <tr style={{ background: 'var(--color-primary)', color: '#fff' }}>
              <th style={{ ...thStyle, minWidth: '144px' }}>Registration No. (NTN)</th>
              <th style={{ ...thStyle, minWidth: '180px' }}>Name</th>
              <th style={{ ...thStyle, minWidth: '120px' }}>Type</th>
              <th style={{ ...thStyle, minWidth: '132px' }}>Type</th>
              <th style={{ ...thStyle, minWidth: '156px' }}>Number</th>
              <th style={{ ...thStyle, minWidth: '156px' }}>Date</th>
              <th style={{ ...thStyle, minWidth: '132px' }}>HS Code Description</th>
              <th style={{ ...thStyle, minWidth: '144px' }}>SRO No. / Schedule No.</th>
              <th style={{ ...thStyle, minWidth: '108px' }}>Item S. No.</th>
            </tr>
          </thead>
          <tbody>
            {state.itemList.length === 0 ? (
              <tr>
                <td colSpan={32} style={{ ...tdStyle, textAlign: 'center', padding: '1.5rem', color: 'var(--color-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Select invoice item from the dropdown above.
                </td>
              </tr>
            ) : (
              state.itemList.map((item, index) => (
              <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : 'var(--color-bg-alt, #f9fafb)' }}>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>

                {/* Buyer Reg No (NTN) */}
                <td style={tdStyle}>
                  <input className="input" style={ci} value={item.buyerNTN ?? state.buyerNTN ?? ''} onChange={(e) => upd(index, 'buyerNTN', e.target.value)} placeholder="NTN / CNIC" />
                </td>

                {/* Buyer Name */}
                <td style={tdStyle}>
                  <input className="input" style={{ ...ci, minWidth: '168px' }} value={item.buyerBusinessName ?? state.buyerBusinessName ?? ''} onChange={(e) => upd(index, 'buyerBusinessName', e.target.value)} />
                </td>

                {/* Buyer Type */}
                <td style={tdStyle}>
                  {buyerTypes.length > 0
                    ? <select className="select" style={ci} value={item.buyerType ?? state.buyerType ?? ''} onChange={(e) => upd(index, 'buyerType', e.target.value)}>
                        <option value="">—</option>
                        {buyerTypes.map((t) => <option key={t._id} value={t.value}>{t.label}</option>)}
                      </select>
                    : <input className="input" style={ci} value={item.buyerType ?? state.buyerType ?? ''} onChange={(e) => upd(index, 'buyerType', e.target.value)} />}
                </td>

                {/* Sale Origination Province */}
                <td style={tdStyle}>
                  <select className="select" style={ci} value={item.sellerProvince ?? state.sellerProvince ?? ''} onChange={(e) => upd(index, 'sellerProvince', e.target.value)}>
                    <option value="">—</option>
                    {allProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>

                {/* Destination of Supply (Buyer Province) */}
                <td style={tdStyle}>
                  <select className="select" style={ci} value={item.buyerProvince ?? state.buyerProvince ?? ''} onChange={(e) => upd(index, 'buyerProvince', e.target.value)}>
                    <option value="">—</option>
                    {allProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>

                {/* Document Type */}
                <td style={tdStyle}>
                  <select className="select" style={ci} value={item.invoiceType || 'Sale invoice'} onChange={(e) => upd(index, 'invoiceType', e.target.value)}>
                    {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>

                {/* Document Number */}
                <td style={tdStyle}>
                  <input className="input" style={{ ...ci, minWidth: '150px' }} value={item.invoiceNumber ?? state.invoiceNumber ?? ''} onChange={(e) => upd(index, 'invoiceNumber', e.target.value)} placeholder="INV-..." />
                </td>

                {/* Document Date */}
                <td style={tdStyle}>
                  <input className="input" type="date" style={{ ...ci, minWidth: '156px' }} value={item.invoiceDate ?? state.invoiceDate ?? ''} onChange={(e) => upd(index, 'invoiceDate', e.target.value)} />
                </td>

                {/* HS Code */}
                <td style={tdStyle}>
                  <select className="select" style={ci} value={item.hsCode || '9815.9000'} onChange={(e) => upd(index, 'hsCode', e.target.value)}>
                    {HS_CODES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>

                {/* Sale Type */}
                <td style={tdStyle}>
                  <select className="select" style={ci} value={item.saleType || 'Services'} onChange={(e) => upd(index, 'saleType', e.target.value)}>
                    {SALE_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>

                {/* Rate (Tax %) */}
                <td style={tdStyle}>
                  <select className="select" style={{ ...ci, minWidth: '70px' }} value={Number(item.taxRate ?? 0)} onChange={(e) => upd(index, 'taxRate', Number(e.target.value))}>
                    {RATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>

                {/* Quantity */}
                <td style={tdStyle}>
                  <input className="input" type="number" style={{ ...ci, minWidth: '78px' }} value={item.quantity ?? 1} onChange={(e) => upd(index, 'quantity', e.target.value)} min="0.01" step="0.01" />
                </td>

                {/* UoM */}
                <td style={tdStyle}>
                  <select className="select" style={{ ...ci, minWidth: '82px' }} value={item.uom ?? ''} onChange={(e) => upd(index, 'uom', e.target.value)}>
                    {UOM_OPTIONS.map((o) => <option key={o || 'blank'} value={o}>{o}</option>)}
                  </select>
                </td>

                {/* Unit Price */}
                <td style={tdStyle}>
                  <input className="input" type="number" style={{ ...ci, minWidth: '108px' }} value={item.unitPrice ?? 0} onChange={(e) => upd(index, 'unitPrice', e.target.value)} min="0" step="0.01" />
                </td>

                {/* Value of Sales Excl. Tax (auto) */}
                <td style={{ ...tdStyle, background: 'var(--color-bg-alt, #eef2f7)' }}>
                  <input className="input" style={{ ...ci, minWidth: '108px' }} value={(Number(item.saleValue) || 0).toFixed(2)} disabled />
                </td>

                {/* Sales Tax / FED (auto) */}
                <td style={{ ...tdStyle, background: 'var(--color-bg-alt, #eef2f7)' }}>
                  <input className="input" style={{ ...ci, minWidth: '108px' }} value={(Number(item.taxAmount) || 0).toFixed(2)} disabled />
                </td>

                {/* Fixed / Notified Value */}
                <td style={tdStyle}>
                  <input className="input" type="number" style={{ ...ci, minWidth: '108px' }} value={item.fixedNotifiedValue ?? 0} onChange={(e) => upd(index, 'fixedNotifiedValue', e.target.value)} min="0" step="0.01" />
                </td>

                {/* Extra Tax */}
                <td style={tdStyle}>
                  <input className="input" type="number" style={{ ...ci, minWidth: '90px' }} value={item.extraTax ?? 0} onChange={(e) => upd(index, 'extraTax', e.target.value)} min="0" step="0.01" />
                </td>

                {/* Further Tax */}
                <td style={tdStyle}>
                  <input className="input" type="number" style={{ ...ci, minWidth: '90px' }} value={item.furtherTax ?? 0} onChange={(e) => upd(index, 'furtherTax', e.target.value)} min="0" step="0.01" />
                </td>

                {/* Total Value of Sales / PFAD */}
                <td style={tdStyle}>
                  <input className="input" type="number" style={{ ...ci, minWidth: '108px' }} value={item.totalValueOfSales ?? 0} onChange={(e) => upd(index, 'totalValueOfSales', e.target.value)} min="0" step="0.01" />
                </td>

                {/* ST Withheld at Source */}
                <td style={tdStyle}>
                  <input className="input" type="number" style={{ ...ci, minWidth: '108px' }} value={item.stWithheldAtSource ?? 0} onChange={(e) => upd(index, 'stWithheldAtSource', e.target.value)} min="0" step="0.01" />
                </td>

                {/* SRO No. / Schedule No. */}
                <td style={tdStyle}>
                  <select className="select" style={ci} value={item.sroScheduleNo || 'ICTO TABLE II'} onChange={(e) => upd(index, 'sroScheduleNo', e.target.value)}>
                    {SRO_SCHEDULES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>

                {/* Item S. No. */}
                <td style={tdStyle}>
                  <select className="select" style={ci} value={item.sroItemSerialNo || '1(i)'} onChange={(e) => upd(index, 'sroItemSerialNo', e.target.value)}>
                    {ITEM_SERIALS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>

                {/* Invoice Reference No. */}
                <td style={tdStyle}>
                  <input className="input" style={{ ...ci, minWidth: '132px' }} value={item.invoiceReferenceNo ?? ''} onChange={(e) => upd(index, 'invoiceReferenceNo', e.target.value)} />
                </td>

                {/* Reasons */}
                <td style={tdStyle}>
                  <input className="input" style={ci} value={item.reasons ?? ''} onChange={(e) => upd(index, 'reasons', e.target.value)} />
                </td>

                {/* Reason Remarks */}
                <td style={tdStyle}>
                  <input className="input" style={ci} value={item.reasonRemarks ?? ''} onChange={(e) => upd(index, 'reasonRemarks', e.target.value)} />
                </td>

                {/* Product Description */}
                <td style={tdStyle}>
                  <input className="input" style={{ ...ci, minWidth: '174px' }} value={item.itemDescription ?? ''} onChange={(e) => upd(index, 'itemDescription', e.target.value)} />
                </td>

                {/* Petroleum Levy on */}
                <td style={tdStyle}>
                  <input className="input" style={ci} value={item.petroleumLevyOn ?? ''} onChange={(e) => upd(index, 'petroleumLevyOn', e.target.value)} placeholder="e.g. Direct Sale" />
                </td>

                {/* Buyer Address */}
                <td style={tdStyle}>
                  <input className="input" style={{ ...ci, minWidth: '174px' }} value={item.buyerAddress ?? ''} onChange={(e) => upd(index, 'buyerAddress', e.target.value)} placeholder="Buyer address" />
                </td>

                {/* Remove row */}
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button type="button" className="button button-sm button-danger" onClick={() => dispatch({ type: 'REMOVE_ITEM', index })} title="Remove row" style={{ fontSize: '1.1rem', lineHeight: 1, padding: '1px 8px' }}>−</button>
                </td>
              </tr>
            )))
            }
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <TotalsCard
        totalSaleValue={state.totalSaleValue}
        totalTaxAmount={state.totalTaxAmount}
        totalBillAmount={state.totalBillAmount}
      />

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="button button-ghost" onClick={fillMockData}>
          Fill Mock Data
        </button>
        <button type="button" className="button button-ghost" onClick={saveDraft} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button type="button" className="button button-primary" onClick={validate} disabled={validating || !submissionId}>
          {validating ? 'Validating…' : 'Validate'}
        </button>
        <button type="button" className="button button-primary" onClick={submitToFbr} disabled={submittingFbr}>
          {submittingFbr ? 'Submitting to FBR…' : 'Submit to FBR'}
        </button>
      </div>

      <FbrSuccessModal
        open={fbrModalOpen}
        onClose={() => setFbrModalOpen(false)}
        receipt={fbrReceipt}
      />
    </div>
  );
}
