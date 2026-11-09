import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { CartService } from '../src/services/cart.service';
import { MenuService } from '../src/services/menu.service';
import { OutletService } from '../src/services/outlet.service';

describe('Cart & Checkout Pricing Compliance', () => {
  test('Prices are GST-inclusive and breakdown correctly without double-charging', async () => {
    const outlets = await OutletService.listOutlets();
    assert.ok(outlets.length > 0, 'Database should contain outlets');
    const kondapur = outlets.find((o) => o.slug === 'kondapur') || outlets[0];

    // Validate a cart with Chicken Dum Biryani Family Pack (₹1180) and Double Ka Meetha (₹90)
    const result = await CartService.validateCart({
      outletId: kondapur.id,
      fulfillmentType: 'PICKUP',
      items: [
        {
          itemId: 'item-chk-dum-fam',
          itemName: 'Chicken dum biryani family pack',
          quantity: 1,
        },
        {
          itemId: 'item-double-meetha',
          itemName: 'Double ka meetha',
          quantity: 2,
        },
      ],
    });

    // Subtotal must be ₹1180 + 2*₹90 = ₹1360.00
    assert.strictEqual(result.subtotal, 1360.0, 'Subtotal must match retail GST-inclusive sum');
    assert.strictEqual(result.deliveryFee, 0.0, 'Pickup delivery fee must be zero');
    assert.strictEqual(result.totalAmount, 1360.0, 'Total amount must equal subtotal for pickup');

    // Net base + GST must equal subtotal (no extra GST added on top)
    const expectedBase = Math.round(result.items.reduce((acc, i) => acc + i.lineBaseTotal, 0) * 100) / 100;
    assert.strictEqual(result.netBaseAmount, expectedBase, 'Net base price must be derived from sum of line base totals');
    assert.strictEqual(
      Math.round((result.netBaseAmount + result.gstAmount) * 100) / 100,
      result.subtotal,
      'Base + GST breakdown must equal the retail subtotal without double-charging'
    );
  });

  test('Simulated delivery validates delivery radius and rejects addresses beyond service area', async () => {
    const outlets = await OutletService.listOutlets();
    const kondapur = outlets.find((o) => o.slug === 'kondapur') || outlets[0];

    // Outside delivery radius (e.g. 15 km when limit is 7 km)
    await assert.rejects(
      async () => {
        await CartService.validateCart({
          outletId: kondapur.id,
          fulfillmentType: 'DELIVERY',
          items: [
            {
              itemId: 'item-veg-biryani',
              itemName: 'Veg biryani',
              quantity: 1,
            },
          ],
          deliveryAddress: {
            line1: 'Faraway Colony, Hyderabad',
            distanceKm: 15.0,
          },
        });
      },
      (err: any) => err.code === 'OUTSIDE_DELIVERY_RADIUS',
      'Should reject delivery exceeding outlet radius'
    );

    // Within delivery radius (e.g. 4.5 km)
    const validDelivery = await CartService.validateCart({
      outletId: kondapur.id,
      fulfillmentType: 'DELIVERY',
      items: [
        {
          itemId: 'item-veg-biryani',
          itemName: 'Veg biryani',
          quantity: 1,
        },
      ],
      deliveryAddress: {
        line1: 'Near Botanical Garden, Kondapur',
        distanceKm: 4.5,
      },
    });

    assert.ok(validDelivery.deliveryFee > 0, 'Delivery fee must be calculated for delivery');
    assert.strictEqual(
      validDelivery.totalAmount,
      Math.round((validDelivery.subtotal + validDelivery.deliveryFee) * 100) / 100,
      'Total must be subtotal + delivery fee'
    );
  });

  test('Outlet availability override (86ing) prevents ordering out-of-stock items', async () => {
    const outlets = await OutletService.listOutlets();
    const outlet = outlets[0];

    // 86 Nizami Seekh Kebab at this outlet
    MenuService.setOutletOverride({
      outletId: outlet.id,
      itemId: 'item-seekh-kebab',
      isAvailableOverride: false,
    });

    await assert.rejects(
      async () => {
        await CartService.validateCart({
          outletId: outlet.id,
          fulfillmentType: 'PICKUP',
          items: [
            {
              itemId: 'item-seekh-kebab',
              itemName: 'Nizami seekh kebab',
              quantity: 1,
            },
          ],
        });
      },
      (err: any) => err.code === 'ITEM_UNAVAILABLE',
      'Should reject unavailable item'
    );

    // Reset override
    MenuService.setOutletOverride({
      outletId: outlet.id,
      itemId: 'item-seekh-kebab',
      isAvailableOverride: true,
    });
  });
});
