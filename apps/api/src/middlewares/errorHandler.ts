import type { ErrorRequestHandler, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { MulterError } from 'multer';
import { isProd } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`No route for ${req.method} ${req.path}`));
};

interface MongoError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let status = 500;
  let message = 'Something went wrong on our side';
  let sources: { path: string; message: string }[] = [];

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    sources = err.errorSources;
  } else if (err instanceof MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large' : 'The upload could not be read';
  } else if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError) {
    status = 401;
    message = 'Your session has expired. Please sign in again';
  } else if ((err as MongoError)?.code === 11000) {
    status = 409;
    const field = Object.keys((err as MongoError).keyPattern ?? {})[0] ?? 'value';
    message = `That ${field} is already in use`;
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'The request is too large';
  } else if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    message = 'The request body is not valid JSON';
  }

  if (status >= 500) logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  res.status(status).json({
    success: false,
    message,
    errorSources: sources,
    ...(isProd ? {} : { stack: err?.stack }),
  });
};
