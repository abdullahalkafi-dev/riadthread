import { model, Schema, type Types } from 'mongoose';
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

// Declared as its own schema because a field called 'type' would otherwise be read as the type declaration.
const activitySchema = new Schema(
  { type: { type: String }, text: { type: String }, at: { type: Date, default: Date.now } },
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
    /** When the lead was marked Confirmed; cleared if it moves to another status. */
    confirmedAt: { type: Date, default: null },
    unread: { type: Boolean, default: true },
    followUpAt: { type: Date, default: null },
    notes: {
      type: [{ text: { type: String, required: true }, authorId: Schema.Types.ObjectId, authorName: String, at: { type: Date, default: Date.now } }],
      default: [],
    },
    activity: { type: [activitySchema], default: [] },
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
enquirySchema.index({ confirmedAt: -1 });

/** Plain shape of a stored enquiry (what .lean() returns). */
export interface EnquiryDoc {
  _id: Types.ObjectId;
  ref: string;
  submissionKey: string;
  payloadHash: string;
  kind: 'product' | 'general' | 'line_sheet';
  contact: { name: string; business?: string; email: string; phone?: string; type?: string; city?: string; website?: string };
  message?: string;
  preferredContact?: string;
  deliveryBy?: string;
  estimatedQty?: number;
  items: Array<{
    productId: Types.ObjectId;
    name: string;
    code: string;
    slug: string;
    colour?: string;
    sizes: Array<{ label?: string; qty?: number }>;
    qty: number;
    thumb?: string;
  }>;
  itemCount: number;
  qtyTotal: number;
  thumbs: string[];
  entryPoint?: string;
  pageUrl?: string;
  visitorId?: string;
  sessionId?: string;
  journey?: Array<{ t?: string; m?: string; k?: string; at?: number }>;
  source?: { channel?: string; medium?: string; campaign?: string; content?: string; term?: string; landingPath?: string; referrerOrigin?: string };
  consent?: { analytics?: boolean; policyVersion?: string };
  score?: { rule?: number; level?: 'hot' | 'warm' | 'cold'; factors?: string[] };
  status: 'new' | 'contacted' | 'discussion' | 'quote' | 'confirmed' | 'lost' | 'spam';
  confirmedAt?: Date | null;
  unread: boolean;
  followUpAt: Date | null;
  notes: Array<{ _id?: Types.ObjectId; text: string; authorId?: Types.ObjectId; authorName?: string; at: Date }>;
  activity: Array<{ type?: string; text?: string; at?: Date }>;
  email?: { confirmation?: string; notification?: string };
  createdAt: Date;
  updatedAt: Date;
}
export const Enquiry = model('Enquiry', enquirySchema);
