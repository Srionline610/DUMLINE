import prisma from '../prisma/client';
import { RegisterInput, LoginInput, AuthResponseData, UserSummary, Role } from '@dumline/shared';
import { hashPassword, verifyPassword, signJwt } from '../utils/crypto';
import { AppError } from '../utils/errors';

// In-memory staff outlet assignment store (can also be populated on registration/admin assign)
const staffOutletMap = new Map<string, string>();

export class AuthService {
  static getStaffOutlet(userId: string): string | null {
    return staffOutletMap.get(userId) || null;
  }

  static setStaffOutlet(userId: string, outletId: string): void {
    staffOutletMap.set(userId, outletId);
  }

  static async register(input: RegisterInput): Promise<AuthResponseData> {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phone: input.phone }],
      },
    });

    if (existing) {
      if (existing.email === input.email) {
        throw AppError.conflict('An account with this email address already exists', 'EMAIL_EXISTS');
      }
      throw AppError.conflict('An account with this phone number already exists', 'PHONE_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);
    const userRole = input.role || 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        fullName: input.fullName,
        role: userRole as any,
        marketingConsent: Boolean(input.marketingConsent),
      },
    });

    if (input.assignedOutletId && (userRole === 'KITCHEN_STAFF' || userRole === 'OUTLET_MANAGER')) {
      staffOutletMap.set(user.id, input.assignedOutletId);
    }

    let assignedOutletId = staffOutletMap.get(user.id) || null;
    if (!assignedOutletId && (user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER')) {
      const outletSlug = user.email.includes('gachibowli')
        ? 'gachibowli-cloud-kitchen'
        : user.email.includes('kukatpally')
        ? 'kukatpally'
        : 'kondapur';
      const outlet = await prisma.outlet.findFirst({ where: { slug: outletSlug } });
      if (outlet) {
        assignedOutletId = outlet.id;
        staffOutletMap.set(user.id, outlet.id);
      }
    }

    const token = signJwt({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      assignedOutletId,
    });

    const userSummary: UserSummary = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as Role,
      marketingConsent: user.marketingConsent,
      assignedOutletId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return { token, user: userSummary };
  }

  static async login(input: LoginInput): Promise<AuthResponseData> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.emailOrPhone }, { phone: input.emailOrPhone }],
      },
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email/phone or password', 'INVALID_CREDENTIALS');
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email/phone or password', 'INVALID_CREDENTIALS');
    }

    let assignedOutletId = staffOutletMap.get(user.id) || null;
    if (!assignedOutletId && (user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER')) {
      const outletSlug = user.email.includes('gachibowli')
        ? 'gachibowli-cloud-kitchen'
        : user.email.includes('kukatpally')
        ? 'kukatpally'
        : 'kondapur';
      const outlet = await prisma.outlet.findFirst({ where: { slug: outletSlug } });
      if (outlet) {
        assignedOutletId = outlet.id;
        staffOutletMap.set(user.id, outlet.id);
      }
    }

    const token = signJwt({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      assignedOutletId,
    });

    const userSummary: UserSummary = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as Role,
      marketingConsent: user.marketingConsent,
      assignedOutletId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return { token, user: userSummary };
  }

  static async getMe(userId: string): Promise<UserSummary> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    let assignedOutletId = staffOutletMap.get(user.id) || null;
    if (!assignedOutletId && (user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER')) {
      const outletSlug = user.email.includes('gachibowli')
        ? 'gachibowli-cloud-kitchen'
        : user.email.includes('kukatpally')
        ? 'kukatpally'
        : 'kondapur';
      const outlet = await prisma.outlet.findFirst({ where: { slug: outletSlug } });
      if (outlet) {
        assignedOutletId = outlet.id;
        staffOutletMap.set(user.id, outlet.id);
      }
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as Role,
      marketingConsent: user.marketingConsent,
      assignedOutletId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static assignStaff(staffUserId: string, outletId: string): void {
    staffOutletMap.set(staffUserId, outletId);
  }
}

