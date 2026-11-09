# DUMLINE — The Modern Royal Kitchen

**Concept:** Premium direct-ordering platform and operational management system for an authentic Hyderabad-based biryani restaurant chain.  
**Assessment:** IsoCode Labs Software Engineering Intern Assessment.  
**Version:** 1.0.0 (Phase 8 Final Delivery Release).

---

## 📖 Project Overview

DUMLINE is a production-minded direct-ordering food platform built for high-volume Hyderabadi culinary hospitality. It delivers two coordinated experiences:
1. **Customer Direct-Ordering Experience**: A responsive, editorial web application allowing guests to browse authentic Hyderabadi menus, select outlets, customize portions, and place orders with single-outlet cart isolation, 5% inclusive GST calculations, and live Socket.IO tracking.
2. **Kitchen Display System (KDS) & Operational Portals**: A dedicated high-glare operational touch interface ($\ge 48\times 48$px touch targets) with live color-coded status tokens (Green on schedule, Amber approaching, Red overdue $\ge 10$m) and real-time manager prep-time override capabilities.

---

## ✨ Core Features & Assessment Compliance

| Feature Area | Assessment Requirement | Implementation Details |
| :--- | :--- | :--- |
| **Guest Menu Browsing** | Unauthenticated menu and outlet discovery | Full public menu by category, dish complexity tags, outlet pricing, and 86ing availability. |
| **Mandatory Customer Auth** | Auth gate before order placement | Argon2id password hashing, JWT sessions, inline checkout login/registration. |
| **Single-Outlet Cart Isolation** | Strictly bound to one outlet | Zustand client store with accessible modal confirmation when switching outlets. |
| **GST-Inclusive Pricing** | 5% restaurant GST in retail price | Prices display GST-inclusive; backend computes base price and GST breakdown without double-charging. |
| **Fulfillment Methods** | Simulated delivery & store pickup | Tiered delivery radius validation (exceeding radius returns `OUTSIDE_DELIVERY_RADIUS`); store pickup staged for handoff. |
| **Server-Side Mock Payment** | Idempotent UPI & Card triggers | Deterministic triggers (`success@upi`/`fail@upi`, `...4242`/`...0002`), idempotency deduplication, HTTP 402 on failure. |
| **Order State Machine** | Strict transition enforcement | Forward-only states: `PLACED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`. |
| **AI Preparation Estimator** | Intelligent scheduling with fallback | Google Gemini API integration with parallel-station safeguard, mathematical deterministic fallback, and $T_{\text{Promised}} = \max(E_{\text{Active}}, T_{\text{Min}})$. |
| **Overdue Order Alerting** | Urgent alerts at $\ge 10$ min late | Color-coded ticket badges on KDS, customer real-time notification, audit logging. |
| **Mandatory Seed Fixtures** | Preserve exact assignment fixtures | `WEB-778120` (Kondapur), `WEB-778131` (Gachibowli), `WEB-778146` (Kukatpally) preserved idempotently in MySQL. |
| **Kitchen Display System (KDS)** | Operational kitchen screen | High-contrast canvas (`#1E1915`), 3–5 ft legibility, $\ge 48$px touch controls, real-time Socket.IO sync. |
| **Outlet Isolation & RBAC** | Staff isolated to assigned outlet | `CUSTOMER`, `KITCHEN_STAFF`, `OUTLET_MANAGER`, `ADMIN` with database `where: { outletId }` scoping. |

---

## 🛠️ Technology Stack & Verified Versions

| Layer | Selected Technology | Verified Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | `16.4.5` (Turbopack) | Server/Client components, SSR, static page optimization |
| **Core UI Library** | React & React DOM | `19.2.4` | Modern component architecture, hooks |
| **Backend Framework** | Node.js & Express | Express `5.3.0` | REST API routing, native Promise error handling |
| **Real-Time Engine** | Socket.IO | `4.8.4` | Bi-directional order updates and overdue alerting |
| **ORM & Database** | Prisma ORM & MySQL | Prisma `7.10.1`, MySQL `8.0` | MariaDB driver adapter, type-safe transactions |
| **Validation** | Zod | `3.23.8` | Isomorphic request validation across frontend & backend |
| **Password Security** | Argon2 | `0.45.1` | Argon2id cryptographic password hashing |
| **Styling & Motion** | Tailwind CSS & Framer Motion | Tailwind `3.4.17`, Motion `11.18.2` | WCAG 2.2 AA compliant dual design tokens |
| **Client State** | Zustand | `4.5.6` | Lightweight isolated client state with local persistence |

