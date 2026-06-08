'use client';
import { useEffect, useState } from 'react';

export default function InvoiceItemsEditor({ items, dispatch, refData }) {
  const uomOptions = refData?.uom || [];
  const saleTypeOptions = refData?.sale_type || [];
  const hsCodeOptions = refData?.hs_code || [];
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    fetch('/api/company/invoice-items')
      .then((r) => r.json())
      .then((d) => setSavedItems(d.items || []))
      .catch(() => {});
  }, []);

  const update = (index, field, value) =>
    dispatch({ type: 'UPDATE_ITEM', index, field, value });

  function applysaved(index, itemDescription) {
    if (!itemDescription) return;
    dispatch({ type: 'UPDATE_ITEM', index, field: 'itemDescription', value: itemDescription });
  }

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} className="form-card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--color-primary)' }}>Item {index + 1}</strong>
            {items.length > 1 && (
              <button
                type="button"
                className="button button-sm button-danger"
                onClick={() => dispatch({ type: 'REMOVE_ITEM', index })}
              >
                Remove
              </button>
            )}
          </div>

          <div className="form-grid">
            {savedItems.length > 0 && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  Select from saved items
                </label>
                <select
                  className="select"
                  value=""
                  onChange={(e) => applysaved(index, e.target.value)}
                >
                  <option value="">— pick a saved item to auto-fill name —</option>
                  {savedItems.map((s) => (
                    <option key={s._id} value={s.itemDescription}>{s.itemDescription}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Description <span className="required">*</span></label>
              <input
                className="input"
                value={item.itemDescription}
                onChange={(e) => update(index, 'itemDescription', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>HS Code <span className="required">*</span></label>
              {hsCodeOptions.length > 0 ? (
                <select className="select" value={item.hsCode} onChange={(e) => update(index, 'hsCode', e.target.value)}>
                  <option value="">Select HS Code</option>
                  {hsCodeOptions.map((o) => <option key={o._id} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input className="input" value={item.hsCode} onChange={(e) => update(index, 'hsCode', e.target.value)} placeholder="e.g. 9999.9999" required />
              )}
            </div>

            <div className="form-group">
              <label>Quantity <span className="required">*</span></label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => update(index, 'quantity', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Unit Price (PKR) <span className="required">*</span></label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => update(index, 'unitPrice', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Tax Rate (%) <span className="required">*</span></label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={item.taxRate}
                onChange={(e) => update(index, 'taxRate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Sale Value (auto)</label>
              <input
                className="input"
                value={(Number(item.saleValue) || 0).toFixed(2)}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tax Amount (auto)</label>
              <input
                className="input"
                value={(Number(item.taxAmount) || 0).toFixed(2)}
                disabled
              />
            </div>

            <div className="form-group">
              <label>UOM</label>
              {uomOptions.length > 0 ? (
                <select className="select" value={item.uom} onChange={(e) => update(index, 'uom', e.target.value)}>
                  <option value="">Select UOM</option>
                  {uomOptions.map((o) => <option key={o._id} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input className="input" value={item.uom} onChange={(e) => update(index, 'uom', e.target.value)} />
              )}
            </div>

            <div className="form-group">
              <label>Sale Type</label>
              {saleTypeOptions.length > 0 ? (
                <select className="select" value={item.saleType} onChange={(e) => update(index, 'saleType', e.target.value)}>
                  <option value="">Select Sale Type</option>
                  {saleTypeOptions.map((o) => <option key={o._id} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input className="input" value={item.saleType} onChange={(e) => update(index, 'saleType', e.target.value)} />
              )}
            </div>

            <div className="form-group">
              <label>SRO Schedule No</label>
              <input className="input" value={item.sroScheduleNo} onChange={(e) => update(index, 'sroScheduleNo', e.target.value)} />
            </div>

            <div className="form-group">
              <label>SRO Item Serial No</label>
              <input className="input" value={item.sroItemSerialNo} onChange={(e) => update(index, 'sroItemSerialNo', e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="button button-secondary"
        onClick={() => dispatch({ type: 'ADD_ITEM' })}
      >
        + Add Item
      </button>
    </div>
  );
}
