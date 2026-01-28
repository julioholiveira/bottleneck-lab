import { config } from './config';
import { RabbitMQService, BottleneckService, TemporalService } from './services';
import { Logger, ShutdownManager } from './utils';
import { Message } from './models';

const logger = new Logger('Consumer');

async function processMessage(
  messageStr: string,
  bottleneckService: BottleneckService,
  temporalService: TemporalService,
): Promise<void> {
  const message: Message = JSON.parse(messageStr);
  logger.debug(`Received message: ${message.id}`);

  await bottleneckService.schedule(async () => {
    const workflowId = `process-message-${message.id}`;
    await temporalService.startWorkflow('processMessageWorkflow', [messageStr], workflowId);
    logger.info(`Message ${message.id} sent to Temporal`);
  });
}

async function main(): Promise<void> {
  const rabbitmqService = new RabbitMQService(config.rabbitmq);
  const bottleneckService = new BottleneckService(config.bottleneck, config.redis);
  const temporalService = new TemporalService(config.temporal);

  const shutdown = new ShutdownManager('Consumer');
  shutdown.register(() => rabbitmqService.close());
  shutdown.register(() => bottleneckService.close());
  shutdown.register(() => temporalService.close());
  shutdown.setupSignalHandlers();

  // Connect all services
  await rabbitmqService.connect();
  bottleneckService.connect();
  await temporalService.connect();

  logger.info('All services connected, starting to consume messages...');

  let processedCount = 0;
  let errorCount = 0;

  // Start consuming messages
  await rabbitmqService.consume(async (messageStr, ack, nack) => {
    try {
      await processMessage(messageStr, bottleneckService, temporalService);
      processedCount++;
      ack();
    } catch (error) {
      logger.error('Failed to process message', error);
      errorCount++;
      nack(false);
    }
  });

  logger.info('Consumer is running. Press Ctrl+C to stop.');

  // Log stats periodically
  setInterval(() => {
    const counts = bottleneckService.getJobCounts();
    logger.info(
      `Stats - Processed: ${processedCount}, Errors: ${errorCount}, Bottleneck: ${JSON.stringify(counts)}`,
    );
  }, 10000);
}

// Start the consumer
main().catch((error) => {
  logger.error('Unhandled error in main', error);
  process.exit(1);
});
