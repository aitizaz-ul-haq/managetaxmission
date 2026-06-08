import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import ReferenceData from '../../../models/ReferenceData';
import { getCurrentUser } from '../../../lib/auth/getCurrentUser';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const filter = { status: 'active' };
  if (type) filter.type = type;

  await connectDB();
  const data = await ReferenceData.find(filter).sort({ label: 1 }).lean();
  return NextResponse.json({ data });
}
