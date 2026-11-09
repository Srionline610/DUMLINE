import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import {
  CreateOrderRequest,
  OrderDetail,
  OrderStatus,
  Role,
  KitchenQueueOrder,
  PrepTimeOverrideRequest,
} from '@dumline/shared';
import { CartService } from './cart.service';
import { OutletService } from './outlet.service';
import { PaymentService } from './payment.service';
import { AiPrepService } from './ai-prep.service';
import { config, ORDER_STATE_TRANSITIONS } from '../config';
import { AppError } from '../utils/errors';

export class OrderService {
  /**
   * Deterministic preparation-time calculation:
   * Max base prep time of ordered items + (active orders at outlet * 2 min factor),
   * bounded below by outlet.minPrepMinutes (e.g. 20 min).
   */
  static calculatePromisedTime(minPrepMinutes: number, itemPrepMinutes: number[], activeOrdersCount: number): Date {
    const maxItemPrep = itemPrepMinutes.length > 0 ? Math.max(...itemPrepMinutes) : 15;
    const loadFactorMinutes = activeOrdersCount * 2;
    const estimatedPrepMinutes = maxItemPrep + loadFactorMinutes;
    const finalPrepMinutes = Math.max(estimatedPrepMinutes, minPrepMinutes);

    const promisedTime = new Date();
    promisedTime.setMinutes(promisedTime.getMinutes() + finalPrepMinutes);
    return promisedTime;
  }

  static isOrderOverdue(promisedTime: Date, status: string): { isOverdue: boolean; minutesOverdue?: number } {
    if (['READY', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return { isOverdue: false };
    }
    const now = Date.now();
    const promisedMs = new Date(promisedTime).getTime();
    const overdueThresholdMs = config.overdueThresholdMinutes * 60 * 1000;

    if (now >= promisedMs + overdueThresholdMs) {
      const minutesOverdue = Math.floor((now - promisedMs) / (60 * 1000));
      return { isOverdue: true, minutesOverdue };
    }
    return { isOverdue: false };
  }

  static formatOrder(order: any): OrderDetail {
    const overdueInfo = this.isOrderOverdue(order.promisedTime, order.status);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customer?.fullName,
      customerPhone: order.customer?.phone,
      outletId: order.outletId,
      outletName: order.outlet?.name,
      fulfillmentType: order.fulfillmentType,
      status: order.status,
      subtotal: Number(order.subtotal),
      gstAmount: Number(order.gstAmount),
      deliveryFee: Number(order.deliveryFee),
      totalAmount: Number(order.totalAmount),
      deliveryAddressJson: order.deliveryAddressJson,
      placedAt: order.placedAt.toISOString(),
      promisedTime: order.promisedTime.toISOString(),
      isOverdue: overdueInfo.isOverdue,
      minutesOverdue: overdueInfo.minutesOverdue,
      items: (order.items || []).map((i: any) => ({
        id: i.id,
        itemName: i.itemName,
        quantity: i.quantity,
        unitPriceSnapshot: Number(i.unitPriceSnapshot),
        lineTotal: Number(i.lineTotal),
        selectedOptionsJson: i.selectedOptionsJson,
      })),
      payments: (order.payments || []).map((p: any) => ({
        id: p.id,
        method: p.method,
        status: p.status,
        amount: Number(p.amount),
        transactionRef: p.transactionRef,
        failureReason: p.failureReason,
        paidAt: p.paidAt?.toISOString() || null,
      })),
    };
  }

