import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getUserByEmail, updateUserChallenge, savePasskey } from '@/lib/db';
import { getRPInfo } from '@/lib/webauthn';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, response } = body;

    const user = getUserByEmail(email);
    if (!user || !user.currentChallenge) {
      return NextResponse.json({ error: 'User not found or no active challenge' }, { status: 400 });
    }

    const { rpID, expectedOrigin } = getRPInfo(req);

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin,
        expectedRPID: rpID,
      });
    } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;
      
      savePasskey({
        id: credential.id, // now a string
        userId: user.id,
        credentialID: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter ?? 0,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: response.response.transports,
      });

      // Clear user challenge
      updateUserChallenge(user.id, undefined);

      // Create session
      await createSession(user.id);

      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (error: any) {
    console.error('Error verifying registration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
