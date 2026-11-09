# DUMLINE — Deployment & Operations Guide

**Project:** DUMLINE — The Modern Royal Kitchen  
**Assessment:** IsoCode Labs Software Engineering Intern Assessment  
**Repository:** [https://github.com/Srionline610/DUMLINE](https://github.com/Srionline610/DUMLINE)  
**Architecture:** Next.js 16 (React 19) + Express 5 (Socket.IO 4) + Prisma 7 (MySQL 8) Monorepo  

---

## 1. Prerequisites

Before installing and running the DUMLINE platform, ensure your local development environment meets the following requirements:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended; tested with Node `v22.19.0`)
- **npm**: `v10.x` or higher
- **MySQL**: `v8.0.x` or **MariaDB** `v10.x+` (running on standard port `3306`, or via Docker Compose)
- **Git**: For source control management
- **Operating System**: Windows 10/11, macOS, or modern Linux (Ubuntu 22.04+)
- *(Optional)* **Python**: `v3.10+` (only required if regenerating submission documentation via ReportLab)

---

## 2. Repository Cloning & Project Structure

Clone the repository and navigate into the root workspace:

```bash
git clone https://github.com/Srionline610/DUMLINE.git
cd DUMLINE
```

### Monorepo Workspaces Layout

```
DUMLINE/
├── apps/
│   ├── server/           # Dedicated Express 5, Socket.IO 4 & Prisma 7 backend
│   └── web/              # Next.js 16.4.5 (React 19, Turbopack, Tailwind CSS)
├── packages/
│   └── shared/           # Shared TypeScript types, Zod schemas & constants
├── docs/                 # Architectural specifications, API schema, TDD
├── submission/           # Final assessment deliverables (TDD PDF & deployment.md)
├── scripts/              # Document generator & automation utilities
├── package.json          # Root npm workspaces definition
└── .env.example          # Environment variable template
```

---

## 3. Installation

Install all root and workspace dependencies using `npm`:

```bash
npm install
```

This single command installs all dependencies for `@dumline/server`, `@dumline/web`, and `@dumline/shared` through npm workspaces.

---

## 4. Environment Variable Configuration

Create your local `.env` file from the provided `.env.example` template:

### Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

### macOS / Linux (Bash):
```bash
cp .env.example .env
```

### Required Configuration Variables

Open `.env` in your editor and configure the variables according to your local environment:

| Variable | Description | Default / Example Value | Required |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | MySQL connection string for Prisma ORM | `mysql://root:password@localhost:3306/dumline_dev` | **Yes** |
| `PORT` | Dedicated Express HTTP and Socket.IO server port | `3000` | **Yes** |
| `NODE_ENV` | Application runtime environment (`development` / `production`) | `development` | **Yes** |
| `JWT_SECRET` | Cryptographic secret for signing and verifying auth tokens | `dumline-secret-key-change-in-production-min-32-chars` | **Yes** |
| `JWT_EXPIRES_IN` | Session token validity duration | `7d` | **Yes** |
| `NEXT_PUBLIC_API_URL` | Base HTTP REST API URL consumed by the web client | `http://localhost:3000/api` | **Yes** |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket Socket.IO URL for real-time kitchen updates | `http://localhost:3000` | **Yes** |
| `GEMINI_API_KEY` | Google Gemini API key for AI prep-time estimation | `<your-gemini-api-key>` | *Optional* |

> **Note on AI Prep-Time Fallback:** If `GEMINI_API_KEY` is omitted or empty, DUMLINE's dual-engine estimation service automatically engages its built-in mathematical fallback estimator without interruption or runtime error.

---

## 5. Database Setup, Migrations & Seeding

### 5.1 Create Local Database
Ensure your MySQL server is running. Create the target development database:

```sql
CREATE DATABASE IF NOT EXISTS dumline_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5.2 Execute Prisma Migrations
Run the initial Prisma schema migration to generate tables and constraints:

```bash
npx prisma migrate dev --config apps/server/src/prisma/prisma.config.ts
```

Or execute the workspace shortcut:
```bash
npm run migrate --workspace=@dumline/server
```

### 5.3 Generate Prisma Client
Generate the TypeScript Prisma Client with the MariaDB driver adapter:

```bash
npm run generate --workspace=@dumline/server
```

### 5.4 Seed Database with Mandatory Fixtures & Demo Accounts
Run the database seed script to populate authentic Hyderabadi culinary items, demo outlets, role-specific user accounts, and the mandatory IsoCode Labs assessment reference fixtures:

```bash
npm run seed --workspace=@dumline/server
```

#### Mandatory Assessment Reference Fixtures Seeded:
1. **WEB-778120** — Kondapur | `PREPARING` | UPI Paid (₹1,180.00) | Placed: `20:14` | Promised: `20:59`
2. **WEB-778131** — Gachibowli cloud kitchen | `READY` | Card Paid (₹640.00) | Placed: `20:21` | Promised: `21:01`
3. **WEB-778146** — Kukatpally | `PREPARING` (Overdue demo) | UPI Paid (₹1,050.00) | Placed: `20:26` | Promised: `21:16`

---

## 6. Starting the Application

DUMLINE requires two concurrent processes during local development:
1. **Backend Server** (Express 5 REST API + Socket.IO 4 on port `3000`)
2. **Frontend Application** (Next.js 16 Web Storefront & KDS on port `3001`)

Open two terminal windows from the repository root:

### Terminal 1: Backend API & WebSocket Server
```bash
npx ts-node --transpile-only apps/server/src/index.ts
```
*Expected Console Output:*
```
🏰 Dumline API server running on port 3000 (development)
🔌 Socket.IO endpoint ready
```
*Verify Health Endpoint:* `http://localhost:3000/health` (Returns `{"status":"ok","service":"dumline-server"}`)

