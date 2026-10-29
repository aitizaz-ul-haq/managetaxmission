'use client';

import Link from 'next/link';
import { useId } from 'react';
import AdminIcon from '../admin/AdminIcon';
import useSupervisorData from './useSupervisorData';
import { LoadState, SubmissionStatus } from './ReportUi';
import { SUBMISSION_STATUSES, count, date, downloadCsv, money, number } from './reporting';
import styles from './Supervisor.module.css';

function exportSummary(stats) {
  const rows = [
    ['Section', 'Metric / period', 'Value', 'Scope'],
    ['Report', 'Generated at', new Date().toISOString(), 'Company supervisor summary'],
    ['Report', 'Environment scope', 'All environments', 'Production, sandbox and historical records'],
    ['Report', 'Submission scope', 'All statuses', 'Includes drafts and failed submissions'],
    ['Overview', 'All submissions', number(stats.totalSubmissions), 'All tax periods'],
    ['Overview', 'Current tax month submissions', number(stats.currentMonthSubmissions), 'Current tax period'],
    ...SUBMISSION_STATUSES.map(({ value, label }) => ['Status', label, number(stats.statusBreakdown?.[value]), 'All tax periods / environments']),
    ['Financial totals (PKR)', 'Sales', number(stats.totalSaleValue), 'All submissions / environments'],
    ['Financial totals (PKR)', 'Tax', number(stats.totalTaxAmount), 'All submissions / environments'],
    ['Financial totals (PKR)', 'Bill amount', number(stats.totalBillAmount), 'All submissions / environments'],
    ...(stats.monthlyTrend || []).flatMap((month) => [
      ['Monthly submissions', month.label, number(month.count), 'Tax period / all statuses and environments'],
      ['Monthly sales (PKR)', month.label, number(month.saleValue), 'Tax period / all statuses and environments'],
      ['Monthly tax (PKR)', month.label, number(month.taxAmount), 'Tax period / all statuses and environments'],
      ['Monthly bill (PKR)', month.label, number(month.billAmount), 'Tax period / all statuses and environments'],
    ]),
  ];
  downloadCsv('supervisor-summary', rows);
}

