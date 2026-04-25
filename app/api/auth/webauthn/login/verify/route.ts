import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getUserByEmail, getPasskeyById, updatePasskeyCounter, updateUserChallenge } from '@/lib/db';
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
    const passkeyIdStr = response.id; // Base64url ID
    const passkey = getPasskeyById(passkeyIdStr);

    if (!passkey) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 400 });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        credential: {
          id: passkey.credentialID, // string
          publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64url')),
          counter: passkey.counter,
          transports: passkey.transports as any,
        },
      });
    } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
      // Update counter to prevent replay
      updatePasskeyCounter(passkey.id, authenticationInfo.newCounter);
      // Clear challenge
      updateUserChallenge(user.id, undefined);
      // Setup session
      await createSession(user.id);

      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (error: any) {
    console.error('Error verifying login:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
