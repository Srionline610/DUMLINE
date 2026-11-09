import {
  OutletSummary,
  MenuCategoryGroup,
  MenuItem,
  CartValidationRequest,
  CartPricingSummary,
  CreateOrderRequest,
  OrderDetail,
  ProcessPaymentRequest,
  PaymentResponseData,
  KitchenQueueOrder,
  LoginInput,
  RegisterInput,
  AuthResponseData,
  UserSummary,
  OutletMenuOverride,
} from '@dumline/shared';

const API_BASE = '/api';

class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || `HTTP error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      (err as any).code = data?.code || 'API_ERROR';
      (err as any).status = response.status;
      (err as any).details = data?.details;
      throw err;
    }

    return (data?.data ?? data) as T;
  }

  // --- Auth ---
  static async register(input: RegisterInput): Promise<AuthResponseData> {
    return this.request<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async login(input: LoginInput): Promise<AuthResponseData> {
    return this.request<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async getMe(token: string): Promise<UserSummary> {
    return this.request<UserSummary>('/auth/me', { method: 'GET' }, token);
  }

  // --- Outlets ---
  static async getOutlets(activeOnly = true): Promise<OutletSummary[]> {
    const query = activeOnly ? '' : '?all=true';
    return this.request<OutletSummary[]>(`/outlets${query}`);
  }

  static async getOutlet(idOrSlug: string): Promise<OutletSummary> {
    return this.request<OutletSummary>(`/outlets/${idOrSlug}`);
  }

  // --- Menu ---
  static async getCategorizedMenu(outletId?: string): Promise<MenuCategoryGroup[]> {
    const query = outletId ? `?outletId=${encodeURIComponent(outletId)}` : '';
    return this.request<MenuCategoryGroup[]>(`/menu${query}`);
  }

  static async getMenuItem(id: string): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/items/${id}`);
  }

  static async createMenuItem(item: any, token: string): Promise<MenuItem> {
    return this.request<MenuItem>('/menu/items', {
      method: 'POST',
      body: JSON.stringify(item),
    }, token);
  }

  static async updateMenuItem(id: string, updates: any, token: string): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, token);
  }

  static async setOutletOverride(override: OutletMenuOverride, token: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/menu/overrides', {
      method: 'POST',
      body: JSON.stringify(override),
    }, token);
  }

  // --- Cart ---
  static async validateCart(request: CartValidationRequest): Promise<CartPricingSummary> {
    return this.request<CartPricingSummary>('/cart/validate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // --- Orders ---
  static async createOrder(request: CreateOrderRequest, token: string): Promise<OrderDetail> {
    return this.request<OrderDetail>('/orders', {
      method: 'POST',
      body: JSON.stringify(request),
    }, token);
  }

  static async getOrder(orderId: string, token: string): Promise<OrderDetail> {
    return this.request<OrderDetail>(`/orders/${orderId}`, { method: 'GET' }, token);
  }

  static async getOrders(token: string, outletId?: string): Promise<OrderDetail[]> {
    const query = outletId ? `?outletId=${encodeURIComponent(outletId)}` : '';
    return this.request<OrderDetail[]>(`/orders${query}`, { method: 'GET' }, token);
  }

  static async updateOrderStatus(
    orderId: string,
    status: string,
    token: string,
    reason?: string
  ): Promise<OrderDetail> {
    return this.request<OrderDetail>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }, token);
  }

  static async getKitchenQueue(outletId: string, token: string, status?: string): Promise<KitchenQueueOrder[]> {
    const statusParam = status && status !== 'ALL' ? `&status=${encodeURIComponent(status)}` : '';
    return this.request<KitchenQueueOrder[]>(`/orders/kitchen/queue?outletId=${encodeURIComponent(outletId)}${statusParam}`, {
      method: 'GET',
    }, token);
  }

  static async overridePrepTime(
    orderId: string,
    promisedTime: string,
    reason: string,
    token: string
  ): Promise<OrderDetail> {
    return this.request<OrderDetail>(`/orders/${orderId}/prep-time`, {
      method: 'PATCH',
      body: JSON.stringify({ promisedTime, reason }),
    }, token);
  }

  // --- Payments ---
  static async processPayment(request: ProcessPaymentRequest, token: string): Promise<PaymentResponseData> {
    return this.request<PaymentResponseData>('/payments', {
      method: 'POST',
      body: JSON.stringify(request),
    }, token);
  }
}

export default ApiClient;

