import { NextResponse } from 'next/server';
import { getCurrentUser } from './getCurrentUser';

export async function requireSupervisor(request) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== 'company_user' || user.personnelType !== 'supervisor' || !user.companyId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}
