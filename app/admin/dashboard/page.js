'use client';
import { useState, useEffect } from 'react';
import AdminDashboardCards from '../../../components/admin/AdminDashboardCards';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Overview of all companies and submissions</p>
          </div>
        </div>
        {loading ? (
          <div className="loading-spinner"><p>Loading stats…</p></div>
        ) : (
          <AdminDashboardCards stats={stats} />
        )}
      </div>
    </>
  );
}
