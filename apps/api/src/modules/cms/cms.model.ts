import { model, Schema } from 'mongoose';

/**
 * One collection for every editable piece of content:
 *  - block:  a homepage section (hero, faq, ...)
 *  - page:   a text page (about, privacy, ...)
 *  - layout: the order and visibility of homepage sections
 */
const contentSchema = new Schema(
  {
    type: { type: String, enum: ['block', 'page', 'layout'], required: true },
    key: { type: String, required: true, maxlength: 40 },
    visible: { type: Boolean, default: true },
    data: { type: Schema.Types.Mixed, required: true },
    /** Flat list of media used by this block, so "is this file in use?" is one cheap query. */
    mediaRefs: { type: [Schema.Types.ObjectId], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false },
);

contentSchema.index({ type: 1, key: 1 }, { unique: true });
contentSchema.index({ mediaRefs: 1 });

export const ContentBlock = model('ContentBlock', contentSchema);
