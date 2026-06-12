import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Company from '../../../../models/Company';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import { validateCompany } from '../../../../lib/validators/companyValidator';
import { syncCompanyPersonnel } from '../../../../lib/personnel/syncCompanyPersonnel';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const companies = await Company.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ companies });
}

export async function POST(request) {
  const { error, user } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const errors = validateCompany(body);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  await connectDB();

  // Personnel are stored as User records, not on the company document.
  const { accountant, supervisor, ...companyData } = body;

  const company = await Company.create({
    ...companyData,
    createdBy: user.userId,
  });

  const { errors: personnelErrors } = await syncCompanyPersonnel(
    company._id,
    { accountant, supervisor },
    user.userId
  );

  if (personnelErrors.length) {
    // Roll back the company so registration can be retried with valid personnel.
    await Company.findByIdAndDelete(company._id);
    return NextResponse.json({ errors: personnelErrors }, { status: 422 });
  }

  return NextResponse.json({ company }, { status: 201 });
}
