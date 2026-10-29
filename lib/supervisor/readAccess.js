import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireSupervisor } from '../auth/requireSupervisor';

export function supervisorJson(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function getSupervisorAccess(request) {
  const { user, error } = await requireSupervisor(request);
  if (error) {
    error.headers.set('Cache-Control', 'no-store');
    return { error };
  }

  if (!user?.companyId || !mongoose.Types.ObjectId.isValid(user.companyId)) {
    return { error: supervisorJson({ error: 'Forbidden' }, 403) };
  }

  return {
    user,
    // Aggregation does not cast IDs; use this same authenticated scope everywhere.
    companyId: new mongoose.Types.ObjectId(String(user.companyId)),
  };
}
