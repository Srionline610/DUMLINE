import { Router, Request, Response, NextFunction } from 'express';
import { RegisterInputSchema, LoginInputSchema } from '@dumline/shared';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limit';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validateBody(RegisterInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.register(req.body);
      sendSuccess(res, result, 201, 'Account successfully created');
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateBody(LoginInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, result, 200, 'Authentication successful');
    } catch (err) {
      next(err);
    }
  }
);

authRouter.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await AuthService.getMe(req.user!.sub);
      sendSuccess(res, user, 200);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  '/logout',
  (_req: Request, res: Response) => {
    res.status(204).send();
  }
);

