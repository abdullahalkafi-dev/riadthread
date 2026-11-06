import { Router } from 'express';
import { analyticsRouter } from '../modules/analytics/analytics.route';
import { accountRouter, authRouter } from '../modules/auth/auth.route';
import { adminCmsRouter, publicCmsRouter } from '../modules/cms/cms.route';
import { adminEnquiryRouter, publicEnquiryRouter } from '../modules/enquiry/enquiry.route';
import { mediaRouter } from '../modules/media/media.route';
import { trackingRouter } from '../modules/tracking/tracking.route';
import { adminProductRouter, publicProductRouter } from '../modules/product/product.route';
import { adminTaxonomyRouter, publicTaxonomyRouter } from '../modules/taxonomy/taxonomy.route';

/** Global router: mounts every module router under /api/v1. */
export const apiRouter = Router();

// Public
apiRouter.use('/', publicCmsRouter);
apiRouter.use('/', publicTaxonomyRouter);
apiRouter.use('/', publicProductRouter);
apiRouter.use('/', publicEnquiryRouter);
apiRouter.use('/', trackingRouter);

// Authentication and admin
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/account', accountRouter);
apiRouter.use('/admin/media', mediaRouter);
apiRouter.use('/admin/products', adminProductRouter);
apiRouter.use('/admin/analytics', analyticsRouter);
apiRouter.use('/admin/enquiries', adminEnquiryRouter);
apiRouter.use('/admin/categories', adminTaxonomyRouter('category'));
apiRouter.use('/admin/collections', adminTaxonomyRouter('collection'));
apiRouter.use('/admin', adminCmsRouter);
