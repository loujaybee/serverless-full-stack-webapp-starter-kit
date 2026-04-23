import { decodeJWT } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { events } from 'aws-amplify/data';
import { useEffect } from 'react';
import { isLocalDevModeClient } from '@/lib/local-dev';

const localDev = isLocalDevModeClient();

if (!localDev) {
  Amplify.configure(
    {
      API: {
        Events: {
          endpoint: `${process.env.NEXT_PUBLIC_EVENT_HTTP_ENDPOINT}/event`,
          region: process.env.NEXT_PUBLIC_AWS_REGION,
          defaultAuthMode: 'userPool',
        },
      },
    },
    {
      Auth: {
        tokenProvider: {
          getTokens: async () => {
            const res = await fetch('/api/cognito-token');
            const { accessToken } = await res.json();
            return {
              accessToken: decodeJWT(accessToken),
            };
          },
        },
      },
    },
  );
}

type UseEventBusProps = {
  channelName: string;
  onReceived: (payload: unknown) => void;
};

export const useEventBus = ({ channelName, onReceived }: UseEventBusProps) => {
  useEffect(() => {
    if (localDev) {
      // No AppSync endpoint in local dev; the hook is a no-op so async-job
      // handlers can still be exercised without realtime push.
      return;
    }

    const connectAndSubscribe = async () => {
      const channel = await events.connect(`event-bus/${channelName}`);
      console.log(`subscribing channel ${channelName}`);

      channel.subscribe({
        next: (data) => {
          onReceived(data);
        },
        error: (err) => console.error('error', err),
      });
      return channel;
    };

    const pr = connectAndSubscribe();

    return () => {
      pr.then((channel) => {
        channel.close();
      });
    };
  }, [channelName, onReceived]);
};
