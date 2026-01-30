import { config } from './config';
import { RabbitMQService, BottleneckService, TemporalService } from './services';
import { Logger, ShutdownManager } from './utils';
import { Message } from './models';

const logger = new Logger('Consumer');

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
  await rabbitmqService.consume((messageStr, ack, nack) => {
    void (async (): Promise<void> => {
      try {
        const message = JSON.parse(messageStr) as Message;
        const workflowId = `process-message-${message.id}`;

        // Envia ao Temporal sem limitação
        await temporalService.startWorkflow('processMessageWorkflow', [messageStr], workflowId);

        // Limita apenas o ack
        await bottleneckService.schedule(async () => {
          ack();
          logger.info(`Message ${message.id} acked`);
        });

        processedCount++;
      } catch (error) {
        logger.error('Failed to process message', error);
        errorCount++;
        nack(false);
      }
    })();
  });

  logger.info('Consumer is running. Press Ctrl+C to stop.');

  shutdown.register(() => {
    logger.info(`Processed messages: ${processedCount}, Errors: ${errorCount}`);
  });
}

// Start the consumer
main().catch((error) => {
  logger.error('Unhandled error in main', error);
  process.exit(1);
});
