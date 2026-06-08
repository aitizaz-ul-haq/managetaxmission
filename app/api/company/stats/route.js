import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Submission from '../../../../models/Submission';
import { requireCompanyUser } from '../../../../lib/auth/requireCompanyUser';

export async function GET(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  const companyId = user.companyId;
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
    totalsAgg,
  ] = await Promise.all([
    Submission.countDocuments({ companyId }),
    Submission.countDocuments({ companyId, taxPeriodMonth: currentMonth, taxPeriodYear: currentYear }),
    Submission.countDocuments({ companyId, status: 'draft' }),
    Submission.countDocuments({ companyId, status: 'validated' }),
    Submission.countDocuments({ companyId, status: 'submitted' }),
    Submission.aggregate([
      { $match: { companyId: require('mongoose').Types.ObjectId.createFromHexString(companyId) } },
      { $group: { _id: null, totalSaleValue: { $sum: '$totalSaleValue' }, totalTaxAmount: { $sum: '$totalTaxAmount' }, totalBillAmount: { $sum: '$totalBillAmount' } } },
    ]),
  ]);

  return NextResponse.json({
    totalSubmissions,
    currentMonthSubmissions,
    draftSubmissions,
    validatedSubmissions,
    submittedSubmissions,
    totalSaleValue: totalsAgg[0]?.totalSaleValue || 0,
    totalTaxAmount: totalsAgg[0]?.totalTaxAmount || 0,
    totalBillAmount: totalsAgg[0]?.totalBillAmount || 0,
  });
}
