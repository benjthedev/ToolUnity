import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  return NextResponse.json({
    session,
    hasSession: !!session,
    hasUser: !!session?.user,
    hasId: !!session?.user?.id,
  });
}
