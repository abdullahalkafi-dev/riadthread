import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import { allowedOrigins, env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { limiters } from './middlewares/rateLimit';
import { sanitizeBody } from './middlewares/sanitize';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
      credentials: true,
    }),
  );
  app.use(
    pinoHttp({
      logger,
      // Health checks would drown the log.
      autoLogging: { ignore: (req) => req.url === '/api/health' },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeBody);

  if (env.NOINDEX) {
    app.use((_req, res, next) => {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      next();
    });
  }

  // Liveness and readiness: "container started" is not enough evidence.
  app.get('/api/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({ status: dbReady ? 'ok' : 'degraded', db: dbReady });
  });

  app.use('/api/v1', limiters.api(), apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
