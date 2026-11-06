import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { sendResponse } from '../../utils/sendResponse';
import { getOverview } from './analytics.service';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

/** One aggregated payload for the whole Overview screen. */
analyticsRouter.get('/overview', async (_req, res) => {
  sendResponse(res, await getOverview());
});
