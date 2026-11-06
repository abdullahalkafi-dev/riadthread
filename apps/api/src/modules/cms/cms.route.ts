import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { contentBlockInput, homeLayoutInput, pageInput, settingsInput } from '@riad/shared';
import { requireAuth } from '../../middlewares/auth';
import { csrfGuard } from '../../middlewares/csrf';
import { validateRequest } from '../../middlewares/validateRequest';
import { sendResponse } from '../../utils/sendResponse';
import { getSettings, updateSettings } from '../settings/settings.service';
import * as cms from './cms.service';

const keyParams = z.object({ key: z.string().min(1).max(40) });

/** Public: the homepage payload and text pages. */
export const publicCmsRouter = Router();
publicCmsRouter.get('/site', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
  sendResponse(res, await cms.getSitePayload());
});
publicCmsRouter.get('/pages/:key', validateRequest({ params: keyParams }), async (req: Request, res: Response) => {
  const { key } = req.validated.params as { key: string };
  sendResponse(res, await cms.getPage(key));
});

/** Admin: content blocks, layout, pages and settings. */
export const adminCmsRouter = Router();
adminCmsRouter.use(requireAuth, csrfGuard);

adminCmsRouter.get('/content/blocks', async (_req, res) => sendResponse(res, await cms.listBlocks()));
adminCmsRouter.put(
  '/content/blocks/:key',
  validateRequest({ params: keyParams, body: contentBlockInput }),
  async (req: Request, res: Response) => {
    const { key } = req.validated.params as { key: string };
    const body = req.validated.body as { visible?: boolean; data: Record<string, unknown> };
    sendResponse(res, await cms.saveBlock(key, body, req.auth!.userId), { message: 'Saved' });
  },
);

adminCmsRouter.get('/content/layout', async (_req, res) => sendResponse(res, await cms.getLayout()));
adminCmsRouter.put('/content/layout', validateRequest({ body: homeLayoutInput }), async (req: Request, res: Response) => {
  const { sections } = req.validated.body as { sections: Array<{ key: string; visible: boolean }> };
  sendResponse(res, await cms.saveLayout(sections, req.auth!.userId), { message: 'Saved' });
});

adminCmsRouter.get('/content/pages/:key', validateRequest({ params: keyParams }), async (req: Request, res: Response) => {
  const { key } = req.validated.params as { key: string };
  sendResponse(res, await cms.getPage(key));
});
adminCmsRouter.put(
  '/content/pages/:key',
  validateRequest({ params: keyParams, body: pageInput }),
  async (req: Request, res: Response) => {
    const { key } = req.validated.params as { key: string };
    sendResponse(res, await cms.savePage(key, req.validated.body as never, req.auth!.userId), { message: 'Saved' });
  },
);

adminCmsRouter.get('/settings', async (_req, res) => sendResponse(res, await getSettings()));
adminCmsRouter.put('/settings', validateRequest({ body: settingsInput }), async (req: Request, res: Response) => {
  sendResponse(res, await updateSettings(req.validated.body as never), { message: 'Settings saved' });
});
