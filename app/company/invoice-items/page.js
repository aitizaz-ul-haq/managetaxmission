'use client';
import { useState, useEffect, useCallback } from 'react';

export default function InvoiceItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/company/invoice-items')
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/company/invoice-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemDescription: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setNewName('');
      setSuccess('Item saved successfully');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this item?')) return;
    await fetch(`/api/company/invoice-items/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Items</h1>
          <p className="page-subtitle">Saved items you can quickly pick when creating a submission</p>
        </div>
      </div>

      {/* Add new item */}
      <div className="form-card">
        <h3 className="form-section-title">Add New Item</h3>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Item Name <span className="required">*</span></label>
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Standard Product, Consulting Service…"
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={saving || !newName.trim()}>
              {saving ? 'Saving…' : '+ Add Item'}
            </button>
          </div>
        </form>
      </div>

      {/* Items list */}
      <div className="form-card">
        <h3 className="form-section-title">Saved Items</h3>
        {loading ? (
          <div className="loading-spinner"><p>Loading…</p></div>
        ) : items.length === 0 ? (
          <div className="table-empty">
            <h3>No items yet</h3>
            <p>Add your first invoice item above.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item._id}>
                    <td>{i + 1}</td>
                    <td><strong>{item.itemDescription}</strong></td>
                    <td>{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <button
                        className="button button-sm button-danger"
                        onClick={() => handleDelete(item._id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
