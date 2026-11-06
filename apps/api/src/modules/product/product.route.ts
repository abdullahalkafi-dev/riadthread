import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  adminProductQuery,
  mediaOrderInput,
  objectId,
  productInput,
  productUpdate,
  publicProductQuery,
  slugSchema,
} from '@riad/shared';
import { requireAuth } from '../../middlewares/auth';
import { csrfGuard } from '../../middlewares/csrf';
import { validateRequest } from '../../middlewares/validateRequest';
import { pageMeta, sendResponse } from '../../utils/sendResponse';
import * as service from './product.service';

const idParams = z.object({ id: objectId });
const slugParams = z.object({ slug: slugSchema });

/** Public catalogue: cacheable by browsers and the CDN for a short time. */
export const publicProductRouter = Router();
const publicCache = (res: Response) => res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');

publicProductRouter.get('/products', validateRequest({ query: publicProductQuery }), async (req: Request, res: Response) => {
  const q = req.validated.query as service.PublicListQuery;
  const { items, total } = await service.publicList(q);
  publicCache(res);
  sendResponse(res, items, { meta: pageMeta(total, q.page, q.limit) });
});

publicProductRouter.get('/products/filters', async (_req, res) => {
  publicCache(res);
  sendResponse(res, await service.publicFilters());
});

publicProductRouter.get('/products/sitemap', async (_req, res) => {
  publicCache(res);
  sendResponse(res, await service.sitemapProducts());
});

publicProductRouter.get('/products/:slug', validateRequest({ params: slugParams }), async (req: Request, res: Response) => {
  const { slug } = req.validated.params as { slug: string };
  const product = await service.publicDetail(slug);
  publicCache(res);
  sendResponse(res, product);
});

/** Admin: products. */
export const adminProductRouter = Router();
adminProductRouter.use(requireAuth, csrfGuard);

adminProductRouter.get('/', validateRequest({ query: adminProductQuery }), async (req: Request, res: Response) => {
  const q = req.validated.query as Parameters<typeof service.adminList>[0];
  const { items, total } = await service.adminList(q);
  sendResponse(res, items, { meta: pageMeta(total, q.page, q.limit) });
});

adminProductRouter.post('/', validateRequest({ body: productInput }), async (req: Request, res: Response) => {
  sendResponse(res, await service.create(req.validated.body as never, req.auth!.userId), { status: 201, message: 'Product created' });
});

adminProductRouter.get('/:id', validateRequest({ params: idParams }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  sendResponse(res, await service.adminGet(id));
});

adminProductRouter.patch('/:id', validateRequest({ params: idParams, body: productUpdate }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  sendResponse(res, await service.update(id, req.validated.body as never, req.auth!.userId), { message: 'Saved' });
});

adminProductRouter.patch(
  '/:id/media/order',
  validateRequest({ params: idParams, body: mediaOrderInput }),
  async (req: Request, res: Response) => {
    const { id } = req.validated.params as { id: string };
    const { media } = req.validated.body as { media: never };
    sendResponse(res, await service.updateMediaOrder(id, media), { message: 'Order saved' });
  },
);

const statusRoute = (path: string, status: 'published' | 'draft' | 'archived', message: string) =>
  adminProductRouter.post(path, validateRequest({ params: idParams }), async (req: Request, res: Response) => {
    const { id } = req.validated.params as { id: string };
    sendResponse(res, await service.setStatus(id, status), { message });
  });
statusRoute('/:id/publish', 'published', 'Published. The website refreshes shortly');
statusRoute('/:id/unpublish', 'draft', 'Unpublished');
statusRoute('/:id/archive', 'archived', 'Archived');

adminProductRouter.post('/:id/duplicate', validateRequest({ params: idParams }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  sendResponse(res, await service.duplicate(id, req.auth!.userId), { status: 201, message: 'Duplicated as a draft' });
});

adminProductRouter.delete('/:id', validateRequest({ params: idParams }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  await service.remove(id);
  sendResponse(res, null, { message: 'Deleted' });
});
