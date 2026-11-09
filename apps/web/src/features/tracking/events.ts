import { LIMITS, type EventType } from '@riad/shared';

/**
 * A small in-memory queue of analytics events. Nothing is queued unless the
 * visitor accepted tracking; the Tracker component drains and sends it in batches.
 */
export interface QueuedEvent {
  eventId: string;
  type: EventType;
  path: string;
  productId?: string;
  durationMs?: number;
  label?: string;
  value?: number;
  at: number;
}

export type EventInput = Omit<QueuedEvent, 'eventId' | 'at' | 'path'> & { path?: string };

/** Keeps a runaway page from growing the queue without limit. */
const MAX_QUEUE = 200;

let enabled = false;
let queue: QueuedEvent[] = [];
let listener: (() => void) | null = null;

/** The query string and fragment never leave the browser. */
export const cleanPath = (p: string) => (p.split('?')[0]!.split('#')[0]!.slice(0, 300) || '/');

export function setEventsEnabled(value: boolean) {
  enabled = value;
  if (!value) queue = [];
}

/** Called by the Tracker so it can flush early when a batch is full. */
export function onQueueGrow(fn: (() => void) | null) {
  listener = fn;
}

export function trackEvent(input: EventInput) {
  if (!enabled || typeof window === 'undefined') return;
  const { path, ...rest } = input;
  queue.push({
    ...rest,
    eventId: crypto.randomUUID(),
    path: cleanPath(path ?? window.location.pathname),
    at: Date.now(),
    ...(rest.label ? { label: rest.label.slice(0, 80) } : {}),
  });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  if (queue.length >= LIMITS.eventBatch) listener?.();
}

export const drainEvents = (max: number = LIMITS.eventBatch) => queue.splice(0, max);

/** Puts events back after a failed send, ahead of anything newer. */
export function requeueEvents(events: QueuedEvent[]) {
  queue = [...events, ...queue].slice(-MAX_QUEUE);
}

export const pendingEvents = () => queue.length;
