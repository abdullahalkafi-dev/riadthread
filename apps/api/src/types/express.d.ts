export {};

declare global {
  namespace Express {
    interface Request {
      /** Output of validateRequest(): parsed and typed by the route's Zod schemas. */
      validated: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
      /** Set by requireAuth() for signed-in admin requests. */
      auth?: { userId: string; role: 'admin' | 'staff' };
    }
  }
}
