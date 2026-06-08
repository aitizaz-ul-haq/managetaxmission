import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Company from '../../../../models/Company';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import { validateCompany } from '../../../../lib/validators/companyValidator';

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

  const company = await Company.create({
    ...body,
    createdBy: user.userId,
  });

  return NextResponse.json({ company }, { status: 201 });
}
