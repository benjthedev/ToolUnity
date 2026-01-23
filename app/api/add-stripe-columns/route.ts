import { NextRequest, NextResponse } from 'next/server';

// This endpoint is no longer needed - subscription tracking now uses customer email lookup
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook now uses customer email for subscription tracking'
  });
}
