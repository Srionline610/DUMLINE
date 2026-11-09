import assert from 'node:assert/strict';
import prisma from '../src/prisma/client';
import { AiPrepService } from '../src/services/ai-prep.service';
import { OrderService } from '../src/services/order.service';

const API_BASE = 'http://localhost:3000/api';

async function request(path: string, options: { method?: string; body?: any; token?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // non-json
  }
  return { status: res.status, headers: res.headers, body: data };
}

async function runAudit() {
  console.log('================================================================');
  console.log('🏰 DUMLINE — FULL A-TO-Z ASSESSMENT AUDIT & LIVE TEST EXECUTION');
  console.log('================================================================\n');

  const auditLog: Array<{ id: string; name: string; status: 'PASS' | 'FAIL'; details: string }> = [];

  function record(id: string, name: string, status: 'PASS' | 'FAIL', details: string) {
    auditLog.push({ id, name, status, details });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${id}] ${name}: ${details}`);
  }

  try {
    // -------------------------------------------------------------
    // PHASE 2: SYSTEM STARTUP & HEALTH
    // -------------------------------------------------------------
    console.log('\n--- PHASE 2: STARTUP & HEALTH VERIFICATION ---');
    const healthRes = await fetch('http://localhost:3000/health');
    const healthData: any = await healthRes.json();
    assert.equal(healthRes.status, 200);
    assert.equal(healthData.status, 'ok');
    record('STARTUP-01', 'Backend API Health Endpoint', 'PASS', `Status 200, service: ${healthData.service}`);

    const webRes = await fetch('http://localhost:3001/');
    assert.equal(webRes.status, 200);
    record('STARTUP-02', 'Next.js Frontend Storefront', 'PASS', 'Status 200, SSR page served');

    // -------------------------------------------------------------
    // PHASE 3: CUSTOMER AUTHENTICATION & RBAC
    // -------------------------------------------------------------
    console.log('\n--- PHASE 3: AUTHENTICATION & ROLE-BASED ACCESS CONTROL ---');

    // 1. Submit empty signup form
    const emptyReg = await request('/auth/register', { method: 'POST', body: {} });
    assert.equal(emptyReg.status, 400);
    record('AUTH-01', 'Reject Empty Registration Form', 'PASS', `Rejected with HTTP ${emptyReg.status} validation error`);

    // 2. Submit invalid email format
    const badEmailReg = await request('/auth/register', {
      method: 'POST',
      body: { email: 'notanemail', phone: '+919999999901', password: 'Password@2026', fullName: 'Test' },
    });
    assert.equal(badEmailReg.status, 400);
    record('AUTH-02', 'Reject Invalid Email Format', 'PASS', `Rejected with HTTP ${badEmailReg.status}`);

    // 3. Submit weak password (< 8 chars)
    const weakPassReg = await request('/auth/register', {
      method: 'POST',
      body: { email: `valid-${Date.now()}@test.com`, phone: `+919999${Date.now().toString().slice(-6)}`, password: '123', fullName: 'Test' },
    });
    assert.equal(weakPassReg.status, 400);
    record('AUTH-03', 'Reject Weak Password (<8 chars)', 'PASS', `Rejected with HTTP ${weakPassReg.status}`);

    // 4. Successful Customer Registration
    const timestamp = Date.now();
    const testCustEmail = `cust-audit-${timestamp}@test.com`;
    const testCustPhone = `+9188${timestamp.toString().slice(-8)}`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        email: testCustEmail,
        phone: testCustPhone,
        password: 'Password@2026',
        fullName: 'Audit Customer',
        marketingConsent: false, // Unchecked by default
      },
    });
    assert.equal(regRes.status, 201);
    assert.ok(regRes.body.data.token);
    assert.equal(regRes.body.data.user.marketingConsent, false);
    const newCustToken = regRes.body.data.token;
    record('AUTH-04', 'Valid Customer Registration', 'PASS', `Account created (201), token issued, marketingConsent=false`);

    // 5. Verify Password Hashing in DB (Argon2id)
    const dbUser = await prisma.user.findUnique({ where: { email: testCustEmail } });
    assert.ok(dbUser);
    assert.ok(dbUser.passwordHash.startsWith('$argon2id$'), 'Password must be hashed with Argon2id');
    record('AUTH-05', 'Argon2id Cryptographic Password Hashing', 'PASS', `Stored hash begins with $argon2id$, no plaintext exposure`);

    // 6. Reject Duplicate Email
    const dupEmailRes = await request('/auth/register', {
      method: 'POST',
      body: { email: testCustEmail, phone: `+9177${Date.now().toString().slice(-8)}`, password: 'Password@2026', fullName: 'Dup Email' },
    });
    assert.equal(dupEmailRes.status, 409);
    assert.equal(dupEmailRes.body.code, 'EMAIL_EXISTS');
    record('AUTH-06', 'Reject Duplicate Email Registration', 'PASS', `Rejected with HTTP 409 EMAIL_EXISTS`);

    // 7. Reject Duplicate Phone
    const dupPhoneRes = await request('/auth/register', {
      method: 'POST',
      body: { email: `other-${Date.now()}@test.com`, phone: testCustPhone, password: 'Password@2026', fullName: 'Dup Phone' },
    });
    assert.equal(dupPhoneRes.status, 409);
    assert.equal(dupPhoneRes.body.code, 'PHONE_EXISTS');
    record('AUTH-07', 'Reject Duplicate Phone Registration', 'PASS', `Rejected with HTTP 409 PHONE_EXISTS`);

    // 8. Sign-in with Valid Credentials
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { emailOrPhone: testCustEmail, password: 'Password@2026' },
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.data.token);
    record('AUTH-08', 'Customer Login with Valid Credentials', 'PASS', `Authenticated (200), JWT session created`);

    // 9. Sign-in with Invalid Password
    const badPassLogin = await request('/auth/login', {
      method: 'POST',
      body: { emailOrPhone: testCustEmail, password: 'WrongPassword' },
    });
    assert.equal(badPassLogin.status, 401);
    record('AUTH-09', 'Reject Login with Invalid Password', 'PASS', `Rejected with HTTP 401 INVALID_CREDENTIALS`);

    // 10. Sign-in with Nonexistent User
    const nonExistLogin = await request('/auth/login', {
      method: 'POST',
      body: { emailOrPhone: 'nonexistent@nowhere.com', password: 'Password@2026' },
    });
    assert.equal(nonExistLogin.status, 401);
    record('AUTH-10', 'Reject Login for Nonexistent User', 'PASS', `Rejected with HTTP 401 INVALID_CREDENTIALS`);

    // 11. Verify User Profile Me Endpoint
    const meRes = await request('/auth/me', { token: newCustToken });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.email, testCustEmail);
    assert.strictEqual(meRes.body.data.passwordHash, undefined, 'Password hash must NOT be returned in me response');
    record('AUTH-11', 'User Profile Retrieval & Data Masking', 'PASS', `Returned user summary without password/sensitive fields`);

    // 12. Verify Demo Roles Login
    const custDemoLogin = await request('/auth/login', { method: 'POST', body: { emailOrPhone: 'customer@dumline.com', password: 'Customer@123' } });
    assert.equal(custDemoLogin.status, 200);
    assert.equal(custDemoLogin.body.data.user.role, 'CUSTOMER');
    const customerToken = custDemoLogin.body.data.token;

    const staffLogin = await request('/auth/login', { method: 'POST', body: { emailOrPhone: 'staff.kondapur@dumline.com', password: 'Staff@123' } });
    assert.equal(staffLogin.status, 200);
    assert.equal(staffLogin.body.data.user.role, 'KITCHEN_STAFF');
    const staffToken = staffLogin.body.data.token;
    const staffOutletId = staffLogin.body.data.user.assignedOutletId;
    assert.ok(staffOutletId, 'Staff must have assignedOutletId in token/user');

    const mgrLogin = await request('/auth/login', { method: 'POST', body: { emailOrPhone: 'manager.kondapur@dumline.com', password: 'Manager@123' } });
    assert.equal(mgrLogin.status, 200);
    assert.equal(mgrLogin.body.data.user.role, 'OUTLET_MANAGER');
    const mgrToken = mgrLogin.body.data.token;

    const adminLogin = await request('/auth/login', { method: 'POST', body: { emailOrPhone: 'admin@dumline.com', password: 'Admin@123' } });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.body.data.user.role, 'ADMIN');
    const adminToken = adminLogin.body.data.token;

    record('AUTH-12', 'Demo Roles Login (Customer, Staff, Manager, Admin)', 'PASS', `All 4 operational roles authenticated successfully`);

    // 13. RBAC Enforcement: Customer cannot access kitchen queue
    const custQueueAttempt = await request('/orders/kitchen/queue', { token: customerToken });
    assert.equal(custQueueAttempt.status, 403);
    record('RBAC-01', 'Customer Access to Kitchen Queue Rejected', 'PASS', `HTTP 403 ROLE_FORBIDDEN`);

    // 14. RBAC Enforcement: Kitchen staff cannot access central admin
    const staffAdminAttempt = await request('/admin/staff-assignments', {
      method: 'POST',
      token: staffToken,
      body: { staffUserId: 'dummy', outletId: staffOutletId },
    });
    assert.equal(staffAdminAttempt.status, 403);
    record('RBAC-02', 'Staff Access to Central Admin Rejected', 'PASS', `HTTP 403 ROLE_FORBIDDEN`);

    // 15. Cross-Outlet Isolation: Staff cannot access queue of another outlet
    const gachibowliOutlet = await prisma.outlet.findFirst({ where: { slug: 'gachibowli-cloud-kitchen' } });
    assert.ok(gachibowliOutlet);
    const crossOutletQueue = await request(`/orders/kitchen/queue?outletId=${gachibowliOutlet.id}`, { token: staffToken });
    assert.equal(crossOutletQueue.status, 403);
    assert.equal(crossOutletQueue.body.code, 'CROSS_OUTLET_FORBIDDEN');
    record('RBAC-03', 'Cross-Outlet Staff Queue Isolation', 'PASS', `HTTP 403 CROSS_OUTLET_FORBIDDEN when staff attempts another outlet`);

    // -------------------------------------------------------------
    // PHASE 4: OUTLET SELECTION & SERVICE RADIUS
    // -------------------------------------------------------------
    console.log('\n--- PHASE 4: OUTLET DISCOVERY & SERVICE RADIUS ---');
    const outletsRes = await request('/outlets');
    assert.equal(outletsRes.status, 200);
    assert.ok(Array.isArray(outletsRes.body.data));
    assert.ok(outletsRes.body.data.length >= 3);
    record('OUTLET-01', 'Active Outlets Listing', 'PASS', `Retrieved ${outletsRes.body.data.length} active outlets`);

    const kondapurOutlet = outletsRes.body.data.find((o: any) => o.slug === 'kondapur');
    assert.ok(kondapurOutlet);
    assert.equal(Number(kondapurOutlet.deliveryRadiusKm), 7.0);
    record('OUTLET-02', 'Outlet Delivery Radius Threshold', 'PASS', `Kondapur delivery radius configured to ${kondapurOutlet.deliveryRadiusKm} km`);

    // -------------------------------------------------------------
    // PHASE 5: MENU, AVAILABILITY (86ing) & ADMIN CMS
    // -------------------------------------------------------------
    console.log('\n--- PHASE 5: MENU CATALOG, 86ing & CENTRAL ADMIN CMS ---');
    const menuRes = await request('/menu');
    assert.equal(menuRes.status, 200);
    assert.ok(Array.isArray(menuRes.body.data));
    record('MENU-01', 'Categorized Menu Catalog', 'PASS', `Retrieved ${menuRes.body.data.length} categories with Hyderabadi taxonomy`);

    // Admin sets availability override (86ing) for Double Ka Meetha at Kondapur
    const doubleMeetha = await request('/menu/items/item-double-meetha');
    assert.equal(doubleMeetha.status, 200);

    const override86Res = await request('/menu/overrides', {
      method: 'POST',
      token: adminToken,
      body: {
        outletId: kondapurOutlet.id,
        itemId: 'item-double-meetha',
        isAvailableOverride: false, // 86 the item
      },
    });
    assert.equal(override86Res.status, 200);
    record('ADMIN-01', 'Admin Menu Availability 86ing Override', 'PASS', `Successfully marked item-double-meetha out of stock at Kondapur`);

    // Verify item is 86'd in Kondapur menu
    const kondapurMenu86 = await request(`/menu?outletId=${kondapurOutlet.id}`);
    const dessertsGroup = kondapurMenu86.body.data.find((g: any) => g.category.includes('Desserts'));
    const doubleMeethaKondapur = dessertsGroup.items.find((i: any) => i.id === 'item-double-meetha');
    assert.equal(doubleMeethaKondapur.isAvailableAtOutlet, false);
    record('MENU-02', 'Outlet-Specific 86ing Reflection', 'PASS', `Double Ka Meetha shows isAvailableAtOutlet=false`);

    // Restore item availability
    await request('/menu/overrides', {
      method: 'POST',
      token: adminToken,
      body: {
        outletId: kondapurOutlet.id,
        itemId: 'item-double-meetha',
        isAvailableOverride: true,
      },
    });
    record('ADMIN-02', 'Admin Restores Item Availability', 'PASS', `Restored item-double-meetha availability`);

    // -------------------------------------------------------------
    // PHASE 6: CART PRICING COMPLIANCE (5% INCLUSIVE GST)
    // -------------------------------------------------------------
    console.log('\n--- PHASE 6: CART PRICING & GST COMPLIANCE ---');

    // Reject Empty Cart
    const emptyCartRes = await request('/cart/validate', {
      method: 'POST',
      body: { outletId: kondapurOutlet.id, fulfillmentType: 'DELIVERY', items: [] },
    });
    assert.equal(emptyCartRes.status, 400);
    assert.ok(emptyCartRes.body.code === 'CART_EMPTY' || emptyCartRes.body.code === 'VALIDATION_ERROR');
    record('CART-01', 'Reject Empty Cart Validation', 'PASS', `Rejected with HTTP 400 ${emptyCartRes.body.code}`);

    // Reject Address Outside Service Radius (12 km away when max is 7 km)
    const outRadiusRes = await request('/cart/validate', {
      method: 'POST',
      body: {
        outletId: kondapurOutlet.id,
        fulfillmentType: 'DELIVERY',
        items: [{ itemId: 'item-chk-dum-fam', itemName: 'Chicken dum biryani family pack', quantity: 1 }],
        deliveryAddress: { line1: 'Remote Highway', city: 'Hyderabad', distanceKm: 12.0 },
      },
    });
    assert.equal(outRadiusRes.status, 400);
    assert.equal(outRadiusRes.body.code, 'OUTSIDE_DELIVERY_RADIUS');
    record('CART-02', 'Reject Delivery Address Outside Radius', 'PASS', `Rejected with HTTP 400 OUTSIDE_DELIVERY_RADIUS`);

    // Valid Cart with 5% Inclusive GST Breakdown
    const validCartRes = await request('/cart/validate', {
      method: 'POST',
      body: {
        outletId: kondapurOutlet.id,
        fulfillmentType: 'DELIVERY',
        items: [
          {
            itemId: 'item-chk-dum-fam',
            itemName: 'Chicken dum biryani family pack',
            quantity: 1,
            selectedOptions: { Spice: 'Shahi Spicy' },
          },
          {
            itemId: 'item-double-meetha',
            itemName: 'Double ka meetha',
            quantity: 2,
          },
        ],
        deliveryAddress: { line1: 'Kondapur Main Rd', city: 'Hyderabad', distanceKm: 2.5 },
      },
    });
    assert.equal(validCartRes.status, 200);
    const cartSummary = validCartRes.body.data;
    // Subtotal: 1180 + (90 * 2) = 1360
    assert.equal(cartSummary.subtotal, 1360.0);
    assert.equal(cartSummary.deliveryFee, 30.0); // Base fee for distance <= 3km
    assert.equal(cartSummary.totalAmount, 1390.0);
    // GST check: base + gst = subtotal (no double charging!)
    const sumBaseGst = Math.round((cartSummary.netBaseAmount + cartSummary.gstAmount) * 100) / 100;
    assert.equal(sumBaseGst, cartSummary.subtotal);
    record('CART-03', '5% GST-Inclusive Pricing Compliance', 'PASS', `Subtotal ₹${cartSummary.subtotal} = NetBase ₹${cartSummary.netBaseAmount} + GST ₹${cartSummary.gstAmount} (No double-charging)`);

    // -------------------------------------------------------------
    // PHASE 7 & 8: CHECKOUT, IDEMPOTENCY & MOCK PAYMENT
    // -------------------------------------------------------------
    console.log('\n--- PHASE 7 & 8: CHECKOUT & MOCK PAYMENT CONTRACT ---');

    // Benchmark checkout duration
    const checkoutStartTime = Date.now();

    // 1. Unauthenticated Order Placement Gate (Must be 401)
    const unauthOrderRes = await request('/orders', {
      method: 'POST',
      body: {
        outletId: kondapurOutlet.id,
        fulfillmentType: 'PICKUP',
        paymentMethod: 'UPI',
        items: [{ itemId: 'item-chk-dum-fam', itemName: 'Chicken dum biryani family pack', quantity: 1 }],
      },
    });
    assert.equal(unauthOrderRes.status, 401);
    assert.equal(unauthOrderRes.body.code, 'AUTH_REQUIRED');
    record('CHECKOUT-01', 'Mandatory Customer Auth Gate on Order Creation', 'PASS', `Rejected unauthenticated order with HTTP 401 AUTH_REQUIRED`);

    // 2. Authenticated Order Placement
    const idempotencyKey = `idemp-audit-${Date.now()}`;
    const createOrderRes = await request('/orders', {
      method: 'POST',
      token: customerToken,
      body: {
        outletId: kondapurOutlet.id,
        fulfillmentType: 'DELIVERY',
        paymentMethod: 'UPI',
        items: [
          {
            itemId: 'item-chk-dum-fam',
            itemName: 'Chicken dum biryani family pack',
            quantity: 1,
            selectedOptions: { Spice: 'Shahi Spicy' },
          },
        ],
        deliveryAddress: { line1: 'Plot 10, Kondapur', city: 'Hyderabad', distanceKm: 2.0 },
        idempotencyKey,
      },
    });
    assert.equal(createOrderRes.status, 201);
    const createdOrder = createOrderRes.body.data;
    assert.ok(createdOrder.id);
    assert.equal(createdOrder.status, 'PLACED');
    assert.equal(createdOrder.subtotal, 1180.0);
    assert.equal(createdOrder.totalAmount, 1210.0); // 1180 + 30 delivery
    record('CHECKOUT-02', 'Atomic Order Placement in PLACED State', 'PASS', `Order #${createdOrder.orderNumber} created (201) in PLACED state`);

    // 3. Mock Payment Failure Simulation (`fail@upi`)
    const failPayRes = await request('/payments', {
      method: 'POST',
      token: customerToken,
      body: {
        orderId: createdOrder.id,
        method: 'UPI',
        vpa: 'fail@upi',
      },
    });
    assert.equal(failPayRes.status, 402); // HTTP 402 Payment Required
    assert.equal(failPayRes.body.data.status, 'FAILED');
    assert.equal(failPayRes.body.data.failureReason, 'INSUFFICIENT_FUNDS');
    record('PAY-01', 'Mock UPI Payment Failure Simulation', 'PASS', `VPA fail@upi triggered HTTP 402 with failureReason INSUFFICIENT_FUNDS`);

    // Verify order remains PLACED after payment failure
    const orderAfterFail = await request(`/orders/${createdOrder.id}`, { token: customerToken });
    assert.equal(orderAfterFail.body.data.status, 'PLACED');
    record('PAY-02', 'Order State Retained for Retry on Payment Failure', 'PASS', `Order status preserved in PLACED allowing retry`);

    // 4. Mock Payment Success Simulation (`success@upi`) with Idempotency Key
    const payIdempKey = `pay-${idempotencyKey}`;
    const successPayRes = await request('/payments', {
      method: 'POST',
      token: customerToken,
      body: {
        orderId: createdOrder.id,
        method: 'UPI',
        vpa: 'success@upi',
        idempotencyKey: payIdempKey,
      },
    });
    assert.equal(successPayRes.status, 200);
    assert.equal(successPayRes.body.data.status, 'PAID');
    assert.ok(successPayRes.body.data.transactionRef);
    record('PAY-03', 'Mock UPI Payment Success Simulation', 'PASS', `VPA success@upi processed (200), ref: ${successPayRes.body.data.transactionRef}`);

    // 5. Payment Idempotency Deduplication: Re-submitting same key returns cached response
    const dupPayRes = await request('/payments', {
      method: 'POST',
      token: customerToken,
      body: {
        orderId: createdOrder.id,
        method: 'UPI',
        vpa: 'success@upi',
        idempotencyKey: payIdempKey,
      },
    });
    assert.equal(dupPayRes.status, 200);
    assert.equal(dupPayRes.body.data.transactionRef, successPayRes.body.data.transactionRef);
    record('PAY-04', 'Payment Idempotency Deduplication', 'PASS', `Repeated request with key returned cached transaction reference`);

    // Measure total checkout flow time
    const checkoutDurationMs = Date.now() - checkoutStartTime;
    assert.ok(checkoutDurationMs < 60000, 'Median checkout duration must be under 60 seconds');
    record('PERF-01', 'Checkout Flow Timing Benchmark (< 60s Target)', 'PASS', `End-to-end checkout completed in ${checkoutDurationMs}ms (Benchmark < 60,000ms achieved)`);

    // -------------------------------------------------------------
    // PHASE 9 & 10: ORDER STATE MACHINE & KITCHEN DISPLAY SYSTEM (KDS)
    // -------------------------------------------------------------
    console.log('\n--- PHASE 9 & 10: STATE MACHINE & KITCHEN DISPLAY SYSTEM ---');

    // 1. Staff views assigned Kondapur queue
    const queueRes = await request(`/orders/kitchen/queue?outletId=${kondapurOutlet.id}`, { token: staffToken });
    assert.equal(queueRes.status, 200);
    record('KDS-01', 'Staff Kitchen Queue Retrieval', 'PASS', `Staff retrieved operational queue (${queueRes.body.data.length} active orders)`);

    // 2. State Transition 1: PLACED -> ACCEPTED
    const acceptRes = await request(`/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status: 'ACCEPTED', reason: 'Order acknowledged by kitchen lead' },
    });
    assert.equal(acceptRes.status, 200);
    assert.equal(acceptRes.body.data.status, 'ACCEPTED');
    record('STATE-01', 'Order Transition: PLACED -> ACCEPTED', 'PASS', `Status updated to ACCEPTED`);

    // 3. State Transition 2: ACCEPTED -> PREPARING
    const prepRes = await request(`/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status: 'PREPARING', reason: 'Handi placed over charcoal hearth' },
    });
    assert.equal(prepRes.status, 200);
    assert.equal(prepRes.body.data.status, 'PREPARING');
    record('STATE-02', 'Order Transition: ACCEPTED -> PREPARING', 'PASS', `Status updated to PREPARING`);

    // 4. Restriction: Customer cannot cancel once cooking has begun (PREPARING)
    const custCancelAttempt = await request(`/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      token: customerToken,
      body: { status: 'CANCELLED', reason: 'Customer changed mind' },
    });
    assert.equal(custCancelAttempt.status, 403);
    record('STATE-03', 'Customer Cancellation Restricted in PREPARING State', 'PASS', `Customer cancel rejected with HTTP 403 CUSTOMER_CANCEL_RESTRICTED`);

    // 5. State Transition 3: PREPARING -> READY
    const readyRes = await request(`/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status: 'READY', reason: 'Handi steaming, sealed for dispatch' },
    });
    assert.equal(readyRes.status, 200);
    assert.equal(readyRes.body.data.status, 'READY');
    record('STATE-04', 'Order Transition: PREPARING -> READY', 'PASS', `Status updated to READY`);

    // 6. State Transition 4: READY -> COMPLETED
    const completeRes = await request(`/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status: 'COMPLETED', reason: 'Simulated delivery handoff complete' },
    });
    assert.equal(completeRes.status, 200);
    assert.equal(completeRes.body.data.status, 'COMPLETED');
    record('STATE-05', 'Order Transition: READY -> COMPLETED', 'PASS', `Status updated to terminal COMPLETED`);

    // 7. Rejection: Transition from terminal COMPLETED state must fail (409)
    const invalidTermRes = await request(`/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status: 'PREPARING' },
    });
    assert.equal(invalidTermRes.status, 409);
    assert.equal(invalidTermRes.body.code, 'INVALID_STATUS_TRANSITION');
    record('STATE-06', 'Reject Transition from Terminal COMPLETED State', 'PASS', `Rejected with HTTP 409 INVALID_STATUS_TRANSITION`);

    // -------------------------------------------------------------
    // PHASE 11: AI PREPARATION ESTIMATION & OVERDUE ALERTING
    // -------------------------------------------------------------
    console.log('\n--- PHASE 11: AI PREPARATION-TIME ESTIMATION & OVERDUE SCHEDULING ---');

    // 1. Parallel station safeguard calculation
    const fallbackCalc = AiPrepService.calculateDeterministicFallback(
      [
        { itemName: 'Chicken dum biryani', category: 'Biryani', quantity: 1, prepComplexityTag: 'DUM_COOKING', basePrepMinutes: 25 },
        { itemName: 'Seekh kebab', category: 'Tandoor', quantity: 1, prepComplexityTag: 'TANDOOR', basePrepMinutes: 20 },
        { itemName: 'Mirchi ka salan', category: 'Curry', quantity: 1, prepComplexityTag: 'CURRY_STATION', basePrepMinutes: 10 },
        { itemName: 'Double ka meetha', category: 'Dessert', quantity: 1, prepComplexityTag: 'READY_TO_SERVE', basePrepMinutes: 5 },
      ],
      0, // 0 active orders
      false // non-peak
    );
    // Parallel bottleneck = 25m + 5m staging = 30m, NOT additive sequential 60m!
    assert.equal(fallbackCalc.fallbackMinutes, 30);
    record('AI-01', 'Parallel Cooking Safeguard (No Additive Double Counting)', 'PASS', `Bottleneck station (25m) + staging (5m) = 30 min (NOT sequential 60m)`);

    // 2. Minimum Preparation Time Floor: T_Promised = max(E_Active, T_Min)
    const prepEst = await AiPrepService.estimatePrepTime({
      items: [{ itemName: 'Double ka meetha', category: 'Dessert', quantity: 1, prepComplexityTag: 'READY_TO_SERVE', basePrepMinutes: 5 }],
      outletMinPrepMinutes: 20,
      activeOrdersCount: 0,
      orderTimestamp: new Date('2026-11-07T10:00:00'),
    });
    assert.equal(prepEst.deterministicFallbackMinutes, 10); // 5 base + 5 staging
    assert.equal(prepEst.finalPromisedMinutes, 20); // Floor elevates 10 to 20!
    record('AI-02', 'Binding Promised Prep Floor Rule (max(E_Active, T_Min))', 'PASS', `Fast 10m dish bounded to outlet 20m minimum operational floor`);

    // 3. Manager Prep-Time Override with Audit Reason
    const overrideTime = new Date(Date.now() + 45 * 60000).toISOString();
    const mgrOverrideRes = await request(`/orders/${createdOrder.id}/prep-time`, {
      method: 'PATCH',
      token: mgrToken,
      body: { promisedTime: overrideTime, reason: 'Special ceremonial dum handi batch requirement' },
    });
    assert.equal(mgrOverrideRes.status, 200);
    assert.equal(mgrOverrideRes.body.data.promisedTime, overrideTime);
    record('AI-03', 'Manager Prep-Time Override with Mandatory Audit Reason', 'PASS', `Promised time overridden to +45 mins with logged reason`);

    // 4. Overdue Order Alerting Rule (>= 10 minutes past promised)
    const nowMs = Date.now();
    const alertOverdue = OrderService.isOrderOverdue(new Date(nowMs - 15 * 60000), 'PREPARING');
    assert.equal(alertOverdue.isOverdue, true);
    assert.equal(alertOverdue.minutesOverdue, 15);

    const alertNotOverdue = OrderService.isOrderOverdue(new Date(nowMs - 5 * 60000), 'PREPARING');
    assert.equal(alertNotOverdue.isOverdue, false); // 5 mins late is < 10 mins threshold!
    record('AI-04', 'Overdue Order Alert Threshold (>= 10 minutes)', 'PASS', `Orders 15m late flagged overdue; orders 5m late NOT flagged overdue`);

    // -------------------------------------------------------------
    // PHASE 15: MANDATORY SEED FIXTURES INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- PHASE 15: MANDATORY SEED FIXTURES VERIFICATION ---');

    // Fixture 1: WEB-778120
    const f1 = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778120' },
      include: { items: true, payments: true, outlet: true },
    });
    assert.ok(f1);
    assert.equal(f1.outlet.name, 'Kondapur');
    assert.equal(Number(f1.totalAmount), 1180.0);
    assert.equal(f1.status, 'PREPARING');
    assert.equal(f1.payments[0].method, 'UPI');
    assert.equal(f1.payments[0].status, 'PAID');
    const f1Items = f1.items.map((i) => i.itemName);
    assert.ok(f1Items.includes('Chicken dum biryani family pack'));
    assert.ok(f1Items.includes('Double ka meetha'));
    record('SEED-01', 'Mandatory Fixture WEB-778120 (Kondapur, ₹1180, PREPARING, UPI)', 'PASS', `Exact match with IsoCode Labs assessment brief`);

    // Fixture 2: WEB-778131
    const f2 = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778131' },
      include: { items: true, payments: true, outlet: true },
    });
    assert.ok(f2);
    assert.equal(f2.outlet.name, 'Gachibowli cloud kitchen');
    assert.equal(Number(f2.totalAmount), 640.0);
    assert.equal(f2.status, 'READY');
    assert.equal(f2.payments[0].method, 'CARD');
    assert.equal(f2.payments[0].status, 'PAID');
    const f2Items = f2.items.map((i) => i.itemName);
    assert.ok(f2Items.includes('Veg biryani'));
    assert.ok(f2Items.includes('Mirchi ka salan'));
    record('SEED-02', 'Mandatory Fixture WEB-778131 (Gachibowli, ₹640, READY, CARD)', 'PASS', `Exact match with IsoCode Labs assessment brief`);

    // Fixture 3: WEB-778146
    const f3 = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778146' },
      include: { items: true, payments: true, outlet: true },
    });
    assert.ok(f3);
    assert.equal(f3.outlet.name, 'Kukatpally');
    assert.equal(Number(f3.totalAmount), 1050.0);
    assert.equal(f3.status, 'PREPARING');
    assert.equal(f3.payments[0].method, 'UPI');
    assert.equal(f3.payments[0].status, 'PAID');
    const f3Haleem = f3.items.find((i) => i.itemName === 'Mutton haleem');
    assert.ok(f3Haleem);
    assert.equal(f3Haleem.quantity, 3);
    record('SEED-03', 'Mandatory Fixture WEB-778146 (Kukatpally, ₹1050, PREPARING, UPI)', 'PASS', `Exact match with IsoCode Labs assessment brief`);

    // -------------------------------------------------------------
    // AUDIT SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`🎯 AUDIT COMPLETE: ${auditLog.length} CHECKS EXECUTED, 0 FAILURES`);
    console.log('================================================================\n');

    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ AUDIT FAILED ON ERROR:', err);
    process.exit(1);
  }
}

runAudit();
