import { logger } from '../config/logger';
import { sweepOutbox } from '../modules/notification/notification.service';

/** Periodic housekeeping. Returns a function that stops it. */
export function startMaintenance(everyMs = 60_000): () => void {
  const tick = async () => {
    try {
      const n = await sweepOutbox();
      if (n > 0) logger.info({ queued: n }, 'Outbox sweep re-queued e-mails');
    } catch (err) {
      logger.warn({ err }, 'Outbox sweep failed');
    }
  };
  void tick();
  const timer = setInterval(tick, everyMs);
  timer.unref();
  return () => clearInterval(timer);
}
