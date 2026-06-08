export default function AdminDashboardCards({ stats }) {
  if (!stats) return null;

  const fmt = (n) => (n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

  const cards = [
    { label: 'Total Companies', value: stats.totalCompanies, type: '' },
    { label: 'Active Companies', value: stats.activeCompanies, type: 'success' },
    { label: 'Company Users', value: stats.totalUsers, type: '' },
    { label: 'Total Submissions', value: stats.totalSubmissions, type: '' },
    { label: 'Draft', value: stats.draftSubmissions, type: '' },
    { label: 'Validated', value: stats.validatedSubmissions, type: 'success' },
    { label: 'Submitted', value: stats.submittedSubmissions, type: 'success' },
    { label: 'Failed', value: stats.failedSubmissions, type: 'danger' },
    { label: 'Total Sale Value (PKR)', value: fmt(stats.totalSaleValue), type: '' },
    { label: 'Total Tax Amount (PKR)', value: fmt(stats.totalTaxAmount), type: 'warning' },
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
