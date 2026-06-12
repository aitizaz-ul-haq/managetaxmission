import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import { validateUser } from '../../../../lib/validators/userValidator';
import { hashPassword } from '../../../../lib/auth/hashPassword';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await connectDB();
  const users = await User.find({ role: 'company_user' })
    .populate('companyId', 'companyName')
    .sort({ createdAt: -1 })
    .lean();

  // Remove passwords before sending
  const safeUsers = users.map(({ password, ...rest }) => rest);
  return NextResponse.json({ users: safeUsers });
}

export async function POST(request) {
  const { error, user: adminUser } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const errors = validateUser(body, true);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  await connectDB();

  const existing = await User.findOne({ email: body.email.toLowerCase().trim() });
  if (existing) {
    return NextResponse.json({ errors: ['Email already in use'] }, { status: 422 });
  }

  const isSupervisor = body.role === 'company_user' && body.personnelType === 'supervisor';
  const hashed = body.password ? await hashPassword(body.password) : '';
  const newUser = await User.create({
    fullName: body.fullName,
    email: body.email.toLowerCase().trim(),
    phone: body.phone || '',
    password: isSupervisor ? '' : hashed,
    role: body.role,
    personnelType: body.role === 'company_user' ? body.personnelType : null,
    companyId: body.companyId || null,
    status: body.status || 'active',
    createdBy: adminUser.userId,
  });

  const { password, ...safeUser } = newUser.toObject();
  return NextResponse.json({ user: safeUser }, { status: 201 });
}
