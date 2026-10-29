import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Company from '../../../../models/Company';
import { verifyPassword } from '../../../../lib/auth/hashPassword';
import { signToken } from '../../../../lib/auth/jwt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Your account is inactive. Contact admin.' }, { status: 403 });
    }

    // Existing reporting contacts need an administrator to set a password first.
    if (!user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      personnelType: user.personnelType || null,
      companyId: user.role === 'company_user' && user.companyId ? user.companyId.toString() : null,
      companyName: null,
    };

    if (user.role === 'company_user') {
      const company = user.companyId
        ? await Company.findById(user.companyId).select('companyName status').lean()
        : null;
      if (!company || company.status !== 'active') {
        return NextResponse.json({ error: 'Your company account is unavailable. Contact admin.' }, { status: 403 });
      }
      tokenPayload.companyName = company.companyName;
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      user: tokenPayload,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
