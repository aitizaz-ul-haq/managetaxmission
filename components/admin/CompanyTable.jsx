'use client';
import { useState } from 'react';
import CompanyDetailModal from './CompanyDetailModal';

export default function CompanyTable({ companies, onRefresh }) {
  const [modal, setModal] = useState(null); // { companyId, mode }

  const openModal = (companyId, mode) => setModal({ companyId, mode });
  const closeModal = () => setModal(null);

  const toggleStatus = async (company) => {
    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/admin/companies/${company._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...company, status: newStatus }),
    });
    onRefresh();
  };

  const deleteCompany = async (company) => {
    const confirmed = window.confirm(
      `Delete "${company.companyName}"? This permanently removes the company and its personnel (accountant and supervisor). This cannot be undone.`
    );
    if (!confirmed) return;
    await fetch(`/api/admin/companies/${company._id}`, { method: 'DELETE' });
    onRefresh();
  };

  if (!companies.length) {
    return (
      <div className="table-wrapper">
        <div className="table-empty">
          <h3>No companies found</h3>
          <p>Register your first company to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Company Name</th>
            <th>NTN</th>
            <th>Province</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c._id}>
              <td>
                <strong>{c.companyName}</strong>
                <br />
                <small style={{ color: 'var(--color-muted)' }}>{c.legalName}</small>
              </td>
              <td>{c.ntn}</td>
              <td>{c.province}</td>
              <td>
                {c.email || '—'}
                <br />
                <small style={{ color: 'var(--color-muted)' }}>{c.cell || '—'}</small>
              </td>
              <td>
                <span className={`status-badge ${c.status}`}>{c.status}</span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="button button-sm button-secondary"
                    onClick={() => openModal(c._id, 'view')}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="button button-sm button-secondary"
                    onClick={() => openModal(c._id, 'edit')}
                  >
                    Edit
                  </button>
                  <button
                    className={`button button-sm ${c.status === 'active' ? 'button-ghost' : 'button-success'}`}
                    onClick={() => toggleStatus(c)}
                  >
                    {c.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="button button-sm button-danger"
                    onClick={() => deleteCompany(c)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <CompanyDetailModal
          companyId={modal.companyId}
          mode={modal.mode}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
