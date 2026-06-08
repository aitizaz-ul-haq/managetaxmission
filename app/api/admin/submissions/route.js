import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Submission from '../../../../models/Submission';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const status = searchParams.get('status');

  const filter = {};
  if (companyId) filter.companyId = companyId;
  if (month) filter.taxPeriodMonth = Number(month);
  if (year) filter.taxPeriodYear = Number(year);
  if (status) filter.status = status;

  await connectDB();
  const submissions = await Submission.find(filter)
    .populate('companyId', 'companyName ntn')
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ submissions });
}
