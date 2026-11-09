import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import { OutletSummary, CreateOutletInput, UpdateOutletInput } from '@dumline/shared';
import { AppError } from '../utils/errors';

export class OutletService {
  static formatOutlet(outlet: any): OutletSummary {
    return {
      id: outlet.id,
      name: outlet.name,
      slug: outlet.slug,
      address: outlet.address,
      city: outlet.city,
      latitude: Number(outlet.latitude),
      longitude: Number(outlet.longitude),
      deliveryRadiusKm: Number(outlet.deliveryRadiusKm),
      minPrepMinutes: outlet.minPrepMinutes,
      isActive: outlet.isActive,
      createdAt: outlet.createdAt?.toISOString(),
      updatedAt: outlet.updatedAt?.toISOString(),
    };
  }

  static async listOutlets(onlyActive = true): Promise<OutletSummary[]> {
    const outlets = await prisma.outlet.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });

    return outlets.map(this.formatOutlet);
  }

  static async getOutletByIdOrSlug(idOrSlug: string): Promise<OutletSummary> {
    const outlet = await prisma.outlet.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!outlet) {
      throw AppError.notFound(`Outlet with identifier '${idOrSlug}' not found`, 'OUTLET_NOT_FOUND');
    }

    return this.formatOutlet(outlet);
  }

  static async createOutlet(input: CreateOutletInput): Promise<OutletSummary> {
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await prisma.outlet.findUnique({
      where: { slug },
    });

    if (existing) {
      throw AppError.conflict(`An outlet with slug '${slug}' already exists`, 'OUTLET_SLUG_EXISTS');
    }

    const outlet = await prisma.outlet.create({
      data: {
        name: input.name,
        slug,
        address: input.address,
        city: input.city || 'Hyderabad',
        latitude: new Prisma.Decimal(input.latitude.toFixed(8)),
        longitude: new Prisma.Decimal(input.longitude.toFixed(8)),
        deliveryRadiusKm: new Prisma.Decimal((input.deliveryRadiusKm ?? 7.0).toFixed(2)),
        minPrepMinutes: input.minPrepMinutes ?? 20,
        isActive: input.isActive ?? true,
      },
    });

    return this.formatOutlet(outlet);
  }

  static async updateOutlet(id: string, input: UpdateOutletInput): Promise<OutletSummary> {
    const existing = await prisma.outlet.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Outlet with id '${id}' not found`, 'OUTLET_NOT_FOUND');
    }

    const data: Prisma.OutletUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.address !== undefined) data.address = input.address;
    if (input.city !== undefined) data.city = input.city;
    if (input.latitude !== undefined) data.latitude = new Prisma.Decimal(input.latitude.toFixed(8));
    if (input.longitude !== undefined) data.longitude = new Prisma.Decimal(input.longitude.toFixed(8));
    if (input.deliveryRadiusKm !== undefined) data.deliveryRadiusKm = new Prisma.Decimal(input.deliveryRadiusKm.toFixed(2));
    if (input.minPrepMinutes !== undefined) data.minPrepMinutes = input.minPrepMinutes;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const updated = await prisma.outlet.update({
      where: { id },
      data,
    });

    return this.formatOutlet(updated);
  }
}

