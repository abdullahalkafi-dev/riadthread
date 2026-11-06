import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { MEDIA_STATUSES, MEDIA_TYPES, UPLOAD_LIMITS, objectId, paginationQuery } from '@riad/shared';
import { requireAuth } from '../../middlewares/auth';
import { csrfGuard } from '../../middlewares/csrf';
import { limiters } from '../../middlewares/rateLimit';
import { validateRequest } from '../../middlewares/validateRequest';
import * as controller from './media.controller';

const dir = join(tmpdir(), 'riad-uploads');
mkdirSync(dir, { recursive: true });

// Uploads are streamed to a temporary file, never held in memory.
const upload = multer({
  storage: multer.diskStorage({ destination: dir, filename: (_req, _file, cb) => cb(null, randomUUID()) }),
  limits: { fileSize: UPLOAD_LIMITS.video.maxBytes, files: 1 },
});

const idParams = z.object({ id: objectId });
const listQuery = paginationQuery.extend({
  type: z.enum(MEDIA_TYPES).optional(),
  status: z.enum(MEDIA_STATUSES).optional(),
  q: z.string().trim().max(80).optional(),
});

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

mediaRouter.get('/', validateRequest({ query: listQuery }), controller.list);
mediaRouter.get('/:id', validateRequest({ params: idParams }), controller.get);
mediaRouter.post('/', csrfGuard, limiters.upload(), upload.single('file'), controller.upload);
mediaRouter.post('/:id/retry', csrfGuard, validateRequest({ params: idParams }), controller.retry);
mediaRouter.delete('/:id', csrfGuard, validateRequest({ params: idParams }), controller.remove);
