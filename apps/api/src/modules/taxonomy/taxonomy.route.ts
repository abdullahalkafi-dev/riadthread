import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { objectId, taxonomyInput, taxonomyUpdate } from '@riad/shared';
import { requireAuth } from '../../middlewares/auth';
import { csrfGuard } from '../../middlewares/csrf';
import { validateRequest } from '../../middlewares/validateRequest';
import { sendResponse } from '../../utils/sendResponse';
import type { TaxonomyKind } from './taxonomy.model';
import * as service from './taxonomy.service';

const idParams = z.object({ id: objectId });

/** Builds the admin CRUD router for categories or collections. */
export function adminTaxonomyRouter(kind: TaxonomyKind) {
  const router = Router();
  router.use(requireAuth, csrfGuard);

  router.get('/', async (_req, res) => sendResponse(res, await service.adminList(kind)));

  router.post('/', validateRequest({ body: taxonomyInput }), async (req: Request, res: Response) => {
    sendResponse(res, await service.create(kind, req.validated.body as never), { status: 201, message: 'Created' });
  });

  router.patch('/:id', validateRequest({ params: idParams, body: taxonomyUpdate }), async (req: Request, res: Response) => {
    const { id } = req.validated.params as { id: string };
    sendResponse(res, await service.update(kind, id, req.validated.body as never), { message: 'Saved' });
  });

  router.delete('/:id', validateRequest({ params: idParams }), async (req: Request, res: Response) => {
    const { id } = req.validated.params as { id: string };
    await service.remove(kind, id);
    sendResponse(res, null, { message: 'Deleted' });
  });

  return router;
}

/** Public lists for navigation, filters and the homepage tiles. */
export const publicTaxonomyRouter = Router();
publicTaxonomyRouter.get('/categories', async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
  sendResponse(res, await service.publicList('category'));
});
publicTaxonomyRouter.get('/collections', async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
  sendResponse(res, await service.publicList('collection'));
});
