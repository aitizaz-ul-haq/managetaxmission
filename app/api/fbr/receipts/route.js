import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import FbrReceipt from '../../../../models/FbrReceipt';
import { requireCompanyUser } from '../../../../lib/auth/requireCompanyUser';

/**
 * GET /api/fbr/receipts
 * Returns all FBR receipts for the authenticated company (most recent first).
 */
export async function GET(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const receipts = await FbrReceipt.find({ companyId: user.companyId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ receipts });
}
