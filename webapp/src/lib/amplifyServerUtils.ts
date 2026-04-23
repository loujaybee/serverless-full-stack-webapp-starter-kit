import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

// In dev mode, Cognito is not configured. Skip the Amplify server runner setup
// entirely so the app starts without real AWS credentials.
const DEV_MODE = process.env.DEV_MODE === 'true';

if (!DEV_MODE && process.env.AMPLIFY_APP_ORIGIN_SOURCE_PARAMETER) {
  const ssm = new SSMClient({});
  try {
    const res = await ssm.send(new GetParameterCommand({ Name: process.env.AMPLIFY_APP_ORIGIN_SOURCE_PARAMETER }));
    process.env.AMPLIFY_APP_ORIGIN = res.Parameter?.Value;
  } catch (e) {
    console.log(e);
  }
}

// Stub used in dev mode — Amplify is never initialised, so we cast the null
// context to satisfy the generic signature without importing ContextSpec.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const devStub = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runWithAmplifyServerContext: async <T>({ operation }: { operation: (ctx: any) => Promise<T> }) =>
    operation(null),
  createAuthRouteHandlers: () => ({
    GET: () => new Response('Auth not available in dev mode', { status: 503 }),
  }),
};

export const { runWithAmplifyServerContext, createAuthRouteHandlers } = DEV_MODE
  ? devStub
  : createServerRunner({
      config: {
        Auth: {
          Cognito: {
            userPoolId: process.env.USER_POOL_ID!,
            userPoolClientId: process.env.USER_POOL_CLIENT_ID!,
            loginWith: {
              oauth: {
                redirectSignIn: [`${process.env.AMPLIFY_APP_ORIGIN!}/api/auth/sign-in-callback`],
                redirectSignOut: [`${process.env.AMPLIFY_APP_ORIGIN!}/api/auth/sign-out-callback`],
                responseType: 'code',
                domain: process.env.COGNITO_DOMAIN!,
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
