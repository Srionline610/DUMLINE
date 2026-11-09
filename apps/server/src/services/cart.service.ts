import {
  CartValidationRequest,
  CartPricingSummary,
  ValidatedCartItem,
} from '@dumline/shared';
import { OutletService } from './outlet.service';
import { MenuService } from './menu.service';
import { config } from '../config';
import { AppError } from '../utils/errors';

export class CartService {
  /**
   * Validates cart items, verifies single outlet binding, re-checks item pricing and availability,
   * calculates base and inclusive GST breakdown (without double-charging),
   * and computes simulated delivery fees and delivery radius limits.
   */
  static async validateCart(request: CartValidationRequest): Promise<CartPricingSummary> {
    const outlet = await OutletService.getOutletByIdOrSlug(request.outletId);
    if (!outlet.isActive) {
      throw AppError.badRequest(`Outlet '${outlet.name}' is currently not accepting orders`, 'OUTLET_INACTIVE');
    }

    if (!request.items || request.items.length === 0) {
      throw AppError.badRequest('Cart must contain at least one item', 'CART_EMPTY');
    }

    const validatedItems: ValidatedCartItem[] = [];
    let runningRetailSubtotal = 0;
    let runningBaseTotal = 0;
    let runningGstTotal = 0;

    for (const itemInput of request.items) {
      if (itemInput.quantity < 1) {
        throw AppError.badRequest(`Quantity for item '${itemInput.itemName}' must be at least 1`, 'INVALID_QUANTITY');
      }

      // Re-fetch genuine item from authoritative catalog
      const menuItem = MenuService.getItemById(itemInput.itemId) || MenuService.getItemByName(itemInput.itemName);
      if (!menuItem) {
        throw AppError.notFound(`Menu item '${itemInput.itemName}' (${itemInput.itemId}) not found in catalog`, 'ITEM_NOT_FOUND');
      }

      // Check outlet-specific price and availability
      const itemsForOutlet = MenuService.getMenuForOutlet(outlet.id);
      const outletItem = itemsForOutlet.find((i) => i.id === menuItem.id);
      const effectivePrice = outletItem ? outletItem.effectivePrice : menuItem.basePrice;
      const isAvailable = outletItem ? outletItem.isAvailableAtOutlet : menuItem.isAvailable;

      if (!isAvailable) {
        throw AppError.badRequest(`'${menuItem.name}' is currently out of stock at ${outlet.name}`, 'ITEM_UNAVAILABLE');
      }

      // Validate Customizations against menuItem.optionGroups
      let optionPriceModifierTotal = 0;
      const optionGroups = menuItem.optionGroups || [];
      const userOptions = itemInput.selectedOptions || {};

      if (optionGroups.length > 0) {
        // 1. Verify required groups are satisfied (or default if direct addition without options)
        for (const grp of optionGroups) {
          if (grp.required) {
            const selectedVal = userOptions[grp.name];
            if (!selectedVal) {
              // If required option missing, assign first default (0 modifier) option if allowed or throw
              if (grp.options.length > 0 && grp.options[0].priceModifier === 0) {
                userOptions[grp.name] = grp.options[0].name;
              } else {
                throw AppError.badRequest(
                  `Required customization '${grp.name}' is missing for ${menuItem.name}`,
                  'INVALID_CUSTOMIZATION'
                );
              }
            }
          }
        }

        // 2. Verify all submitted options are valid for this specific dish
        for (const [groupName, optionValue] of Object.entries(userOptions)) {
          const matchingGroup = optionGroups.find((g) => g.name === groupName);
          if (!matchingGroup) {
            throw AppError.badRequest(
              `Customization group '${groupName}' is not applicable to ${menuItem.name}`,
              'INVALID_CUSTOMIZATION'
            );
          }

          const matchingOption = matchingGroup.options.find((o) => o.name === optionValue);
          if (!matchingOption) {
            throw AppError.badRequest(
              `Option '${optionValue}' is invalid for '${groupName}' on ${menuItem.name}`,
              'INVALID_CUSTOMIZATION'
            );
          }

          optionPriceModifierTotal += matchingOption.priceModifier || 0;
        }
      } else {
        if (Object.keys(userOptions).length > 0) {
          throw AppError.badRequest(
            `No customizations are applicable to ${menuItem.name}`,
            'INVALID_CUSTOMIZATION'
          );
        }
      }

      // GST Breakdown:
      // unitPrice is retail GST-inclusive (effective price + custom option modifiers)
      const unitPrice = effectivePrice + optionPriceModifierTotal;
      const unitBasePrice = Math.round((unitPrice / (1 + config.gstRate)) * 100) / 100;
      const unitGstAmount = Math.round((unitPrice - unitBasePrice) * 100) / 100;

      const lineTotal = Math.round(unitPrice * itemInput.quantity * 100) / 100;
      const lineBaseTotal = Math.round(unitBasePrice * itemInput.quantity * 100) / 100;
      const lineGstTotal = Math.round(unitGstAmount * itemInput.quantity * 100) / 100;

      runningRetailSubtotal += lineTotal;
      runningBaseTotal += lineBaseTotal;
      runningGstTotal += lineGstTotal;

      validatedItems.push({
        itemId: menuItem.id,
        itemName: menuItem.name,
        quantity: itemInput.quantity,
        unitPrice,
        unitBasePrice,
        unitGstAmount,
        lineTotal,
        lineBaseTotal,
        lineGstTotal,
        selectedOptionsJson: itemInput.selectedOptions ? JSON.stringify(itemInput.selectedOptions) : null,
        prepComplexityTag: menuItem.prepComplexityTag,
        basePrepMinutes: menuItem.basePrepMinutes,
      });
    }

    // Delivery fee and radius validation
    let deliveryFee = 0;
    if (request.fulfillmentType === 'DELIVERY') {
      if (!request.deliveryAddress || !request.deliveryAddress.line1) {
        throw AppError.badRequest('Delivery address line 1 is required for delivery orders', 'ADDRESS_REQUIRED');
      }

      const distanceKm = request.deliveryAddress.distanceKm ?? 2.5; // default simulated demo distance
      if (distanceKm > outlet.deliveryRadiusKm) {
        throw AppError.badRequest(
          `Delivery address is ${distanceKm.toFixed(1)} km away, which exceeds ${outlet.name}'s delivery radius of ${outlet.deliveryRadiusKm} km`,
          'OUTSIDE_DELIVERY_RADIUS'
        );
      }

      // Simulated tiered delivery fee: base fee up to 3 km, then ₹10 per km beyond 3 km
      if (distanceKm > config.delivery.freeDistanceKm) {
        deliveryFee = config.delivery.baseFee + (distanceKm - config.delivery.freeDistanceKm) * config.delivery.perKmFee;
      } else {
        deliveryFee = config.delivery.baseFee;
      }
      deliveryFee = Math.round(deliveryFee * 100) / 100;
    }

    const subtotal = Math.round(runningRetailSubtotal * 100) / 100;
    const netBaseAmount = Math.round(runningBaseTotal * 100) / 100;
    const gstAmount = Math.round(runningGstTotal * 100) / 100;
    const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;

    return {
      outletId: outlet.id,
      fulfillmentType: request.fulfillmentType,
      items: validatedItems,
      subtotal,
      netBaseAmount,
      gstAmount,
      deliveryFee,
      totalAmount,
      currency: 'INR',
      gstRate: config.gstRate,
    };
  }
}

