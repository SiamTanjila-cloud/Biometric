import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getUserByEmail, updateUserChallenge, getUserPasskeys } from '@/lib/db';
import { getRPInfo } from '@/lib/webauthn';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user) {
      // Return a random challenge to prevent email enumeration, though real apps
      // might just fail explicitly if not supporting passwordless start or handle generic responses.
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userPasskeys = getUserPasskeys(user.id);
    const { rpID } = getRPInfo(req);

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userPasskeys.map(passkey => ({
        id: passkey.credentialID, // already a base64url string
        transports: passkey.transports as any,
      })),
      userVerification: 'preferred',
    });

    updateUserChallenge(user.id, options.challenge);

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('Error generating login options:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
