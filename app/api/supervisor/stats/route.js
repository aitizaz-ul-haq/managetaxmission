import connectDB from '../../../../lib/mongodb';
import Submission from '../../../../models/Submission';
import { getSupervisorAccess, supervisorJson } from '../../../../lib/supervisor/readAccess';
import { buildMonthlyTrend, getReportingPeriods } from '../../../../lib/supervisor/reportingPeriods';

export const dynamic = 'force-dynamic';

const countStatus = (status) => ({ $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } });

export async function GET(request) {
  try {
    const { error, companyId } = await getSupervisorAccess(request);
    if (error) return error;

    const periods = getReportingPeriods();
    const currentPeriod = periods[periods.length - 1];
    await connectDB();

    const [summaryRows, monthlyTotals, buyerTotals, recentSubmissions] = await Promise.all([
      Submission.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            currentMonthSubmissions: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$taxPeriodMonth', currentPeriod.month] },
                      { $eq: ['$taxPeriodYear', currentPeriod.year] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            draftSubmissions: countStatus('draft'),
            validatedSubmissions: countStatus('validated'),
            readySubmissions: countStatus('ready_for_submission'),
            submittedSubmissions: countStatus('submitted'),
            failedSubmissions: countStatus('failed'),
            totalSaleValue: { $sum: '$totalSaleValue' },
            totalTaxAmount: { $sum: '$totalTaxAmount' },
            totalBillAmount: { $sum: '$totalBillAmount' },
          },
        },
      ]),
      Submission.aggregate([
        {
          $match: {
            companyId,
            $or: periods.map(({ year, month }) => ({ taxPeriodYear: year, taxPeriodMonth: month })),
          },
        },
        {
          $group: {
            _id: { year: '$taxPeriodYear', month: '$taxPeriodMonth' },
            count: { $sum: 1 },
            saleValue: { $sum: '$totalSaleValue' },
            taxAmount: { $sum: '$totalTaxAmount' },
            billAmount: { $sum: '$totalBillAmount' },
          },
        },
      ]),
      Submission.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: {
              $cond: [
                { $ne: [{ $ifNull: [{ $arrayElemAt: ['$itemList.buyerBusinessName', 0] }, ''] }, ''] },
                { $arrayElemAt: ['$itemList.buyerBusinessName', 0] },
                { $cond: [{ $ne: [{ $ifNull: ['$buyerBusinessName', ''] }, ''] }, '$buyerBusinessName', 'Unknown'] },
              ],
            },
            count: { $sum: 1 },
            billAmount: { $sum: '$totalBillAmount' },
            taxAmount: { $sum: '$totalTaxAmount' },
          },
        },
        { $sort: { billAmount: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      Submission.find({ companyId })
        .sort({ updatedAt: -1, _id: -1 })
        .limit(6)
        .select('buyerBusinessName itemList.buyerBusinessName taxPeriodMonth taxPeriodYear totalBillAmount status updatedAt submittedAt')
        .lean(),
    ]);

    const summary = summaryRows[0] || {};
    const statusBreakdown = {
      draft: summary.draftSubmissions || 0,
      validated: summary.validatedSubmissions || 0,
      ready_for_submission: summary.readySubmissions || 0,
      submitted: summary.submittedSubmissions || 0,
      failed: summary.failedSubmissions || 0,
    };

    return supervisorJson({
      totalSubmissions: summary.totalSubmissions || 0,
      currentMonthSubmissions: summary.currentMonthSubmissions || 0,
      draftSubmissions: statusBreakdown.draft,
      validatedSubmissions: statusBreakdown.validated,
      readySubmissions: statusBreakdown.ready_for_submission,
      submittedSubmissions: statusBreakdown.submitted,
      failedSubmissions: statusBreakdown.failed,
      // Financial totals include submissions in every status.
      totalSaleValue: summary.totalSaleValue || 0,
      totalTaxAmount: summary.totalTaxAmount || 0,
      totalBillAmount: summary.totalBillAmount || 0,
      monthlyTrend: buildMonthlyTrend(periods, monthlyTotals),
      statusBreakdown,
      topBuyers: buyerTotals.map((buyer) => ({
        name: buyer._id || 'Unknown',
        count: buyer.count,
        billAmount: buyer.billAmount || 0,
        taxAmount: buyer.taxAmount || 0,
      })),
      recent: recentSubmissions.map((submission) => ({
        id: String(submission._id),
        buyer: submission.itemList?.[0]?.buyerBusinessName || submission.buyerBusinessName || '—',
        period: `${submission.taxPeriodMonth}/${submission.taxPeriodYear}`,
        billAmount: submission.totalBillAmount || 0,
        status: submission.status,
        date: submission.submittedAt || submission.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to load supervisor statistics:', error);
    return supervisorJson({ error: 'Unable to load dashboard statistics' }, 500);
  }
}
