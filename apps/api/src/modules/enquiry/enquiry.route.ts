import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  addNoteSchema,
  adminEnquiryQuery,
  createEnquirySchema,
  enquiryExportQuery,
  followUpSchema,
  lineSheetRequestSchema,
  objectId,
  updateStatusSchema,
  type CreateEnquiryInput,
  type LineSheetRequestInput,
} from '@riad/shared';
import { requireAuth } from '../../middlewares/auth';
import { csrfGuard } from '../../middlewares/csrf';
import { limiters } from '../../middlewares/rateLimit';
import { validateRequest } from '../../middlewares/validateRequest';
import { pageMeta, sendResponse } from '../../utils/sendResponse';
import { retryFailedEmails } from '../notification/notification.service';
import * as service from './enquiry.service';

const idParams = z.object({ id: objectId });

/** Public: submit an enquiry or ask for the line sheet. No account needed. */
export const publicEnquiryRouter = Router();
const submitLimit = limiters.enquiry();

publicEnquiryRouter.post('/enquiries', submitLimit, validateRequest({ body: createEnquirySchema }), async (req: Request, res: Response) => {
  const result = await service.submitEnquiry(req.validated.body as CreateEnquiryInput, { ip: req.ip });
  // A retry of an accepted enquiry answers 200 with the same reference; a new one answers 201.
  sendResponse(res, { ref: result.ref }, { status: result.duplicate ? 200 : 201, message: 'We have received your enquiry' });
});

publicEnquiryRouter.post('/line-sheet', submitLimit, validateRequest({ body: lineSheetRequestSchema }), async (req: Request, res: Response) => {
  const result = await service.submitLineSheetRequest(req.validated.body as LineSheetRequestInput, { ip: req.ip });
  sendResponse(res, { ref: result.ref }, { status: result.duplicate ? 200 : 201, message: 'We have received your request' });
});

/** Admin: the lead pipeline. */
export const adminEnquiryRouter = Router();
adminEnquiryRouter.use(requireAuth, csrfGuard);

adminEnquiryRouter.get('/', validateRequest({ query: adminEnquiryQuery }), async (req: Request, res: Response) => {
  const q = req.validated.query as service.AdminQuery;
  const { items, total, statusCounts } = await service.adminList(q);
  sendResponse(res, items, { meta: { ...pageMeta(total, q.page, q.limit), statusCounts } });
});

adminEnquiryRouter.get('/export.csv', validateRequest({ query: enquiryExportQuery }), async (req: Request, res: Response) => {
  const csv = await service.exportCsv(req.validated.query as Omit<service.AdminQuery, 'page' | 'limit'>);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(`﻿${csv}`);
});

adminEnquiryRouter.get('/:id', validateRequest({ params: idParams }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  sendResponse(res, await service.adminGet(id));
});

adminEnquiryRouter.patch('/:id/status', validateRequest({ params: idParams, body: updateStatusSchema }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  const { status } = req.validated.body as { status: never };
  sendResponse(res, await service.updateStatus(id, status), { message: 'Status updated' });
});

adminEnquiryRouter.post('/:id/notes', validateRequest({ params: idParams, body: addNoteSchema }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  const { text } = req.validated.body as { text: string };
  sendResponse(res, await service.addNote(id, text, req.auth!.userId), { status: 201, message: 'Note added' });
});

adminEnquiryRouter.patch('/:id/follow-up', validateRequest({ params: idParams, body: followUpSchema }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  const { followUpAt } = req.validated.body as { followUpAt: Date | null };
  sendResponse(res, await service.setFollowUp(id, followUpAt), { message: 'Follow-up saved' });
});

adminEnquiryRouter.post('/:id/emails/retry', validateRequest({ params: idParams }), async (req: Request, res: Response) => {
  const { id } = req.validated.params as { id: string };
  const retried = await retryFailedEmails(id);
  sendResponse(res, { retried }, { message: retried ? 'Sending again' : 'Nothing to retry' });
});
