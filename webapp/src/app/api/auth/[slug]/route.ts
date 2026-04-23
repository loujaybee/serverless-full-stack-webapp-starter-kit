import { NextResponse } from 'next/server';
import { createAuthRouteHandlers } from '@/lib/amplifyServerUtils';
import { isLocalDevMode } from '@/lib/local-dev';

const realHandlers = createAuthRouteHandlers({
  redirectOnSignInComplete: '/auth-callback',
  redirectOnSignOutComplete: '/sign-in',
});

// In local dev mode there is no Cognito hosted UI to redirect to. Send users
// straight back to the home page on any /api/auth/* request so the Sign Out
// link stays harmless even if it's clicked.
export const GET: typeof realHandlers = (request, ctx) => {
  if (isLocalDevMode()) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return realHandlers(request, ctx);
};
