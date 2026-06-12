'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserTable from '../../../components/admin/UserTable';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    fetch('/api/admin/companies')
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []));
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesType = typeFilter === 'all' || u.personnelType === typeFilter;
    const userCompanyId = u.companyId?._id || u.companyId || '';
    const matchesCompany = companyFilter === 'all' || userCompanyId === companyFilter;
    return matchesType && matchesCompany;
  });

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">Manage company users</p>
          </div>
          <Link href="/admin/users/new" className="button button-primary">
            + Add Users
          </Link>
        </div>
        <div className="filter-bar">
          <label className="filter-label">Filter by type</label>
          <select
            className="select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="accountant">Accountant</option>
            <option value="supervisor">Supervisor</option>
          </select>
          <label className="filter-label">Filter by company</label>
          <select
            className="select"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="all">All</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>{c.companyName}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="loading-spinner"><p>Loading…</p></div>
        ) : (
          <UserTable users={filteredUsers} onRefresh={load} />
        )}
      </div>
    </>
  );
}
