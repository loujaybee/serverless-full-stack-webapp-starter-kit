import { NextRequest, NextResponse } from 'next/server';
import { createAuthRouteHandlers } from '@/lib/amplifyServerUtils';
import { isLocalDevMode } from '@/lib/local-dev';

const realHandlers = createAuthRouteHandlers({
  redirectOnSignInComplete: '/auth-callback',
  redirectOnSignOutComplete: '/sign-in',
});

type Handler = typeof realHandlers;
type Ctx = Parameters<Handler>[1];

// In local dev mode there is no Cognito hosted UI to redirect to. Send users
// straight back to the home page on any /api/auth/* request so the Sign Out
// link stays harmless even if it's clicked.
export const GET: Handler = async (request: NextRequest, contextOrResponse: Ctx) => {
  if (isLocalDevMode()) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return realHandlers(request, contextOrResponse);
};
