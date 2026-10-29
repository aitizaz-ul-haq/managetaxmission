import connectDB from '../../../../lib/mongodb';
import Submission from '../../../../models/Submission';
import { getSupervisorAccess, supervisorJson } from '../../../../lib/supervisor/readAccess';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { error, companyId } = await getSupervisorAccess(request);
    if (error) return error;

    await connectDB();
    const submissions = await Submission.find({ companyId })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return supervisorJson({ submissions });
  } catch (error) {
    console.error('Failed to load supervisor submissions:', error);
    return supervisorJson({ error: 'Unable to load submissions' }, 500);
  }
}
