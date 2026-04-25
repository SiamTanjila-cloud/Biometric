import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyOTP } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const isValid = verifyOTP(email, code);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User mapping failed' }, { status: 500 });
    }

    // Success, setup session
    await createSession(user.id);

    return NextResponse.json({ verified: true });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
