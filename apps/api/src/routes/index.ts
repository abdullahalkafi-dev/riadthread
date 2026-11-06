import { Router } from 'express';
import { accountRouter, authRouter } from '../modules/auth/auth.route';

/** Global router: mounts every module router under /api/v1. */
export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/account', accountRouter);
