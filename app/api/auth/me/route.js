import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth/getCurrentUser';

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401, headers });
    }

    return NextResponse.json({ user }, { headers });
  } catch (error) {
    console.error('Failed to resolve current user:', error);
    return NextResponse.json({ error: 'Unable to verify your session. Please try again.' }, { status: 503, headers });
  }
}
