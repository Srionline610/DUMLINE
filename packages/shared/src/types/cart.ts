import { FulfillmentType } from './common';

export interface CartItemInput {
  itemId: string;
  itemName: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface ValidatedCartItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number; // Retail price (inclusive of GST)
  unitBasePrice: number; // Net base price before GST
  unitGstAmount: number; // 5% inclusive GST amount per unit
  lineTotal: number; // quantity * unitPrice
  lineBaseTotal: number;
  lineGstTotal: number;
  selectedOptionsJson?: string | null;
  prepComplexityTag: string;
  basePrepMinutes: number;
}

export interface CartValidationRequest {
  outletId: string;
  fulfillmentType: FulfillmentType;
  items: CartItemInput[];
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city?: string;
    distanceKm?: number;
  };
}

export interface CartPricingSummary {
  outletId: string;
  fulfillmentType: FulfillmentType;
  items: ValidatedCartItem[];
  subtotal: number; // Total items retail amount (inclusive of 5% GST)
  netBaseAmount: number; // Total item base amounts before GST
  gstAmount: number; // 5% inclusive GST breakdown
  deliveryFee: number; // 0 for pickup; computed based on distance for delivery
  totalAmount: number; // subtotal + deliveryFee
  currency: string;
  gstRate: number; // 0.05
}

