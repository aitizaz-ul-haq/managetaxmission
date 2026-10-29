import { getReportingPeriods } from '../supervisor/reportingPeriods';

export const COMPANY_STATUSES = ['draft', 'validated', 'ready_for_submission', 'submitted', 'failed'];

export function buildCompanyTrend(monthlyTotals, now = new Date()) {
  const periods = getReportingPeriods(now);
  const byPeriod = new Map(monthlyTotals.map((entry) => [`${entry._id.year}-${entry._id.month}`, entry]));
  const monthlyTrend = periods.map((period) => {
    const entry = byPeriod.get(`${period.year}-${period.month}`) || {};
    return {
      ...period,
      count: entry.count || 0,
      saleValue: entry.saleValue || 0,
      taxAmount: entry.taxAmount || 0,
      billAmount: entry.billAmount || 0,
      statusBreakdown: Object.fromEntries(COMPANY_STATUSES.map((status) => [status, entry[status] || 0])),
    };
  });
  const metrics = {
    totalSubmissions: ['count', 'Submissions by tax month'],
    currentMonthSubmissions: ['count', 'Submissions by tax month'],
    submittedSubmissions: ['submitted', 'Currently submitted records by tax month'],
    totalSaleValue: ['saleValue', 'Sales value by tax month'],
    totalTaxAmount: ['taxAmount', 'Tax amount by tax month'],
    totalBillAmount: ['billAmount', 'Bill amount by tax month'],
  };
  const cardTrends = Object.fromEntries(Object.entries(metrics).map(([key, [field, basis]]) => {
    const values = monthlyTrend.map((entry) => field === 'submitted' ? entry.statusBreakdown.submitted : entry[field]);
    const current = values.at(-1);
    const previous = values.at(-2);
    return [key, {
      values, current, previous, basis,
      percentChange: previous ? Math.round((current - previous) / previous * 1000) / 10 : current ? null : 0,
    }];
  }));
  return { monthlyTrend, cardTrends };
}
