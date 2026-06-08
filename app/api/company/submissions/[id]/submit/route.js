import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb';
import Submission from '../../../../../../models/Submission';
import { requireCompanyUser } from '../../../../../../lib/auth/requireCompanyUser';

export async function POST(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const submission = await Submission.findOne({ _id: params.id, companyId: user.companyId });
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  if (submission.status !== 'ready_for_submission') {
    return NextResponse.json({ error: 'Prepare payload first before submitting' }, { status: 400 });
  }

  // FBR API endpoint is not connected yet - placeholder response
  submission.fbrResponse = {
    message: 'FBR API endpoint is not connected yet',
    status: 'placeholder',
    timestamp: new Date().toISOString(),
    payload: submission.fbrPayload,
  };

  await submission.save();

  return NextResponse.json({
    message: 'FBR API endpoint is not connected yet. Payload preserved for future submission.',
    fbrResponse: submission.fbrResponse,
  });
}
