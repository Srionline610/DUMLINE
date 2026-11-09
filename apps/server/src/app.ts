import express, { Request, Response, NextFunction } from 'express';
import { authRouter } from './routes/auth.routes';
import { outletRouter } from './routes/outlet.routes';
import { menuRouter } from './routes/menu.routes';
import { cartRouter } from './routes/cart.routes';
import { orderRouter } from './routes/order.routes';
import { paymentRouter } from './routes/payment.routes';
import { adminRouter } from './routes/admin.routes';
import { AppError } from './utils/errors';
import { sendError } from './utils/response';

export const app = express();

// Middleware
app.use(express.json());

// Basic CORS headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'dumline-server',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/outlets', outletRouter);
app.use('/api/menu', menuRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`Cannot ${req.method} ${req.path}`, 'ROUTE_NOT_FOUND'));
});

// Centralized Error Handling Middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.code, err.statusCode, err.details);
    return;
  }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  sendError(res, message, 'INTERNAL_ERROR', 500);
});

export default app;

