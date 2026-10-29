'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import AdminIcon from '../admin/AdminIcon';
import styles from './CompanyDashboard.module.css';

const number = (value) => Number(value || 0).toLocaleString('en-PK');
const money = (value) => Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const short = (value) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1e7) return `${(amount / 1e7).toLocaleString('en-PK', { maximumFractionDigits: 1 })}Cr`;
  if (Math.abs(amount) >= 1e5) return `${(amount / 1e5).toLocaleString('en-PK', { maximumFractionDigits: 1 })}L`;
  if (Math.abs(amount) >= 1e3) return `${(amount / 1e3).toLocaleString('en-PK', { maximumFractionDigits: 1 })}K`;
  return number(amount);
};
const date = (value) => value ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' }) : '—';
const STATUS_META = {
  draft: { label: 'Draft', icon: 'submissions', color: 'amber' },
  validated: { label: 'Validated', icon: 'verified', color: 'teal' },
  ready_for_submission: { label: 'Ready for submission', icon: 'check', color: 'purple' },
  submitted: { label: 'Submitted', icon: 'paperPlane', color: 'blue' },
  failed: { label: 'Failed', icon: 'failedUser', color: 'coral' },
};

function MiniSeries({ trend, label, periods, color }) {
  const id = useId().replace(/:/g, '');
  const values = trend?.values?.length ? trend.values : Array(6).fill(0);
  const maximum = Math.max(1, ...values);
  const points = values.map((value, index) => ({ x: 3 + index * 94 / Math.max(1, values.length - 1), y: 36 - Number(value || 0) / maximum * 30 }));
  const line = points.reduce((path, point, index) => {
    if (!index) return `M${point.x},${point.y}`;
    const previous = points[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `${path}C${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;
  }, '');
  const description = trend ? `${trend.basis}. ${values.map((value, index) => `${periods[index]?.label || `Month ${index + 1}`}: ${number(value)}`).join('; ')}` : `${label}: monthly trend unavailable`;
  return <svg className={`${styles.sparkline} ${color ? styles[color] : ''}`} viewBox="0 0 100 42" role="img" aria-label={description}><title>{description}</title><defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".3" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><path d={`${line}L97,41H3Z`} fill={`url(#${id}-fill)`} /><path d={line} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
}

function Change({ trend, period }) {
  const available = trend && (trend.percentChange === null || Number.isFinite(trend.percentChange));
  const change = trend?.percentChange;
  const negative = change < 0;
  const label = !available ? '—' : change === null ? 'New' : `${number(Math.abs(change))}%`;
  const description = available ? `${trend.basis}. ${period || 'Current month'} versus the previous tax month: ${number(trend.previous)} to ${number(trend.current)}${change === null ? '; new activity after a zero month' : `; ${change}% change`}.` : 'Monthly comparison is unavailable.';
  return <span className={`${styles.change} ${negative ? styles.negative : available ? styles.positive : styles.unavailable}`} role="img" aria-label={description} title={description}>{available && <AdminIcon name={negative ? 'arrowDown' : 'arrowUp'} size={12} />}{label}</span>;
}

function StatCards({ stats }) {
  const cards = [
    { key: 'totalSubmissions', label: 'Total Submissions', icon: 'company', color: 'blue' },
    { key: 'currentMonthSubmissions', label: 'This Month', icon: 'calendar', color: 'coral' },
    { key: 'submittedSubmissions', label: 'Submitted', icon: 'paperPlane', color: 'blue', chartColor: 'teal' },
    { key: 'totalSaleValue', label: 'Total Sales (PKR)', icon: 'database', color: 'amber', money: true },
    { key: 'totalTaxAmount', label: 'Total Tax (PKR)', icon: 'submissions', color: 'purple', money: true },
    { key: 'totalBillAmount', label: 'Total Bill (PKR)', icon: 'receipt', color: 'coral', money: true },
  ];
  const periods = stats.monthlyTrend || [];
  return <section className={styles.statsGrid} aria-label="Company submission and financial totals, all statuses and environments included">{cards.map((card) => <article className={`${styles.statCard} ${styles[card.color]} ${card.money ? styles.financial : ''}`} data-metric={card.key} key={card.key}>
    <span className={styles.statIcon}><AdminIcon name={card.icon} size={25} /></span><div className={styles.statText}><h2>{card.label}</h2><p className={styles.statValue} title={card.money ? `PKR ${money(stats[card.key])}` : number(stats[card.key])}>{card.money ? money(stats[card.key]) : number(stats[card.key])}</p><Change trend={stats.cardTrends?.[card.key]} period={periods.at(-1)?.label} /></div><MiniSeries trend={stats.cardTrends?.[card.key]} periods={periods} color={card.chartColor} label={card.label} />
  </article>)}</section>;
}

function PanelHeader({ title, description, children }) {
  return <div className={styles.panelHeader}><div><h2>{title}</h2><p>{description}</p></div>{children}</div>;
}

function TrendChart({ trend }) {
  const [range, setRange] = useState(6);
  const id = useId().replace(/:/g, '');
  const shown = trend.slice(-range);
  const max = Math.max(1, ...shown.map((entry) => entry.billAmount));
  const niceMax = max <= 1 ? 1 : Math.ceil(max / 5 / 10 ** Math.floor(Math.log10(max / 5))) * 5 * 10 ** Math.floor(Math.log10(max / 5));
  const left = 54;
  const width = 646;
  const step = width / Math.max(1, shown.length);
  return <section className={`${styles.panel} ${styles.billPanel}`}><PanelHeader title="Monthly Bill Amount" description={`Total submission bill amount (PKR) across the last ${range} months`}><select className={styles.select} aria-label="Monthly bill reporting period" value={range} onChange={(event) => setRange(Number(event.target.value))}><option value={6}>Last 6 months</option><option value={3}>Last 3 months</option></select></PanelHeader>
    <svg className={styles.billChart} viewBox="0 0 720 208" role="img" aria-label={`Monthly bill amounts. ${shown.map((entry) => `${entry.label}: PKR ${money(entry.billAmount)}, ${number(entry.count)} submissions`).join('; ')}`}>
      <defs><linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#aa70ff" /><stop offset="100%" stopColor="#6332c2" /></linearGradient></defs>
      {Array.from({ length: 6 }, (_, index) => { const y = 18 + index * 32; return <g key={index}><line x1={left} y1={y} x2="700" y2={y} className={styles.chartGrid} /><text x="42" y={y + 4} textAnchor="end" className={styles.chartLabel}>{short(niceMax * (5 - index) / 5)}</text></g>; })}
      {shown.map((entry, index) => { const height = Math.max(0, Number(entry.billAmount || 0)) / niceMax * 154; const x = left + step * (index + .5); return <g key={entry.label}><line x1={left + step * index} y1="18" x2={left + step * index} y2="178" className={styles.chartGrid} /><rect x={x - Math.min(28, step * .27)} y={178 - height} width={Math.min(56, step * .54)} height={height} rx="5" fill={`url(#${id}-bar)`}><title>{entry.label}: PKR {money(entry.billAmount)} · {number(entry.count)} submissions</title></rect><text x={x} y={Math.max(12, 170 - height)} textAnchor="middle" className={styles.barValue}>{short(entry.billAmount)}</text><text x={x} y="201" textAnchor="middle" className={styles.chartLabel}>{entry.label}</text></g>; })}
      <line x1={left} y1="178" x2="700" y2="178" className={styles.chartAxis} />
    </svg>
  </section>;
}

function StatusChart({ breakdown, currentMonth }) {
  const [range, setRange] = useState('all');
  const selected = range === 'month' ? currentMonth : breakdown;
  const total = Object.keys(STATUS_META).reduce((sum, key) => sum + Number(selected[key] || 0), 0);
  return <section className={`${styles.panel} ${styles.statusPanel}`}><PanelHeader title="Status Breakdown" description="Distribution of all submissions by status"><select className={styles.select} aria-label="Status breakdown reporting period" value={range} onChange={(event) => setRange(event.target.value)}><option value="all">{number(Object.values(breakdown).reduce((sum, value) => sum + Number(value || 0), 0))} total</option><option value="month">This tax month</option></select></PanelHeader><div className={styles.statusList}>{Object.entries(STATUS_META).map(([key, meta]) => { const count = Number(selected[key] || 0); const percent = total ? count / total * 100 : 0; return <div key={key} className={`${styles.statusRow} ${styles[meta.color]}`}><span className={styles.statusIcon}><AdminIcon name={meta.icon} size={20} /></span><span className={styles.statusName}>{meta.label}</span><div className={styles.statusTrack} role="img" aria-label={`${meta.label}: ${number(count)}, ${percent.toFixed(1)}%`}><span style={{ width: `${percent}%` }} /></div><strong>{number(count)}</strong><span className={styles.statusPercent}>({percent.toFixed(1)}%)</span></div>; })}</div></section>;
}

function RecentList({ recent }) {
  return <section className={`${styles.panel} ${styles.recentPanel}`}><PanelHeader title="Recent Activity" description="Latest submission activity across all buyers"><Link className={styles.viewAll} href="/company/records">View all <span aria-hidden="true">→</span></Link></PanelHeader>{!recent.length ? <p className={styles.empty}>No submissions yet. <Link href="/company/submissions/new">Create your first submission</Link>.</p> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Recent submissions"><table className={styles.table}><thead><tr><th>#</th><th>Buyer</th><th>Period</th><th>Status</th><th className={styles.numeric}>Bill (PKR)</th><th>Date</th><th><span className={styles.srOnly}>Open</span></th></tr></thead><tbody>{recent.map((entry, index) => { const meta = STATUS_META[entry.status] || { label: entry.status, color: 'blue' }; return <tr key={entry.id}><td>{index + 1}</td><td className={styles.buyerCell}><span title={entry.buyer}>{entry.buyer}</span></td><td>{entry.period}</td><td><span className={`${styles.badge} ${styles[entry.status === 'submitted' ? 'teal' : meta.color]}`}>{meta.label}</span></td><td className={styles.numeric}>{money(entry.billAmount)}</td><td>{date(entry.date)}</td><td><Link className={styles.rowAction} href={`/company/submissions/${encodeURIComponent(entry.id)}`} aria-label={`View submission for ${entry.buyer}`}>•••</Link></td></tr>; })}</tbody></table></div>}</section>;
}

function TopBuyers({ buyers }) {
  const [sort, setSort] = useState('billAmount');
  const shown = [...buyers].sort((a, b) => Number(b[sort] || 0) - Number(a[sort] || 0));
  return <section className={`${styles.panel} ${styles.buyersPanel}`}><PanelHeader title="Top Buyers" description="Five largest buyers by total bill"><select className={styles.select} aria-label="Reorder displayed buyers" title="Reorder the five largest buyers by total bill" value={sort} onChange={(event) => setSort(event.target.value)}><option value="billAmount">By total bill</option><option value="taxAmount">By total tax</option><option value="count">By submissions</option></select></PanelHeader>{!shown.length ? <p className={styles.empty}>No buyer data yet.</p> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Top buyers"><table className={styles.table}><thead><tr><th>#</th><th>Buyer</th><th className={styles.numeric}>Subs</th><th className={styles.numeric}>Tax (PKR)</th><th className={styles.numeric}>Bill (PKR)</th></tr></thead><tbody>{shown.map((entry, index) => <tr key={entry.name}><td>{index + 1}</td><td className={styles.buyerCell}><span title={entry.name}>{entry.name}</span></td><td className={styles.numeric}>{number(entry.count)}</td><td className={styles.numeric}>{money(entry.taxAmount)}</td><td className={styles.numeric}>{money(entry.billAmount)}</td></tr>)}</tbody></table></div>}</section>;
}

export default function CompanyDashboardCards({ stats, loading = false }) {
  return <div className={styles.overview} aria-busy={loading}>{loading && <span className={styles.updating} role="status">Updating dashboard…</span>}<StatCards stats={stats} /><div className={styles.chartsGrid}><TrendChart trend={stats.monthlyTrend || []} /><StatusChart breakdown={stats.statusBreakdown || {}} currentMonth={stats.currentMonthStatusBreakdown || {}} /></div><div className={styles.detailsGrid}><RecentList recent={stats.recent || []} /><TopBuyers buyers={stats.topBuyers || []} /></div></div>;
}
