import { model, Schema, type Types } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** SHA-256 of the token; the token itself is only ever in the cookie. */
    tokenHash: { type: String, required: true, unique: true },
    /** All tokens issued from one login share a family, so reuse can revoke them all. */
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// MongoDB removes expired tokens on its own.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export interface RefreshTokenDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export const RefreshToken = model('RefreshToken', refreshTokenSchema);
