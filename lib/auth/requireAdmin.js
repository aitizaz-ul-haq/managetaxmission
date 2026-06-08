import { NextResponse } from 'next/server';
import { getCurrentUser } from './getCurrentUser';

export async function requireAdmin(request) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}
