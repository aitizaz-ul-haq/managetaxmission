'use client';
import Link from 'next/link';

export default function CompanyTable({ companies, onRefresh }) {
  const toggleStatus = async (company) => {
    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/admin/companies/${company._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...company, status: newStatus }),
    });
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
                {c.contactPersonName}
                <br />
                <small style={{ color: 'var(--color-muted)' }}>{c.contactPersonEmail}</small>
              </td>
              <td>
                <span className={`status-badge ${c.status}`}>{c.status}</span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/admin/companies/${c._id}`} className="button button-sm button-secondary">
                    Edit
                  </Link>
                  <button
                    className={`button button-sm ${c.status === 'active' ? 'button-ghost' : 'button-success'}`}
                    onClick={() => toggleStatus(c)}
                  >
                    {c.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
