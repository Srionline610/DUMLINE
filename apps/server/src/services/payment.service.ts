import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import { ProcessPaymentRequest, PaymentResponseData } from '@dumline/shared';
import { config } from '../config';
import { AppError } from '../utils/errors';

// Idempotency cache: key -> PaymentResponseData
const idempotencyStore = new Map<string, PaymentResponseData>();
// Processing locks to prevent race conditions
const processingLocks = new Set<string>();

export class PaymentService {
  static async processPayment(request: ProcessPaymentRequest): Promise<PaymentResponseData> {
    const { orderId, method, vpa, cardLast4, idempotencyKey } = request;

    // Idempotency check
    if (idempotencyKey) {
      if (idempotencyStore.has(idempotencyKey)) {
        return idempotencyStore.get(idempotencyKey)!;
      }
      if (processingLocks.has(idempotencyKey)) {
        throw AppError.conflict('Payment request is already processing with this idempotency key', 'PAYMENT_IN_PROGRESS');
      }
      processingLocks.add(idempotencyKey);
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });

      if (!order) {
        throw AppError.notFound(`Order with id '${orderId}' not found`, 'ORDER_NOT_FOUND');
      }

      // Check if order already has a successful payment
      const existingSuccess = order.payments.find((p) => p.status === 'PAID');
      if (existingSuccess) {
        const response: PaymentResponseData = {
          paymentId: existingSuccess.id,
          orderId: order.id,
          method: existingSuccess.method as any,
          status: 'PAID',
          amount: Number(existingSuccess.amount),
          transactionRef: existingSuccess.transactionRef || `tx-${Date.now()}`,
          failureReason: null,
          paidAt: existingSuccess.paidAt?.toISOString() || null,
        };
        if (idempotencyKey) idempotencyStore.set(idempotencyKey, response);
        return response;
      }

      // Evaluate mock payment outcome based on authoritative test contract
      let status: 'PAID' | 'FAILED' = 'PAID';
      let failureReason: string | null = null;

      if (method === 'UPI') {
        if (!vpa) {
          throw AppError.badRequest('VPA is required for UPI payments', 'VPA_REQUIRED');
        }
        if (vpa === config.mockPayment.failVpa || vpa.startsWith('fail@')) {
          status = 'FAILED';
          failureReason = 'INSUFFICIENT_FUNDS';
        } else {
          status = 'PAID';
        }
      } else if (method === 'CARD') {
        if (!cardLast4) {
          throw AppError.badRequest('cardLast4 is required for Card payments', 'CARD_REQUIRED');
        }
        if (cardLast4 === config.mockPayment.failCardLast4 || cardLast4 === '0000') {
          status = 'FAILED';
          failureReason = 'BANK_TIMEOUT';
        } else {
          status = 'PAID';
        }
      }

      const transactionRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const now = new Date();

      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          method,
          status,
          amount: order.totalAmount,
          transactionRef,
          failureReason,
          paidAt: status === 'PAID' ? now : null,
        },
      });

      const response: PaymentResponseData = {
        paymentId: payment.id,
        orderId: order.id,
        method: payment.method as any,
        status: payment.status as any,
        amount: Number(payment.amount),
        transactionRef,
        failureReason,
        paidAt: payment.paidAt?.toISOString() || null,
      };

      if (idempotencyKey) {
        idempotencyStore.set(idempotencyKey, response);
      }

      return response;
    } finally {
      if (idempotencyKey) {
        processingLocks.delete(idempotencyKey);
      }
    }
  }

  static async getPaymentById(paymentId: string): Promise<PaymentResponseData> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw AppError.notFound(`Payment with id '${paymentId}' not found`, 'PAYMENT_NOT_FOUND');
    }

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      method: payment.method as any,
      status: payment.status as any,
      amount: Number(payment.amount),
      transactionRef: payment.transactionRef || '',
      failureReason: payment.failureReason,
      paidAt: payment.paidAt?.toISOString() || null,
    };
  }
}

