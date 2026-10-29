import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import Submission from '../../../../models/Submission';
import { requireCompanyUser } from '../../../../lib/auth/requireCompanyUser';
import { buildCompanyTrend, COMPANY_STATUSES } from '../../../../lib/company/dashboardStats';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  try {
    const companyId = user.companyId;
    const objectId = mongoose.Types.ObjectId.createFromHexString(companyId);
    const now = new Date();
    const { monthlyTrend: periods } = buildCompanyTrend([], now);
    const { month: currentMonth, year: currentYear } = periods.at(-1);

    await connectDB();

    const [
      totalSubmissions,
      currentMonthSubmissions,
      draftSubmissions,
      validatedSubmissions,
      readySubmissions,
      submittedSubmissions,
      failedSubmissions,
      totalsAgg,
      monthlyAgg,
      topBuyersAgg,
      recentSubmissions,
    ] = await Promise.all([
      Submission.countDocuments({ companyId }),
      Submission.countDocuments({ companyId, taxPeriodMonth: currentMonth, taxPeriodYear: currentYear }),
      Submission.countDocuments({ companyId, status: 'draft' }),
      Submission.countDocuments({ companyId, status: 'validated' }),
      Submission.countDocuments({ companyId, status: 'ready_for_submission' }),
      Submission.countDocuments({ companyId, status: 'submitted' }),
      Submission.countDocuments({ companyId, status: 'failed' }),
      Submission.aggregate([
        { $match: { companyId: objectId } },
        {
          $group: {
            _id: null,
            totalSaleValue: { $sum: '$totalSaleValue' },
            totalTaxAmount: { $sum: '$totalTaxAmount' },
            totalBillAmount: { $sum: '$totalBillAmount' },
          },
        },
      ]),
      Submission.aggregate([
        { $match: { companyId: objectId } },
        {
          $group: {
            _id: { year: '$taxPeriodYear', month: '$taxPeriodMonth' },
            count: { $sum: 1 },
            saleValue: { $sum: '$totalSaleValue' },
            taxAmount: { $sum: '$totalTaxAmount' },
            billAmount: { $sum: '$totalBillAmount' },
            ...Object.fromEntries(COMPANY_STATUSES.map((status) => [status, { $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } }])),
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Submission.aggregate([
        { $match: { companyId: objectId } },
        {
          $group: {
            _id: {
              $ifNull: [
                { $arrayElemAt: ['$itemList.buyerBusinessName', 0] },
                { $ifNull: ['$buyerBusinessName', 'Unknown'] },
              ],
            },
            count: { $sum: 1 },
            billAmount: { $sum: '$totalBillAmount' },
            taxAmount: { $sum: '$totalTaxAmount' },
          },
        },
        { $sort: { billAmount: -1 } },
        { $limit: 5 },
      ]),
      Submission.find({ companyId })
        .sort({ updatedAt: -1 })
        .limit(6)
        .select('buyerBusinessName itemList taxPeriodMonth taxPeriodYear totalBillAmount status updatedAt submittedAt')
        .lean(),
    ]);

    const { monthlyTrend, cardTrends } = buildCompanyTrend(monthlyAgg, now);

    const topBuyers = topBuyersAgg.map((b) => ({
      name: b._id || 'Unknown',
      count: b.count,
      billAmount: b.billAmount || 0,
      taxAmount: b.taxAmount || 0,
    }));

    const recent = recentSubmissions.map((s) => ({
      id: String(s._id),
      buyer: s.itemList?.[0]?.buyerBusinessName || s.buyerBusinessName || '—',
      period: `${s.taxPeriodMonth}/${s.taxPeriodYear}`,
      billAmount: s.totalBillAmount || 0,
      status: s.status,
      date: s.submittedAt || s.updatedAt,
    }));

    return NextResponse.json({
      totalSubmissions,
      currentMonthSubmissions,
      draftSubmissions,
      validatedSubmissions,
      readySubmissions,
      submittedSubmissions,
      failedSubmissions,
      totalSaleValue: totalsAgg[0]?.totalSaleValue || 0,
      totalTaxAmount: totalsAgg[0]?.totalTaxAmount || 0,
      totalBillAmount: totalsAgg[0]?.totalBillAmount || 0,
      monthlyTrend,
      cardTrends,
      currentMonthStatusBreakdown: monthlyTrend.at(-1).statusBreakdown,
      statusBreakdown: {
        draft: draftSubmissions,
        validated: validatedSubmissions,
        ready_for_submission: readySubmissions,
        submitted: submittedSubmissions,
        failed: failedSubmissions,
      },
      topBuyers,
      recent,
    }, { headers });
  } catch (error) {
    console.error('Company dashboard could not be loaded:', error);
    return NextResponse.json({ error: 'Unable to load your dashboard. Please try again.' }, { status: 500, headers });
  }
}
