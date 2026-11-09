const prisma = require('../apps/server/src/prisma/client').default;

async function main() {
  const outlets = await prisma.outlet.findMany({ select: { id: true, name: true, slug: true } });
  console.log('Outlets in DB:', JSON.stringify(outlets, null, 2));
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log('Users in DB:', JSON.stringify(users, null, 2));
  const orders = await prisma.order.findMany({ select: { id: true, orderNumber: true, outletId: true, status: true, customerId: true, placedAt: true } });
  console.log('Orders in DB:', JSON.stringify(orders, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
