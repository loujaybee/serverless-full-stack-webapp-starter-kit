import { JobPayloadProps } from '@/jobs/async-job-runner';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { isLocalDevMode } from '@/lib/local-dev';

const lambda = new LambdaClient();

const handlerArn = process.env.ASYNC_JOB_HANDLER_ARN!;

export async function runJob(props: JobPayloadProps) {
  if (isLocalDevMode()) {
    // No Lambda is provisioned in local dev; log the dispatch so the
    // developer can see the job that would have run.
    console.log('[local-dev] runJob skipped:', JSON.stringify(props));
    return;
  }

  await lambda.send(
    new InvokeCommand({
      FunctionName: handlerArn,
      InvocationType: 'Event',
      Payload: JSON.stringify(props),
    }),
  );
}
