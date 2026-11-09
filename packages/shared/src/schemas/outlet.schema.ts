import { z } from 'zod';

export const CreateOutletInputSchema = z.object({
  name: z.string().trim().min(2, 'Outlet name must be at least 2 characters'),
  slug: z.string().trim().min(2).optional(),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  city: z.string().trim().default('Hyderabad'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  deliveryRadiusKm: z.number().positive().default(7.0),
  minPrepMinutes: z.number().int().positive().default(20),
  isActive: z.boolean().default(true),
});

export const UpdateOutletInputSchema = z.object({
  name: z.string().trim().min(2).optional(),
  address: z.string().trim().min(5).optional(),
  city: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deliveryRadiusKm: z.number().positive().optional(),
  minPrepMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

