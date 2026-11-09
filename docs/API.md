# Dumline API Documentation

> This document describes the **implemented** REST and Socket.IO endpoints for the Dumline backend as of **Phase 4 (Core Backend Implementation)**. All request and response payloads adhere strictly to the shared Zod schemas defined in `@dumline/shared`.

---

## 1. Authentication & Identity

| Method | Path | Description | Access | Request Body | Response Body |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new customer or staff user with Argon2id hashing. | Public | `RegisterInputSchema` | `{ success: true, data: { token, user } }` (201) |
| `POST` | `/api/auth/login` | Authenticate using email/phone and password. | Public | `LoginInputSchema` | `{ success: true, data: { token, user } }` (200) |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & assigned outlet. | Authenticated | None | `{ success: true, data: UserSummary }` (200) |
| `POST` | `/api/auth/logout` | Invalidate client session token. | Public | None | `204 No Content` |

### Error Response Envelope
```json
{
  "success": false,
  "error": "Human-readable error description",
  "code": "ERROR_CODE",
  "details": []
}
```

---

## 2. Outlets & Locations

| Method | Path | Description | Access | Request Body | Response Body |
|---|---|---|---|---|---|
| `GET` | `/api/outlets` | List active Hyderabad outlets with delivery radius & coordinates. | Public | Query: `?all=true` (optional) | `{ success: true, data: OutletSummary[] }` |
| `GET` | `/api/outlets/:idOrSlug` | Retrieve outlet detail by UUID or unique slug. | Public | None | `{ success: true, data: OutletSummary }` |
| `POST` | `/api/outlets` | Register a new outlet. | Admin | `CreateOutletInputSchema` | `{ success: true, data: OutletSummary }` (201) |
| `PATCH` | `/api/outlets/:id` | Update outlet parameters, radius, or active status. | Admin, Outlet Manager | `UpdateOutletInputSchema` | `{ success: true, data: OutletSummary }` (200) |

---

## 3. Menu & Catalog

| Method | Path | Description | Access | Request Body | Response Body |
|---|---|---|---|---|---|
| `GET` | `/api/menu` | Categorized Hyderabadi menu with outlet-specific pricing & availability. | Public | Query: `?outletId=:id` | `{ success: true, data: MenuCategoryGroup[] }` |
| `GET` | `/api/menu/items` | Flat list of menu items with dish complexity tags. | Public | Query: `?outletId=:id` | `{ success: true, data: MenuItemWithOutletData[] }` |
| `GET` | `/api/menu/items/:id` | Retrieve single menu item detail. | Public | None | `{ success: true, data: MenuItem }` |
| `POST` | `/api/menu/items` | Create new item in central menu catalog. | Admin | `CreateMenuItemSchema` | `{ success: true, data: MenuItem }` (201) |
| `PATCH` | `/api/menu/items/:id` | Update central catalog item properties. | Admin | `UpdateMenuItemSchema` | `{ success: true, data: MenuItem }` (200) |
| `POST` | `/api/menu/overrides` | Set outlet-level price or 86ing availability override. | Admin, Outlet Manager | `OutletMenuOverrideSchema` | `{ success: true, data: { override } }` (200) |

---

## 4. Cart & Pricing Validation

| Method | Path | Description | Access | Request Body | Response Body |
|---|---|---|---|---|---|
| `POST` | `/api/cart/validate` | Validates single-outlet binding, stock availability, GST-inclusive base breakdown (5% GST), and delivery radius. | Public / Customer | `CartValidationRequestSchema` | `{ success: true, data: CartPricingSummary }` (200) |

### Pricing Breakdown Compliance
Displayed menu prices are GST-inclusive. The backend breaks down:
$$\text{Base Price} = \frac{\text{Retail Price}}{1 + 0.05}$$
$$\text{GST Amount} = \text{Retail Price} - \text{Base Price}$$
No additional GST is charged on top at checkout.

---

## 5. Orders & Kitchen Workflow

