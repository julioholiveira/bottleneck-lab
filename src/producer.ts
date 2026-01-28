import { config } from './config';
import { RabbitMQService } from './services/rabbitmq.service';
import { Logger, generateMessages, ShutdownManager } from './utils';

const logger = new Logger('Producer');

interface ProducerConfig {
  messageCount: number;
  intervalMs: number;
}

function parseArgs(): ProducerConfig {
  const args = process.argv.slice(2);

  const getArgValue = (flags: string[]): string | undefined => {
    for (const flag of flags) {
      const index = args.indexOf(flag);
      if (index !== -1 && args[index + 1]) {
        return args[index + 1];
      }
    }
    return undefined;
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npm run producer [options]

Options:
  -c, --count <number>      Number of messages to send (default: 1)
  -i, --interval <ms>       Interval between messages in milliseconds (default: 0)
  -h, --help                Show this help message

Examples:
  npm run producer -- --count 100
  npm run producer -- --count 1000 --interval 10
      `);
    process.exit(0);
  }

  return {
    messageCount: parseInt(getArgValue(['--count', '-c']) || '1', 10),
    intervalMs: parseInt(getArgValue(['--interval', '-i']) || '0', 10),
  };
}

async function sendMessages(
  rabbitmqService: RabbitMQService,
  producerConfig: ProducerConfig,
): Promise<void> {
  const { messageCount, intervalMs } = producerConfig;
  logger.info(`Starting to send ${messageCount} messages with ${intervalMs}ms interval`);

  const messages = generateMessages(messageCount);
  const results = { success: 0, failure: 0 };

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const messageStr = JSON.stringify(message);

    try {
      await rabbitmqService.publish(messageStr);
      results.success++;
      logger.debug(`Message ${i + 1}/${messageCount} sent: ${message.id}`);
    } catch (error) {
      results.failure++;
      logger.error(`Failed to send message ${i + 1}/${messageCount}`, error);
    }

    if (intervalMs > 0 && i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  logger.info(
    `Finished sending messages. Success: ${results.success}, Failed: ${results.failure}, Total: ${messageCount}`,
  );

  // Aguardar para garantir que as mensagens sejam persistidas no RabbitMQ
  // logger.info('Waiting for messages to be persisted...');
  // await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function main(): Promise<void> {
  const rabbitmqService = new RabbitMQService(config.rabbitmq);

  const shutdown = new ShutdownManager('Producer');
  shutdown.register(() => rabbitmqService.close());
  shutdown.setupSignalHandlers();

  const producerConfig = parseArgs();

  await rabbitmqService.connect();
  logger.info('Producer connected to RabbitMQ');

  await sendMessages(rabbitmqService, producerConfig);

  await rabbitmqService.close();
  logger.info('Producer finished successfully');
  process.exit(0);
}

// Start the producer
main().catch((error) => {
  logger.error('Unhandled error in main', error);
  process.exit(1);
});
