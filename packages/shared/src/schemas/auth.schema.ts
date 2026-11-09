import { z } from 'zod';

export const RoleSchema = z.enum(['CUSTOMER', 'KITCHEN_STAFF', 'OUTLET_MANAGER', 'ADMIN']);

export const RegisterInputSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Phone number must be between 10 and 15 digits, optionally prefixed with +'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  marketingConsent: z.boolean().optional().default(false),
  role: RoleSchema.optional().default('CUSTOMER'),
  assignedOutletId: z.string().optional(),
});

export const LoginInputSchema = z.object({
  emailOrPhone: z.string().trim().min(3, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

