import connectDB from '../../../../lib/mongodb';
import FbrReceipt from '../../../../models/FbrReceipt';
import { getSupervisorAccess, supervisorJson } from '../../../../lib/supervisor/readAccess';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { error, companyId } = await getSupervisorAccess(request);
    if (error) return error;

    await connectDB();
    const receipts = await FbrReceipt.find({ companyId })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return supervisorJson({ receipts });
  } catch (error) {
    console.error('Failed to load supervisor FBR invoices:', error);
    return supervisorJson({ error: 'Unable to load FBR invoices' }, 500);
  }
}
