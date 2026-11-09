import { z } from 'zod';

export const FulfillmentTypeSchema = z.enum(['DELIVERY', 'PICKUP']);

export const CartItemInputSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemName: z.string().trim().min(1, 'Item name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  selectedOptions: z.record(z.string()).optional(),
});

export const CartValidationRequestSchema = z.object({
  outletId: z.string().min(1, 'Outlet ID is required'),
  fulfillmentType: FulfillmentTypeSchema,
  items: z.array(CartItemInputSchema).min(1, 'Cart must contain at least one item'),
  deliveryAddress: z
    .object({
      line1: z.string().trim().min(3, 'Address line 1 is required'),
      line2: z.string().trim().optional(),
      city: z.string().trim().default('Hyderabad'),
      distanceKm: z.number().nonnegative().optional(),
    })
    .optional(),
});

