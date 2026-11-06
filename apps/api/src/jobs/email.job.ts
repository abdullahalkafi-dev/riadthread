import { registerHandler, QUEUES } from '../lib/queue';
import { processOutbox } from '../modules/notification/notification.service';

registerHandler(QUEUES.email, async (job) => {
  if (job.name === 'send') await processOutbox(String(job.data.outboxId));
});
