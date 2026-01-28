import * as amqp from 'amqplib';
import { Logger } from '../utils';
import { RabbitMQConfig } from '../models';

export class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly logger: Logger;
  private readonly config: RabbitMQConfig;

  constructor(config: RabbitMQConfig) {
    this.config = config;
    this.logger = new Logger('RabbitMQService');
  }

  async connect(): Promise<void> {
    this.logger.info(`Connecting to RabbitMQ at ${this.config.url}`);

    // Type cast necessário devido a inconsistência nos tipos do amqplib
    this.connection = (await amqp.connect(this.config.url)) as unknown as amqp.Connection;

    this.connection.on('error', (err) => {
      this.logger.error('RabbitMQ connection error', err);
    });

    this.connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.channel = await (this.connection as any).createChannel();

    if (this.channel) {
      this.channel.on('error', (err) => {
        this.logger.error('RabbitMQ channel error', err);
      });

      this.channel.on('close', () => {
        this.logger.warn('RabbitMQ channel closed');
      });

      await this.channel.assertQueue(this.config.queue, { durable: true });

      if (this.config.exchange) {
        await this.channel.assertExchange(this.config.exchange, 'topic', { durable: true });
      }

      this.logger.info(
        `Successfully connected to RabbitMQ and asserted queue: ${this.config.queue}`,
      );
    }
  }

  async publish(message: string): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized. Call connect() first.');
    }

    const buffer = Buffer.from(message);
    const options = {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
    };

    if (this.config.exchange && this.config.routingKey) {
      this.channel.publish(this.config.exchange, this.config.routingKey, buffer, options);
    } else {
      this.channel.sendToQueue(this.config.queue, buffer, options);
    }

    return true;
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
      this.logger.info('RabbitMQ channel closed');
    }

    if (this.connection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.connection as any).close();
      this.connection = null;
      this.logger.info('RabbitMQ connection closed');
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  getChannel(): amqp.Channel | null {
    return this.channel;
  }

  async consume(
    onMessage: (message: string, ack: () => void, nack: (requeue: boolean) => void) => void,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized. Call connect() first.');
    }

    await this.channel.consume(
      this.config.queue,
      (msg) => {
        if (msg !== null) {
          const content = msg.content.toString();
          const ack = (): void => {
            if (this.channel) {
              this.channel.ack(msg);
            }
          };
          const nack = (requeue: boolean): void => {
            if (this.channel) {
              this.channel.nack(msg, false, requeue);
            }
          };
          onMessage(content, ack, nack);
        }
      },
      { noAck: false },
    );

    this.logger.info(`Started consuming messages from queue: ${this.config.queue}`);
  }
}
