import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { enqueue, QUEUES } from '../../lib/queue';
import { Enquiry, type EnquiryDoc } from '../enquiry/enquiry.model';
import { loadMedia } from '../media/media.service';
import { getSettings } from '../settings/settings.service';
import { confirmationMail, lineSheetMail, notificationMail, type EnquiryMail } from './email.templates';
import { Outbox, type OutboxType } from './outbox.model';

/** Wait before attempt 2, 3, 4, 5. After the fifth failure the e-mail is marked failed. */
const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 60 * 60_000];
const MAX_ATTEMPTS = BACKOFF_MS.length;
const STALE_LOCK_MS = 5 * 60_000;

// Without SMTP settings, messages are written to the log so development still works.
const transporter = env.SMTP_URL ? nodemailer.createTransport(env.SMTP_URL) : nodemailer.createTransport({ jsonTransport: true });

async function sendMail(to: string[], mail: { subject: string; html: string; text: string }) {
  const info = await transporter.sendMail({ from: env.MAIL_FROM, to, ...mail });
  if (!env.SMTP_URL) logger.info({ to, subject: mail.subject }, 'E-mail not sent (no SMTP_URL): written to the log');
  return info;
}

function toMail(e: EnquiryDoc, scoreLabel?: string): EnquiryMail {
  return {
    ref: e.ref,
    business: e.contact.business ?? '',
    name: e.contact.name,
    email: e.contact.email,
    phone: e.contact.phone,
    city: e.contact.city,
    type: e.contact.type,
    message: e.message ?? '',
    items: e.items.map((i) => ({
      name: i.name,
      code: i.code,
      colour: i.colour ?? null,
      sizes: (i.sizes ?? []).map((s) => ({ label: s.label ?? '', qty: s.qty ?? 0 })),
      qty: i.qty,
    })),
    qtyTotal: e.qtyTotal ?? 0,
    preferredContact: e.preferredContact,
    deliveryBy: e.deliveryBy,
    source: e.source?.channel,
    ...(scoreLabel ? { score: scoreLabel } : {}),
    dashboardUrl: `${env.SITE_URL}/admin/enquiries/${e._id}`,
  };
}

/**
 * Which status on the enquiry an e-mail reports to. The owner alert is
 * "notification"; everything sent to the customer (the confirmation, or the
 * line sheet link for a line sheet request) is "confirmation".
 */
const emailField = (type: OutboxType): 'notification' | 'confirmation' =>
  type === 'enquiry.notification' ? 'notification' : 'confirmation';

/**
 * Sends one outbox e-mail. It is claimed atomically first, so two workers (or a
 * worker and the sweeper) can never send the same message twice. Failures are
 * recorded on the outbox record, which owns the retry schedule.
 */
export async function processOutbox(outboxId: string): Promise<void> {
  const claimed = await Outbox.findOneAndUpdate(
    { _id: outboxId, status: 'pending', nextAttemptAt: { $lte: new Date() } },
    { $set: { status: 'sending', lockedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!claimed) return;

  const field = emailField(claimed.type);
  try {
    const enquiry = (await Enquiry.findById(claimed.enquiryId).lean()) as unknown as EnquiryDoc | null;
    if (!enquiry) throw new Error('The enquiry no longer exists');
    const settings = await getSettings();

    if (claimed.type === 'enquiry.confirmation') {
      await sendMail([enquiry.contact.email], confirmationMail(toMail(enquiry)));
    } else if (claimed.type === 'enquiry.notification') {
      const to = settings.notifications.emails.length > 0 ? settings.notifications.emails : env.NOTIFY_EMAILS;
      if (to.length === 0) {
        // Nothing was sent, so the dashboard must not say "sent".
        logger.warn({ ref: enquiry.ref }, 'No notification addresses in Settings or NOTIFY_EMAILS; nobody was told');
        claimed.status = 'skipped';
        claimed.attempts += 1;
        await claimed.save();
        await Enquiry.updateOne({ _id: claimed.enquiryId }, { $set: { [`email.${field}`]: 'skipped' } });
        return;
      }
      await sendMail(to, notificationMail(toMail(enquiry, `${enquiry.score?.level ?? ''} lead`.trim())));
    } else {
      const mediaId = settings.lineSheet.mediaId;
      const file = mediaId ? (await loadMedia([mediaId])).get(mediaId) : undefined;
      if (!file?.url) throw new Error('No line sheet has been uploaded');
      await sendMail([enquiry.contact.email], lineSheetMail(enquiry.contact.name, `${env.SITE_URL}${file.url}`));
    }

    claimed.status = 'sent';
    claimed.sentAt = new Date();
    claimed.attempts += 1;
    await claimed.save();
    await Enquiry.updateOne({ _id: claimed.enquiryId }, { $set: { [`email.${field}`]: 'sent' } });
  } catch (err) {
    claimed.attempts += 1;
    claimed.lastError = (err instanceof Error ? err.message : 'Unknown error').slice(0, 300);
    if (claimed.attempts >= MAX_ATTEMPTS) {
      claimed.status = 'failed';
      await Enquiry.updateOne({ _id: claimed.enquiryId }, { $set: { [`email.${field}`]: 'failed' } });
      logger.error({ outboxId, error: claimed.lastError }, 'E-mail failed permanently');
    } else {
      claimed.status = 'pending';
      claimed.nextAttemptAt = new Date(Date.now() + BACKOFF_MS[claimed.attempts - 1]!);
      logger.warn({ outboxId, attempt: claimed.attempts, error: claimed.lastError }, 'E-mail failed; will retry');
    }
    await claimed.save();
  }
}

export const enqueueOutbox = (id: string, attempt = 0) =>
  enqueue(QUEUES.email, 'send', { outboxId: id }, { jobId: `email-${id}-${attempt}` });

/**
 * Safety net: re-queues e-mails that are due, and frees ones stuck "sending"
 * after a crash. Runs every minute in the worker (or in the API when there is
 * no queue Redis), so a Redis flush can never lose a notification.
 */
export async function sweepOutbox(): Promise<number> {
  const now = new Date();
  await Outbox.updateMany(
    { status: 'sending', lockedAt: { $lt: new Date(now.getTime() - STALE_LOCK_MS) } },
    { $set: { status: 'pending' } },
  );
  const due = await Outbox.find({ status: 'pending', nextAttemptAt: { $lte: now } }).select('_id attempts').limit(50).lean();
  await Promise.all(due.map((d) => enqueueOutbox(String(d._id), d.attempts)));
  return due.length;
}

/** Admin action: try failed e-mails for an enquiry again. */
export async function retryFailedEmails(enquiryId: string): Promise<number> {
  const failed = await Outbox.find({ enquiryId, status: 'failed' }).select('_id type').lean();
  if (failed.length === 0) return 0;
  await Outbox.updateMany({ enquiryId, status: 'failed' }, { $set: { status: 'pending', attempts: 0, nextAttemptAt: new Date() }, $unset: { lastError: 1 } });
  // Only the e-mails being retried go back to "pending"; one that was sent stays "sent".
  const reset = Object.fromEntries(failed.map((f) => [`email.${emailField(f.type as OutboxType)}`, 'pending']));
  await Enquiry.updateOne({ _id: enquiryId }, { $set: reset });
  await Promise.all(failed.map((f) => enqueueOutbox(String(f._id), Date.now())));
  return failed.length;
}
