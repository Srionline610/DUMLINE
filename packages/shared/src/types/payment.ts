import { PaymentMethod, PaymentStatus } from './common';

export interface ProcessPaymentRequest {
  orderId: string;
  method: PaymentMethod;
  vpa?: string; // e.g. success@upi or fail@upi
  cardLast4?: string; // e.g. 4242 or 0002
  idempotencyKey?: string;
}

export interface PaymentResponseData {
  paymentId: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionRef: string;
  failureReason?: string | null;
  paidAt?: string | null;
}

