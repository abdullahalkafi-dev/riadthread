import { model, Schema, type Types } from 'mongoose';

export const OUTBOX_TYPES = ['enquiry.confirmation', 'enquiry.notification', 'line_sheet.link'] as const;
export type OutboxType = (typeof OUTBOX_TYPES)[number];

/**
 * Durable to-do list for e-mails, written in the same transaction as the
 * enquiry. Even if Redis is flushed or the worker is down, nothing is lost:
 * the sweeper re-queues anything still pending.
 */
const outboxSchema = new Schema(
  {
    type: { type: String, enum: OUTBOX_TYPES, required: true },
    enquiryId: { type: Schema.Types.ObjectId, ref: 'Enquiry', required: true, index: true },
    /** "skipped": there was nobody to send it to (no notification addresses configured). */
    status: { type: String, enum: ['pending', 'sending', 'sent', 'failed', 'skipped'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: () => new Date() },
    lockedAt: { type: Date },
    lastError: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

outboxSchema.index({ status: 1, nextAttemptAt: 1 });
// Delivery records are kept for a year, then removed.
outboxSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 86_400 });

export interface OutboxDoc {
  _id: Types.ObjectId;
  type: OutboxType;
  enquiryId: Types.ObjectId;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';
  attempts: number;
  nextAttemptAt: Date;
}

export const Outbox = model('Outbox', outboxSchema);
