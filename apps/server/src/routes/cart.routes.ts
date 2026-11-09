import { Router, Request, Response, NextFunction } from 'express';
import { CartValidationRequestSchema } from '@dumline/shared';
import { validateBody } from '../middleware/validate';
import { CartService } from '../services/cart.service';
import { sendSuccess } from '../utils/response';

export const cartRouter = Router();

cartRouter.post(
  '/validate',
  validateBody(CartValidationRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await CartService.validateCart(req.body);
      sendSuccess(res, summary, 200, 'Cart validated successfully');
    } catch (err) {
      next(err);
    }
  }
);

