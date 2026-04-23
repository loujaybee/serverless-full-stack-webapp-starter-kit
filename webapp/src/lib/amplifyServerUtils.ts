import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

if (process.env.AMPLIFY_APP_ORIGIN_SOURCE_PARAMETER) {
  const ssm = new SSMClient({});
  try {
    const res = await ssm.send(new GetParameterCommand({ Name: process.env.AMPLIFY_APP_ORIGIN_SOURCE_PARAMETER }));
    process.env.AMPLIFY_APP_ORIGIN = res.Parameter?.Value;
  } catch (e) {
    console.log(e);
  }
}

// In local dev mode the Cognito env vars are typically unset. Fall back to
// harmless placeholders so module evaluation doesn't blow up; the actual
// Amplify runtime is never invoked because callers short-circuit on
// isLocalDevMode().
const userPoolId = process.env.USER_POOL_ID ?? 'us-east-1_localdev';
const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? 'localdev';
const appOrigin = process.env.AMPLIFY_APP_ORIGIN ?? 'http://localhost:3010';
const cognitoDomain = process.env.COGNITO_DOMAIN ?? 'localdev.example.com';

export const { runWithAmplifyServerContext, createAuthRouteHandlers } = createServerRunner({
  config: {
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          oauth: {
            redirectSignIn: [`${appOrigin}/api/auth/sign-in-callback`],
            redirectSignOut: [`${appOrigin}/api/auth/sign-out-callback`],
            responseType: 'code',
            domain: cognitoDomain,
            scopes: ['profile', 'openid', 'aws.cognito.signin.user.admin'],
          },
        },
      },
    },
  },
  runtimeOptions: {
    cookies: {
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
});
