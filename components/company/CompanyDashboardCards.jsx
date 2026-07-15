'use client';
import Link from 'next/link';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });
const fmtShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
};
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-PK') : '—');

const STATUS_META = {
  draft: { label: 'Draft', color: 'var(--color-muted)' },
  validated: { label: 'Validated', color: 'var(--color-primary)' },
  submitted: { label: 'Submitted', color: 'var(--color-success)' },
  failed: { label: 'Failed', color: 'var(--color-danger)' },
};

function StatCards({ stats }) {
  const cards = [
    { label: 'Total Submissions', value: stats.totalSubmissions, type: '' },
    { label: 'This Month', value: stats.currentMonthSubmissions, type: 'accent' },
    { label: 'Submitted', value: stats.submittedSubmissions, type: 'success' },
    { label: 'Total Sales (PKR)', value: fmt(stats.totalSaleValue), type: '' },
    { label: 'Total Tax (PKR)', value: fmt(stats.totalTaxAmount), type: 'warning' },
    { label: 'Total Bill (PKR)', value: fmt(stats.totalBillAmount), type: '' },
  ];
  return (
    <div className="stats-grid">
      {cards.map((c) => (
        <div key={c.label} className={`stat-card ${c.type}`}>
          <p className="stat-label">{c.label}</p>
          <p className="stat-value">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ trend }) {
  const max = Math.max(1, ...trend.map((t) => t.billAmount));
  return (
    <div className="card chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Monthly Bill Amount</h3>
        <span className="chart-sub">Last 6 months</span>
      </div>
      <div className="bar-chart">
        {trend.map((t) => (
          <div key={t.label} className="bar-col">
            <div className="bar-value">{t.billAmount ? fmtShort(t.billAmount) : ''}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ height: `${Math.round((t.billAmount / max) * 100)}%` }}
                title={`${t.label}: PKR ${fmt(t.billAmount)} · ${t.count} submissions`}
              />
            </div>
            <div className="bar-label">{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusChart({ breakdown }) {
  const entries = Object.entries(breakdown).map(([key, count]) => ({
    key,
    count,
    ...STATUS_META[key],
  }));
  const total = entries.reduce((s, e) => s + e.count, 0);
  return (
    <div className="card chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Status Breakdown</h3>
        <span className="chart-sub">{total} total</span>
      </div>
      <div className="status-bars">
        {entries.map((e) => {
          const pct = total ? Math.round((e.count / total) * 100) : 0;
          return (
            <div key={e.key} className="status-row">
              <span className="status-name">{e.label}</span>
              <div className="status-track">
                <div
                  className="status-fill"
                  style={{ width: `${pct}%`, background: e.color }}
                />
              </div>
              <span className="status-count">{e.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopBuyers({ buyers }) {
  return (
    <div className="card chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Top Buyers</h3>
        <span className="chart-sub">By total bill</span>
      </div>
      {buyers.length === 0 ? (
        <p className="chart-empty">No buyer data yet.</p>
      ) : (
        <table className="mini-table">
          <thead>
            <tr>
              <th>Buyer</th>
              <th className="num">Subs</th>
              <th className="num">Tax</th>
              <th className="num">Bill</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((b) => (
              <tr key={b.name}>
                <td className="truncate">{b.name}</td>
                <td className="num">{b.count}</td>
                <td className="num">{fmt(b.taxAmount)}</td>
                <td className="num">{fmt(b.billAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RecentList({ recent }) {
  return (
    <div className="card chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Recent Activity</h3>
        <Link href="/company/records" className="chart-link">View all</Link>
      </div>
      {recent.length === 0 ? (
        <p className="chart-empty">No submissions yet.</p>
      ) : (
        <table className="mini-table">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Period</th>
              <th>Status</th>
              <th className="num">Bill</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => {
              const meta = STATUS_META[r.status] || { label: r.status };
              return (
                <tr key={r.id}>
                  <td className="truncate">{r.buyer}</td>
                  <td>{r.period}</td>
                  <td>
                    <span className="dot" style={{ background: meta.color }} /> {meta.label}
                  </td>
                  <td className="num">{fmt(r.billAmount)}</td>
                  <td>{fmtDate(r.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function CompanyDashboardCards({ stats }) {
  if (!stats) return null;
  return (
    <>
      <StatCards stats={stats} />
      <div className="dashboard-charts">
        <TrendChart trend={stats.monthlyTrend || []} />
        <StatusChart breakdown={stats.statusBreakdown || {}} />
      </div>
      <div className="dashboard-charts">
        <RecentList recent={stats.recent || []} />
        <TopBuyers buyers={stats.topBuyers || []} />
      </div>
    </>
  );
}
