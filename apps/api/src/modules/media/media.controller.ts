import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { pageMeta, sendResponse } from '../../utils/sendResponse';
import * as service from './media.service';

export async function upload(req: Request, res: Response) {
  if (!req.file) throw AppError.badRequest('Choose a file to upload');
  const media = await service.createFromUpload(req.file, req.auth!.userId);
  sendResponse(res, media, { status: 202, message: 'Upload received. Processing has started' });
}

export async function list(req: Request, res: Response) {
  const q = req.validated.query as { type?: string; status?: string; q?: string; page: number; limit: number };
  const { items, total } = await service.listMedia(q);
  sendResponse(res, items, { meta: pageMeta(total, q.page, q.limit) });
}

export async function get(req: Request, res: Response) {
  const { id } = req.validated.params as { id: string };
  sendResponse(res, await service.getMedia(id));
}

export async function retry(req: Request, res: Response) {
  const { id } = req.validated.params as { id: string };
  sendResponse(res, await service.retryProcessing(id), { message: 'Processing restarted' });
}

export async function remove(req: Request, res: Response) {
  const { id } = req.validated.params as { id: string };
  await service.deleteMedia(id);
  sendResponse(res, null, { message: 'File deleted' });
}
