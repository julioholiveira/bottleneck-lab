import { randomUUID } from 'crypto';
import { Message } from '../models';

export interface MessageGeneratorOptions {
  payload?: unknown;
  metadata?: Record<string, unknown>;
}

export function generateMessage(options?: MessageGeneratorOptions): Message {
  return {
    id: randomUUID(),
    payload: options?.payload || { text: 'Test message', value: Math.random() },
    timestamp: new Date(),
    metadata: options?.metadata || {},
  };
}

export function generateMessages(count: number, options?: MessageGeneratorOptions): Message[] {
  return Array.from({ length: count }, () => generateMessage(options));
}
