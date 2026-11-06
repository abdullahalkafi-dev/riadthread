import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  /** Public address of the site. Everything else derives from this one value. */
  SITE_URL: z.string().url().default('http://localhost:3000'),
  /** Extra browser origins allowed to call the API, comma separated. */
  CORS_ORIGINS: z.string().default(''),
  TRUST_PROXY: bool.default(false),
  /** Staging addresses must stay out of search results. */
  NOINDEX: bool.default(false),

  COOKIE_SECURE: bool.default(false),
  COOKIE_DOMAIN: z.string().default(''),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TTL_MIN: z.coerce.number().int().min(1).default(15),
  REFRESH_TTL_DAYS: z.coerce.number().int().min(1).default(7),

  ADMIN_NAME: z.string().default('Admin'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(10).optional(),

  MONGODB_URI: z.string().min(10),

  /** Cache instance may evict keys; queue instance must not. Both are optional in dev. */
  REDIS_CACHE_URL: z.string().optional(),
  REDIS_QUEUE_URL: z.string().optional(),

  /** Any S3-compatible service: SeaweedFS locally and on the VPS, or R2 / S3. */
  S3_ENDPOINT: z.string().url().default('http://localhost:8333'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().default('riadthreads'),
  S3_SECRET_KEY: z.string().default('riadthreads-secret'),
  S3_BUCKET_PRIVATE: z.string().default('riad-private'),
  S3_BUCKET_PUBLIC: z.string().default('riad-public'),
  /** Base path the browser uses for public media (Caddy or the dev server proxies it to the public bucket). */
  MEDIA_BASE_URL: z.string().default('/media'),

  /** e.g. smtp://user:pass@host:587. Without it, e-mails are written to the log. */
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('Riad Threads <no-reply@localhost>'),
  /**
   * Comma-separated addresses that receive new-lead e-mails until the owner
   * saves their own list in Settings. Settings always wins once it is filled.
   */
  NOTIFY_EMAILS: z
    .string()
    .default('')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().email())),

  TURNSTILE_SECRET: z.string().optional(),

  /** Server-to-server call that refreshes the website after a publish. */
  WEB_REVALIDATE_URL: z.string().url().optional(),
  REVALIDATE_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  // An empty line such as "SMTP_URL=" means "not configured", not an empty value.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    // The logger is not available yet, so print directly and stop.
    console.error(`Invalid environment configuration:\n${lines.join('\n')}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = load();
export const isProd = env.NODE_ENV === 'production';

/** Origins that may send cookie-authenticated requests. */
export const allowedOrigins = [
  new URL(env.SITE_URL).origin,
  ...env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
];
