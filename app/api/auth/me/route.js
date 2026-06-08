import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth/getCurrentUser';
import connectDB from '../../../../lib/mongodb';
import Company from '../../../../models/Company';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let companyName = user.companyName || null;
  if (!companyName && user.companyId) {
    await connectDB();
    const company = await Company.findById(user.companyId).select('companyName').lean();
    if (company) companyName = company.companyName;
  }

  return NextResponse.json({ user: { ...user, companyName } });
}
