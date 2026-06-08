'use client';
import { useState, useEffect } from 'react';
import ReferenceDataForm from '../../../components/admin/ReferenceDataForm';
import ReferenceDataTable from '../../../components/admin/ReferenceDataTable';

const TYPES = ['province', 'invoice_type', 'buyer_type', 'tax_rate', 'hs_code', 'sale_type', 'document_type', 'uom', 'sro_schedule'];

export default function ReferenceDataPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = (type = selectedType) => {
    setLoading(true);
    const params = type ? `?type=${type}` : '';
    fetch(`/api/admin/reference-data${params}`)
      .then((r) => r.json())
      .then((d) => setData(d.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setLoading(true);
    const params = type ? `?type=${type}` : '';
    fetch(`/api/admin/reference-data${params}`)
      .then((r) => r.json())
      .then((d) => setData(d.data || []))
      .finally(() => setLoading(false));
  };

  const handleSave = async (formData) => {
    const isEdit = !!editItem;
    const url = isEdit ? `/api/admin/reference-data/${editItem._id}` : '/api/admin/reference-data';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    if (!res.ok) throw [json.error];
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reference item?')) return;
    await fetch(`/api/admin/reference-data/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Reference Data</h1>
            <p className="page-subtitle">Manage dropdown values used in forms</p>
          </div>
          <button className="button button-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>
            + Add Item
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button className={`button ${selectedType === '' ? 'button-primary' : 'button-ghost'}`} onClick={() => handleTypeChange('')}>All</button>
          {TYPES.map((t) => (
            <button key={t} className={`button ${selectedType === t ? 'button-primary' : 'button-ghost'}`} onClick={() => handleTypeChange(t)}>
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="form-card">
            <ReferenceDataForm
              initialData={editItem}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditItem(null); }}
            />
          </div>
        )}

        {loading ? (
          <div className="loading-spinner"><p>Loading…</p></div>
        ) : (
          <ReferenceDataTable
            data={data}
            onEdit={(item) => { setEditItem(item); setShowForm(true); }}
            onDelete={handleDelete}
          />
        )}
      </div>
    </>
  );
}
