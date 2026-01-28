import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities';

const { processMessageActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function processMessageWorkflow(messageJson: string): Promise<string> {
  return await processMessageActivity(messageJson);
}
