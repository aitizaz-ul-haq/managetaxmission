import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb';
import Submission from '../../../../../../models/Submission';
import { requireCompanyUser } from '../../../../../../lib/auth/requireCompanyUser';
import { prepareFbrPayload } from '../../../../../../lib/taxmission/prepareFbrPayload';

export async function POST(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const submission = await Submission.findOne({ _id: params.id, companyId: user.companyId });
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  if (submission.status !== 'validated') {
    return NextResponse.json({ error: 'Submission must be validated before preparing payload' }, { status: 400 });
  }

  const payload = prepareFbrPayload(submission.toObject());
  submission.fbrPayload = payload;
  submission.status = 'ready_for_submission';
  await submission.save();

  return NextResponse.json({ submission: submission.toObject(), payload });
}
