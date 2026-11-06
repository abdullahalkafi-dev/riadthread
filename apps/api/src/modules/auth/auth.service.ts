import argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { toPublicUser, User } from '../user/user.model';
import { hashPassword } from '../user/user.service';
import { RefreshToken } from './refreshToken.model';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export interface AccessClaims {
  sub: string;
  role: 'admin' | 'staff';
}

export const signAccessToken = (claims: AccessClaims) =>
  jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: `${env.ACCESS_TTL_MIN}m` });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & AccessClaims;

async function issueRefreshToken(userId: string, family: string, userAgent?: string) {
  const token = randomBytes(48).toString('base64url');
  await RefreshToken.create({
    userId,
    tokenHash: sha256(token),
    family,
    expiresAt: new Date(Date.now() + env.REFRESH_TTL_DAYS * 86_400_000),
    userAgent: userAgent?.slice(0, 300),
  });
  return token;
}

// Verified against when the email is unknown, so timing does not reveal which emails exist.
let dummyHash: Promise<string> | null = null;

export async function login(email: string, password: string, userAgent?: string) {
  const user = await User.findOne({ email }).select('+passwordHash');
  dummyHash ??= hashPassword('not-a-real-password');
  const valid = await argon2.verify(user?.passwordHash ?? (await dummyHash), password).catch(() => false);
  if (!user || !user.isActive || !valid) throw AppError.unauthorized('Email or password is incorrect');

  user.lastLoginAt = new Date();
  await user.save();

  const access = signAccessToken({ sub: String(user._id), role: user.role });
  const refresh = await issueRefreshToken(String(user._id), randomUUID(), userAgent);
  return { user: toPublicUser(user), access, refresh };
}

/**
 * A browser often sends two refreshes at once (two tabs, or a page load plus a
 * background request). The loser of that race presents a token that was
 * rotated a moment ago; inside this window it is treated as the same sign-in,
 * not as a stolen token.
 */
const REUSE_GRACE_MS = 30_000;

/** Rotates the refresh token. Presenting an old token after the grace window revokes the whole family. */
export async function refresh(token: string, userAgent?: string) {
  const now = new Date();
  const tokenHash = sha256(token);

  // Claim the token atomically: only one request can rotate it.
  let record = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now, rotatedAt: now } },
    { returnDocument: 'after' },
  );

  if (!record) {
    const used = await RefreshToken.findOne({ tokenHash });
    if (!used || used.expiresAt <= now) throw AppError.unauthorized('Please sign in again');
    // Grace applies only to a token replaced by rotation, and only while that sign-in is still
    // live. A logout or password change revokes the live token too, so it is never undone here.
    const rotatedRecently = !!used.rotatedAt && now.getTime() - used.rotatedAt.getTime() < REUSE_GRACE_MS;
    const familyLive = rotatedRecently && (await RefreshToken.exists({ family: used.family, revokedAt: null, expiresAt: { $gt: now } }));
    if (!familyLive) {
      // A genuinely reused token: assume it was stolen and end every session from that sign-in.
      await RefreshToken.updateMany({ family: used.family, revokedAt: null }, { revokedAt: now });
      throw AppError.unauthorized('Please sign in again');
    }
    record = used;
  }

  const user = await User.findById(record.userId);
  if (!user || !user.isActive) throw AppError.unauthorized('Please sign in again');

  return {
    user: toPublicUser(user),
    access: signAccessToken({ sub: String(user._id), role: user.role }),
    refresh: await issueRefreshToken(String(user._id), record.family, userAgent),
  };
}

export async function logout(token: string | undefined) {
  if (!token) return;
  await RefreshToken.updateOne({ tokenHash: sha256(token), revokedAt: null }, { revokedAt: new Date() });
}

export async function currentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) throw AppError.unauthorized();
  return toPublicUser(user);
}
