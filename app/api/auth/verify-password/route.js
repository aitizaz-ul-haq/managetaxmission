import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { getCurrentUser } from '../../../../lib/auth/getCurrentUser';
import { verifyPassword } from '../../../../lib/auth/hashPassword';

/**
 * POST /api/auth/verify-password
 * Body: { password }
 * Verifies the current user's password. Used to gate sensitive actions
 * (e.g. deletions) behind a password prompt.
 */
export async function POST(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  const user = await User.findById(currentUser.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isValid = await verifyPassword(body.password, user.password);
  if (!isValid) return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });

  return NextResponse.json({ valid: true });
}
