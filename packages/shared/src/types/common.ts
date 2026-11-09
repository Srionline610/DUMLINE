export type Role = 'CUSTOMER' | 'KITCHEN_STAFF' | 'OUTLET_MANAGER' | 'ADMIN';

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CARD';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

