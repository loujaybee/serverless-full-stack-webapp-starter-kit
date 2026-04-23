import { NextResponse } from 'next/server';
import { tryGetAuthSession } from '@/lib/auth';
import { isLocalDevMode } from '@/lib/local-dev';

export async function GET() {
  // The realtime channel is disabled in local dev, but the route is left
  // wired up so the client doesn't 500 if it gets called.
  if (isLocalDevMode()) {
    return NextResponse.json({ accessToken: 'local-dev-access-token' });
  }

  try {
    const session = await tryGetAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      accessToken: session.accessToken,
    });
  } catch (error) {
    console.error('Error fetching Cognito token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
