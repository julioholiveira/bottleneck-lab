import { Worker, NativeConnection } from '@temporalio/worker';
import { config } from './config';
import { Logger, ShutdownManager } from './utils';
import * as activities from './temporal/activities';

const logger = new Logger('Worker');

async function main(): Promise<void> {
  logger.info(`Connecting to Temporal at ${config.temporal.address}`);

  const connection = await NativeConnection.connect({
    address: config.temporal.address,
  });

  logger.info('Creating worker...');

  const worker = await Worker.create({
    connection,
    namespace: config.temporal.namespace,
    taskQueue: config.temporal.taskQueue,
    workflowsPath: require.resolve('./temporal/workflows'),
    activities,
  });

  const shutdown = new ShutdownManager('Worker');
  shutdown.register(() => worker.shutdown());
  shutdown.setupSignalHandlers();

  logger.info(`Worker started, polling task queue: ${config.temporal.taskQueue}`);
  await worker.run();
}

// Start the worker
main().catch((error) => {
  logger.error('Unhandled error in main', error);
  process.exit(1);
});
