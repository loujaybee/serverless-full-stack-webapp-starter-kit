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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AmplifyServerUtils = ReturnType<typeof createServerRunner>;

let runWithAmplifyServerContext: AmplifyServerUtils['runWithAmplifyServerContext'];
let createAuthRouteHandlers: AmplifyServerUtils['createAuthRouteHandlers'];

if (DEV_MODE) {
  // Amplify is never initialised in dev mode — stub out both exports so
  // callers compile without changes. Cast to any to avoid importing internal
  // Amplify types (RunOperationWithContext, ContextSpec, etc.).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runWithAmplifyServerContext = (({ operation }: { operation: (ctx: any) => Promise<any> }) => operation(null)) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAuthRouteHandlers = (() => ({ GET: () => new Response('Auth not available in dev mode', { status: 503 }) })) as any;
} else {
  ({ runWithAmplifyServerContext, createAuthRouteHandlers } = createServerRunner({
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
  }));
}

export { runWithAmplifyServerContext, createAuthRouteHandlers };
