import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Company from '../../../../models/Company';
import { requireCompanyUser } from '../../../../lib/auth/requireCompanyUser';

export async function GET(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const company = await Company.findById(user.companyId).lean();
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  return NextResponse.json({ company });
}
