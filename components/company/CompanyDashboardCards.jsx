export default function CompanyDashboardCards({ stats }) {
  if (!stats) return null;

  const fmt = (n) => (n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

  const cards = [
    { label: 'Total Submissions', value: stats.totalSubmissions, type: '' },
    { label: 'This Month', value: stats.currentMonthSubmissions, type: '' },
    { label: 'Draft', value: stats.draftSubmissions, type: '' },
    { label: 'Validated', value: stats.validatedSubmissions, type: 'success' },
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
