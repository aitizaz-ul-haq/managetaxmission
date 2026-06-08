export default function TotalsCard({ totalSaleValue, totalTaxAmount, totalBillAmount }) {
  const fmt = (n) => (Number(n) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

  return (
    <div className="form-card">
      <h3 className="form-section-title">Totals (Auto Calculated)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="stat-card">
          <p className="stat-label">Total Sale Value</p>
          <p className="stat-value" style={{ fontSize: '1.25rem' }}>PKR {fmt(totalSaleValue)}</p>
        </div>
        <div className="stat-card warning">
          <p className="stat-label">Total Tax Amount</p>
          <p className="stat-value" style={{ fontSize: '1.25rem' }}>PKR {fmt(totalTaxAmount)}</p>
        </div>
        <div className="stat-card success">
          <p className="stat-label">Total Bill Amount</p>
          <p className="stat-value" style={{ fontSize: '1.25rem' }}>PKR {fmt(totalBillAmount)}</p>
        </div>
      </div>
    </div>
  );
}
