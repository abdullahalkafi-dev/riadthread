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

/** Rotates the refresh token. Presenting an already-used token revokes the whole family. */
export async function refresh(token: string, userAgent?: string) {
  const record = await RefreshToken.findOne({ tokenHash: sha256(token) });
  if (!record || record.expiresAt < new Date()) throw AppError.unauthorized('Please sign in again');

  if (record.revokedAt) {
    await RefreshToken.updateMany({ family: record.family, revokedAt: null }, { revokedAt: new Date() });
    throw AppError.unauthorized('Please sign in again');
  }

  const user = await User.findById(record.userId);
  if (!user || !user.isActive) throw AppError.unauthorized('Please sign in again');

  record.revokedAt = new Date();
  await record.save();

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
