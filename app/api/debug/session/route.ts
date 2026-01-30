import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  return NextResponse.json({
    session,
    hasSession: !!session,
    hasUser: !!session?.user,
    hasId: !!session?.user?.id,
  });
}
