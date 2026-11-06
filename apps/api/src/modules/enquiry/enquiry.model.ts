import { model, Schema, type InferSchemaType } from 'mongoose';
import { BUSINESS_TYPES, ENQUIRY_KINDS, ENQUIRY_STATUSES, ENTRY_POINTS, LEAD_LEVELS, PREFERRED_CONTACT } from '@riad/shared';

const itemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    /** Frozen at submission: later product edits never change an old request. */
    name: { type: String, required: true },
    code: { type: String, required: true },
    slug: { type: String, required: true },
    colour: { type: String },
    sizes: { type: [{ _id: false, label: String, qty: Number }], default: [] },
    qty: { type: Number, required: true },
    thumb: { type: String },
  },
  { _id: false },
);

const enquirySchema = new Schema(
  {
    /** Human-readable reference such as RT-2611-0042. */
    ref: { type: String, required: true, unique: true },
    /** One per logical attempt; makes retries and double clicks safe. */
    submissionKey: { type: String, required: true, unique: true },
    payloadHash: { type: String, required: true },
    kind: { type: String, enum: ENQUIRY_KINDS, required: true },

    contact: {
      name: { type: String, required: true },
      business: { type: String },
      email: { type: String, required: true },
      phone: { type: String },
      type: { type: String, enum: [...BUSINESS_TYPES, undefined] },
      city: { type: String },
      website: { type: String },
    },
    message: { type: String, default: '' },
    preferredContact: { type: String, enum: [...PREFERRED_CONTACT, undefined] },
    deliveryBy: { type: String },
    estimatedQty: { type: Number },

    items: { type: [itemSchema], default: [] },
    /** Denormalised so the dashboard list never needs a lookup per row. */
    itemCount: { type: Number, default: 0 },
    qtyTotal: { type: Number, default: 0 },
    thumbs: { type: [String], default: [] },

    entryPoint: { type: String, enum: ENTRY_POINTS },
    pageUrl: { type: String },

    visitorId: { type: String },
    sessionId: { type: String },
    /** Bounded snapshot taken at submission; later visits never rewrite it. */
    journey: { type: [{ _id: false, t: String, m: String, k: String, at: Number }], default: undefined },
    source: {
      channel: { type: String },
      medium: { type: String },
      campaign: { type: String },
      content: { type: String },
      term: { type: String },
      landingPath: { type: String },
      referrerOrigin: { type: String },
    },
    consent: { analytics: { type: Boolean, default: false }, policyVersion: { type: String } },

    score: {
      rule: { type: Number, default: 1 },
      level: { type: String, enum: LEAD_LEVELS, default: 'cold' },
      factors: { type: [String], default: [] },
    },

    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new' },
    unread: { type: Boolean, default: true },
    followUpAt: { type: Date, default: null },
    notes: {
      type: [{ text: { type: String, required: true }, authorId: Schema.Types.ObjectId, authorName: String, at: { type: Date, default: Date.now } }],
      default: [],
    },
    activity: { type: [{ _id: false, type: String, text: String, at: { type: Date, default: Date.now } }], default: [] },
    email: {
      confirmation: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
      notification: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
    },
  },
  { timestamps: true },
);

enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ unread: 1 });
enquirySchema.index({ followUpAt: 1 });
enquirySchema.index({ 'items.productId': 1 });
enquirySchema.index({ 'score.level': 1 });

export type EnquiryDoc = InferSchemaType<typeof enquirySchema> & { _id: import('mongoose').Types.ObjectId };
export const Enquiry = model('Enquiry', enquirySchema);
