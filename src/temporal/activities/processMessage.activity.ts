import { Message } from '../../models';

export async function processMessageActivity(messageJson: string): Promise<string> {
  const message: Message = JSON.parse(messageJson);

  console.log(`[Activity] Processing message ${message.id}`);
  console.log(`[Activity] Payload:`, message.payload);
  console.log(`[Activity] Timestamp:`, message.timestamp);

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 100));

  return `Message ${message.id} processed successfully`;
}
