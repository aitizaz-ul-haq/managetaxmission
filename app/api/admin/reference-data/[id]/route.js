import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import ReferenceData from '../../../../../models/ReferenceData';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  await connectDB();
  const item = await ReferenceData.findByIdAndUpdate(params.id, body, { new: true }).lean();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const item = await ReferenceData.findByIdAndDelete(params.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
