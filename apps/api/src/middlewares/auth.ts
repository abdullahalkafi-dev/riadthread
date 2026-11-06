import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../modules/auth/auth.service';
import { AppError } from '../utils/AppError';

export const ACCESS_COOKIE = 'rt_access';
export const REFRESH_COOKIE = 'rt_refresh';

/** Requires a valid access cookie. Role checks live here, not in the web middleware. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (!token) return next(AppError.unauthorized());
  try {
    const claims = verifyAccessToken(token);
    req.auth = { userId: claims.sub, role: claims.role };
    next();
  } catch {
    next(AppError.unauthorized('Your session has expired'));
  }
};

export const requireRole =
  (...roles: Array<'admin' | 'staff'>): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(AppError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(AppError.forbidden());
    next();
  };
