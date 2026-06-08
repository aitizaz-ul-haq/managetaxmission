import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import ReferenceData from '../../../../models/ReferenceData';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const filter = type ? { type } : {};

  await connectDB();
  const data = await ReferenceData.find(filter).sort({ type: 1, label: 1 }).lean();
  return NextResponse.json({ data });
}

export async function POST(request) {
  const { error, user } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  if (!body.type || !body.label || body.value === undefined) {
    return NextResponse.json({ error: 'type, label, and value are required' }, { status: 422 });
  }

  await connectDB();
  const item = await ReferenceData.create({ ...body, createdBy: user.userId });
  return NextResponse.json({ item }, { status: 201 });
}
