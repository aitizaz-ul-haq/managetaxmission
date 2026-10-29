import Link from 'next/link';
import { useId } from 'react';
import AdminIcon from './AdminIcon';
import styles from './AdminDashboard.module.css';

const money = (value) => Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integer = (value) => Number(value || 0).toLocaleString('en-PK');
const compact = (value) => Number(value).toLocaleString('en', { notation: 'compact', maximumFractionDigits: 1 });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUSES = [
  { key: 'draft', label: 'Draft', color: '#ffbe54' },
  { key: 'validated', label: 'Validated', color: '#19cea0' },
  { key: 'ready_for_submission', label: 'Ready', color: '#50c6ee' },
  { key: 'submitted', label: 'Submitted', color: '#3578ff' },
  { key: 'failed', label: 'Failed', color: '#ff557c' },
];

export function DashboardHero() {
  return <section className={styles.hero} aria-labelledby="admin-dashboard-title"><div className={styles.heroCopy}><p className={styles.eyebrow}>Welcome back</p><h1 id="admin-dashboard-title"><span>Taxmission</span> Dashboard</h1><p className={styles.heroSubtitle}>Overview of all companies, submissions, and tax activity</p></div><p className={styles.heroTagline}>Simplifying<br />Tax Submissions<br />for a Compliant Tomorrow<span /></p></section>;
}

export function DashboardLoading() {
  return <div className={styles.loading} role="status"><span className={styles.spinner} /><p>Loading your dashboard…</p></div>;
}

function PanelHeader({ title, subtitle, children }) {
  return <div className={styles.panelHeader}><div><h2>{title}</h2><p>{subtitle}</p></div>{children}</div>;
}

function YearSelect({ year, currentYear, onChange, disabled, label }) {
  const latestYear = Number(currentYear || year || new Date().getFullYear());
  const years = [...new Set([Number(year), ...Array.from({ length: 5 }, (_, index) => latestYear - index)])].filter(Boolean).sort((a, b) => b - a);
  return <select className={styles.periodSelect} aria-label={label} value={year} onChange={(event) => onChange(event.target.value)} disabled={disabled}>{years.map((option) => <option key={option} value={option}>{option === latestYear ? `This Year (${option})` : option}</option>)}</select>;
}

export function SubmissionStatus({ stats, range, onRangeChange }) {
  const legacy = { draft: stats.draftSubmissions, validated: stats.validatedSubmissions, ready_for_submission: stats.readySubmissions, submitted: stats.submittedSubmissions, failed: stats.failedSubmissions };
  const breakdown = stats.statusBreakdowns?.[range] || (range === 'all' ? stats.statusBreakdown || legacy : {});
  const statuses = STATUSES.map((status) => ({ ...status, count: Number(breakdown[status.key] || 0) }));
  const total = statuses.reduce((sum, status) => sum + status.count, 0);
  const circumference = 2 * Math.PI * 68;
  let offset = 0;
  const period = stats.currentPeriod;
  const subtitle = range === 'all' ? 'Distribution of all submissions' : `Tax period: ${MONTHS[(period?.month || 1) - 1]} ${period?.year || stats.year}`;
  return (
    <section className={`${styles.panel} ${styles.statusPanel}`}>
      <PanelHeader title="Submissions Status" subtitle={subtitle}><select className={styles.periodSelect} aria-label="Submission status period" value={range} onChange={(event) => onRangeChange(event.target.value)}><option value="all">All Time</option><option value="currentMonth">Current Tax Month</option></select></PanelHeader>
      <div className={styles.statusBody}>
        <svg viewBox="0 0 180 180" className={styles.donut} role="img" aria-label={`${integer(total)} submissions. ${statuses.map((status) => `${status.label}: ${integer(status.count)}`).join('. ')}`}>
          <circle cx="90" cy="90" r="68" fill="none" stroke="rgba(133,150,205,.12)" strokeWidth="26" />
          {statuses.map((status) => {
            const length = total ? status.count / total * circumference : 0;
            const circle = <circle key={status.key} cx="90" cy="90" r="68" fill="none" stroke={status.color} strokeWidth="26" strokeDasharray={`${length} ${circumference}`} strokeDashoffset={-offset} transform="rotate(-90 90 90)" />;
            offset += length;
            return circle;
          })}
          <text x="90" y="87" textAnchor="middle" className={styles.donutTotal}>{integer(total)}</text><text x="90" y="108" textAnchor="middle" className={styles.donutCaption}>{total ? 'Total' : 'No submissions'}</text>
        </svg>
        <ul className={styles.statusLegend}>{statuses.map((status) => <li key={status.key}><span className={styles.statusDot} style={{ background: status.color }} /><span title={status.key === 'ready_for_submission' ? 'Ready for submission' : undefined}>{status.label}</span><strong>{integer(status.count)}</strong><span className={styles.statusPercent}>({total ? (status.count / total * 100).toFixed(1) : '0.0'}%)</span></li>)}</ul>
      </div>
    </section>
  );
}

