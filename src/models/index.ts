export interface Message {
  id: string;
  payload: unknown;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface RabbitMQConfig {
  url: string;
  queue: string;
  exchange?: string;
  routingKey?: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface BottleneckConfig {
  maxConcurrent: number;
  minTime: number;
  reservoir?: number | null;
  reservoirRefreshAmount?: number | null;
  reservoirRefreshInterval?: number | null;
}

export interface TemporalConfig {
  address: string;
  namespace: string;
  taskQueue: string;
}
