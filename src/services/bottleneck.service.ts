import Bottleneck from 'bottleneck';
import Redis from 'ioredis';
import { Logger } from '../utils';
import { BottleneckConfig, RedisConfig } from '../models';

export class BottleneckService {
  private limiter: Bottleneck | null = null;
  private readonly logger: Logger;
  private readonly bottleneckConfig: BottleneckConfig;
  private readonly redisConfig: RedisConfig;

  constructor(bottleneckConfig: BottleneckConfig, redisConfig: RedisConfig) {
    this.bottleneckConfig = bottleneckConfig;
    this.redisConfig = redisConfig;
    this.logger = new Logger('BottleneckService');
  }

  connect(): void {
    this.logger.info(
      `Initializing Bottleneck with Redis at ${this.redisConfig.host}:${this.redisConfig.port}`,
    );

    // Bottleneck gerencia sua própria conexão Redis internamente
    this.limiter = new Bottleneck({
      id: 'bottleneck-lab-consumer',
      datastore: 'ioredis',
      clientOptions: {
        host: this.redisConfig.host,
        port: this.redisConfig.port,
        password: this.redisConfig.password,
        db: this.redisConfig.db,
      },
      Redis,
      maxConcurrent: this.bottleneckConfig.maxConcurrent,
      minTime: this.bottleneckConfig.minTime,
      // reservoir: this.bottleneckConfig.reservoir,
      // reservoirRefreshAmount: this.bottleneckConfig.reservoirRefreshAmount,
      // reservoirRefreshInterval: this.bottleneckConfig.reservoirRefreshInterval,
    });

    this.limiter.on('error', (err) => {
      this.logger.error('Bottleneck error', err);
    });

    this.limiter.on('depleted', () => {
      this.logger.warn('Bottleneck reservoir depleted - waiting for refresh');
    });

    this.logger.info('Bottleneck initialized with Redis datastore');
  }

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.limiter) {
      throw new Error('Bottleneck is not initialized. Call connect() first.');
    }

    return this.limiter.schedule(fn);
  }

  async close(): Promise<void> {
    if (this.limiter) {
      await this.limiter.stop({ dropWaitingJobs: false });
      this.limiter = null;
      this.logger.info('Bottleneck stopped');
    }
  }

  getJobCounts(): Bottleneck.Counts | null {
    return this.limiter?.counts() || null;
  }
}