---

## 📂 Monorepo Structure

```
DUMLINE/
├── apps/
│   ├── web/                         # Next.js 16 App Router frontend (Port 3001)
│   │   ├── src/app/                 # Route handlers: /, /menu, /checkout, /kds, /manager, /admin, /orders/[id]
│   │   ├── src/components/          # Customer storefront, KDS cards, navigation, modals
│   │   ├── src/store/               # Zustand stores: cartStore, authStore, outletStore
│   │   └── src/lib/                 # API client, Socket.IO client, constants
│   │
│   └── server/                      # Dedicated Express 5 & Socket.IO 4 server (Port 3000)
│       ├── src/config/              # Config, Gemini prompt parameters, transition rules
│       ├── src/middleware/          # Argon2/JWT auth, RBAC, Zod validation, sliding rate-limiter
│       ├── src/routes/              # REST routes: auth, outlets, menu, cart, orders, payments, admin
│       ├── src/services/            # Business logic: OrderService, CartService, PaymentService, AiPrepService
│       ├── src/prisma/              # Prisma schema, migrations, and idempotent seed script
│       └── test/                    # Node test runner suite (8 suites, 39 automated tests)
│
├── packages/
│   └── shared/                      # Isomorphic TypeScript types and shared Zod schemas
│
├── docs/                            # Architecture, API specifications, and deployment guides
└── AGENTS.md                        # Authoritative project engineering rules
```

---

## ⚙️ Local Quickstart Guide

### 1. Prerequisites
- **Node.js**: $\ge 20$ (Tested on Node `v22.19.0`)
- **MySQL / MariaDB**: Running locally on port `3306`, or via the provided `docker-compose.yml`
- **Git**

### 2. Environment Setup
Copy the provided environment template:
```bash
cp .env.example .env
```

Ensure `.env` matches your database configuration:
```env
DATABASE_URL="mysql://dumline_user:DumlineTemp2026!@localhost:3306/dumline_dev"
JWT_SECRET="dumline_dev_secret_key_change_in_production"
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
# Optional: Google Gemini API Key for live AI estimation (falls back deterministically if omitted)
GEMINI_API_KEY=""
```

### 3. Spin Up Local MySQL (Optional via Docker Compose)
If you do not have a local MySQL 8 server installed, launch the canonical containerized database:
```bash
docker compose up -d
```
This spins up a healthy MySQL 8 container with persistent volume storage matching the credentials above.

### 4. Database Migration & Repeatable Seed
```bash
# Generate Prisma Client
npm run generate --workspace=@dumline/server

# Execute database migrations
npm run migrate:deploy --workspace=@dumline/server

# Run idempotent seed script (preserves mandatory fixtures WEB-778120, WEB-778131, WEB-778146)
npm run seed --workspace=@dumline/server
```

### 5. Start Development Servers
Run both backend and frontend concurrently:
```bash
# Terminal 1: Start Backend API & Socket.IO Server (Port 3000)
npm run dev --workspace=@dumline/server

# Terminal 2: Start Next.js Frontend Web Application (Port 3001)
npm run dev --workspace=@dumline/web
```

---

## 🧪 Automated Testing & Quality Gates

Run the comprehensive test suite verifying all 13 critical operational and security modules:
```bash
# Run full backend test runner (13 test suites, 60+ assertions, 100% pass)
npm test --workspace=@dumline/server

# Run typecheck across all workspaces
npm run typecheck --workspaces

# Run production build verification across all workspaces
npm run build
```

