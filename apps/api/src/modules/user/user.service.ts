import argon2 from 'argon2';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../utils/AppError';
import { RefreshToken } from '../auth/refreshToken.model';
import { toPublicUser, User } from './user.model';

export const hashPassword = (plain: string) => argon2.hash(plain, { type: argon2.argon2id });

/**
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Idempotent: it never touches an existing admin.
 */
export async function seedAdminIfMissing(): Promise<'created' | 'exists' | 'skipped'> {
  if (await User.exists({ role: 'admin' })) return 'exists';
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    logger.warn('No admin exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set; skipping the seed');
    return 'skipped';
  }
  await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    passwordHash: await hashPassword(env.ADMIN_PASSWORD),
    role: 'admin',
  });
  logger.info({ email: env.ADMIN_EMAIL }, 'Seeded the first admin account');
  return 'created';
}

export async function updateAccount(userId: string, input: { name?: string | undefined; email?: string | undefined }) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('Account not found');
  if (input.name) user.name = input.name;
  if (input.email) user.email = input.email;
  await user.save();
  return toPublicUser(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw AppError.notFound('Account not found');
  if (!(await argon2.verify(user.passwordHash, currentPassword))) {
    throw AppError.badRequest('Your current password is not correct', [
      { path: 'body.currentPassword', message: 'Incorrect password' },
    ]);
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  // A new password signs out every other device.
  await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
}
