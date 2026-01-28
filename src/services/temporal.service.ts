import { Connection, Client, WorkflowHandle } from '@temporalio/client';
import { Logger } from '../utils';
import { TemporalConfig } from '../models';

export class TemporalService {
  private connection: Connection | null = null;
  private client: Client | null = null;
  private readonly logger: Logger;
  private readonly config: TemporalConfig;

  constructor(config: TemporalConfig) {
    this.config = config;
    this.logger = new Logger('TemporalService');
  }

  async connect(): Promise<void> {
    try {
      this.logger.info(`Connecting to Temporal at ${this.config.address}`);

      this.connection = await Connection.connect({
        address: this.config.address,
      });

      this.client = new Client({
        connection: this.connection,
        namespace: this.config.namespace,
      });

      this.logger.info('Successfully connected to Temporal');
    } catch (error) {
      this.logger.error('Failed to connect to Temporal', error);
      throw error;
    }
  }

  async startWorkflow(
    workflowType: string,
    args: unknown[],
    workflowId: string,
  ): Promise<WorkflowHandle> {
    if (!this.client) {
      throw new Error('Temporal client is not initialized. Call connect() first.');
    }

    try {
      const handle = await this.client.workflow.start(workflowType, {
        taskQueue: this.config.taskQueue,
        args,
        workflowId,
      });

      this.logger.debug(`Started workflow ${workflowType} with ID: ${workflowId}`);
      return handle;
    } catch (error) {
      this.logger.error(`Failed to start workflow ${workflowType}`, error);
      throw error;
    }
  }

  close(): void {
    try {
      if (this.connection) {
        this.connection.close();
        this.connection = null;
        this.client = null;
        this.logger.info('Temporal connection closed');
      }
    } catch (error) {
      this.logger.error('Error closing Temporal connection', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}