### Test Suite Summary:
1. `Mandatory Seed Fixtures Verification` (3/3 tests passed) — Validates `WEB-778120`, `WEB-778131`, `WEB-778146`.
2. `Auth & Security Module` (3/3 tests passed) — Argon2id password hashing, JWT signing, user creation.
3. `Cart & Checkout Pricing Compliance` (3/3 tests passed) — 5% inclusive GST, delivery radius validation, 86ing.
4. `Server-Side Mock Payment Contract` (3/3 tests passed) — UPI/Card success/fail triggers, idempotency caching.
5. `Order State Machine & Access Control` (3/3 tests passed) — Strictly ordered transitions, cross-outlet isolation.
6. `REST API End-to-End Integration` (5/5 tests passed) — Outlets, menu, unauthorized order gate (401), `/health`.
7. `AI Preparation-Time & Overdue Scheduling` (7/7 tests passed) — Parallel station cook calculation, portion scaling, overdue alerting.
8. `Customer E2E Workflow & Edge Cases` (11/11 tests passed) — Full customer lifecycle, manager prep override, error transitions.
9. `Customer-to-Kitchen Multi-Role Audit` (10/10 tests passed) — End-to-end multi-role flow from order placement to terminal completion.
10. `RBAC Access Control & Route Authorization` (9/9 tests passed) — Multi-tier role permissions and outlet boundary checks.
11. `Master Audit Trail & Overdue Order Escalation` (5/5 tests passed) — Overdue calculation and audit logging.
12. `Branch-Specific KDS and Centralized All-Kitchens Dashboard` (12/12 tests passed) — Multi-branch filtering and cross-outlet authorization.
13. `Socket.IO Enterprise Authentication & Authorization Security Suite` (12/12 tests passed) — JWT handshake enforcement, role isolation, and order eavesdropping prevention.

---

## 👤 Demo Credentials & Operational Roles

| Role | Email / Phone | Password | Assigned Outlet | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `demo.customer@example.com` | `Password@2026` | N/A | Ordering storefront, cart, checkout, live tracking |
| **Kitchen Staff (Kondapur)** | `staff.kondapur@dumline.com` | `Staff@123` | Kondapur | KDS queue (`/kds`), order prep status transitions |
| **Kitchen Staff (Gachibowli)**| `staff.gachibowli@dumline.com`| `Staff@123` | Gachibowli | KDS queue (`/kds`), order prep status transitions |
| **Outlet Manager** | `manager.kondapur@dumline.com` | `Manager@123` | Kondapur | Manager portal (`/manager`), prep-time overrides, 86ing |
| **Central Admin** | `admin@dumline.com` | `Admin@123` | Global | Admin portal (`/admin`), global menu CMS, cross-outlet |

---

## 💳 Mock Payment Test Triggers

| Payment Method | Test Input Value | Simulated Outcome | Response Code |
| :--- | :--- | :--- | :--- |
| **UPI** | `success@upi` | `PAID` (Transaction reference returned) | `200 OK` |
| **UPI** | `fail@upi` | `FAILED` (`INSUFFICIENT_FUNDS`) | `402 Payment Required` |
| **Card** | Card ending `4242` | `PAID` (Transaction reference returned) | `200 OK` |
| **Card** | Card ending `0002` | `FAILED` (`BANK_TIMEOUT`) | `402 Payment Required` |

---

## 🚀 Recommended Assessment Review Sequence

Follow this 5-step sequence to review all mandatory assessment workflows:

1. **Storefront & Menu Browsing**:
   - Open `http://localhost:3001` in your browser.
   - Explore the signature Hyderabadi dishes and editorial storytelling.
   - Switch outlets in the header to observe outlet-specific pricing and availability.
2. **Cart Isolation & Item Customization**:
   - Add a *Chicken Dum Biryani (Family Pack)* from Kondapur.
   - Attempt to add a dish from *Gachibowli Cloud Kitchen* $\rightarrow$ Confirm the single-outlet warning modal appears.
3. **Checkout, Auth Gate & Mock Payment**:
   - Proceed to `/checkout`.
   - Experience the mandatory customer authentication gate (Login or Register with marketing consent unchecked).
   - Test mock UPI payment with `success@upi` $\rightarrow$ Order transitions to `PLACED`, cart clears, redirects to live tracker.
4. **Kitchen Display System (KDS)**:
   - In a second tab/window, open `http://localhost:3001/kds`.
   - Inspect the live order ticket `#DL-...` and seed fixtures.
   - Notice the high-contrast status tokens (Green on schedule, Red overdue for `WEB-778120`).
   - Click `START DUM COOKING` $\rightarrow$ Transitions to `PREPARING` and broadcasts via Socket.IO.
5. **Real-Time Customer Tracking & Manager Override**:
   - Return to the customer tab $\rightarrow$ The timeline updates in real-time to `PREPARING` without manual page reload.
   - Open `/manager` $\rightarrow$ Test preparation-time override with a mandatory audit reason.

