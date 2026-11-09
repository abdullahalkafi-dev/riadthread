import { NextResponse, type NextRequest } from 'next/server';

/**
 * Dashboard responses are private: never stored by shared caches and never indexed.
 *
 * It deliberately does NOT redirect people without a session cookie. The access
 * cookie lives only 15 minutes and the refresh cookie is scoped to /api/v1/auth,
 * so a missing access cookie does not mean "signed out". The API is the only
 * real check; the dashboard shell asks it and sends visitors to /admin/login.
 */
export function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = { matcher: '/admin/:path*' };