export default function SupervisorDashboard() {
  const { data: stats, loading, error, reload } = useSupervisorData('/api/supervisor/stats');
  const total = number(stats?.totalSubmissions);
  const submitted = number(stats?.submittedSubmissions);
  const progress = total ? Math.round(submitted / total * 100) : 0;
  const trend = stats?.monthlyTrend || [];

  return (
    <div className={`${styles.page} ${styles.dashboard}`}>
      <section className={styles.hero} aria-labelledby="supervisor-dashboard-title">
        <div className={styles.heroCopy}><p className={styles.eyebrow}>Supervisor portal</p><h1 id="supervisor-dashboard-title"><span>Submission</span> Dashboard</h1><p>Monitor your company’s tax submission progress and download reports.</p><div className={styles.heroActions}><button type="button" onClick={reload} disabled={loading}>Refresh</button><button type="button" onClick={() => exportSummary(stats)} disabled={loading || !!error || !stats}>Download summary CSV <span aria-hidden="true">↓</span></button></div></div>
        <p className={styles.heroTagline}>Track<br />Submissions.<br />Ensure Compliance.<br />Drive Accuracy.<span /></p>
      </section>
      <LoadState loading={loading} error={error} retry={reload} label="Loading company progress…" />
      {!loading && !error && stats && (
        <div className={styles.dashboardBody}>
          <div className={styles.overview}>
            <section className={styles.progressCard} aria-labelledby="submission-progress-title">
              <span className={`${styles.metricIcon} ${styles.blue}`}><AdminIcon name="paperPlane" size={29} /></span>
              <div className={styles.progressCopy}><p className={styles.eyebrow} id="submission-progress-title">Submission progress</p>
              <div className={styles.progressHeading}><strong>{progress}% submitted</strong><span>{count(submitted)} of {count(total)}</span></div>
              <progress className={styles.progress} max="100" value={progress} aria-label={`${submitted} of ${total} submissions submitted`} />
              <p className={styles.progressNote}>{count(stats.currentMonthSubmissions)} submissions for the current tax month. {total === 0 ? 'Progress will appear when your team creates submissions.' : 'Submitted progress includes production and sandbox.'}</p></div>
            </section>
            <div className={styles.attention}>
              <Link className={styles.readyCard} href="/supervisor/submissions?status=ready_for_submission"><span className={`${styles.metricIcon} ${styles.teal}`}><AdminIcon name="verified" size={29} /></span><div><strong>{count(stats.readySubmissions)}</strong><span>Ready for Submission</span></div><AdminIcon name="chevron" className={styles.attentionChevron} size={18} /></Link>
              <Link className={styles.failedCard} href="/supervisor/submissions?status=failed"><span className={`${styles.metricIcon} ${styles.coral}`}><AdminIcon name="failed" size={29} /></span><div><strong>{count(stats.failedSubmissions)}</strong><span>Failed Submissions</span></div><AdminIcon name="chevron" className={styles.attentionChevron} size={18} /></Link>
            </div>
          </div>

          <section className={styles.stats} aria-label="Company financial totals across all statuses, tax periods and environments">
            {[
              { label: 'All Submission Sales (PKR)', value: stats.totalSaleValue, key: 'saleValue', color: 'purple', icon: 'bars' },
              { label: 'All Submission Tax (PKR)', value: stats.totalTaxAmount, key: 'taxAmount', color: 'amber', icon: 'coins' },
              { label: 'All Submission Bills (PKR)', value: stats.totalBillAmount, key: 'billAmount', color: 'blue', icon: 'submissions' },
            ].map((metric) => <FinancialCard key={metric.key} metric={metric} trend={trend} />)}
          </section>

          <div className={styles.charts}>
            <section className={styles.panel} aria-labelledby="status-breakdown-title">
              <div className={styles.cardHeader}><div><h2 id="status-breakdown-title">Status Breakdown</h2><p>Distribution of all submissions</p></div><span className={styles.scopeBadge}>{count(total)} submissions</span></div>
              <div className={styles.statusRows}>
                {SUBMISSION_STATUSES.map(({ value, label }) => {
                  const amount = number(stats.statusBreakdown?.[value]);
                  return <div className={styles.statusRow} key={value}><span>{label}</span><div className={styles.track} aria-hidden="true"><div className={`${styles.fill} ${styles[value]}`} style={{ width: `${total ? amount / total * 100 : 0}%` }} /></div><strong>{count(amount)}</strong></div>;
                })}
              </div>
            </section>
            <section className={`${styles.panel} ${styles.volumePanel}`} aria-labelledby="monthly-progress-title">
              <div className={styles.cardHeader}><div><h2 id="monthly-progress-title">Monthly Submission Volume</h2><p>Submissions count by tax period · All statuses</p></div><span className={styles.scopeBadge}>Last 6 tax periods</span></div>
              {trend.length ? <MonthlyVolume trend={trend} /> : <p className={styles.empty}>No monthly submission data yet.</p>}
            </section>
          </div>

          <section className={`${styles.panel} ${styles.recentPanel}`} aria-labelledby="recent-submissions-title">
            <div className={styles.cardHeader}><div><h2 id="recent-submissions-title">Recent Submission Activity</h2><p>Latest submission activity across all environments</p></div><Link className={styles.viewAll} href="/supervisor/submissions">View all submissions <span aria-hidden="true">→</span></Link></div>
            {stats.recent?.length ? (
              <div className={`${styles.tableScroll} ${styles.recentScroll}`} role="region" aria-label="Recent submission history" tabIndex={0}>
                <table>
                  <thead><tr><th scope="col">#</th><th scope="col">Buyer</th><th scope="col">Tax Period</th><th scope="col">Status</th><th scope="col" className={styles.numeric}>Bill (PKR)</th><th scope="col">Last Activity (PKT)</th><th scope="col">Actions</th></tr></thead>
                  <tbody>{stats.recent.map((record, index) => <tr key={record.id}><td>{index + 1}</td><td className={styles.buyerCell}><span title={record.buyer}>{record.buyer}</span></td><td>{record.period}</td><td><SubmissionStatus value={record.status} /></td><td className={styles.numeric}>{money(record.billAmount)}</td><td>{date(record.date)}</td><td><Link className={styles.rowAction} href={`/supervisor/submissions?record=${encodeURIComponent(record.id)}`} aria-label={`View submission for ${record.buyer}`}><span aria-hidden="true">•••</span></Link></td></tr>)}</tbody>
                </table>
              </div>
            ) : <div className={styles.empty}><h3>No submissions yet</h3><p>Your company’s activity will appear here as submissions are created.</p></div>}
            <p className={styles.dashboardScope}>All statuses, including drafts · All environments · Financial totals cover all tax periods</p>
          </section>
        </div>
      )}
    </div>
  );
}

