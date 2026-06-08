import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { getCurrentUser } from '../../../../lib/auth/getCurrentUser';
import { verifyPassword, hashPassword } from '../../../../lib/auth/hashPassword';

export async function POST(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both fields are required' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(currentUser.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

  user.password = await hashPassword(newPassword);
  await user.save();

  return NextResponse.json({ success: true });
}
