const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const SUBMISSION_STATUSES = [
  ['draft', 'draftSubmissions'],
  ['validated', 'validatedSubmissions'],
  ['ready_for_submission', 'readySubmissions'],
  ['submitted', 'submittedSubmissions'],
  ['failed', 'failedSubmissions'],
];

export function getCurrentTaxPeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  return {
    year: Number(parts.find((part) => part.type === 'year').value),
    month: Number(parts.find((part) => part.type === 'month').value),
  };
}

export function parseReportYear(value, defaultYear) {
  if (value === null) return defaultYear;
  if (!/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= 1900 && year <= 9999 ? year : null;
}

export function buildStatusBreakdown(summary, prefix = '') {
  return Object.fromEntries(SUBMISSION_STATUSES.map(([status, field]) => {
    const key = prefix ? `${prefix}${field[0].toUpperCase()}${field.slice(1)}` : field;
    return [status, summary[key] || 0];
  }));
}

export function buildYearlyTrend(monthlyTotals) {
  const totalsByMonth = new Map(monthlyTotals.map((entry) => [entry._id, entry]));
  return MONTH_NAMES.map((label, index) => {
    const month = index + 1;
    const totals = totalsByMonth.get(month);
    return {
      label,
      month,
      saleValue: totals?.saleValue || 0,
      taxAmount: totals?.taxAmount || 0,
      count: totals?.count || 0,
    };
  });
}

export function getCardTrendPeriods(currentPeriod) {
  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(Date.UTC(currentPeriod.year, currentPeriod.month - 6 + index, 1));
    const year = month.getUTCFullYear();
    const monthNumber = month.getUTCMonth() + 1;
    return { year, month: monthNumber, label: `${MONTH_NAMES[monthNumber - 1]} ${year}` };
  });
}

export function getKarachiMonthStart({ year, month }) {
  // Pakistan's reporting calendar uses UTC+05:00, including across UTC month boundaries.
  return new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+05:00`);
}

export function buildCardTrends({ periods, companies, users, submissions }) {
  const key = ({ year, month }) => `${year}-${String(month).padStart(2, '0')}`;
  const companyMonths = new Map(companies.map((entry) => [entry._id, entry]));
  const userMonths = new Map(users.map((entry) => [entry._id, entry]));
  const submissionMonths = new Map(submissions.map((entry) => [key(entry._id), entry]));
  const definitions = [
    ['totalCompanies', companyMonths, 'New company registrations'],
    ['activeCompanies', companyMonths, 'New registrations currently active'],
    ['totalUsers', userMonths, 'New company user accounts'],
    ['totalSubmissions', submissionMonths, 'Submissions by tax period'],
    ...SUBMISSION_STATUSES.map(([status, field]) => [
      field,
      submissionMonths,
      `${status === 'ready_for_submission' ? 'Ready' : status[0].toUpperCase() + status.slice(1)} submissions by tax period`,
    ]),
    ['totalSaleValue', submissionMonths, 'Sale value by tax period'],
    ['totalTaxAmount', submissionMonths, 'Tax amount by tax period'],
  ];
  return Object.fromEntries(definitions.map(([field, months, basis]) => {
    const values = periods.map((period) => months.get(key(period))?.[field] || 0);
    const current = values.at(-1) || 0;
    const previous = values.at(-2) || 0;
    const percentChange = previous === 0
      ? (current === 0 ? 0 : null)
      : Math.round(((current - previous) / previous) * 1000) / 10;
    return [field, { values, current, previous, percentChange, basis }];
  }));
}
