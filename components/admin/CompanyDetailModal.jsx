'use client';
import { useEffect, useState } from 'react';
import CompanyForm from './CompanyForm';

function Item({ label, value, span }) {
  return (
    <div className={`detail-item${span ? ' detail-span-2' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '—'}</span>
    </div>
  );
}

function CompanyView({ company }) {
  const accountant = company.accountant || {};
  const supervisor = company.supervisor || {};
  const branches = Array.isArray(company.branches) ? company.branches : [];

  return (
    <>
      <div className="detail-section">
        <h3 className="detail-section-title">Company Information</h3>
        <div className="detail-grid">
          <Item label="Company Name" value={company.companyName} />
          <Item label="Legal Name" value={company.legalName} />
          <Item label="NTN" value={company.ntn} />
          <Item label="STRN" value={company.strn} />
          <Item label="Province" value={company.province} />
          <Item label="Status" value={company.status} />
          <Item label="Email" value={company.email} />
          <Item label="Cell" value={company.cell} />
          <Item label="Address" value={company.address} span />
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">FBR Registration Details</h3>
        <div className="detail-grid">
          <Item label="Registration No" value={company.registrationNo} />
          <Item label="Reference No" value={company.referenceNo} />
          <Item label="Registered for Sales Tax" value={company.salesTaxRegistered ? 'Yes' : 'No'} />
          <Item label="Sales Tax Registered w.e.f." value={company.salesTaxRegisteredDate} />
          <Item label="PP/REG/INC No." value={company.ppRegIncNo} />
          <Item label="Registered On" value={company.registeredOn} />
          <Item label="Tax Office" value={company.taxOffice} />
          <Item label="Income Tax Status" value={company.incomeTaxStatus} />
          <Item label="Sales Tax Status" value={company.salesTaxStatus} />
          <Item label="Category" value={company.category} span />
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Business / Branches</h3>
        {branches.length === 0 ? (
          <p className="detail-value">—</p>
        ) : (
          branches.map((b, i) => (
            <div key={i} className="detail-grid" style={{ marginBottom: '0.75rem' }}>
              <Item label="Branch Name" value={b.name} />
              <Item label="Principal Activity" value={b.principalActivity} />
              <Item label="Branch Address" value={b.address} span />
            </div>
          ))
        )}
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Personnel</h3>
        <div className="detail-grid">
          <Item label="Accountant Name" value={accountant.fullName} />
          <Item label="Accountant Email" value={accountant.email} />
          <Item label="Accountant Phone" value={accountant.phone} />
          <Item label="Supervisor Name" value={supervisor.fullName} />
          <Item label="Supervisor Email" value={supervisor.email} />
          <Item label="Supervisor Phone" value={supervisor.phone} />
        </div>
      </div>
    </>
  );
}

export default function CompanyDetailModal({ companyId, mode, onClose, onSaved }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetch(`/api/admin/companies/${companyId}`)
      .then((r) => r.json())
      .then((d) => setCompany(d.company || null))
      .finally(() => setLoading(false));
  }, [companyId]);

  async function handleSave(data) {
    const res = await fetch(`/api/admin/companies/${companyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw json.errors || [json.error];
    onSaved();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Company' : 'Company Details'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          {loading || !company ? (
            <p>Loading…</p>
          ) : mode === 'edit' ? (
            <CompanyForm initialData={company} onSave={handleSave} onCancel={onClose} />
          ) : (
            <CompanyView company={company} />
          )}
        </div>
      </div>
    </div>
  );
}
