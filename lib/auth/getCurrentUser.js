import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import connectDB from '../mongodb';
import User from '../../models/User';
import Company from '../../models/Company';

export async function getCurrentUser() {
  let payload;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    payload = verifyToken(token);
    if (!payload.userId) return null;
  } catch {
    return null;
  }

  // Resolve authorization from current records so changes and disabled accounts
  // take effect immediately, including for sessions issued before supervisor access.
  // Operational database errors must remain distinct from an invalid session.
  await connectDB();
  const user = await User.findById(payload.userId)
    .select('fullName email role personnelType companyId status')
    .lean();
  if (!user || user.status !== 'active') return null;
  if (!['super_admin', 'company_user'].includes(user.role)) return null;

  let companyName = null;
  if (user.role === 'company_user') {
    if (!user.companyId) return null;
    const company = await Company.findById(user.companyId).select('companyName status').lean();
    if (!company || company.status !== 'active') return null;
    companyName = company.companyName;
  }

  return {
    userId: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    personnelType: user.personnelType || null,
    companyId: user.role === 'company_user' ? user.companyId.toString() : null,
    companyName,
  };
}
