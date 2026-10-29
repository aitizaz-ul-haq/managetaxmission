'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CompanyDashboardCards from '../../../components/company/CompanyDashboardCards';
import styles from '../../../components/company/CompanyDashboard.module.css';

export default function CompanyDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let current = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/company/stats', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load your dashboard.');
        if (current) setStats(data);
      } catch (loadError) {
        if (current) setError(loadError.message || 'Unable to load your dashboard.');
      } finally {
        if (current) setLoading(false);
      }
    }
    load();
    return () => { current = false; };
  }, [revision]);

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero} aria-labelledby="accountant-dashboard-title">
        <div><p className={styles.eyebrow}>Welcome back</p><h1 id="accountant-dashboard-title"><span>Accountant</span> Dashboard</h1><p className={styles.heroDescription}>Monitor your company&apos;s tax submission progress and manage invoices.</p></div>
        <div className={styles.heroAside}><p>Accurate<br />Tax Submissions<br />For a Smarter Tomorrow</p><Link href="/company/submissions/new">+ New Submission</Link></div>
      </section>
      {error && <div className={styles.error} role="alert"><span>{error}</span><button type="button" onClick={() => setRevision((value) => value + 1)} disabled={loading}>Try again</button></div>}
      {loading && !stats ? <div className={styles.loading} role="status"><span />Loading your dashboard…</div> : stats ? <CompanyDashboardCards stats={stats} loading={loading} /> : null}
    </div>
  );
}
