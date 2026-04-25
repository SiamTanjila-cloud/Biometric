import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getUserByEmail, createUser, updateUserChallenge, getUserPasskeys } from '@/lib/db';
import { getRPInfo, RP_NAME } from '@/lib/webauthn';

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

    const userPasskeys = getUserPasskeys(user.id);
    const { rpID } = getRPInfo(req);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userID: new Uint8Array(Buffer.from(user.webAuthnUserID, 'base64url')),
      userName: user.email,
      attestationType: 'none', // Can be 'none', 'direct', 'enterprise', etc.
      excludeCredentials: userPasskeys.map(passkey => ({
        id: passkey.credentialID, // already a base64url string
        type: 'public-key',
        transports: passkey.transports as any,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    updateUserChallenge(user.id, options.challenge);

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('Error generating register options:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
