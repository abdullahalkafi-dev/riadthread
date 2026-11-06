import type { TrackingBatch } from '@riad/shared';
import { EVENT_RETENTION_DAYS, TrackingEvent } from './event.model';

const DAY = 86_400_000;
const MAX_AGE_MS = DAY; // events older than a day are stale retries
const MAX_FUTURE_MS = 5 * 60_000; // allow a little clock drift

/** Query strings and fragments never reach the database. */
const cleanPath = (p: string) => p.split('?')[0]!.split('#')[0]!.slice(0, 300) || '/';

/**
 * Stores a batch from a visitor who accepted tracking. The schema already
 * guarantees consent === true; here we bound the data: old or future events are
 * dropped, duplicates (same eventId) are ignored, and everything expires.
 * Returns how many events were new.
 */
export async function ingestBatch(batch: TrackingBatch): Promise<number> {
  const now = Date.now();
  const valid = batch.events.filter((e) => e.at >= now - MAX_AGE_MS && e.at <= now + MAX_FUTURE_MS);
  if (valid.length === 0) return 0;

  const docs = valid.map((e, i) => ({
    eventId: e.eventId,
    type: e.type,
    visitorId: batch.visitorId,
    sessionId: batch.sessionId,
    path: cleanPath(e.path),
    productId: e.productId,
    durationMs: e.durationMs,
    label: e.label,
    value: e.value,
    at: new Date(e.at),
    policyVersion: batch.policyVersion,
    ...(i === 0 && (batch.attribution || batch.device) ? { ctx: { attribution: batch.attribution, device: batch.device } } : {}),
    expiresAt: new Date(now + EVENT_RETENTION_DAYS * DAY),
  }));

  try {
    const res = await TrackingEvent.insertMany(docs, { ordered: false });
    return res.length;
  } catch (err) {
    // Duplicate eventIds are expected when a batch is retried; count only what was stored.
    const e = err as { code?: number; insertedDocs?: unknown[]; writeErrors?: Array<{ err?: { code?: number } }> };
    const allDuplicates = e.writeErrors?.every((w) => w.err?.code === 11000);
    if (e.code === 11000 || allDuplicates) return e.insertedDocs?.length ?? 0;
    throw err;
  }
}
