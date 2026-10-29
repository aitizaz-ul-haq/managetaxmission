const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getReportingPeriods(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year').value);
  const month = Number(parts.find((part) => part.type === 'month').value);

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 6 + index, 1));
    const periodYear = date.getUTCFullYear();
    const periodMonth = date.getUTCMonth() + 1;
    return {
      year: periodYear,
      month: periodMonth,
      label: `${MONTH_NAMES[periodMonth - 1]} ${String(periodYear).slice(2)}`,
    };
  });
}

export function buildMonthlyTrend(periods, monthlyTotals) {
  const totalsByPeriod = new Map(
    monthlyTotals.map((entry) => [`${entry._id.year}-${entry._id.month}`, entry])
  );

  return periods.map((period) => {
    const totals = totalsByPeriod.get(`${period.year}-${period.month}`);
    return {
      label: period.label,
      count: totals?.count || 0,
      saleValue: totals?.saleValue || 0,
      taxAmount: totals?.taxAmount || 0,
      billAmount: totals?.billAmount || 0,
    };
  });
}
