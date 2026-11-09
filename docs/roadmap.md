# Dumline – Engineering Roadmap

**Phase 2 – Architecture & Scaffold (Completed)**
- Monorepo skeleton (`apps/server`, `packages/shared`).
- Prisma schema with `User`, `Outlet`, `Order`, `OrderItem`, `Payment`.
- Initial migration `20261103090125_init`.
- Architecture diagram (`docs/architecture.md`).
- Root `README.md` and initial docs (`API.md`, `deployment.md`).

**Phase 3 – Database & Seed Data (Completed)**
- Idempotent seed script (`apps/server/src/prisma/seed.ts`) preserving all three mandatory assessment fixtures (`WEB-778120`, `WEB-778131`, `WEB-778146`).
- Synchronized database schema with MariaDB driver adapter.
- Verified fixture data integrity and idempotency.

**Phase 4 – Core Backend Implementation (Completed)**
- Express server configuration with centralized error handling and health check.
- Authentication & security module: Argon2id password hashing, JWT sessions, role-based access control (`CUSTOMER`, `KITCHEN_STAFF`, `OUTLET_MANAGER`, `ADMIN`), and outlet-level staff data isolation.
- Outlets module: Active outlet discovery, single outlet detail, admin creation, manager updating.
- Menu module: Central Hyderabadi menu catalog, dish complexity tags, outlet pricing overrides, and availability overrides (86ing).
- Cart & checkout module: Single-outlet cart binding, backend price re-verification, GST-inclusive breakdown (5% restaurant GST without double-charging), and simulated delivery radius validation.
- Server-side mock payment contract: Deterministic test triggers (`success@upi`/`fail@upi`, `...4242`/`...0002`) and payment idempotency deduplication.
- Order management module: Mandatory customer authentication, atomic order placement in Prisma transaction, order state machine enforcement (`PLACED → ACCEPTED → PREPARING → READY → COMPLETED`), cancellation restrictions, dedicated kitchen queue, manager prep time override, and overdue order checking ($\ge 10$ minutes).
- Automated test suite (19 tests across 6 suites passing with 100% success rate).

**Phase 5 – Frontend Scaffold & UI (Next)**
- Create `apps/web` Next.js 16 / React 19 project.
- Build customer ordering pages (menu browsing, cart with single-outlet isolation prompt, authenticated checkout).
- Build admin dashboard and Kitchen Display System (KDS) operational interface.
- Apply Hyderabadi culinary heritage visual design system (WCAG AA compliant color contrast, typography, responsive layouts).

**Phase 6 – Real-Time & AI Integration**
- Real-time Socket.IO event broadcasting (order state transitions, kitchen queue live updates, overdue alerts).
- Google Gemini AI preparation-time estimation integration with mathematical deterministic fallback.

**Phase 7 – Testing, Accessibility, & Delivery**
- End-to-end tests (Playwright, React Testing Library).
- WCAG 2.2 AA audit (contrast, keyboard navigation, screen reader accessibility, Core Web Vitals).
- CI/CD workflows and deployment documentation.

---

## Summary of Current Status
- **Completed:** Architecture blueprint, monorepo foundation, Prisma schema & seed data, core backend modules & REST APIs, security & RBAC, mock payment contract, comprehensive test suite.
- **Remaining:** Customer frontend & KDS UI (Phase 5), Socket.IO live events & Google Gemini AI estimation (Phase 6), E2E audit & deployment delivery (Phase 7).
