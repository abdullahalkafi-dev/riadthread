import { Router } from 'express';
import { changePasswordSchema, loginSchema, updateAccountSchema } from '@riad/shared';
import { requireAuth } from '../../middlewares/auth';
import { csrfGuard } from '../../middlewares/csrf';
import { limiters } from '../../middlewares/rateLimit';
import { validateRequest } from '../../middlewares/validateRequest';
import { sendResponse } from '../../utils/sendResponse';
import * as controller from './auth.controller';
import * as userService from '../user/user.service';
import type { Request, Response } from 'express';

export const authRouter = Router();
const loginLimit = limiters.login();

authRouter.post('/login', csrfGuard, loginLimit, validateRequest({ body: loginSchema }), controller.login);
authRouter.post('/refresh', csrfGuard, controller.refresh);
authRouter.post('/logout', csrfGuard, controller.logout);
authRouter.get('/me', requireAuth, controller.me);

/** Account settings for the signed-in admin. */
export const accountRouter = Router();
accountRouter.use(requireAuth, csrfGuard);

accountRouter.patch('/', validateRequest({ body: updateAccountSchema }), async (req: Request, res: Response) => {
  const user = await userService.updateAccount(req.auth!.userId, req.validated.body as { name?: string; email?: string });
  sendResponse(res, { user }, { message: 'Account updated' });
});

accountRouter.post('/password', validateRequest({ body: changePasswordSchema }), async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.validated.body as { currentPassword: string; newPassword: string };
  await userService.changePassword(req.auth!.userId, currentPassword, newPassword);
  sendResponse(res, null, { message: 'Password changed. Other devices have been signed out' });
});
