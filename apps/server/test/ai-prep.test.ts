import test from 'node:test';
import assert from 'node:assert/strict';
import { AiPrepService } from '../src/services/ai-prep.service';
import { OrderService } from '../src/services/order.service';

test('AI Preparation-Time & Overdue Scheduling', async (t) => {
  await t.test('Parallel station cooking safeguard avoids additive multiplication', async () => {
    // 1 Biryani (DUM_COOKING: 25m) + 1 Tandoor (TANDOOR: 20m) + 1 Salan (CURRY_STATION: 10m) + 1 Dessert (READY_TO_SERVE: 5m)
    // If additive sequential: 25 + 20 + 10 + 5 = 60 minutes!
    // Parallel stations: Staging (5m) + max(25, 20, 10, 5) + 0 workload = 5 + 25 = 30 minutes!
    const { fallbackMinutes, stationBreakdown } = AiPrepService.calculateDeterministicFallback(
      [
        {
          itemName: 'Chicken dum biryani family pack',
          category: 'Biryani & Rice',
          quantity: 1,
          prepComplexityTag: 'DUM_COOKING',
          basePrepMinutes: 25,
        },
        {
          itemName: 'Nizami seekh kebab',
          category: 'Starters & Tandoor',
          quantity: 1,
          prepComplexityTag: 'TANDOOR',
          basePrepMinutes: 20,
        },
        {
          itemName: 'Mirchi ka salan',
          category: 'Curries & Salan',
          quantity: 1,
          prepComplexityTag: 'CURRY_STATION',
          basePrepMinutes: 10,
        },
        {
          itemName: 'Double ka meetha',
          category: 'Desserts & Beverages',
          quantity: 1,
          prepComplexityTag: 'READY_TO_SERVE',
          basePrepMinutes: 5,
        },
      ],
      0, // 0 active orders
      false // non-peak
    );

    assert.equal(stationBreakdown.BIRYANI_STATION, 25);
    assert.equal(stationBreakdown.TANDOOR_STATION, 20);
    assert.equal(stationBreakdown.CURRY_STATION, 10);
    assert.equal(stationBreakdown.DESSERT_BEVERAGE_STATION, 5);

    // Staging buffer (5m) + bottleneck station (25m) = 30m, NOT sequential 60m!
    assert.equal(fallbackMinutes, 30);
  });

  await t.test('Fractional portion scaling adds +2m per portion, not full cook time', async () => {
    // 3 Mutton Dum Biryanis (same station: 25m base + 2 additional portions * 2m = 29m)
    // Staging buffer 5m + 29m = 34m
    const { fallbackMinutes, stationBreakdown } = AiPrepService.calculateDeterministicFallback(
      [
        {
          itemName: 'Mutton dum biryani',
          category: 'Biryani & Rice',
          quantity: 3,
          prepComplexityTag: 'DUM_COOKING',
          basePrepMinutes: 25,
        },
      ],
      0,
      false
    );

    assert.equal(stationBreakdown.BIRYANI_STATION, 29);
    assert.equal(fallbackMinutes, 34);
  });

  await t.test('Active kitchen workload factor adds +2m per active order', async () => {
    const { fallbackMinutes } = AiPrepService.calculateDeterministicFallback(
      [
        {
          itemName: 'Veg biryani',
          category: 'Biryani & Rice',
          quantity: 1,
          prepComplexityTag: 'DUM_COOKING',
          basePrepMinutes: 20,
        },
      ],
      5, // 5 active orders in kitchen
      false
    );

    // Staging (5m) + base (20m) + workload (5 * 2 = 10m) = 35m
    assert.equal(fallbackMinutes, 35);
  });

  await t.test('Binding promised preparation time enforces T_Promised = max(E_Active, T_Min)', async () => {
    // Fast ready-to-serve item (Double ka meetha: 5m base + 5m staging = 10m estimate)
    // Outlet minimum floor T_Min = 20 minutes
    const result = await AiPrepService.estimatePrepTime({
      items: [
        {
          itemName: 'Double ka meetha',
          category: 'Desserts & Beverages',
          quantity: 1,
          prepComplexityTag: 'READY_TO_SERVE',
          basePrepMinutes: 5,
        },
      ],
      outletMinPrepMinutes: 20, // Outlet floor
      activeOrdersCount: 0,
      orderTimestamp: new Date('2026-11-05T10:00:00'), // Off-peak morning hour
    });

    assert.equal(result.deterministicFallbackMinutes, 10);
    assert.equal(result.outletMinPrepMinutes, 20);
    // Binding floor elevates promised time to 20 minutes
    assert.equal(result.finalPromisedMinutes, 20);
    assert.equal(result.source, 'DETERMINISTIC_FALLBACK');
  });

  await t.test('Overdue alerting correctly detects orders >= 10 minutes past promised time', async () => {
    const now = Date.now();

    // 1. Order due 15 minutes ago -> Overdue by 15 mins (>= 10m threshold)
    const overduePromisedTime = new Date(now - 15 * 60 * 1000);
    const alert1 = OrderService.isOrderOverdue(overduePromisedTime, 'PREPARING');
    assert.equal(alert1.isOverdue, true);
    assert.equal(alert1.minutesOverdue, 15);

    // 2. Order due 5 minutes ago -> NOT overdue yet (threshold is >= 10 minutes)
    const recentPromisedTime = new Date(now - 5 * 60 * 1000);
    const alert2 = OrderService.isOrderOverdue(recentPromisedTime, 'PREPARING');
    assert.equal(alert2.isOverdue, false);

    // 3. Completed or Ready orders are never overdue
    const alert3 = OrderService.isOrderOverdue(overduePromisedTime, 'COMPLETED');
    assert.equal(alert3.isOverdue, false);
    const alert4 = OrderService.isOrderOverdue(overduePromisedTime, 'READY');
    assert.equal(alert4.isOverdue, false);
  });
});

