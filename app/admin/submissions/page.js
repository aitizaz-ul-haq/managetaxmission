'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({ companyId: '', month: '', year: '', status: '' });

  useEffect(() => {
    fetch('/api/admin/companies').then((r) => r.json()).then((d) => setCompanies(d.companies || []));
  }, []);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.companyId) params.set('companyId', filters.companyId);
    if (filters.month) params.set('month', filters.month);
    if (filters.year) params.set('year', filters.year);
    if (filters.status) params.set('status', filters.status);
    fetch(`/api/admin/submissions?${params}`)
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const applyFilters = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">All Submissions</h1>
            <p className="page-subtitle">View submissions from all companies</p>
          </div>
        </div>

        <div className="form-card">
          <form onSubmit={applyFilters} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label>Company</label>
              <select className="select" value={filters.companyId} onChange={(e) => setFilters((p) => ({ ...p, companyId: e.target.value }))}>
                <option value="">All Companies</option>
                {companies.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Month</label>
              <select className="select" value={filters.month} onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}>
                <option value="">All</option>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input className="input" type="number" value={filters.year} onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))} placeholder="e.g. 2026" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                <option value="">All</option>
                {['draft','validated','ready_for_submission','submitted','failed'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" className="button button-primary">Filter</button>
          </form>
        </div>

        {loading ? (
          <div className="loading-spinner"><p>Loading…</p></div>
        ) : (
          <div className="table-wrapper">
            {submissions.length === 0 ? (
              <div className="table-empty"><h3>No submissions found</h3></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Company</th>
                    <th>Period</th>
                    <th>Buyer</th>
                    <th>Total Bill</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id}>
                      <td>{s.invoiceNumber || '—'}</td>
                      <td>{s.companyId?.companyName || '—'}</td>
                      <td>{s.taxPeriodMonth}/{s.taxPeriodYear}</td>
                      <td>{s.buyerBusinessName || '—'}</td>
                      <td>PKR {(s.totalBillAmount || 0).toLocaleString()}</td>
                      <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                      <td>
                        <Link href={`/admin/submissions/${s._id}`} className="button button-sm button-secondary">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
