import { Logger } from './logger';

export type ShutdownHandler = () => Promise<void> | void;

export class ShutdownManager {
  private isShuttingDown = false;
  private readonly handlers: ShutdownHandler[] = [];
  private readonly logger: Logger;

  constructor(componentName: string) {
    this.logger = new Logger(componentName);
  }

  register(handler: ShutdownHandler): void {
    this.handlers.push(handler);
  }

  async execute(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    this.logger.info(`Received ${signal}, shutting down gracefully...`);

    for (const handler of this.handlers) {
      try {
        await handler();
      } catch (error) {
        this.logger.error('Error during shutdown', error);
      }
    }

    this.logger.info('Shutdown complete');
    process.exit(0);
  }

  setupSignalHandlers(): void {
    process.on('SIGINT', () => void this.execute('SIGINT'));
    process.on('SIGTERM', () => void this.execute('SIGTERM'));
  }
}
