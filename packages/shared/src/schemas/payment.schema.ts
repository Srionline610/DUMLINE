import { z } from 'zod';
import { PaymentMethodSchema } from './order.schema';

export const ProcessPaymentRequestSchema = z
  .object({
    orderId: z.string().min(1, 'Order ID is required'),
    method: PaymentMethodSchema,
    vpa: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/, 'Invalid UPI ID format (e.g. name@upi)')
      .optional(),
    cardLast4: z
      .string()
      .trim()
      .regex(/^[0-9]{4}$/, 'Card last 4 digits must be exactly 4 digits')
      .optional(),
    idempotencyKey: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'UPI' && !data.vpa) {
        return false;
      }
      if (data.method === 'CARD' && !data.cardLast4) {
        return false;
      }
      return true;
    },
    {
      message: 'VPA is required for UPI payments; cardLast4 is required for Card payments',
      path: ['method'],
    }
  );

