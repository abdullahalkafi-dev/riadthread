import { Queue, Worker, type JobsOptions } from 'bullmq';
import { logger } from '../config/logger';
import { queueRedis } from './redis';

export const QUEUES = { email: 'email', media: 'media' } as const;
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export interface JobPayload {
  name: string;
  data: Record<string, unknown>;
}
type Handler = (job: JobPayload) => Promise<void>;

const handlers = new Map<QueueName, Handler>();
const queues = new Map<QueueName, Queue>();

/** Handlers are registered by the job modules, for both the worker and the inline fallback. */
export function registerHandler(queue: QueueName, handler: Handler) {
  handlers.set(queue, handler);
}

function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, { connection: queueRedis! });
    queues.set(name, q);
  }
  return q;
}

const DEFAULT_JOB: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 7 * 86_400 },
};

/**
 * Adds a job. Without a queue Redis (a minimal local setup) the job runs in the
 * API process instead; the outbox sweeper still guarantees delivery.
 */
export async function enqueue(
  queue: QueueName,
  name: string,
  data: Record<string, unknown>,
  opts: { jobId?: string; delayMs?: number } = {},
): Promise<void> {
  if (queueRedis) {
    await getQueue(queue).add(name, data, {
      ...DEFAULT_JOB,
      ...(opts.jobId ? { jobId: opts.jobId } : {}),
      ...(opts.delayMs ? { delay: opts.delayMs } : {}),
    });
    return;
  }
  const handler = handlers.get(queue);
  setTimeout(() => {
    handler?.({ name, data }).catch((err) => logger.error({ err, queue, name }, 'Inline job failed'));
  }, opts.delayMs ?? 0);
}

/** Starts BullMQ workers for every registered handler (used by the worker process). */
export function startWorkers(concurrency: Partial<Record<QueueName, number>> = {}) {
  if (!queueRedis) {
    logger.warn('REDIS_QUEUE_URL is not set: jobs run inline in the API and there is nothing for a worker to do');
    return [];
  }
  const workers: Worker[] = [];
  for (const [name, handler] of handlers) {
    const worker = new Worker(name, (job) => handler({ name: job.name, data: job.data }), {
      connection: queueRedis,
      concurrency: concurrency[name] ?? 2,
    });
    worker.on('failed', (job, err) =>
      logger.warn({ queue: name, job: job?.name, attempt: job?.attemptsMade, reason: err.message }, 'Job failed'),
    );
    worker.on('error', (err) => logger.warn({ queue: name, reason: err.message }, 'Worker error'));
    workers.push(worker);
  }
  logger.info({ queues: [...handlers.keys()] }, 'Workers started');
  return workers;
}

export async function queueStats() {
  if (!queueRedis) return null;
  const out: Record<string, unknown> = {};
  for (const name of Object.values(QUEUES)) {
    out[name] = await getQueue(name).getJobCounts('waiting', 'active', 'failed', 'delayed');
  }
  return out;
}

export async function closeQueues() {
  await Promise.allSettled([...queues.values()].map((q) => q.close()));
}
