'use client';

import { useEffect, useState } from 'react';
import AdminDashboardCards from '../../../components/admin/AdminDashboardCards';
import { CompanyPerformance, DashboardHero, DashboardLoading, QuickActions, RecentSubmissions, SalesChart, SubmissionStatus } from '../../../components/admin/AdminDashboardOverview';
import styles from '../../../components/admin/AdminDashboard.module.css';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [year, setYear] = useState('');
  const [statusRange, setStatusRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    async function load() {
      try {
        const response = await fetch(`/api/admin/stats${year ? `?year=${year}` : ''}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load dashboard data.');
        if (current) setStats(result);
      } catch (failure) {
        if (current) setError(failure?.message || 'Unable to load dashboard data.');
      } finally {
        if (current) setLoading(false);
      }
    }
    load();
    return () => { current = false; };
  }, [year, revision]);

  return (
    <div className={styles.dashboard}>
      <DashboardHero />
      {error && (
        <div className={styles.error} role="alert">
          <div><strong>Dashboard data could not be loaded.</strong><span>{error}</span>{stats && <span>Showing the last successfully loaded data for {stats.year}.</span>}</div>
          <button type="button" onClick={() => setRevision((value) => value + 1)}>Try again</button>
        </div>
      )}
      {loading && !stats ? <DashboardLoading /> : stats ? (
        <div className={styles.contentGrid} aria-busy={loading}>
          {loading && <p className={styles.refreshing} role="status">Updating dashboard…</p>}
          <AdminDashboardCards stats={stats} />
          <div className={styles.analyticsGrid}>
            <SubmissionStatus stats={stats} range={statusRange} onRangeChange={setStatusRange} />
            <SalesChart stats={stats} year={year || stats.year} onYearChange={setYear} disabled={loading} />
            <QuickActions />
          </div>
          <div className={styles.detailGrid}>
            <RecentSubmissions submissions={stats.recentSubmissions || []} />
            <CompanyPerformance stats={stats} year={year || stats.year} onYearChange={setYear} disabled={loading} />
          </div>
        </div>
      ) : !loading && <QuickActions />}
    </div>
  );
}
