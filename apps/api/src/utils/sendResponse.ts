import type { Response } from 'express';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Uniform envelope: { success, message, data, meta? } */
export function sendResponse<T>(
  res: Response,
  data: T,
  opts: { status?: number; message?: string; meta?: PageMeta | Record<string, unknown> } = {},
) {
  return res.status(opts.status ?? 200).json({
    success: true,
    message: opts.message ?? 'OK',
    data,
    ...(opts.meta ? { meta: opts.meta } : {}),
  });
}

export function pageMeta(total: number, page: number, limit: number): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