export function SalesChart({ stats, year, onYearChange, disabled }) {
  const id = useId().replace(/:/g, '');
  const months = Array.from({ length: 12 }, (_, index) => stats.monthlyTrend?.find((month) => Number(month.month) === index + 1) || { label: MONTHS[index], month: index + 1, saleValue: 0, taxAmount: 0, count: 0 });
  const maximum = Math.max(1, ...months.flatMap((month) => [Number(month.saleValue || 0), Number(month.taxAmount || 0)]));
  const magnitude = 10 ** Math.floor(Math.log10(maximum));
  const ceiling = Math.ceil(maximum / magnitude / 0.5) * magnitude * 0.5;
  const coordinates = (key) => months.map((month, index) => ({ x: 51 + index * 43.8, y: 161 - (Number(month[key] || 0) / ceiling) * 143 }));
  const sales = coordinates('saleValue');
  const taxes = coordinates('taxAmount');
  const points = (series) => series.map((point) => `${point.x},${point.y}`).join(' ');
  const empty = !months.some((month) => Number(month.count) || Number(month.saleValue) || Number(month.taxAmount));
  return (
    <section className={`${styles.panel} ${styles.salesPanel}`}>
      <PanelHeader title="Sales vs Tax Amount" subtitle={`Monthly comparisons (PKR) · ${stats.year}`}><YearSelect year={year} currentYear={stats.currentPeriod?.year} onChange={onYearChange} disabled={disabled} label="Sales and tax year" /></PanelHeader>
      <div className={styles.chartLegend}><span><i className={styles.saleKey} />Sale Value</span><span><i className={styles.taxKey} />Tax Amount</span></div>
      <svg viewBox="0 0 550 194" className={styles.salesChart} role="img" aria-labelledby={`${id}-title ${id}-description`}>
        <title id={`${id}-title`}>Monthly sale value and tax amount for {stats.year}</title><desc id={`${id}-description`}>{empty ? `No submissions for ${stats.year}.` : months.map((month) => `${month.label}: sale value PKR ${money(month.saleValue)}, tax amount PKR ${money(month.taxAmount)}`).join('; ')}</desc>
        <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a66aff" stopOpacity=".4" /><stop offset="100%" stopColor="#a66aff" stopOpacity=".025" /></linearGradient></defs>
        {Array.from({ length: 5 }, (_, index) => { const y = 18 + index * 35.75; return <g key={index}><line x1="51" x2="533" y1={y} y2={y} className={styles.chartGridLine} /><text x="35" y={y + 4} textAnchor="end" className={styles.chartLabel}>{compact(ceiling * (1 - index / 4))}</text></g>; })}
        {months.map((month, index) => <g key={month.month}><line x1={sales[index].x} x2={sales[index].x} y1="18" y2="161" className={styles.chartGridLine} /><text x={sales[index].x} y="184" textAnchor="middle" className={styles.chartLabel}>{month.label}</text></g>)}
        <polygon points={`51,161 ${points(sales)} 533,161`} fill={`url(#${id}-area)`} /><polyline points={points(sales)} fill="none" stroke="#b67bff" strokeWidth="2" strokeLinejoin="round" /><polyline points={points(taxes)} fill="none" stroke="#ff577e" strokeWidth="2" strokeLinejoin="round" />
        {months.map((month, index) => <g key={month.month}><circle cx={sales[index].x} cy={sales[index].y} r="3.2" fill="#b67bff"><title>{month.label}: PKR {money(month.saleValue)} sale value</title></circle><circle cx={taxes[index].x} cy={taxes[index].y} r="2.8" fill="#ff577e"><title>{month.label}: PKR {money(month.taxAmount)} tax amount</title></circle></g>)}
      </svg>
      {empty && <p className={styles.chartEmpty}>No submissions for {stats.year} yet.</p>}
    </section>
  );
}

export function QuickActions() {
  const actions = [
    { title: 'Add Company', description: 'Register a new company', href: '/admin/companies/new', icon: 'company', color: 'coral' },
    { title: 'Add User', description: 'Create a new company user', href: '/admin/users/new', icon: 'users', color: 'blue' },
    { title: 'View Submissions', description: 'Review company tax submissions', href: '/admin/submissions', icon: 'submissions', color: 'teal' },
    { title: 'Manage Reference Data', description: 'Update tax rates and reference data', href: '/admin/reference-data', icon: 'database', color: 'purple' },
  ];
  return <section className={`${styles.panel} ${styles.quickPanel}`}><PanelHeader title="Quick Actions" subtitle="Common administrative tasks" /><div className={styles.actions}>{actions.map((action) => <Link key={action.href} href={action.href} className={styles.action}><span className={`${styles.actionIcon} ${styles[action.color]}`}><AdminIcon name={action.icon} /></span><span className={styles.actionCopy}><strong>{action.title}</strong><span>{action.description}</span></span><AdminIcon name="chevron" className={styles.actionChevron} /></Link>)}</div></section>;
}

