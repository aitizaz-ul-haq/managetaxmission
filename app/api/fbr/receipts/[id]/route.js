import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import FbrReceipt from '../../../../../models/FbrReceipt';
import User from '../../../../../models/User';
import { requireCompanyUser } from '../../../../../lib/auth/requireCompanyUser';
import { verifyPassword } from '../../../../../lib/auth/hashPassword';

/**
 * GET /api/fbr/receipts/[id]
 * Returns a single FBR receipt for the authenticated company.
 */
export async function GET(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const receipt = await FbrReceipt.findOne({
    _id: params.id,
    companyId: user.companyId,
  }).lean();

  if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  return NextResponse.json({ receipt });
}

/**
 * DELETE /api/fbr/receipts/[id]
 * Body: { password }
 * Password-protected deletion — verifies the current user's password first.
 */
export async function DELETE(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!body.password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  await connectDB();

  const account = await User.findById(user.userId);
  if (!account) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isValid = await verifyPassword(body.password, account.password);
  if (!isValid) return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });

  const receipt = await FbrReceipt.findOneAndDelete({
    _id: params.id,
    companyId: user.companyId,
  });

  if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
