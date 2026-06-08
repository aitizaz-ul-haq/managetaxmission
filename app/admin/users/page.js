'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserTable from '../../../components/admin/UserTable';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">Manage company users</p>
          </div>
          <Link href="/admin/users/new" className="button button-primary">
            + Create User
          </Link>
        </div>
        {loading ? (
          <div className="loading-spinner"><p>Loading…</p></div>
        ) : (
          <UserTable users={users} onRefresh={load} />
        )}
      </div>
    </>
  );
}