function formatPeriod(month, year) { return month >= 1 && month <= 12 && year ? `${MONTHS[month - 1]} ${year}` : '—'; }
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'Asia/Karachi' });
}

export function RecentSubmissions({ submissions }) {
  return (
    <section className={`${styles.panel} ${styles.recentPanel}`}>
      <PanelHeader title="Recent Submissions" subtitle="Latest tax submissions across all companies"><Link className={styles.viewAll} href="/admin/submissions">View All</Link></PanelHeader>
      {submissions.length ? <div className={styles.tableScroll} role="region" aria-label="Recent submissions table" tabIndex={0}><table className={styles.recentTable}><thead><tr><th scope="col">Invoice #</th><th scope="col">Company</th><th scope="col">Type</th><th scope="col">Period</th><th scope="col" className={styles.numeric}>Sale Value (PKR)</th><th scope="col" className={styles.numeric}>Tax Amount (PKR)</th><th scope="col">Status</th><th scope="col">Submitted At</th><th scope="col">Actions</th></tr></thead><tbody>{submissions.map((submission) => {
        const status = STATUSES.find((item) => item.key === submission.status);
        return <tr key={submission.id}><td><Link href={`/admin/submissions/${submission.id}`} className={styles.invoiceLink}>{submission.invoiceNumber || 'View invoice'}</Link></td><td className={styles.companyCell}><span className={styles.companyName} title={submission.companyName || undefined}>{submission.companyName || '—'}</span></td><td>{submission.submissionType === 'services_fed_st_mode' ? 'Services / FED' : submission.submissionType === 'sale_tax_fed' ? 'Sales Tax' : submission.submissionType || '—'}</td><td>{formatPeriod(submission.taxPeriodMonth, submission.taxPeriodYear)}</td><td className={styles.numeric}>{money(submission.totalSaleValue)}</td><td className={styles.numeric}>{money(submission.totalTaxAmount)}</td><td><span className={styles.statusBadge} style={{ '--status-color': status?.color || '#aab6dc' }}>{status?.label || submission.status || '—'}</span></td><td>{formatDate(submission.submittedAt)}</td><td><Link href={`/admin/submissions/${submission.id}`} className={styles.rowAction} aria-label={`View submission ${submission.invoiceNumber || submission.id}`}><span aria-hidden="true">•••</span></Link></td></tr>;
      })}</tbody></table></div> : <div className={styles.empty}><AdminIcon name="submissions" /><strong>No submissions yet</strong><p>Company submissions will appear here as they are created.</p><Link href="/admin/companies">View companies<AdminIcon name="chevron" /></Link></div>}
    </section>
  );
}

export function CompanyPerformance({ stats, year, onYearChange, disabled }) {
  const companies = stats.companyPerformance || [];
  const maximum = Math.max(1, ...companies.map((company) => Number(company.saleValue || 0)));
  return <section className={`${styles.panel} ${styles.performancePanel}`}><PanelHeader title="Company Performance" subtitle={`Sales value and tax amount by company · ${stats.year}`}><YearSelect year={year} currentYear={stats.currentPeriod?.year} onChange={onYearChange} disabled={disabled} label="Company performance year" /></PanelHeader>{companies.length ? <ul className={styles.performanceList}>{companies.map((company) => <li key={company.id}><Link href={`/admin/companies/${company.id}`} className={styles.performanceCompany}><span className={styles.companyIcon}><AdminIcon name="company" /></span><span>{company.name || 'Unnamed company'}</span></Link><div className={styles.performanceSale}><span>Sale Value (PKR)</span><strong>{money(company.saleValue)}</strong><div className={styles.performanceTrack} role="meter" aria-label={`${company.name} sale value`} aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={company.saleValue}><span style={{ width: `${Math.max(0, Number(company.saleValue || 0)) / maximum * 100}%` }} /></div></div><div className={styles.performanceTax}><span>Tax Amount (PKR)</span><strong>{money(company.taxAmount)}</strong></div></li>)}</ul> : <div className={styles.empty}><AdminIcon name="company" /><strong>No company activity for {stats.year}</strong><p>Sales and tax totals will appear with the first submission.</p></div>}</section>;
}
