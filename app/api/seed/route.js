import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { hashPassword } from '../../../lib/auth/hashPassword';

export async function POST(request) {
  try {
    const { secretKey } = await request.json();

    if (secretKey !== process.env.SEED_SECRET_KEY && secretKey !== 'managetaxmission-seed-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const existing = await User.findOne({ role: 'super_admin' });
    if (existing) {
      return NextResponse.json({ message: 'Super admin already exists', email: existing.email });
    }

    const hashed = await hashPassword('Admin@123456');
    const admin = await User.create({
      fullName: 'Super Admin',
      email: 'admin@managetaxmission.com',
      password: hashed,
      role: 'super_admin',
      companyId: null,
      status: 'active',
    });

    return NextResponse.json({
      message: 'Super admin created',
      email: admin.email,
      defaultPassword: 'Admin@123456',
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
