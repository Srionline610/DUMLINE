import { FulfillmentType, OrderStatus, PaymentMethod, PaymentStatus } from './common';

export interface CreateOrderItemInput {
  itemId: string;
  itemName: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface CreateOrderRequest {
  outletId: string;
  fulfillmentType: FulfillmentType;
  items: CreateOrderItemInput[];
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city?: string;
    distanceKm?: number;
  };
  paymentMethod: PaymentMethod;
  idempotencyKey?: string;
}

export interface OrderItemSummary {
  id: string;
  itemName: string;
  quantity: number;
  unitPriceSnapshot: number;
  lineTotal: number;
  selectedOptionsJson?: string | null;
}

export interface OrderPaymentSummary {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionRef?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  outletId: string;
  outletName?: string;
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
  subtotal: number;
  gstAmount: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddressJson?: string | null;
  placedAt: string;
  promisedTime: string;
  estimatedPrepMinutes?: number;
  isOverdue: boolean;
  minutesOverdue?: number;
  items: OrderItemSummary[];
  payments: OrderPaymentSummary[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
}

export interface PrepTimeOverrideRequest {
  promisedTime: string; // ISO date string
  reason: string;
}

export interface KitchenQueueOrder {
  id: string;
  orderNumber: string;
  outletId: string;
  outletName: string;
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
  placedAt: string;
  promisedTime: string;
  isOverdue: boolean;
  minutesOverdue?: number;
  totalAmount: number;
  items: Array<{
    itemName: string;
    quantity: number;
    selectedOptionsJson?: string | null;
  }>;
}

