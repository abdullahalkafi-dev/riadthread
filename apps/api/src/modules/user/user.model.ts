import { model, Schema, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['admin', 'staff'] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'admin', required: true },
    isActive: { type: Boolean, default: true },
    /** Reserved so two-factor can be added later without a migration. */
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: (typeof USER_ROLES)[number];
  lastLoginAt: Date | null;
}

export function toPublicUser(u: {
  _id: unknown;
  name: string;
  email: string;
  role: (typeof USER_ROLES)[number];
  lastLoginAt?: Date | null;
}): PublicUser {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    lastLoginAt: u.lastLoginAt ?? null,
  };
}
