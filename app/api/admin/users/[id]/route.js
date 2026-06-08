import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';
import { validateUser } from '../../../../../lib/validators/userValidator';
import { hashPassword } from '../../../../../lib/auth/hashPassword';

export async function GET(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const user = await User.findById(params.id).populate('companyId', 'companyName').lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const { password, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const errors = validateUser(body, false);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  await connectDB();

  const updateData = {
    fullName: body.fullName,
    email: body.email.toLowerCase().trim(),
    role: body.role,
    companyId: body.companyId || null,
    status: body.status,
  };

  if (body.password && body.password.trim()) {
    if (body.password.length < 8) {
      return NextResponse.json({ errors: ['Password must be at least 8 characters'] }, { status: 422 });
    }
    updateData.password = await hashPassword(body.password);
  }

  const user = await User.findByIdAndUpdate(params.id, updateData, { new: true }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const { password, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
