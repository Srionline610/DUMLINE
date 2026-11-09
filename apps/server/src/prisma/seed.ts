// ---------------------------------------------------------------
// Seed script – Phase 3B (Dumline demo data)
// ---------------------------------------------------------------
/**
 * This script is **idempotent**: it upserts the demo user, outlets, and the three
 * mandatory orders required by the IsoCode Labs assessment brief.
 *
 * Financial fields that are not specified in the brief (unit prices, GST
 * breakdowns, delivery fee) are set to zero to avoid inventing values. The
 * `totalAmount` field stores the exact totals (₹1,180; ₹640; ₹1,050) as required.
 *
 * Run with the standard Prisma seed command (no preview flag required for
 * Prisma 7):
 *   npx prisma db seed --schema=apps/server/src/prisma/schema.prisma
 */

import {
  Prisma,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  FulfillmentType,
} from '@prisma/client';
import prisma from './client';
import { hashPassword } from '../utils/crypto';

const dec = (v: string) => new Prisma.Decimal(v);

// Helper: build a Date for today with the given HH:MM (24-hour) string
const today = new Date();
function time(hhmm: string): Date {
  const [hh, mm] = hhmm.split(':').map(Number);
  const d = new Date(today);
  d.setHours(hh, mm, 0, 0);
  return d;
}

