import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import prisma from '../prisma/client';

export const adminRouter = Router();

const StaffAssignmentSchema = z.object({
  staffUserId: z.string().min(1, 'Staff User ID is required'),
  outletId: z.string().min(1, 'Outlet ID is required'),
});

adminRouter.get(
  '/staff-assignments',
  authenticate,
  requireRole('ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['KITCHEN_STAFF', 'OUTLET_MANAGER'] } },
        select: { id: true, email: true, fullName: true, role: true },
      });
      sendSuccess(res, staffUsers, 200, 'Staff assignments retrieved');
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/staff-assignments',
  authenticate,
  requireRole('ADMIN'),
  validateBody(StaffAssignmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { staffUserId, outletId } = req.body;
      const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
      if (!outlet) {
        return next(new Error(`Outlet '${outletId}' not found`));
      }

      AuthService.assignStaff(staffUserId, outletId);
      sendSuccess(res, { staffUserId, outletId, outletName: outlet.name }, 200, 'Staff assigned to outlet');
    } catch (err) {
      next(err);
    }
  }
);

