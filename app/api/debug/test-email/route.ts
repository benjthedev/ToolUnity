import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-EMAIL] Test triggered from IP:', request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown');
    console.log('[DEBUG-EMAIL] Attempting to call Resend API...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@toolunity.app',
        to: 'test@example.com',
        subject: 'Debug Test',
        html: '<p>This is a test email from the debug endpoint</p>',
      }),
    });

    const data = await response.json();
    
    console.log('[DEBUG-EMAIL] Resend response status:', response.status);
    console.log('[DEBUG-EMAIL] Resend response body:', JSON.stringify(data));

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      resendResponse: data,
      timestamp: new Date().toISOString(),
      clientIp: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown',
    });
  } catch (error) {
    console.error('[DEBUG-EMAIL] Caught error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
