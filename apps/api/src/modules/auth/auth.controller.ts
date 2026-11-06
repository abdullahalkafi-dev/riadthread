import type { CookieOptions, Request, Response } from 'express';
import type { LoginInput } from '@riad/shared';
import { env } from '../../config/env';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import { sendResponse } from '../../utils/sendResponse';
import * as service from './auth.service';

const base: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

function setSessionCookies(res: Response, access: string, refresh: string) {
  res.cookie(ACCESS_COOKIE, access, { ...base, path: '/', maxAge: env.ACCESS_TTL_MIN * 60_000 });
  // The refresh cookie is only ever sent to the auth endpoints.
  res.cookie(REFRESH_COOKIE, refresh, {
    ...base,
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TTL_DAYS * 86_400_000,
  });
}

function clearSessionCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/v1/auth' });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.validated.body as LoginInput;
  const result = await service.login(email, password, req.get('user-agent'));
  setSessionCookies(res, result.access, result.refresh);
  sendResponse(res, { user: result.user }, { message: 'Signed in' });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw AppError.unauthorized();
  try {
    const result = await service.refresh(token, req.get('user-agent'));
    setSessionCookies(res, result.access, result.refresh);
    sendResponse(res, { user: result.user }, { message: 'Session refreshed' });
  } catch (err) {
    clearSessionCookies(res);
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  await service.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
  clearSessionCookies(res);
  sendResponse(res, null, { message: 'Signed out' });
}

export async function me(req: Request, res: Response) {
  sendResponse(res, { user: await service.currentUser(req.auth!.userId) });
}
