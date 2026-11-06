import { model, Schema } from 'mongoose';
import type { SettingsInput } from '@riad/shared';

/** Single document holding every business-wide setting. */
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    business: { type: Schema.Types.Mixed, required: true },
    whatsapp: { type: Schema.Types.Mixed, required: true },
    social: { type: Schema.Types.Mixed, required: true },
    notifications: { type: Schema.Types.Mixed, required: true },
    tracking: { type: Schema.Types.Mixed, required: true },
    productDefaults: { type: Schema.Types.Mixed, required: true },
    lineSheet: {
      enabled: { type: Boolean, default: false },
      mediaId: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
    },
  },
  { timestamps: true, minimize: false },
);

export const Settings = model('Settings', settingsSchema);

/** Starting values, taken from the approved design. The client confirms the claims before launch. */
export const DEFAULT_SETTINGS: SettingsInput = {
  business: { name: 'Riad Threads', email: 'hello@riadthreads.co.uk', phone: '', address: '' },
  whatsapp: { number: '', template: "Hi Riad Threads, I'd like to ask about {product} ({code})" },
  social: { instagram: '', tiktok: '', facebook: '' },
  notifications: { emails: [], sendConfirmation: true },
  tracking: { banner: true, journey: true },
  productDefaults: {
    dispatch: '48h from UK stock',
    samples: 'Available',
    priceLine: 'Trade price on request',
    shipText:
      'Each piece is folded in a branded sleeve. Packs are boxed by size run, so they go straight onto your shelves. UK mainland delivery takes 1–3 working days by tracked courier. Pallet delivery is available for orders over 300 units.',
    tiersFootnote: 'Exact prices are confirmed in your quote and depend on the mix and delivery date.',
  },
  lineSheet: { enabled: false, mediaId: null },
};
