import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getUserById, getUserPasskeys } from '@/lib/db';

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const passkeys = getUserPasskeys(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      passkeyCount: passkeys.length,
    }
  });
}
