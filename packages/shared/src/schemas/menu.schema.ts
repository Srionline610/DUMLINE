import { z } from 'zod';

export const PrepComplexityTagSchema = z.enum([
  'DUM_COOKING',
  'TANDOOR',
  'CURRY_STATION',
  'READY_TO_SERVE',
  'DESSERT_BEVERAGE',
]);

export const MenuItemOptionSchema = z.object({
  name: z.string().trim().min(1),
  priceModifier: z.number().default(0),
});

export const MenuItemOptionGroupSchema = z.object({
  name: z.string().trim().min(1),
  required: z.boolean().default(false),
  options: z.array(MenuItemOptionSchema).min(1),
});

export const CreateMenuItemSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  slug: z.string().trim().min(2).optional(),
  description: z.string().trim().default(''),
  category: z.string().trim().min(2, 'Category is required'),
  basePrice: z.number().positive('Base price must be positive'),
  prepComplexityTag: PrepComplexityTagSchema,
  basePrepMinutes: z.number().int().min(1).default(15),
  isVegetarian: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  optionGroups: z.array(MenuItemOptionGroupSchema).optional(),
});

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial();

export const OutletMenuOverrideSchema = z.object({
  outletId: z.string().uuid().or(z.string().min(1)),
  itemId: z.string().min(1),
  priceOverride: z.number().positive().optional(),
  isAvailableOverride: z.boolean().optional(),
});

