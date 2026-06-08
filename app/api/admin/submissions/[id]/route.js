import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Submission from '../../../../../models/Submission';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';

export async function GET(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const submission = await Submission.findById(params.id)
    .populate('companyId', 'companyName ntn strn province address')
    .populate('createdBy', 'fullName email')
    .lean();

  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  return NextResponse.json({ submission });
}