  static async createOrder(customerId: string, request: CreateOrderRequest): Promise<OrderDetail> {
    // 1. Re-validate cart and calculate authoritative pricing breakdown
    const cartSummary = await CartService.validateCart({
      outletId: request.outletId,
      fulfillmentType: request.fulfillmentType,
      items: request.items,
      deliveryAddress: request.deliveryAddress,
    });

    const outlet = await OutletService.getOutletByIdOrSlug(request.outletId);

    // 2. Count active orders at outlet for load factor calculation
    const activeOrdersCount = await prisma.order.count({
      where: {
        outletId: outlet.id,
        status: { in: ['ACCEPTED', 'PREPARING'] },
      },
    });

    // 3. Compute promised preparation time using AI service with deterministic fallback
    const prepEstimate = await AiPrepService.estimatePrepTime({
      items: cartSummary.items.map((i) => ({
        itemName: i.itemName,
        category: 'Specialty',
        quantity: i.quantity,
        prepComplexityTag: i.prepComplexityTag as any,
        basePrepMinutes: i.basePrepMinutes,
      })),
      outletMinPrepMinutes: outlet.minPrepMinutes,
      activeOrdersCount,
      orderTimestamp: new Date(),
    });

    const promisedTime = new Date();
    promisedTime.setMinutes(promisedTime.getMinutes() + prepEstimate.finalPromisedMinutes);

    // 4. Generate unique order number
    const orderNumber = `DL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    // 5. Create Order & OrderItems atomically
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          outletId: outlet.id,
          fulfillmentType: request.fulfillmentType,
          status: 'PLACED',
          subtotal: new Prisma.Decimal(cartSummary.subtotal.toFixed(2)),
          gstAmount: new Prisma.Decimal(cartSummary.gstAmount.toFixed(2)),
          deliveryFee: new Prisma.Decimal(cartSummary.deliveryFee.toFixed(2)),
          totalAmount: new Prisma.Decimal(cartSummary.totalAmount.toFixed(2)),
          deliveryAddressJson: request.deliveryAddress ? JSON.stringify(request.deliveryAddress) : null,
          placedAt: new Date(),
          promisedTime,
          items: {
            create: cartSummary.items.map((item) => ({
              itemName: item.itemName,
              unitPriceSnapshot: new Prisma.Decimal(item.unitPrice.toFixed(2)),
              quantity: item.quantity,
              lineTotal: new Prisma.Decimal(item.lineTotal.toFixed(2)),
              selectedOptionsJson: item.selectedOptionsJson || null,
            })),
          },
        },
        include: {
          items: true,
          payments: true,
          outlet: true,
          customer: true,
        },
      });

      return createdOrder;
    });

    return this.formatOrder(order);
  }

  static async getOrderById(orderId: string, user: { id: string; role: Role; assignedOutletId?: string | null }): Promise<OrderDetail> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        outlet: true,
        customer: true,
      },
    });

    if (!order) {
      throw AppError.notFound(`Order with id '${orderId}' not found`, 'ORDER_NOT_FOUND');
    }

    // Role-based customer and outlet isolation
    if (user.role === 'CUSTOMER' && order.customerId !== user.id) {
      throw AppError.forbidden('You do not have permission to view this order', 'ORDER_ACCESS_DENIED');
    }

    if ((user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER') && user.assignedOutletId !== order.outletId) {
      throw AppError.forbidden('Staff is isolated to orders of their assigned outlet only', 'CROSS_OUTLET_FORBIDDEN');
    }

    return this.formatOrder(order);
  }

  static async listOrders(
    user: { id: string; role: Role; assignedOutletId?: string | null },
    query?: { outletId?: string; status?: OrderStatus; limit?: number; page?: number }
  ): Promise<OrderDetail[]> {
    const where: Prisma.OrderWhereInput = {};

    if (user.role === 'CUSTOMER') {
      where.customerId = user.id;
    } else if (user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER') {
      if (!user.assignedOutletId) {
        throw AppError.forbidden('Staff user does not have an assigned outlet', 'NO_ASSIGNED_OUTLET');
      }
      where.outletId = user.assignedOutletId;
    } else if (user.role === 'ADMIN') {
      if (query?.outletId) {
        where.outletId = query.outletId;
      }
    }

    if (query?.status) {
      where.status = query.status;
    }

    const limit = query?.limit ? Math.min(query.limit, 100) : 50;
    const page = query?.page ? Math.max(query.page, 1) : 1;
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
        outlet: true,
        customer: true,
      },
      orderBy: { placedAt: 'desc' },
      take: limit,
      skip,
    });

    return orders.map((o) => this.formatOrder(o));
  }

  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason: string | undefined,
    user: { id: string; role: Role; assignedOutletId?: string | null }
  ): Promise<OrderDetail> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        outlet: true,
        customer: true,
      },
    });

    if (!order) {
      throw AppError.notFound(`Order with id '${orderId}' not found`, 'ORDER_NOT_FOUND');
    }

    // Authorization check
    if (user.role === 'CUSTOMER') {
      if (order.customerId !== user.id) {
        throw AppError.forbidden('You can only update your own orders', 'ORDER_ACCESS_DENIED');
      }
      // Customer may only cancel from PLACED
      if (newStatus !== 'CANCELLED' || order.status !== 'PLACED') {
        throw AppError.forbidden('Customers can only request cancellation while an order is PLACED', 'CUSTOMER_CANCEL_RESTRICTED');
      }
    } else if (user.role === 'KITCHEN_STAFF') {
      if (user.assignedOutletId !== order.outletId) {
        throw AppError.forbidden('Kitchen staff can only manage orders for their assigned outlet', 'CROSS_OUTLET_FORBIDDEN');
      }
      // Kitchen staff cannot cancel orders in PREPARING or later
      if (newStatus === 'CANCELLED' && ['PREPARING', 'READY'].includes(order.status)) {
        throw AppError.forbidden('Cancellation of orders in PREPARING state requires Outlet Manager authorization', 'MANAGER_OVERRIDE_REQUIRED');
      }
    } else if (user.role === 'OUTLET_MANAGER') {
      if (user.assignedOutletId !== order.outletId) {
        throw AppError.forbidden('Outlet managers can only manage orders for their assigned outlet', 'CROSS_OUTLET_FORBIDDEN');
      }
    }

    // State machine transition validation
    const allowedTransitions = ORDER_STATE_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw AppError.conflict(
        `Invalid status transition from '${order.status}' to '${newStatus}'. Allowed: [${allowedTransitions.join(', ')}]`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        items: true,
        payments: true,
        outlet: true,
        customer: true,
      },
    });

    return this.formatOrder(updated);
  }

  static async getKitchenQueue(
    outletId: string,
    user: { id: string; role: Role; assignedOutletId?: string | null },
    statusFilter?: string
  ): Promise<KitchenQueueOrder[]> {
    // Role & Outlet isolation guard: Customers cannot access KDS; Staff is isolated to their assigned outlet
    if (user.role === 'CUSTOMER') {
      throw AppError.forbidden('Customers cannot access kitchen operational queue', 'CROSS_OUTLET_FORBIDDEN');
    }

    if (user.role !== 'ADMIN') {
      if (outletId === 'ALL' || (user.assignedOutletId && user.assignedOutletId !== outletId)) {
        throw AppError.forbidden('Staff is isolated to their assigned outlet queue only', 'CROSS_OUTLET_FORBIDDEN');
      }
    }

    // Build status condition
    let statusCondition: Prisma.OrderWhereInput['status'];
    if (statusFilter === 'COMPLETED') {
      statusCondition = 'COMPLETED';
    } else if (statusFilter === 'OVERDUE') {
      statusCondition = { in: ['PLACED', 'ACCEPTED', 'PREPARING'] };
    } else if (statusFilter && statusFilter !== 'ALL') {
      statusCondition = statusFilter as OrderStatus;
    } else {
      statusCondition = { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] };
    }

    const where: Prisma.OrderWhereInput = {
      status: statusCondition,
    };

    // If a specific outlet is filtered, scope to that outlet.
    // If outletId === 'ALL' (authorized for ADMIN), query across all branches.
    if (outletId && outletId !== 'ALL') {
      where.outletId = outletId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        outlet: true,
      },
      orderBy: { placedAt: 'asc' },
    });

    const mapped = orders.map((o) => {
      const overdueInfo = this.isOrderOverdue(o.promisedTime, o.status);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        outletId: o.outletId,
        outletName: o.outlet.name,
        fulfillmentType: o.fulfillmentType,
        status: o.status,
        placedAt: o.placedAt.toISOString(),
        promisedTime: o.promisedTime.toISOString(),
        isOverdue: overdueInfo.isOverdue,
        minutesOverdue: overdueInfo.minutesOverdue,
        totalAmount: Number(o.totalAmount),
        items: o.items.map((i) => ({
          itemName: i.itemName,
          quantity: i.quantity,
          selectedOptionsJson: i.selectedOptionsJson,
        })),
      };
    });

    if (statusFilter === 'OVERDUE') {
      return mapped.filter((o) => o.isOverdue);
    }

    return mapped;
  }

  static async overridePrepTime(
    orderId: string,
    input: PrepTimeOverrideRequest,
    user: { id: string; role: Role; assignedOutletId?: string | null }
  ): Promise<OrderDetail> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, outlet: true, customer: true },
    });

    if (!order) {
      throw AppError.notFound(`Order '${orderId}' not found`, 'ORDER_NOT_FOUND');
    }

    if (user.role !== 'ADMIN' && (user.role !== 'OUTLET_MANAGER' || user.assignedOutletId !== order.outletId)) {
      throw AppError.forbidden('Only Outlet Managers or Admins can override promised preparation times', 'PREP_OVERRIDE_FORBIDDEN');
    }

    const newPromised = new Date(input.promisedTime);
    if (isNaN(newPromised.getTime())) {
      throw AppError.badRequest('Invalid ISO date string for promisedTime', 'INVALID_PROMISED_TIME');
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { promisedTime: newPromised },
      include: { items: true, payments: true, outlet: true, customer: true },
    });

    return this.formatOrder(updated);
  }
}

