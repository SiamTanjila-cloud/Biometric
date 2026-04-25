import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser, saveOTP } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let user = getUserByEmail(email);
    if (!user) {
      user = createUser(email);
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to DB (expires in 10 minutes)
    saveOTP(email, code, 10 * 60 * 1000);

    // In a real application, you would send this via an Email Service (SendGrid, Postmark, AWS SES, etc).
    // For this demo, we will log it to the console and also return it in the response (unsafe for prod!).
    console.log(`\n\n[DEV ONLY] OTP for ${email} is: ${code}\n\n`);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully (check backend console)',
      _dev_otp: code // REMOVE THIS IN PRODUCTION
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
