import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Company from '../../../../models/Company';
import User from '../../../../models/User';
import Submission from '../../../../models/Submission';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();

  const [
    totalCompanies,
    activeCompanies,
    totalUsers,
    totalSubmissions,
    draftSubmissions,
    validatedSubmissions,
    submittedSubmissions,
    failedSubmissions,
    totalsAgg,
  ] = await Promise.all([
    Company.countDocuments(),
    Company.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'company_user' }),
    Submission.countDocuments(),
    Submission.countDocuments({ status: 'draft' }),
    Submission.countDocuments({ status: 'validated' }),
    Submission.countDocuments({ status: 'submitted' }),
    Submission.countDocuments({ status: 'failed' }),
    Submission.aggregate([
      {
        $group: {
          _id: null,
          totalSaleValue: { $sum: '$totalSaleValue' },
          totalTaxAmount: { $sum: '$totalTaxAmount' },
        },
      },
    ]),
  ]);

  return NextResponse.json({
    totalCompanies,
    activeCompanies,
    totalUsers,
    totalSubmissions,
    draftSubmissions,
    validatedSubmissions,
    submittedSubmissions,
    failedSubmissions,
    totalSaleValue: totalsAgg[0]?.totalSaleValue || 0,
    totalTaxAmount: totalsAgg[0]?.totalTaxAmount || 0,
  });
}
