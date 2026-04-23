/**
 * Local development mode lets the app run end-to-end without external AWS
 * dependencies (Cognito, Lambda, AppSync). Enable by setting LOCAL_DEV_MODE=true
 * in `.env.local`. All auth, async-job dispatch, and event publishing become
 * no-ops; a single seeded user (LOCAL_DEV_USER_ID) is used for every request.
 */

export const LOCAL_DEV_USER_ID = 'local-dev-user';
export const LOCAL_DEV_USER_EMAIL = 'dev@example.com';

export function isLocalDevMode(): boolean {
  return process.env.LOCAL_DEV_MODE === 'true';
}

/**
 * Browser-safe variant. Reads from NEXT_PUBLIC_LOCAL_DEV_MODE so client
 * components can short-circuit without leaking server env vars.
 */
export function isLocalDevModeClient(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_DEV_MODE === 'true';
}