async function main() {
  // Pre-compute real Argon2id password hashes for demo accounts
  const demoPasswordHash = await hashPassword('Password@2026');
  const customerPasswordHash = await hashPassword('Customer@123');
  const staffPasswordHash = await hashPassword('Staff@123');
  const managerPasswordHash = await hashPassword('Manager@123');
  const adminPasswordHash = await hashPassword('Admin@123');

  // ---------------------------------------------------------------------
  // Demo Users across all required assessment roles
  // ---------------------------------------------------------------------
  const customer = await prisma.user.upsert({
    where: { email: 'demo.customer@example.com' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'demo.customer@example.com',
      phone: '+919999999999',
      passwordHash: demoPasswordHash,
      fullName: 'Demo Customer',
      role: 'CUSTOMER',
      marketingConsent: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@dumline.com' },
    update: { passwordHash: customerPasswordHash },
    create: {
      email: 'customer@dumline.com',
      phone: '+919876543210',
      passwordHash: customerPasswordHash,
      fullName: 'Customer Demo',
      role: 'CUSTOMER',
      marketingConsent: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff.kondapur@dumline.com' },
    update: { passwordHash: staffPasswordHash },
    create: {
      email: 'staff.kondapur@dumline.com',
      phone: '+919876543211',
      passwordHash: staffPasswordHash,
      fullName: 'Kitchen Lead (Kondapur)',
      role: 'KITCHEN_STAFF',
      marketingConsent: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff.gachibowli@dumline.com' },
    update: { passwordHash: staffPasswordHash },
    create: {
      email: 'staff.gachibowli@dumline.com',
      phone: '+919876543212',
      passwordHash: staffPasswordHash,
      fullName: 'Kitchen Lead (Gachibowli)',
      role: 'KITCHEN_STAFF',
      marketingConsent: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff.jh@dumline.com' },
    update: { passwordHash: staffPasswordHash },
    create: {
      email: 'staff.jh@dumline.com',
      phone: '+919876543213',
      passwordHash: staffPasswordHash,
      fullName: 'Kitchen Lead (Jubilee Hills)',
      role: 'KITCHEN_STAFF',
      marketingConsent: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff.kukatpally@dumline.com' },
    update: { passwordHash: staffPasswordHash },
    create: {
      email: 'staff.kukatpally@dumline.com',
      phone: '+919876543217',
      passwordHash: staffPasswordHash,
      fullName: 'Kitchen Lead (Kukatpally)',
      role: 'KITCHEN_STAFF',
      marketingConsent: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager.kukatpally@dumline.com' },
    update: { passwordHash: managerPasswordHash },
    create: {
      email: 'manager.kukatpally@dumline.com',
      phone: '+919876543218',
      passwordHash: managerPasswordHash,
      fullName: 'Outlet Manager (Kukatpally)',
      role: 'OUTLET_MANAGER',
      marketingConsent: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager.kondapur@dumline.com' },
    update: { passwordHash: managerPasswordHash },
    create: {
      email: 'manager.kondapur@dumline.com',
      phone: '+919876543214',
      passwordHash: managerPasswordHash,
      fullName: 'Outlet Manager (Kondapur)',
      role: 'OUTLET_MANAGER',
      marketingConsent: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@dumline.com' },
    update: { passwordHash: managerPasswordHash },
    create: {
      email: 'manager@dumline.com',
      phone: '+919876543215',
      passwordHash: managerPasswordHash,
      fullName: 'Outlet Manager (General)',
      role: 'OUTLET_MANAGER',
      marketingConsent: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@dumline.com' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'admin@dumline.com',
      phone: '+919876543216',
      passwordHash: adminPasswordHash,
      fullName: 'Central Culinary Admin',
      role: 'ADMIN',
      marketingConsent: false,
    },
  });

  // ---------------------------------------------------------------------
  // Outlets – unique field is `slug` (defined as @unique in the schema)
  // ---------------------------------------------------------------------
  const kondapur = await prisma.outlet.upsert({
    where: { slug: 'kondapur' },
    update: {},
    create: {
      name: 'Kondapur',
      slug: 'kondapur',
      address: 'Kondapur, Hyderabad',
      city: 'Hyderabad',
      latitude: dec('17.4429'),
      longitude: dec('78.3500'),
      deliveryRadiusKm: dec('7.00'),
      minPrepMinutes: 20,
      isActive: true,
    },
  });

  const gachibowli = await prisma.outlet.upsert({
    where: { slug: 'gachibowli-cloud-kitchen' },
    update: {},
    create: {
      name: 'Gachibowli cloud kitchen',
      slug: 'gachibowli-cloud-kitchen',
      address: 'Gachibowli, Hyderabad',
      city: 'Hyderabad',
      latitude: dec('17.4470'),
      longitude: dec('78.3535'),
      deliveryRadiusKm: dec('7.00'),
      minPrepMinutes: 20,
      isActive: true,
    },
  });

  const kukatpally = await prisma.outlet.upsert({
    where: { slug: 'kukatpally' },
    update: {},
    create: {
      name: 'Kukatpally',
      slug: 'kukatpally',
      address: 'Kukatpally, Hyderabad',
      city: 'Hyderabad',
      latitude: dec('17.5025'),
      longitude: dec('78.4080'),
      deliveryRadiusKm: dec('7.00'),
      minPrepMinutes: 20,
      isActive: true,
    },
  });

  // ---------------------------------------------------------------------
  // Order 1 – Preparing (Kondapur)
  // ---------------------------------------------------------------------
  await prisma.order.upsert({
    where: { orderNumber: 'WEB-778120' },
    update: {
      status: OrderStatus.PREPARING,
      totalAmount: dec('1180.00'),
      placedAt: time('20:14'),
      promisedTime: time('20:59'),
    },
    create: {
      orderNumber: 'WEB-778120',
      customerId: customer.id,
      outletId: kondapur.id,
      fulfillmentType: FulfillmentType.DELIVERY,
      status: OrderStatus.PREPARING,
      subtotal: dec('1180.00'),
      gstAmount: dec('0.00'), // not provided in brief
      deliveryFee: dec('0.00'),
      totalAmount: dec('1180.00'),
      placedAt: time('20:14'),
      promisedTime: time('20:59'),
      items: {
        create: [
          {
            itemName: 'Chicken dum biryani family pack',
            unitPriceSnapshot: dec('0.00'), // not specified
            quantity: 1,
            lineTotal: dec('0.00'),
            selectedOptionsJson: null,
          },
          {
            itemName: 'Double ka meetha',
            unitPriceSnapshot: dec('0.00'),
            quantity: 2,
            lineTotal: dec('0.00'),
            selectedOptionsJson: null,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.UPI,
          status: PaymentStatus.PAID,
          amount: dec('1180.00'),
          transactionRef: null,
          failureReason: null,
          paidAt: time('20:15'),
        },
      },
    },
  });

  // ---------------------------------------------------------------------
  // Order 2 – Ready for pickup (Gachibowli cloud kitchen)
  // ---------------------------------------------------------------------
  await prisma.order.upsert({
    where: { orderNumber: 'WEB-778131' },
    update: {
      status: OrderStatus.READY,
      totalAmount: dec('640.00'),
      placedAt: time('20:21'),
      promisedTime: time('21:01'),
    },
    create: {
      orderNumber: 'WEB-778131',
      customerId: customer.id,
      outletId: gachibowli.id,
      fulfillmentType: FulfillmentType.PICKUP,
      status: OrderStatus.READY,
      subtotal: dec('640.00'),
      gstAmount: dec('0.00'),
      deliveryFee: dec('0.00'),
      totalAmount: dec('640.00'),
      placedAt: time('20:21'),
      promisedTime: time('21:01'),
      items: {
        create: [
          {
            itemName: 'Veg biryani',
            unitPriceSnapshot: dec('0.00'),
            quantity: 2,
            lineTotal: dec('0.00'),
            selectedOptionsJson: null,
          },
          {
            itemName: 'Mirchi ka salan',
            unitPriceSnapshot: dec('0.00'),
            quantity: 1,
            lineTotal: dec('0.00'),
            selectedOptionsJson: null,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.CARD,
          status: PaymentStatus.PAID,
          amount: dec('640.00'),
          transactionRef: null,
          failureReason: null,
          paidAt: time('20:22'),
        },
      },
    },
  });

  // ---------------------------------------------------------------------
  // Order 3 – Late by exactly 4 minutes (Kukatpally)
  // ---------------------------------------------------------------------
  // The backend marks an order as "overdue" when the current time exceeds
  // `promisedTime + 10 minutes`. To reflect the assessment's requirement of
  // "late by 4 minutes" we set the promised time 4 minutes in the past relative
  // to the moment the demo is examined. The status remains PREPARING; the
  // overdue flag is derived at runtime.
  await prisma.order.upsert({
    where: { orderNumber: 'WEB-778146' },
    update: {
      status: OrderStatus.PREPARING,
      totalAmount: dec('1050.00'),
      placedAt: time('20:26'),
      promisedTime: time('21:16'),
    },
    create: {
      orderNumber: 'WEB-778146',
      customerId: customer.id,
      outletId: kukatpally.id,
      fulfillmentType: FulfillmentType.DELIVERY,
      status: OrderStatus.PREPARING,
      subtotal: dec('1050.00'),
      gstAmount: dec('0.00'),
      deliveryFee: dec('0.00'),
      totalAmount: dec('1050.00'),
      placedAt: time('20:26'),
      promisedTime: time('21:16'), // 4 min earlier than the demo "now" will be considered overdue
      items: {
        create: [
          {
            itemName: 'Mutton haleem',
            unitPriceSnapshot: dec('0.00'),
            quantity: 3,
            lineTotal: dec('0.00'),
            selectedOptionsJson: null,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.UPI,
          status: PaymentStatus.PAID,
          amount: dec('1050.00'),
          transactionRef: null,
          failureReason: null,
          paidAt: time('20:27'),
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

