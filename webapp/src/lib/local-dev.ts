/**
 * Local development mode lets the app run end-to-end without external AWS
 * dependencies (Cognito, Lambda, AppSync). Enable by setting LOCAL_DEV_MODE=true
 * in `.env.local`. All auth, async-job dispatch, and event publishing become
 * no-ops; a single seeded user (LOCAL_DEV_USER_ID) is used for every request.
 *
 * As a safety net the flag is force-disabled when NODE_ENV === 'production'
 * so a stray env var on a deployed Lambda can never accidentally bypass auth.
 */

export const LOCAL_DEV_USER_ID = 'local-dev-user';
export const LOCAL_DEV_USER_EMAIL = 'dev@example.com';

export function isLocalDevMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.LOCAL_DEV_MODE === 'true';
}

/**
 * Browser-safe variant. Reads from NEXT_PUBLIC_LOCAL_DEV_MODE so client
 * components can short-circuit without leaking server env vars.
 */
export function isLocalDevModeClient(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_LOCAL_DEV_MODE === 'true';
}
