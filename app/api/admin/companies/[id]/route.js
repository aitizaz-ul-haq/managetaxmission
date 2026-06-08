import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Company from '../../../../../models/Company';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';
import { validateCompany } from '../../../../../lib/validators/companyValidator';

export async function GET(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const company = await Company.findById(params.id).lean();
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  return NextResponse.json({ company });
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const errors = validateCompany(body);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  await connectDB();
  const company = await Company.findByIdAndUpdate(
    params.id,
    { ...body },
    { new: true, runValidators: true }
  ).lean();

  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  return NextResponse.json({ company });
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const company = await Company.findByIdAndDelete(params.id);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
