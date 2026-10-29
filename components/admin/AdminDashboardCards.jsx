import { useId } from 'react';
import AdminIcon from './AdminIcon';
import styles from './AdminDashboard.module.css';

const number = (value) => Number(value || 0).toLocaleString('en-PK');
const money = (value) => Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function MiniSeries({ values, bars = false, label }) {
  const id = useId().replace(/:/g, '');
  const series = values?.length ? values : Array(6).fill(0);
  const maximum = Math.max(1, ...series);
  const points = series.map((value, index) => ({ x: 3 + index * (94 / Math.max(1, series.length - 1)), y: 37 - (Number(value || 0) / maximum) * 32 }));
  const line = points.reduce((path, point, index) => {
    if (!index) return `M ${point.x},${point.y}`;
    const previous = points[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `${path} C ${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;
  }, '');
  return (
    <svg className={styles.miniSeries} viewBox="0 0 100 42" role="img" aria-label={label}>
      <title>{label}</title>
      <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".38" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      {bars ? series.map((value, index) => <rect key={index} x={index * (100 / series.length) + 2} y={39 - (Number(value || 0) / maximum) * 34} width={Math.max(1, 100 / series.length - 5)} height={(Number(value || 0) / maximum) * 34} rx=".8" fill="currentColor" opacity={0.5 + index / series.length * 0.5} />) : <>
        <path d={`${line} L ${points[points.length - 1].x},41 L ${points[0].x},41 Z`} fill={`url(#${id}-fill)`} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" />
      </>}
    </svg>
  );
}

function MetricChange({ trend, tone = 'positive', periodLabel }) {
  const available = trend && (trend.percentChange === null || Number.isFinite(trend.percentChange));
  const change = trend?.percentChange;
  const rising = change === null || change >= 0;
  const label = !available ? '—' : change === null ? 'New' : `${Math.abs(change).toLocaleString('en-PK', { maximumFractionDigits: 1 })}%`;
  const direction = !available ? '' : change === null ? 'New activity' : change === 0 ? 'No change' : `${Math.abs(change)}% ${rising ? 'increase' : 'decrease'}`;
  const description = available ? `${trend.basis}. ${direction} in ${periodLabel} compared with the previous month (${number(trend.previous)} to ${number(trend.current)}).` : 'Monthly comparison is unavailable.';
  const unfavorable = tone === 'negative' ? change === null || change > 0 : change < 0;
  const color = !available ? styles.changeUnavailable : tone === 'warning' ? styles.changeWarning : unfavorable ? styles.changeNegative : styles.changePositive;
  return <span className={`${styles.metricChange} ${color}`} role="img" title={description} aria-label={description}>
    {available && <AdminIcon name={rising ? 'arrowUp' : 'arrowDown'} size={12} />}<span>{label}</span>
  </span>;
}

function MoneyWave() {
  const id = useId().replace(/:/g, '');
  return <svg className={styles.moneyWave} viewBox="0 0 220 76" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={`${id}-wave`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffbe80" stopOpacity=".46" /><stop offset="100%" stopColor="#f8ab69" stopOpacity="0" /></linearGradient></defs><path d="M0 0H220V8C206-6 198 13 185 8S169 5 157 15 143 24 130 18 113 14 101 24 85 39 69 32 44 40 29 31 10 29 0 34Z" fill={`url(#${id}-wave)`} /><path d="M0 34C10 29 15 23 29 31S54 25 69 32 89 34 101 24 117 12 130 18 145 25 157 15 173 3 185 8 206-6 220 8" fill="none" stroke="#fbc18b" strokeOpacity=".3" strokeWidth="1" /></svg>;
}

export default function AdminDashboardCards({ stats }) {
  if (!stats) return null;
  const periods = stats.cardTrendPeriods || [];
  const periodLabel = periods[periods.length - 1]?.label || 'the current month';
  const chartLabel = (key, label) => {
    const trend = stats.cardTrends?.[key];
    return trend ? `${trend.basis || label}. ${periods.map((period, index) => `${period.label}: ${number(trend.values[index])}`).join('; ')}` : `${label}: monthly trend unavailable`;
  };
  const cards = [
    { key: 'totalCompanies', label: 'Total Companies', icon: 'company', color: 'blue' },
    { key: 'activeCompanies', label: 'Active Companies', icon: 'company', color: 'teal', chartColor: 'blue' },
    { key: 'totalUsers', label: 'Company Users', icon: 'users', color: 'purple' },
    { key: 'totalSubmissions', label: 'Total Submissions', icon: 'submissions', color: 'purple', chartColor: 'blue' },
    { key: 'draftSubmissions', label: 'Draft', icon: 'submissions', color: 'amber', tone: 'warning' },
    { key: 'validatedSubmissions', label: 'Validated', icon: 'verified', color: 'teal' },
    { key: 'submittedSubmissions', label: 'Submitted', icon: 'paperPlane', color: 'blue' },
    { key: 'failedSubmissions', label: 'Failed', icon: 'failedUser', color: 'coral', tone: 'negative' },
  ];
  return (
    <section className={styles.statsGrid} aria-label="All-time company and submission totals">
      {cards.map((card, index) => (
        <article key={card.key} data-metric={card.key} className={`${styles.statCard} ${styles[card.color]}`} style={{ '--metric-column': index % 4 + 1, '--metric-row': Math.floor(index / 4) + 1 }}>
          <span className={styles.statIcon}><AdminIcon name={card.icon} /></span>
          <div className={styles.statContent}><h2>{card.label}</h2><div className={styles.statReadout}><p className={styles.statValue}>{number(stats[card.key])}</p><MetricChange trend={stats.cardTrends?.[card.key]} tone={card.tone} periodLabel={periodLabel} /></div></div>
          <div className={`${styles.statSparkline} ${styles[card.chartColor || card.color]}`}><MiniSeries values={stats.cardTrends?.[card.key]?.values} label={chartLabel(card.key, card.label)} /></div>
        </article>
      ))}
      <article data-metric="totalSaleValue" className={`${styles.statCard} ${styles.moneyCard} ${styles.blue}`}>
        <MoneyWave />
        <span className={styles.statIcon}><AdminIcon name="database" /></span><h2>Total Sale Value (PKR)</h2><p className={styles.moneyValue}>{money(stats.totalSaleValue)}</p>
        <div className={styles.moneyFooter}><MetricChange trend={stats.cardTrends?.totalSaleValue} periodLabel={periodLabel} /><MiniSeries values={stats.cardTrends?.totalSaleValue?.values} bars label={chartLabel('totalSaleValue', 'Sale value')} /></div>
      </article>
      <article data-metric="totalTaxAmount" className={`${styles.statCard} ${styles.moneyCard} ${styles.amber}`}>
        <MoneyWave />
        <span className={styles.statIcon}><AdminIcon name="coins" /></span><h2>Total Tax Amount (PKR)</h2><p className={styles.moneyValue}>{money(stats.totalTaxAmount)}</p>
        <div className={styles.moneyFooter}><MetricChange trend={stats.cardTrends?.totalTaxAmount} periodLabel={periodLabel} /><MiniSeries values={stats.cardTrends?.totalTaxAmount?.values} label={chartLabel('totalTaxAmount', 'Tax amount')} /></div>
      </article>
    </section>
  );
}