function FinancialCard({ metric, trend }) {
  const values = trend.map((month) => number(month[metric.key]));
  const previous = values[values.length - 2] || 0;
  const current = values[values.length - 1] || 0;
  const available = values.length >= 2;
  const change = previous ? (current - previous) / Math.abs(previous) * 100 : current ? null : 0;
  const label = !available ? '—' : change === null ? 'New' : `${Math.abs(change).toLocaleString('en-PK', { maximumFractionDigits: 1 })}%`;
  const description = !available ? 'Monthly comparison unavailable.' : `${trend[trend.length - 1].label}: PKR ${money(current)}, compared with PKR ${money(previous)} in ${trend[trend.length - 2].label}. All submission statuses and environments.`;
  return <article className={`${styles.financialCard} ${styles[metric.color]}`}>
    <span className={styles.metricIcon}><AdminIcon name={metric.icon} size={29} /></span><div className={styles.financialCopy}><h2>{metric.label}</h2><strong>{money(metric.value)}</strong><span className={`${styles.change} ${change < 0 ? styles.decrease : ''}`} title={description} role="img" aria-label={description}>{available && <AdminIcon name={change < 0 ? 'arrowDown' : 'arrowUp'} size={13} />}{label}<small>vs previous tax month</small></span></div>
    <MiniTrend values={values} label={`${metric.label}. ${trend.map((month) => `${month.label}: ${money(month[metric.key])}`).join('; ')}`} />
  </article>;
}

function MiniTrend({ values, label }) {
  const id = useId().replace(/:/g, '');
  const maximum = Math.max(1, ...values);
  const minimum = Math.min(0, ...values);
  const range = maximum - minimum || 1;
  const points = (values.length ? values : [0, 0]).map((value, index, series) => ({ x: 3 + index / Math.max(1, series.length - 1) * 94, y: 38 - (value - minimum) / range * 32 }));
  const line = points.reduce((path, point, index) => {
    if (!index) return `M${point.x} ${point.y}`;
    const previous = points[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `${path} C${middle} ${previous.y} ${middle} ${point.y} ${point.x} ${point.y}`;
  }, '');
  return <svg className={styles.miniTrend} viewBox="0 0 100 44" role="img" aria-label={label}><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".35" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><path d={`${line} L97 44 L3 44Z`} fill={`url(#${id})`} /><path d={line} fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

function MonthlyVolume({ trend }) {
  const id = useId().replace(/:/g, '');
  const maximum = Math.max(1, ...trend.map((month) => number(month.count)));
  const step = Math.max(1, Math.ceil(maximum / 5));
  const ceiling = step * 5;
  const space = 555 / trend.length;
  return <svg className={styles.volumeChart} viewBox="0 0 610 165" preserveAspectRatio="none" role="img" aria-label={`Monthly submission volume. ${trend.map((month) => `${month.label}: ${count(month.count)} submissions`).join('; ')}`}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9444ff" /><stop offset="1" stopColor="#3b278d" /></linearGradient></defs>
    {Array.from({ length: 6 }, (_, index) => { const y = 12 + index * 24.2; return <g key={index}><line x1="36" x2="591" y1={y} y2={y} className={styles.chartGridLine} /><text x="24" y={y + 3} textAnchor="end" className={styles.chartLabel}>{count(ceiling - index * step)}</text></g>; })}
    {trend.map((month, index) => {
      const x = 36 + index * space;
      const height = Math.max(0, number(month.count)) / ceiling * 121;
      return <g key={month.label}><line x1={x} x2={x} y1="12" y2="133" className={styles.chartGridLine} /><rect x={x + space * .28} y={133 - height} width={space * .44} height={height} rx="3" fill={`url(#${id})`} /><text x={x + space / 2} y={Math.max(9, 127 - height)} textAnchor="middle" className={styles.chartCount}>{count(month.count)}</text><text x={x + space / 2} y="154" textAnchor="middle" className={styles.chartLabel}>{month.label}</text></g>;
    })}
  </svg>;
}
