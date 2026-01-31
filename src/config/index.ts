import dotenv from 'dotenv';
import { RabbitMQConfig, RedisConfig, BottleneckConfig, TemporalConfig } from '../models';

dotenv.config();

// Helper para parseInt com valor padrão
const parseEnvInt = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export const rabbitmqConfig: RabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  queue: process.env.RABBITMQ_QUEUE || 'bottleneck-queue',
  prefetchCount: parseEnvInt('RABBITMQ_PREFETCH_COUNT', 10),
};

export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseEnvInt('REDIS_PORT', 6379),
  password: process.env.REDIS_PASSWORD,
  db: parseEnvInt('REDIS_DB', 0),
};

export const bottleneckConfig: BottleneckConfig = {
  maxConcurrent: parseEnvInt('MAX_CONCURRENT', 50),
  minTime: parseEnvInt('MIN_TIME', 20),
};

export const temporalConfig: TemporalConfig = {
  address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'bottleneck-task-queue',
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  rabbitmq: rabbitmqConfig,
  redis: redisConfig,
  bottleneck: bottleneckConfig,
  temporal: temporalConfig,
};
