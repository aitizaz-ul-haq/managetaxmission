'use client';
import { useState, useEffect, useCallback } from 'react';

const backdropStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
};
const modalStyle = {
  background: '#fff', borderRadius: '8px', padding: '2rem',
  width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  position: 'relative',
};
const fieldRow = { marginBottom: '1rem' };
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-muted)' };
const valueStyle = { fontSize: '0.95rem', color: 'var(--color-text)' };

const TYPE_OPTIONS = ['Unregistered', 'Registered', 'Unrecognised', 'Retail Consumer'];

export default function InvoiceItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRegistrationNo, setNewRegistrationNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Unregistered');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [modalItem, setModalItem] = useState(null);   // item object
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit'
  const [editRegistrationNo, setEditRegistrationNo] = useState('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('Unregistered');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/company/invoice-items')
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openView(item) {
    setModalItem(item);
    setModalMode('view');
    setModalError('');
  }

  function openEdit(item) {
    setModalItem(item);
    setModalMode('edit');
    setEditRegistrationNo(item.registrationNo || '');
    setEditName(item.itemDescription || '');
    setEditType(item.type || 'Unregistered');
    setModalError('');
  }

  function closeModal() {
    setModalItem(null);
    setModalError('');
  }

  async function handleSaveEdit() {
    if (!editRegistrationNo.trim()) { setModalError('Registration No is required'); return; }
    if (!editName.trim()) { setModalError('Name is required'); return; }
    setModalSaving(true);
    setModalError('');
    try {
      const res = await fetch(`/api/company/invoice-items/${modalItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNo: editRegistrationNo.trim(),
          itemDescription: editName.trim(),
          type: editType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setItems((prev) => prev.map((it) => it._id === modalItem._id
        ? { ...it, registrationNo: editRegistrationNo.trim(), itemDescription: editName.trim(), type: editType }
        : it));
      closeModal();
      setSuccess('Item updated successfully');
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSaving(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newRegistrationNo.trim() || !newName.trim()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/company/invoice-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNo: newRegistrationNo.trim(),
          itemDescription: newName.trim(),
          type: newType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setNewRegistrationNo('');
      setNewName('');
      setNewType('Unregistered');
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
            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Standard Product, Consulting Service…"
                required
              />
            </div>
            <div className="form-group">
              <label>Registration No <span className="required">*</span></label>
              <input
                className="input"
                value={newRegistrationNo}
                onChange={(e) => setNewRegistrationNo(e.target.value)}
                placeholder="e.g. 1234567-8"
                required
              />
            </div>
            <div className="form-group">
              <label>Type <span className="required">*</span></label>
              <select
                className="select"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={saving || !newRegistrationNo.trim() || !newName.trim()}>
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
                  <th>Name</th>
                  <th>Registration No</th>
                  <th>Type</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item._id}>
                    <td>{i + 1}</td>
                    <td><strong>{item.itemDescription}</strong></td>
                    <td>{item.registrationNo}</td>
                    <td>{item.type}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="button button-sm button-secondary" onClick={() => openView(item)}>View</button>
                        <button className="button button-sm button-primary" onClick={() => openEdit(item)}>Edit</button>
                        <button className="button button-sm button-danger" onClick={() => handleDelete(item._id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalItem && (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={modalStyle}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                {modalMode === 'view' ? 'Invoice Item Details' : 'Edit Invoice Item'}
              </h3>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, color: 'var(--color-muted)' }}
                aria-label="Close"
              >×</button>
            </div>

            {modalError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{modalError}</div>}

            {/* Fields */}
            {modalMode === 'view' ? (
              <>
                <div style={fieldRow}>
                  <span style={labelStyle}>Name</span>
                  <span style={valueStyle}>{modalItem.itemDescription}</span>
                </div>
                <div style={fieldRow}>
                  <span style={labelStyle}>Registration No</span>
                  <span style={valueStyle}>{modalItem.registrationNo}</span>
                </div>
                <div style={fieldRow}>
                  <span style={labelStyle}>Type</span>
                  <span style={valueStyle}>{modalItem.type}</span>
                </div>
                <div style={fieldRow}>
                  <span style={labelStyle}>Status</span>
                  <span style={valueStyle}>{modalItem.status}</span>
                </div>
                <div style={fieldRow}>
                  <span style={labelStyle}>Date Added</span>
                  <span style={valueStyle}>{new Date(modalItem.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                <div style={fieldRow}>
                  <span style={labelStyle}>Last Updated</span>
                  <span style={valueStyle}>{new Date(modalItem.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Registration No <span className="required">*</span></label>
                  <input
                    className="input"
                    value={editRegistrationNo}
                    onChange={(e) => setEditRegistrationNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Type <span className="required">*</span></label>
                  <select
                    className="select"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Footer buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              {modalMode === 'view' ? (
                <>
                  <button className="button button-secondary" onClick={closeModal}>Close</button>
                  <button className="button button-primary" onClick={() => openEdit(modalItem)}>Edit</button>
                </>
              ) : (
                <>
                  <button className="button button-secondary" onClick={closeModal} disabled={modalSaving}>Cancel</button>
                  <button className="button button-primary" onClick={handleSaveEdit} disabled={modalSaving}>
                    {modalSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