---

## 🌐 Cross-Platform Production Deployment Guide

DUMLINE is architected to be completely platform-agnostic. It can be deployed to **Render, Railway, Vercel, Docker, AWS, Google Cloud, Azure**, or standard **self-hosted Linux** servers.

### 1. Production Environment Variables

| Variable Name | Purpose | Target Service | Example / Format |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | MySQL 8 connection string (Prisma ORM) | Backend | `mysql://user:pass@db-host:3306/dbname?sslaccept=strict` |
| `MYSQL_URL` | Alternative MySQL URL (auto-detected fallback) | Backend | `mysql://user:pass@db-host:3306/dbname` |
| `JWT_SECRET` | 32+ char cryptographic token signing key | Backend | Generated via `openssl rand -hex 32` |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | Backend | `https://dumline.com,https://dumline.vercel.app` |
| `PORT` | HTTP port to bind | Backend / Frontend | `3000` (backend) / `3001` (frontend) |
| `HOST` | Interface to bind (default `0.0.0.0`) | Backend | `0.0.0.0` |
| `NODE_ENV` | Environment mode (`production`) | Both | `production` |
| `NEXT_PUBLIC_API_URL` | Public backend API URL | Frontend | `https://api.dumline.com` |
| `NEXT_PUBLIC_SOCKET_URL` | Public Socket.IO backend URL | Frontend | `https://api.dumline.com` |
| `GEMINI_API_KEY` | Optional Google Gemini API key | Backend | Generated in Google AI Studio |

### 2. Standard Production Lifecycle Commands

```bash
# 1. Install all dependencies across monorepo workspaces
npm ci

# 2. Build shared schemas, Next.js frontend, and generate Prisma client
npm run build

# 3. Run production database migrations (at deployment/runtime)
npm run migrate:deploy --workspace=@dumline/server

# 4. One-time database seeding (populates branches, menu catalog, roles)
npm run seed --workspace=@dumline/server

# 5. Start Backend API & Socket.IO server
npm run start --workspace=@dumline/server

# 6. Start Next.js Frontend Web application
npm run start --workspace=@dumline/web
```

### 3. Docker Deployment

Production-ready Dockerfiles are provided for containerized deployments:

```bash
# Build Backend container
docker build -f Dockerfile.server -t dumline-server .

# Run Backend container
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e JWT_SECRET="your_32_character_minimum_random_secret" \
  -e CORS_ORIGIN="https://your-frontend-domain.com" \
  dumline-server

# Build Frontend container
docker build -f Dockerfile.web -t dumline-web .

# Run Frontend container
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL="https://api.your-domain.com" \
  -e NEXT_PUBLIC_SOCKET_URL="https://api.your-domain.com" \
  dumline-web
```

### 4. Cloud Platform Guidelines

- **Render**:
  - **Backend**: Create a Web Service with Root Directory `/`. Build Command: `npm run build --workspace=@dumline/shared && npm run generate --workspace=@dumline/server`. Start Command: `npm run migrate:deploy --workspace=@dumline/server && npm run start --workspace=@dumline/server`. Health check path: `/health`.
  - **Frontend**: Create a Web Service with Root Directory `/`. Build Command: `npm run build --workspace=@dumline/shared && npm run build --workspace=@dumline/web`. Start Command: `npm run start --workspace=@dumline/web`.
  - **Database**: Add a Managed MySQL instance and link `DATABASE_URL`.
- **Railway**:
  - Connect GitHub repository. Add Managed MySQL service.
  - Deploy `dumline-server` and `dumline-web` as separate services from the monorepo.
- **Vercel (Frontend Only)**:
  - Import repository, configure Root Directory as `apps/web`.
  - Add environment variable `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` pointing to your deployed backend.
- **AWS ECS / Google Cloud Run / Azure Container Apps**:
  - Build and push `Dockerfile.server` and `Dockerfile.web` to ECR, GCR, or ACR.
  - Deploy with environment variables injected via AWS Secrets Manager or GCP Secret Manager.
- **Self-Hosted Linux (VPS / Bare Metal)**:
  - Run MySQL 8 or use `docker compose up -d`.
  - Manage Node processes using `pm2` or `systemd`.
  - Configure NGINX reverse proxy with WebSocket upgrade headers (`Upgrade $http_upgrade`, `Connection "upgrade"`).
