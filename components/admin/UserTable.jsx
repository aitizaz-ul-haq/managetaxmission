'use client';
import Link from 'next/link';

export default function UserTable({ users, onRefresh }) {
  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/admin/users/${user._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, companyId: user.companyId?._id || user.companyId, status: newStatus }),
    });
    onRefresh();
  };

  if (!users.length) {
    return (
      <div className="table-wrapper">
        <div className="table-empty">
          <h3>No users found</h3>
          <p>Create the first company user to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Type</th>
            <th>Company</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td><strong>{u.fullName}</strong></td>
              <td>{u.email}</td>
              <td>
                {u.role === 'super_admin'
                  ? 'Admin'
                  : u.personnelType
                    ? u.personnelType.charAt(0).toUpperCase() + u.personnelType.slice(1)
                    : '—'}
              </td>
              <td>{u.companyId?.companyName || '—'}</td>
              <td><span className={`status-badge ${u.status}`}>{u.status}</span></td>
              <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/admin/users/${u._id}`} className="button button-sm button-secondary">
                    Edit
                  </Link>
                  <button
                    className={`button button-sm ${u.status === 'active' ? 'button-ghost' : 'button-success'}`}
                    onClick={() => toggleStatus(u)}
                  >
                    {u.status === 'active' ? 'Deactivate' : 'Activate'}
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
