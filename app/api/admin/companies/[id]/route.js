import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Company from '../../../../../models/Company';
import User from '../../../../../models/User';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';
import { validateCompany } from '../../../../../lib/validators/companyValidator';
import { syncCompanyPersonnel } from '../../../../../lib/personnel/syncCompanyPersonnel';

export async function GET(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const company = await Company.findById(params.id).lean();
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const personnel = await User.find({
    companyId: params.id,
    personnelType: { $in: ['accountant', 'supervisor'] },
  })
    .select('fullName email phone personnelType status')
    .lean();

  const accountant = personnel.find((p) => p.personnelType === 'accountant') || null;
  const supervisor = personnel.find((p) => p.personnelType === 'supervisor') || null;

  return NextResponse.json({ company: { ...company, accountant, supervisor } });
}

export async function PUT(request, { params }) {
  const { error, user } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const errors = validateCompany(body);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  await connectDB();

  const { accountant, supervisor, ...companyData } = body;

  const company = await Company.findByIdAndUpdate(
    params.id,
    { ...companyData },
    { new: true, runValidators: true }
  ).lean();

  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const { errors: personnelErrors } = await syncCompanyPersonnel(
    params.id,
    { accountant, supervisor },
    user.userId
  );

  if (personnelErrors.length) {
    return NextResponse.json({ errors: personnelErrors }, { status: 422 });
  }

  return NextResponse.json({ company });
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const company = await Company.findByIdAndDelete(params.id);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  // Remove the company's personnel users along with the company.
  await User.deleteMany({ companyId: params.id });

  return NextResponse.json({ success: true });
}
