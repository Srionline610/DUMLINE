import { Router, Request, Response, NextFunction } from 'express';
import {
  CreateMenuItemSchema,
  UpdateMenuItemSchema,
  OutletMenuOverrideSchema,
} from '@dumline/shared';
import { validateBody } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { MenuService } from '../services/menu.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import { socketEvents } from '../utils/socket';

export const menuRouter = Router();

// Public guest menu browsing (categorized with optional outlet overrides)
menuRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = typeof req.query.outletId === 'string' ? req.query.outletId : undefined;
      const categories = MenuService.getCategorizedMenu(outletId);
      sendSuccess(res, categories, 200);
    } catch (err) {
      next(err);
    }
  }
);

// All raw menu items
menuRouter.get(
  '/items',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = typeof req.query.outletId === 'string' ? req.query.outletId : undefined;
      const items = MenuService.getMenuForOutlet(outletId);
      sendSuccess(res, items, 200);
    } catch (err) {
      next(err);
    }
  }
);

menuRouter.get(
  '/items/:id',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = MenuService.getItemById(req.params.id);
      if (!item) {
        throw AppError.notFound(`Menu item '${req.params.id}' not found`, 'ITEM_NOT_FOUND');
      }
      sendSuccess(res, item, 200);
    } catch (err) {
      next(err);
    }
  }
);

// Admin: create menu item
menuRouter.post(
  '/items',
  authenticate,
  requireRole('ADMIN'),
  validateBody(CreateMenuItemSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = MenuService.createMenuItem(req.body);
      sendSuccess(res, created, 201, 'Menu item created');
    } catch (err) {
      next(err);
    }
  }
);

// Admin: update menu item
menuRouter.patch(
  '/items/:id',
  authenticate,
  requireRole('ADMIN'),
  validateBody(UpdateMenuItemSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = MenuService.updateMenuItem(req.params.id, req.body);
      sendSuccess(res, updated, 200, 'Menu item updated');
    } catch (err) {
      next(err);
    }
  }
);

// Admin / Outlet Manager: outlet price and availability overrides (86ing)
menuRouter.post(
  '/overrides',
  authenticate,
  requireRole('ADMIN', 'OUTLET_MANAGER'),
  validateBody(OutletMenuOverrideSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user!.role === 'OUTLET_MANAGER' && req.user!.assignedOutletId !== req.body.outletId) {
        throw AppError.forbidden('Outlet managers may only configure overrides for their assigned outlet', 'CROSS_OUTLET_FORBIDDEN');
      }
      MenuService.setOutletOverride(req.body);
      socketEvents.emitMenuAvailabilityUpdated(req.body.outletId, req.body);
      sendSuccess(res, { success: true, override: req.body }, 200, 'Outlet override configured');
    } catch (err) {
      next(err);
    }
  }
);

