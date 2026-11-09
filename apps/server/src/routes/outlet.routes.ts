import { Router, Request, Response, NextFunction } from 'express';
import { CreateOutletInputSchema, UpdateOutletInputSchema } from '@dumline/shared';
import { validateBody } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { OutletService } from '../services/outlet.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';

export const outletRouter = Router();

outletRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activeOnly = req.query.all !== 'true';
      const outlets = await OutletService.listOutlets(activeOnly);
      sendSuccess(res, outlets, 200);
    } catch (err) {
      next(err);
    }
  }
);

outletRouter.get(
  '/:idOrSlug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outlet = await OutletService.getOutletByIdOrSlug(req.params.idOrSlug);
      sendSuccess(res, outlet, 200);
    } catch (err) {
      next(err);
    }
  }
);

outletRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validateBody(CreateOutletInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await OutletService.createOutlet(req.body);
      sendSuccess(res, created, 201, 'Outlet successfully created');
    } catch (err) {
      next(err);
    }
  }
);

outletRouter.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'OUTLET_MANAGER'),
  validateBody(UpdateOutletInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user!.role === 'OUTLET_MANAGER' && req.user!.assignedOutletId !== req.params.id) {
        throw AppError.forbidden('Outlet managers may only update their assigned outlet', 'CROSS_OUTLET_FORBIDDEN');
      }
      const updated = await OutletService.updateOutlet(req.params.id, req.body);
      sendSuccess(res, updated, 200, 'Outlet updated');
    } catch (err) {
      next(err);
    }
  }
);