| Method | Path | Description | Access | Request Body | Response Body |
|---|---|---|---|---|---|
| `POST` | `/api/orders` | Create an order. Mandatory authentication required before placement. | Authenticated Customer | `CreateOrderRequestSchema` | `{ success: true, data: OrderDetail }` (201) |
| `GET` | `/api/orders` | List orders (Customer: own orders; Staff: assigned outlet orders; Admin: all). | Authenticated | Query: `?outletId=&status=&limit=&page=` | `{ success: true, data: OrderDetail[] }` (200) |
| `GET` | `/api/orders/:id` | Retrieve full order details including line items and payment records. | Customer (owner), Staff (outlet), Admin | None | `{ success: true, data: OrderDetail }` (200) |
| `PATCH` | `/api/orders/:id/status` | Advance order state machine (`PLACED → ACCEPTED → PREPARING → READY → COMPLETED`). | Authenticated (scoped by role) | `UpdateOrderStatusSchema` | `{ success: true, data: OrderDetail }` (200) |
| `GET` | `/api/orders/kitchen/queue` | Kitchen display queue for active orders (`ACCEPTED`, `PREPARING`, `READY`). | Kitchen Staff, Manager, Admin | Query: `?outletId=:id` | `{ success: true, data: KitchenQueueOrder[] }` (200) |
| `PATCH` | `/api/orders/:id/prep-time` | Manual manager override for promised preparation time with logged audit reason. | Outlet Manager, Admin | `PrepTimeOverrideSchema` | `{ success: true, data: OrderDetail }` (200) |

### State Machine Transition Rules
- `PLACED`: Initial state upon creation.
- `ACCEPTED`: Acknowledged by kitchen staff.
- `PREPARING`: Cooking underway.
- `READY`: Prepared and staged for pickup or simulated delivery dispatch.
- `COMPLETED`: Terminal handoff state.
- `CANCELLED`: Terminal cancellation state. Permitted from `PLACED` or `ACCEPTED` by customer or staff. Cancellation from `PREPARING` or later strictly requires `OUTLET_MANAGER` or `ADMIN`.

---

## 6. Server-Side Mock Payment Contract

| Method | Path | Description | Access | Request Body | Response Body |
|---|---|---|---|---|---|
| `POST` | `/api/payments` | Process simulated payment (UPI or Card) with idempotency key. | Authenticated | `ProcessPaymentRequestSchema` | `{ success: true, data: PaymentResponseData }` (200 on PAID, 402 on FAILED) |
| `GET` | `/api/payments/:id` | Fetch payment transaction record. | Authenticated | None | `{ success: true, data: PaymentResponseData }` (200) |

### Predictable Payment Simulation Triggers
- **UPI Success**: `vpa: "success@upi"` $\rightarrow$ `status: "PAID"`.
- **UPI Failure**: `vpa: "fail@upi"` $\rightarrow$ `status: "FAILED"`, `failureReason: "INSUFFICIENT_FUNDS"`.
- **Card Success**: `cardLast4: "4242"` $\rightarrow$ `status: "PAID"`.
- **Card Failure**: `cardLast4: "0002"` $\rightarrow$ `status: "FAILED"`, `failureReason: "BANK_TIMEOUT"`.
- **Idempotency**: Submitting an identical `idempotencyKey` returns the cached payment record without creating duplicate debits or transactions.

---

## 7. Admin Operations

| Method | Path | Description | Access | Request Body | Response Body |
|---|---|---|---|---|---|
| `POST` | `/api/admin/staff-assignments` | Assign a kitchen staff or outlet manager to an outlet. | Admin | `{ staffUserId, outletId }` | `{ success: true, data: { staffUserId, outletId, outletName } }` (200) |

---

## 8. Health Check

| Method | Path | Description | Access | Response Body |
|---|---|---|---|---|
| `GET` | `/health` | Server health check and uptime timestamp. | Public | `{ status: "ok", service: "dumline-server", timestamp: "..." }` |
