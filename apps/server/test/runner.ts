import { after } from 'node:test';
import prisma from '../src/prisma/client';

console.log('🚀 Loading Dumline Backend Test Suites...');

// Load test suites
require('./fixtures.test');
require('./auth.test');
require('./cart-checkout.test');
require('./payment-idempotency.test');
require('./order-state-machine.test');
require('./api-integration.test');
require('./ai-prep.test');
require('./customer-e2e.test');
require('./customer-to-kitchen-flow.test');
require('./rbac-access.test');
require('./master-audit.test');
require('./branch-kds.test');

// Global teardown after all test suites complete
after(async () => {
  console.log('\n🧹 All suites completed. Cleaning up test orders and disconnecting database client...');
  try {
    await prisma.order.deleteMany({ where: { orderNumber: { startsWith: 'DL-' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
  } catch (e) {
    // ignore
  }
  await prisma.$disconnect();
  process.exit(0);
});
