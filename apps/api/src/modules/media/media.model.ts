import { model, Schema, type InferSchemaType } from 'mongoose';
import { MEDIA_STATUSES, MEDIA_TYPES } from '@riad/shared';

const variantSchema = new Schema(
  {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    format: { type: String, enum: ['webp', 'avif', 'jpg'], required: true },
    key: { type: String, required: true },
    bytes: { type: Number, required: true },
  },
  { _id: false },
);

const mediaSchema = new Schema(
  {
    type: { type: String, enum: MEDIA_TYPES, required: true, index: true },
    status: { type: String, enum: MEDIA_STATUSES, default: 'processing', index: true },
    error: { type: String },

    originalName: { type: String, maxlength: 200 },
    /** Detected from the file bytes, never from the extension the client sent. */
    mime: { type: String, required: true },
    bytes: { type: Number, required: true },
    /** Key of the untouched upload in the private bucket. */
    originalKey: { type: String, required: true },

    width: { type: Number },
    height: { type: Number },
    durationSec: { type: Number },

    /** Responsive renditions of an image. */
    variants: { type: [variantSchema], default: [] },
    /** Single public file for video, 3D models and documents. */
    fileKey: { type: String },
    /** Poster frame for video or 3D. */
    posterKey: { type: String },
    blurDataUrl: { type: String },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

mediaSchema.index({ createdAt: -1 });

export type MediaDoc = InferSchemaType<typeof mediaSchema> & { _id: import('mongoose').Types.ObjectId };
export const Media = model('Media', mediaSchema);
