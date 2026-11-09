import { Router, Request, Response, NextFunction } from 'express';
import { ProcessPaymentRequestSchema } from '@dumline/shared';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { checkoutRateLimiter } from '../middleware/rate-limit';
import { PaymentService } from '../services/payment.service';
import { sendSuccess } from '../utils/response';
import { socketEvents } from '../utils/socket';
import prisma from '../prisma/client';

export const paymentRouter = Router();

paymentRouter.post(
  '/',
  authenticate,
  checkoutRateLimiter,
  validateBody(ProcessPaymentRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await PaymentService.processPayment(req.body);

      // On successful payment, notify the kitchen display system immediately via Socket.IO
      if (result.status === 'PAID') {
        const order = await prisma.order.findUnique({
          where: { id: result.orderId },
          select: { outletId: true, orderNumber: true, status: true },
        });
        if (order) {
          socketEvents.emitOrderCreated(order.outletId, {
            id: result.orderId,
            orderNumber: order.orderNumber,
            status: order.status,
          });
          socketEvents.emitOrderStatusUpdated(order.outletId, {
            id: result.orderId,
            orderNumber: order.orderNumber,
            status: order.status,
          });
        }
      }

      const statusCode = result.status === 'PAID' ? 200 : 402;
      sendSuccess(
        res,
        result,
        statusCode,
        result.status === 'PAID' ? 'Payment processed successfully' : 'Payment simulation failed'
      );
    } catch (err) {
      next(err);
    }
  }
);

paymentRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id);
      sendSuccess(res, payment, 200);
    } catch (err) {
      next(err);
    }
  }
);

