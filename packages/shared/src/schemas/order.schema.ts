import { z } from 'zod';
import { FulfillmentTypeSchema } from './cart.schema';

export const OrderStatusSchema = z.enum([
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
]);

export const PaymentMethodSchema = z.enum(['UPI', 'CARD']);

export const CreateOrderItemInputSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemName: z.string().trim().min(1, 'Item name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  selectedOptions: z.record(z.string()).optional(),
});

export const CreateOrderRequestSchema = z.object({
  outletId: z.string().min(1, 'Outlet ID is required'),
  fulfillmentType: FulfillmentTypeSchema,
  items: z.array(CreateOrderItemInputSchema).min(1, 'Order must contain at least one item'),
  deliveryAddress: z
    .object({
      line1: z.string().trim().min(3),
      line2: z.string().trim().optional(),
      city: z.string().trim().default('Hyderabad'),
      distanceKm: z.number().nonnegative().optional(),
    })
    .optional(),
  paymentMethod: PaymentMethodSchema,
  idempotencyKey: z.string().trim().min(1).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  reason: z.string().trim().optional(),
});

export const PrepTimeOverrideSchema = z.object({
  promisedTime: z.string().datetime('Promised time must be a valid ISO datetime string'),
  reason: z.string().trim().min(3, 'A reason is required for preparation time overrides'),
});