### Terminal 2: Next.js Frontend Application
```bash
npm run dev --workspace=@dumline/web
```
*Expected Console Output:*
```
▲ Next.js 16.4.5 (Turbopack)
- Local:   http://localhost:3001
✓ Ready in 800ms
```

---

## 7. Local Development URLs & Navigation

| Interface / Endpoint | URL | Description |
| :--- | :--- | :--- |
| **Customer Storefront** | [http://localhost:3001](http://localhost:3001) | Guest menu browsing, outlet switcher, cart drawer, checkout |
| **Kitchen Display System (KDS)** | [http://localhost:3001/kds](http://localhost:3001/kds) | Branch-locked KDS for Staff; All-Kitchens Command for Admin |
| **Outlet Manager Dashboard** | [http://localhost:3001/manager](http://localhost:3001/manager) | Real-time 86ing (stock toggles), prep-time overrides, analytics |
| **Central Admin Menu CMS** | [http://localhost:3001/admin](http://localhost:3001/admin) | Global menu catalog, pricing overrides, branch metrics |
| **Order History & Tracker** | [http://localhost:3001/orders](http://localhost:3001/orders) | Customer real-time live order status and tracking |
| **User Sign-In** | [http://localhost:3001/auth/login](http://localhost:3001/auth/login) | Role-aware login with instant portal redirection |
| **Backend API Base** | [http://localhost:3000/api](http://localhost:3000/api) | Express REST API endpoints |
| **Backend Health Check** | [http://localhost:3000/health](http://localhost:3000/health) | System uptime and health check |

---

## 8. Role-Based Demo Accounts

The database seed provides verified demo credentials across all assessment roles:

| Role | Email | Password | Assigned Branch / Scope | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `customer@dumline.com` | `Customer@123` | Public Storefront | Place orders, single-outlet cart, checkout, live tracking |
| **Customer (Alt)** | `demo.customer@example.com` | `Password@2026` | Public Storefront | Alternate customer profile with existing order history |
| **Kitchen Staff** | `staff.kondapur@dumline.com` | `Staff@123` | Kondapur (Station Locked) | View only Kondapur orders; advance states (`ACCEPTED` $\to$ `READY`) |
| **Kitchen Staff** | `staff.gachibowli@dumline.com` | `Staff@123` | Gachibowli (Station Locked) | View only Gachibowli cloud kitchen orders; advance states |
| **Kitchen Staff** | `staff.kukatpally@dumline.com` | `Staff@123` | Kukatpally (Station Locked) | View only Kukatpally orders; manage active delayed queue |
| **Outlet Manager** | `manager.kondapur@dumline.com` | `Manager@123` | Kondapur Branch | Stock 86ing, prep-time adjustments, branch metrics |
| **Outlet Manager** | `manager.kukatpally@dumline.com` | `Manager@123` | Kukatpally Branch | Manage overdue escalations, localized availability overrides |
| **Central Admin** | `admin@dumline.com` | `Admin@123` | Multi-Branch Command | "All Kitchens" centralized KDS, global menu CMS, branch switcher |

---

## 9. Automated Testing & Verification Gates

Run the automated test suites to independently verify all system functionality, security isolation, and data integrity:

```bash
# 1. Run full backend test suite (12 test suites, 50+ assertions, 100% pass)
npm test --workspace=@dumline/server

# 2. Run branch-specific KDS and multi-kitchen isolation suite
npx ts-node --transpile-only apps/server/test/branch-kds.test.ts

# 3. Run comprehensive 20-point master audit suite
npx ts-node --transpile-only apps/server/test/master-audit.test.ts

# 4. Run TypeScript typecheck across all workspaces (zero errors)
npm run typecheck --workspaces

# 5. Run Next.js production build verification (11 static & dynamic routes)
npm run build --workspace=@dumline/web
```

---

## 10. Production Deployment Architecture

In a production environment, DUMLINE is architected for containerized deployment across cloud infrastructure:

### 10.1 Architecture Diagram
```
                     ┌────────────────────────┐
                     │ Cloudflare / AWS CloudFront │
                     │   (SSL Termination & CDN)   │
                     └───────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
      ┌──────────────────────┐       ┌──────────────────────┐
      │ Next.js Web Frontend │       │ Express 5 API Server │
      │   (Vercel / Docker)  │       │  + Socket.IO Server  │
      │  Port 3001 / Port 80 │       │  (AWS ECS / Railway) │
      └──────────────────────┘       └───────────┬──────────┘
                                                 │
                                                 ▼
                                     ┌──────────────────────┐
                                     │     Managed MySQL    │
                                     │  (AWS RDS / Cloud SQL)│
                                     │      Port 3306       │
                                     └──────────────────────┘
```

### 10.2 Component Deployment Guidelines

1. **Frontend (Next.js 16)**:
   - Deploy as a standalone Node.js container or deploy directly to **Vercel**.
   - Build command: `npm run build --workspace=@dumline/web`
   - Set environment variables: `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` pointing to the public API domain (e.g., `https://api.dumline.com`).

2. **Backend API & Real-Time Engine (Express 5 + Socket.IO 4)**:
   - Deploy on containerized platforms that support persistent WebSockets: **AWS ECS (Fargate)**, **Google Cloud Run** (with session affinity enabled), or **Railway**.
   - **Crucial Requirement:** Persistent WebSocket connections require a long-running Node.js process. Do not deploy Socket.IO onto standard AWS Lambda or stateless serverless functions without a dedicated WebSocket proxy.
   - For horizontal scaling across multiple container instances, configure the `@socket.io/redis-adapter` with a managed Redis cluster.

3. **Database (MySQL 8.0)**:
   - Provision a managed database service such as **AWS RDS MySQL** or **Google Cloud SQL**.
   - Set `DATABASE_URL="mysql://user:password@db-host:3306/dumline_prod?sslaccept=strict"`.
   - Run migrations via CI/CD before container startup: `npm run migrate --workspace=@dumline/server`.

4. **Reverse Proxy & Load Balancing**:
   - NGINX or AWS Application Load Balancer (ALB) configured with WebSocket upgrade headers:
     ```nginx
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
     proxy_http_version 1.1;
     ```

---

## 11. Troubleshooting & FAQ

### Issue 1: Database Connection Refused (`ECONNREFUSED 127.0.0.1:3306`)
- **Cause:** Local MySQL service is stopped or not listening on port 3306.
- **Solution:** Verify MySQL status using Windows Services (`services.msc`), Docker (`docker ps`), or command line (`systemctl status mysql`). Confirm `DATABASE_URL` credentials in `.env`.

### Issue 2: Prisma Client Initialization / Driver Adapter Error
- **Cause:** Prisma 7 requires driver adapter initialization when connecting directly to MySQL.
- **Solution:** The codebase uses `@prisma/adapter-mariadb` defined in `apps/server/src/prisma/client.ts`. Re-run `npm run generate --workspace=@dumline/server` and ensure migrations are applied.

### Issue 3: Port 3000 or 3001 Already in Use
- **Cause:** A previous instance of the server or another local application is holding the port.
- **Solution (Windows):**
  ```powershell
  Get-NetTCPConnection -LocalPort 3000, 3001 | Select-Object OwningProcess, LocalPort
  Stop-Process -Id <PID> -Force
  ```
- **Solution (macOS / Linux):**
  ```bash
  lsof -ti:3000,3001 | xargs kill -9
  ```

### Issue 4: Cross-Outlet Forbidden Error (`403 CROSS_OUTLET_FORBIDDEN`)
- **Cause:** Kitchen Staff or Outlet Manager attempted to view or mutate orders belonging to a different restaurant branch.
- **Solution:** This is intentional RBAC security enforcement. Log in as Central Admin (`admin@dumline.com`) to view or manage cross-outlet queues, or sign in as the staff member assigned to that specific branch.

---

## 12. Security Notes & Best Practices

1. **Zero Credential Exposure**:
   - Never commit `.env` files or credentials into version control. `.gitignore` is configured to prevent committing `.env`, `node_modules`, and local build artifacts.

2. **Cryptographic Password Hashing**:
   - All user passwords are encrypted using **Argon2id** (`argon2.hash()`) with secure memory and time cost parameters, preventing rainbow table attacks.

3. **Strict RBAC & Tenant Isolation**:
   - Backend queries validate role permissions and outlet assignment (`where: { outletId: user.assignedOutletId }`) before reading or mutating order data.

4. **Payment Idempotency**:
   - Checkout and payment submission endpoints require client-generated UUID idempotency keys. Duplicate submissions are intercepted and resolved without duplicate financial transactions.

5. **Financial Pricing Compliance**:
   - All item prices are inclusive of 5% restaurant GST. Frontend calculated prices are never trusted blindly; the backend recalculates and verifies subtotal, tax breakdown, and delivery fees before creating order records.
