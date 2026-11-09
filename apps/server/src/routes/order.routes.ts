import { Router, Request, Response, NextFunction } from 'express';
import {
  CreateOrderRequestSchema,
  UpdateOrderStatusSchema,
  PrepTimeOverrideSchema,
} from '@dumline/shared';
import { validateBody } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { checkoutRateLimiter } from '../middleware/rate-limit';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import { socketEvents } from '../utils/socket';

export const orderRouter = Router();

// Create order: mandatory customer authentication
orderRouter.post(
  '/',
  authenticate,
  checkoutRateLimiter,
  validateBody(CreateOrderRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderService.createOrder(req.user!.sub, req.body);
      socketEvents.emitOrderCreated(order.outletId, order);
      sendSuccess(res, order, 201, 'Order successfully created');
    } catch (err) {
      next(err);
    }
  }
);

// Kitchen queue: dedicated endpoint for staff/manager/admin
orderRouter.get(
  '/kitchen/queue',
  authenticate,
  requireRole('KITCHEN_STAFF', 'OUTLET_MANAGER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestedOutletId = req.query.outletId as string | undefined;
      let effectiveOutletId: string;

      if (req.user!.role === 'ADMIN') {
        effectiveOutletId = requestedOutletId || 'ALL';
      } else {
        if (!req.user!.assignedOutletId) {
          throw AppError.forbidden('Staff user does not have an assigned outlet', 'NO_ASSIGNED_OUTLET');
        }
        if (requestedOutletId && requestedOutletId !== 'ALL' && requestedOutletId !== req.user!.assignedOutletId) {
          throw AppError.forbidden('Kitchen staff can only access their assigned outlet queue', 'CROSS_OUTLET_FORBIDDEN');
        }
        if (requestedOutletId === 'ALL') {
          throw AppError.forbidden('Only Central Admin can access All Outlets queue', 'CROSS_OUTLET_FORBIDDEN');
        }
        effectiveOutletId = req.user!.assignedOutletId;
      }

      const queue = await OrderService.getKitchenQueue(
        effectiveOutletId,
        {
          id: req.user!.sub,
          role: req.user!.role,
          assignedOutletId: req.user!.assignedOutletId,
        },
        req.query.status as string | undefined
      );

      sendSuccess(res, queue, 200);
    } catch (err) {
      next(err);
    }
  }
);

// List orders: customer sees own; staff sees assigned outlet; admin sees all
orderRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = {
        outletId: req.query.outletId as string | undefined,
        status: req.query.status as any,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
      };

      const orders = await OrderService.listOrders(
        {
          id: req.user!.sub,
          role: req.user!.role,
          assignedOutletId: req.user!.assignedOutletId,
        },
        query
      );

      sendSuccess(res, orders, 200);
    } catch (err) {
      next(err);
    }
  }
);

// Get single order detail
orderRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderService.getOrderById(req.params.id, {
        id: req.user!.sub,
        role: req.user!.role,
        assignedOutletId: req.user!.assignedOutletId,
      });

      sendSuccess(res, order, 200);
    } catch (err) {
      next(err);
    }
  }
);

// Update order status: validated against order state machine
orderRouter.patch(
  '/:id/status',
  authenticate,
  validateBody(UpdateOrderStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await OrderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.body.reason,
        {
          id: req.user!.sub,
          role: req.user!.role,
          assignedOutletId: req.user!.assignedOutletId,
        }
      );

      socketEvents.emitOrderStatusUpdated(updated.outletId, updated);
      sendSuccess(res, updated, 200, `Order status updated to ${req.body.status}`);
    } catch (err) {
      next(err);
    }
  }
);

// Manager override for preparation time
orderRouter.patch(
  '/:id/prep-time',
  authenticate,
  requireRole('OUTLET_MANAGER', 'ADMIN'),
  validateBody(PrepTimeOverrideSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await OrderService.overridePrepTime(
        req.params.id,
        req.body,
        {
          id: req.user!.sub,
          role: req.user!.role,
          assignedOutletId: req.user!.assignedOutletId,
        }
      );

      socketEvents.emitPrepTimeOverridden(updated.outletId, updated);
      sendSuccess(res, updated, 200, 'Promised preparation time updated');
    } catch (err) {
      next(err);
    }
  }
);

