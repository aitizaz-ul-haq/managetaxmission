'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CompanyTable from '../../../components/admin/CompanyTable';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/companies')
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Companies</h1>
            <p className="page-subtitle">Manage registered companies</p>
          </div>
          <Link href="/admin/companies/new" className="button button-primary">
            + Register Company
          </Link>
        </div>
        {loading ? (
          <div className="loading-spinner"><p>Loading…</p></div>
        ) : (
          <CompanyTable companies={companies} onRefresh={load} />
        )}
      </div>
    </>
  );
}
