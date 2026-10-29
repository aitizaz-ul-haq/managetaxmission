'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserTable from '../../../components/admin/UserTable';
import filterStyles from '../../../components/admin/AdminFilterBar.module.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ personnelType: 'all', companyId: 'all' });
  const [appliedFilters, setAppliedFilters] = useState({ personnelType: 'all', companyId: 'all' });

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
    const matchesType = appliedFilters.personnelType === 'all' || u.personnelType === appliedFilters.personnelType;
    const userCompanyId = u.companyId?._id || u.companyId || '';
    const matchesCompany = appliedFilters.companyId === 'all' || userCompanyId === appliedFilters.companyId;
    return matchesType && matchesCompany;
  });

  const applyFilters = (e) => {
    e.preventDefault();
    setAppliedFilters(filters);
  };

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
        <div className="form-card">
          <form className={filterStyles.row} onSubmit={applyFilters} aria-label="Filter users">
            <div className="form-group">
              <label htmlFor="user-type-filter">Filter by type</label>
              <select
                id="user-type-filter"
                className="select"
                value={filters.personnelType}
                onChange={(e) => setFilters((previous) => ({ ...previous, personnelType: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="accountant">Accountant</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="user-company-filter">Filter by company</label>
              <select
                id="user-company-filter"
                className="select"
                value={filters.companyId}
                onChange={(e) => setFilters((previous) => ({ ...previous, companyId: e.target.value }))}
              >
                <option value="all">All</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="button button-primary">Filter</button>
          </form>
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
