import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import Submission from '../../../../models/Submission';
import { requireCompanyUser } from '../../../../lib/auth/requireCompanyUser';

export async function GET(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  const companyId = user.companyId;
  const objectId = mongoose.Types.ObjectId.createFromHexString(companyId);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await connectDB();

  const [
    totalSubmissions,
    currentMonthSubmissions,
    draftSubmissions,
    validatedSubmissions,
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
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Submission.aggregate([
      { $match: { companyId: objectId } },
      {
        $group: {
          _id: { $ifNull: ['$buyerBusinessName', 'Unknown'] },
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

  // Build a continuous last-6-months trend series so gaps show as zero
  const trendMap = new Map(
    monthlyAgg.map((m) => [`${m._id.year}-${m._id.month}`, m])
  );
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const hit = trendMap.get(`${y}-${mo}`);
    monthlyTrend.push({
      label: `${monthNames[mo - 1]} ${String(y).slice(2)}`,
      count: hit?.count || 0,
      saleValue: hit?.saleValue || 0,
      taxAmount: hit?.taxAmount || 0,
      billAmount: hit?.billAmount || 0,
    });
  }

  const topBuyers = topBuyersAgg.map((b) => ({
    name: b._id || 'Unknown',
    count: b.count,
    billAmount: b.billAmount || 0,
    taxAmount: b.taxAmount || 0,
  }));

  const recent = recentSubmissions.map((s) => ({
    id: String(s._id),
    buyer: s.buyerBusinessName || s.itemList?.[0]?.buyerBusinessName || '—',
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
    submittedSubmissions,
    failedSubmissions,
    totalSaleValue: totalsAgg[0]?.totalSaleValue || 0,
    totalTaxAmount: totalsAgg[0]?.totalTaxAmount || 0,
    totalBillAmount: totalsAgg[0]?.totalBillAmount || 0,
    monthlyTrend,
    statusBreakdown: {
      draft: draftSubmissions,
      validated: validatedSubmissions,
      submitted: submittedSubmissions,
      failed: failedSubmissions,
    },
    topBuyers,
    recent,
  });
}
