import express, { Router, type NextFunction, type Request, type Response } from 'express';
import { trackingBatch } from '@riad/shared';
import { limiters } from '../../middlewares/rateLimit';
import { validateRequest } from '../../middlewares/validateRequest';
import { AppError } from '../../utils/AppError';
import { ingestBatch } from './tracking.service';

export const trackingRouter = Router();

/**
 * navigator.sendBeacon often sends text/plain. Accept it, parse it ourselves and
 * keep it small, so the browser can flush events while a page is closing.
 */
trackingRouter.post(
  '/tracking/events',
  limiters.tracking(),
  express.text({ type: 'text/plain', limit: '64kb' }),
  (req: Request, _res: Response, next: NextFunction) => {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        return next(AppError.badRequest('The request body is not valid JSON'));
      }
    }
    next();
  },
  validateRequest({ body: trackingBatch }),
  async (req: Request, res: Response) => {
    const accepted = await ingestBatch(req.validated.body as never);
    // 202: received. Analytics must never make the page wait or show an error.
    res.status(202).json({ success: true, message: 'Accepted', data: { accepted } });
  },
);
