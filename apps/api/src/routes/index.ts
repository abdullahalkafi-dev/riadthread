import { Router } from 'express';
import { accountRouter, authRouter } from '../modules/auth/auth.route';
import { adminCmsRouter, publicCmsRouter } from '../modules/cms/cms.route';
import { mediaRouter } from '../modules/media/media.route';

/** Global router: mounts every module router under /api/v1. */
export const apiRouter = Router();

// Public
apiRouter.use('/', publicCmsRouter);

// Authentication and admin
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/account', accountRouter);
apiRouter.use('/admin/media', mediaRouter);
apiRouter.use('/admin', adminCmsRouter);
