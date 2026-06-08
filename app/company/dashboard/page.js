'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CompanyDashboardCards from '../../../components/company/CompanyDashboardCards';

export default function CompanyDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/company/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your submission overview</p>
        </div>
        <Link href="/company/submissions/new" className="button button-primary">
          + New Submission
        </Link>
      </div>
      {loading ? (
        <div className="loading-spinner"><p>Loading…</p></div>
      ) : (
        <CompanyDashboardCards stats={stats} />
      )}
    </div>
  );
}
