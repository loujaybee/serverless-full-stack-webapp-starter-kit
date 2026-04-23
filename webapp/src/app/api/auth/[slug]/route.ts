import { createAuthRouteHandlers } from '@/lib/amplifyServerUtils';
import { NextResponse } from 'next/server';

// In dev mode Amplify is not initialised, so these routes are unavailable.
if (process.env.DEV_MODE === 'true') {
  module.exports = {
    GET: () => NextResponse.json({ error: 'Auth not available in dev mode' }, { status: 503 }),
  };
} else {
  module.exports = {
    GET: createAuthRouteHandlers({
      redirectOnSignInComplete: '/auth-callback',
      redirectOnSignOutComplete: '/sign-in',
    }),
  };
}
