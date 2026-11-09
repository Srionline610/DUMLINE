# DUMLINE — Project Engineering Rules

## 1. Project Identity

Project: Dumline  
Concept: The Modern Royal Kitchen  
Purpose: Premium direct-ordering platform for a Hyderabad-based biryani restaurant chain.  
Assignment: IsoCode Labs Software Engineering Intern Assessment.  

Dumline must deliver a polished, responsive, production-minded restaurant ordering experience with reliable backend functionality.

This is an assessment prototype. Never represent mock services as real production integrations.

## 2. Role and Responsibility

Act as a Senior Full-Stack Engineer working under the direction of the Principal Architect.

The user is the Product Owner.

Technical direction, architecture proposals, and implementation guidance are presented iteratively to the Product Owner for review and explicit approval.

Do not make major architectural or product decisions without presenting the decision and its rationale first.

## 3. Source of Truth & Scope

The assignment brief and approved architecture are the source of truth.

### Required MVP Functionality:
- Customer ordering web application with guest menu browsing.
- Mandatory customer authentication prior to order placement/checkout submission.
- Outlet selection with outlet-specific menu pricing, item customization, and availability (86ing/stock status).
- Single-outlet cart isolation: each cart is strictly bound to one outlet; switching outlets requires user confirmation before clearing the active cart.
- Fulfillment methods:
  - Simulated direct delivery: Simple demo address input, fictional demo outlet service areas with configurable delivery-radius validation, and simulated delivery fee calculation. Staged for simulated dispatch and completed upon simulated handoff. (Explicitly documented as demo validation, not production address verification or live geocoding).
  - Store pickup / takeaway: Staged for customer collection and completed upon order handoff.
  - No rider tracking or third-party delivery provider integrations.
- Server-side mock payment processing (UPI and Card) with idempotent submission.
- Pricing compliance: Displayed prices are GST-inclusive; checkout provides base + inclusive GST breakdown without double-charging.
- Marketing consent: Customer marketing/promotional communications consent must be explicitly opt-in (unchecked by default).
- Central menu administration (global catalog with outlet-level price and availability overrides).
- Kitchen staff authentication and outlet-isolated role-based access (staff view and manage only their assigned outlet's orders).
- Kitchen Display System (KDS) with a dedicated operational interface.
- Real-time order status updates via Socket.IO.
- AI-assisted preparation-time estimation with structured inputs, validated outputs, deterministic fallback, and manager overrides.
- Overdue order alerting: orders $\ge$ 10 minutes overdue trigger an outlet-manager alert and real-time customer notification.
- Seed data and mandatory fixtures:
  - The three exact sample orders from the IsoCode Labs assignment brief are mandatory seed fixtures. Preserve their exact order IDs, outlet names, item names, quantities, totals, payment methods, timestamps, promised times, and statuses without replacing them with invented scenarios.
  - Authentic Hyderabadi culinary taxonomy for catalog items paired with realistic fictional Hyderabad outlet locations (e.g., Jubilee Hills, Banjara Hills, Gachibowli).
  - Additional scenarios may be added for testing, but must be clearly identified as supplemental demo data.
  - All demo registration numbers, GSTINs, and FSSAI licenses must be explicitly identified as fictional demo values (e.g., `FSSAI Lic. No. 10000000000000 (Demo/Mock)`).
- Unit/integration/E2E tests, documentation, and deployment instructions.

### Stretch Goals (Post-MVP):
- Customer loyalty program, reward points accrual, and membership tiers.  
  *(Note: A GitHub repository description mentioning Loyalty does not make it a mandatory MVP feature. Do not implement loyalty until the core assessment flows are fully completed and tested).*

### Out of Scope:
- Real third-party delivery partner API integrations (e.g. Dunzo, Shadowfax).
- Rider-facing mobile application and live GPS rider tracking.
- Real production payment gateway processing.
- Real physical ERP, inventory depletion, or POS billing machine integrations.
- Table reservation or dining floor-plan management.
- Features that do not directly improve the core assessment evaluation.

## 4. Visual Direction & Design Systems

Dumline implements two distinct visual design systems appropriate to their user environments: Customer Experience and Kitchen Display System.

### Customer Experience Design System:
- Visual concept: Modern Hyderabadi culinary heritage with premium editorial design.
- Core palette:
  - Royal Ivory: `#F7F3EA`
  - Charcoal Umber: `#211C18`
  - Biryani Crimson: `#9E3428`
  - Antique Saffron: `#C18A3B`
  - Heritage Sage: `#68735A`
  - Soft Sand: `#EFE7D8`
- Typography:
  - Display: Cormorant Garamond.
  - UI and Body: Manrope.
- Color Contrast Guardrail (WCAG AA):
  - Antique Saffron (`#C18A3B`) on Royal Ivory (`#F7F3EA`) fails WCAG AA contrast (~2.8:1).
  - Saffron is strictly prohibited for body text or unbordered text on light backgrounds.
  - Saffron must be restricted to borders, accent icons, or pill backgrounds with dark text. For text on light surfaces, use accessible dark alternatives such as Deep Saffron (`#8C5E1A`, contrast $\ge$ 4.5:1) or Charcoal Umber.
- Design principles:
  - High-quality food presentation and spacious editorial hierarchy.
  - Elegant, restrained motion.
  - Mobile-first responsive layouts.
  - High-quality interaction feedback (loading states, toasts, micro-interactions).

### Kitchen Display System (KDS) Operational Design System:
- Optimized for high-glare, fast-paced commercial kitchen environments.
- Dark/neutral operational canvas with high-contrast status tokens:
  - Green: New / On Schedule
  - Amber / Yellow: Approaching Promised Time
  - Crimson / Red: Overdue ($\ge$ 10 minutes past promised time) or urgent
- Large, high-legibility typography readable from 3–5 feet away.
- Touch-friendly controls with minimum target dimensions of 48×48px.
- Full support for `prefers-reduced-motion`.

## 5. Engineering Standards

Use TypeScript wherever applicable across the entire codebase.

### Monorepo Architecture:
- Repository structure: Next.js + Express monorepo (e.g. `apps/web` for frontend, `apps/server` for backend, `packages/shared` for shared types/schemas).
- Frontend: Next.js (React, TypeScript).
- Styling: Tailwind CSS.
- Animation: Motion (framer-motion).
- Client state: Zustand where appropriate.
- Backend: Dedicated Node.js and Express server.
- Real-time updates: Socket.IO running directly with the dedicated Express server (not dependent on unsupported serverless WebSocket runtimes).
- Database: MySQL running through local Docker Compose (`docker-compose.yml`) as the default development environment. Prisma ORM handles schema migrations and queries.
  - Required environment variables (`DATABASE_URL`, etc.) and setup steps must be fully documented in `.env.example` and `README.md`.
  - Never commit secrets or real credentials.
  - Hosted database deployment options can be determined later.
- Validation: Shared Zod schemas enforced on both frontend and backend.
- Testing: Vitest, React Testing Library, and Playwright.

Before installing dependencies:
- Verify current stable versions.
- Check compatibility.
- Explain major dependencies.
- Avoid unnecessary libraries.

Do not change the approved stack without justification and approval.

## 6. Functional Integrity & Business Logic

Every visible interactive control must work.

Never:
- Use fake buttons or non-functional placeholder interactions.
- Hardcode successful payment responses without going through the server-side contract.
- Simulate a backend without documenting it.
- Claim an AI model exists when only a heuristic is implemented, or fabricate AI output.
- Store sensitive secrets or credentials in frontend code.
- Trust frontend-calculated prices or cart totals.
- Skip server-side validation.

### Order Status State Machine:
All order state transitions are validated and enforced by the backend API:
- `PLACED`: Order successfully created after payment validation.
- `ACCEPTED`: Acknowledged by outlet kitchen staff.
- `PREPARING`: Food is actively being cooked in the kitchen.
- `READY`: Order is prepared and staged for fulfillment:
  - Pickup: Staged for customer collection.
  - Simulated Delivery: Packed and staged for simulated dispatch.
- `COMPLETED`: Terminal fulfillment state:
  - Pickup: Handed over to customer upon collection.
  - Simulated Delivery: Marked complete upon simulated delivery handoff.
- `CANCELLED`: Terminal state. Permitted only from `PLACED` or `ACCEPTED` with a logged cancellation reason. Cancellation from `PREPARING` or later requires outlet-manager authorization.

Invalid transitions (e.g. `PLACED` $\rightarrow$ `COMPLETED`, skipping `READY`, or transitioning from `CANCELLED`) must be rejected with HTTP 400/409 errors. Order status must be committed to the database before publishing real-time Socket.IO events.

### Server-Side Mock Payment Contract:
- Endpoints must simulate both UPI and Card payment methods.
- Predictable test triggers:
  - Success scenarios: Test UPI VPA `success@upi` or test card ending in `4242` $\rightarrow$ status `PAID`.
  - Failure scenarios: Test UPI VPA `fail@upi` or test card ending in `0002` $\rightarrow$ status `FAILED` with specific failure reasons (e.g., `INSUFFICIENT_FUNDS`, `BANK_TIMEOUT`).
- Idempotency & Duplicate Prevention: Every checkout request must require an idempotency key. Duplicate submission attempts while an order is processing must be locked and rejected.
- Zero real cardholder or payment data handled or persisted.

### Pricing & GST Calculation:
- All listed menu item prices are GST-inclusive (5% restaurant GST included in retail price).
- Backend calculation breaks down `basePrice = itemPrice / (1 + 0.05)` and `gstAmount = itemPrice - basePrice` for display and receipts.
- GST must NOT be added on top of displayed prices during checkout.

### Cart & Outlet Association:
- A cart is strictly bound to one outlet.
- If a customer switches outlets while items are in the cart, a modal prompt requires confirmation that changing outlets will clear the current cart.

### Delivery & Fulfillment Validation:
- Outlet delivery service areas are defined by configurable delivery-radius thresholds per outlet.
- Checkout validates demo address input against the selected outlet's demo service radius.
- Delivery fee is calculated via a transparent simulated tier based on radius.
- Delivery validation is explicitly documented as simulated demo validation, not production address geocoding.

### Customer Privacy & Consent:
- Marketing and promotional communications consent must be an explicit, unselected opt-in checkbox during checkout or account creation.

## 7. AI Preparation-Time Estimation & Overdue Alerts

The preparation-time estimator provides intelligent, transparent preparation scheduling.

### Separation of Concepts:
The system distinguishes four distinct preparation-time concepts:
1. **AI Estimate ($E_{\text{AI}}$)**: Intelligent estimate generated by a real AI model (e.g., Google Gemini API via official SDK) based on order items, prep complexity tags, station batching, active kitchen load, and peak indicators.
2. **Deterministic Fallback Estimate ($E_{\text{Fallback}}$)**: Mathematical formula executed when the AI service is unavailable, times out, or returns invalid schema.
3. **Outlet Minimum Preparation Time ($T_{\text{Min}}$)**: Operational floor configured per outlet (e.g., 20 minutes) representing the minimum logistical threshold.
4. **Final Promised Preparation Time ($T_{\text{Promised}}$)**: The binding preparation time presented to the customer and monitored by KDS:
   $$T_{\text{Promised}} = \max(E_{\text{Active}}, T_{\text{Min}})$$
   where $E_{\text{Active}} = E_{\text{AI}}$ if successful, else $E_{\text{Fallback}}$.

### Real AI Service Integration:
- Uses a real AI service (e.g. Google Gemini API via official SDK) with structured inputs and schema-validated outputs.
- Inputs to AI model:
  - List of ordered items, item categories, and item quantities.
  - Dish-specific preparation complexity tags (e.g., `DUM_COOKING`, `TANDOOR`, `READY_TO_SERVE`).
  - Active outlet workload (number of orders currently in `ACCEPTED` and `PREPARING` states).
  - Time of day and peak-hour indicator.
- Output requirements & bounding:
  - Estimated preparation time in minutes (`number` clamped within realistic bounds, e.g., $[5, 120]$ minutes).
  - Natural-language explanation of estimate factors (`string`).
  - Confidence rating (`number` between $0.0$ and $1.0$).
- Double-counting safeguard: The prompt and logic must account for parallel kitchen stations (e.g., Biryani station and Salan/Dessert station prepare concurrently), avoiding additive multiplication of cook times for items prepared in parallel.
- Model parameters, prompts, latency, and operational limitations must be thoroughly documented. Never claim machine learning training or model capabilities without evidence.

### Deterministic Fallback Rule:
If the AI service is unavailable, encounters a network timeout, or returns invalid schema/out-of-bounds output, the system immediately falls back to a deterministic calculation:
$$\text{Fallback Minutes} = \text{Base Prep Time} + \max_{s \in \text{Stations}}(\text{Station Max Prep Time}) + (\text{Active Orders} \times \text{Workload Factor})$$
- Item quantities within the same station add a fractional scale factor (e.g., $+2$ minutes per additional portion) rather than full sequential cook time, preventing double-counting.
- Assumptions and limitations of the formula must be clearly documented in architecture and API documentation.

### Promised Preparation Time Rule:
In accordance with the assignment brief, the promised preparation time presented to the customer must be:
$$T_{\text{Promised}} = \max(E_{\text{Active}}, T_{\text{Min}})$$

### Overdue Order Alerting Rule:
- When $\text{Elapsed Time} \ge T_{\text{Promised}} + 10\text{ minutes}$ and order status is not yet `READY` or `COMPLETED`:
  - An urgent visual and audible alert is displayed on the outlet Kitchen Display System.
  - A real-time notification is dispatched to the customer's order tracking screen.
  - The overdue event is recorded in the order audit log.

### Manager Overrides:
- Outlet managers may manually adjust preparation times.
- All overrides must require a reason and be recorded in an audit trail.

## 8. Security & Access Control

Implement:
- Customer Authentication: Mandatory prior to order checkout; guest browsing permitted for menus and outlets.
- Role-Based Access Control (RBAC):
  - `CUSTOMER`: Can place orders, view order tracking, and manage their profile.
  - `KITCHEN_STAFF`: Scoped strictly to their assigned `outletId`; can view KDS and update order preparation states.
  - `OUTLET_MANAGER`: Scoped to their assigned `outletId`; can override prep times, manage outlet availability, and view outlet metrics.
  - `ADMIN`: Central administrator; can manage all outlets, users, global menu, and view cross-outlet analytics.
- Outlet Isolation: Backend queries must enforce `where: { outletId }` for staff roles to prevent cross-outlet data exposure.
- Password Hashing: Use bcrypt or argon2 with safe work factors.
- Session Security: Secure, httpOnly JWTs or session tokens.
- Server-side validation with Zod on all incoming requests.
- Rate limiting on authentication, checkout, and AI estimation endpoints.
- Environment variables for all secrets; never commit keys, credentials, or customer data.

## 9. Accessibility and Performance

Follow WCAG 2.2 AA as a minimum practical target.

Implement:
- Accessible color contrast: avoid or darken low-contrast saffron text; ensure minimum 4.5:1 ratio for standard text.
- KDS operational readability: high-contrast status tokens, 3–5 foot legibility, $\ge 48\text{px}$ touch targets.
- Keyboard navigation across the entire customer ordering flow.
- Visible focus rings with high contrast.
- Semantic HTML and ARIA labels for modal dialogs, drawer menus, and dynamic status banners.
- Reduced-motion support (`prefers-reduced-motion`) across animations.
- Touch-friendly controls for mobile and kitchen tablets.

Performance targets:
- LCP $\le$ 2.5 seconds.
- INP $\le$ 200 milliseconds.
- CLS $\le$ 0.1.

Treat these as measurable targets requiring audit via Lighthouse / Playwright.

## 10. Development Workflow

Work incrementally in defined phases:
1. Architecture Planning & Specification.
2. Monorepo Setup & Database Modeling (Prisma + MySQL via Docker Compose).
3. Core Backend APIs, State Machine, & Mock Payment.
4. AI Preparation-Time Estimator & Deterministic Fallback.
5. Customer Frontend: Outlet Selection, Menu Browsing, & Cart.
6. Customer Checkout, Auth, & Simulated Payment.
7. Kitchen Display System (KDS) & Real-Time Socket.IO Updates.
8. Testing, Accessibility Audit, & Deployment Documentation.

Before each phase:
1. Inspect project structure and existing code.
2. Review relevant files and dependencies.
3. Identify dependencies, edge cases, and risks.
4. Explain the implementation plan and acceptance criteria.
5. Wait for Product Owner approval before writing code.

After each phase:
1. Implement approved scope.
2. Run automated test suites.
3. Verify zero TypeScript errors and zero browser console warnings.
4. Verify responsive mobile and desktop viewports.
5. Report completed deliverables and known issues.
6. Recommend next phase.

Do not overwrite working code unnecessarily. Do not generate the entire application in a single task.

## 11. Git Standards

Use meaningful conventional commits:
- chore: initialize project architecture
- feat: implement premium customer homepage
- feat: implement menu browsing and outlet selector
- feat: implement cart and single-outlet isolation
- feat: implement mock payment contract and checkout
- feat: add kitchen display system with high-contrast UI
- feat: add real-time Socket.IO order updates
- feat: implement AI prep-time estimator with deterministic fallback
- test: add order state machine integration tests
- docs: add deployment and architecture documentation

Do not force-push or rewrite git history without approval.

## 12. Documentation

Maintain:
- `README.md`: Project overview, quickstart, architecture summary.
- `deployment.md`: Environment setup, database migrations, Docker Compose instructions, and production build instructions.
- `TDD.md`: Test-driven development notes and coverage reports.
- `ARCHITECTURE.md`: Monorepo structure, state machine diagrams, and data models.
- `.env.example`: Documented sample environment variables.
- `API.md`: Documented REST endpoints and Socket.IO events.

Document all assumptions, limitations, mock integrations, and future improvements.

## 13. Current Instruction

The architecture planning phase is complete.

The Principal Solution Architecture Blueprint v1.2.0-FINAL and the Phase 2 implementation plan have been explicitly approved by the Product Owner.

The current phase is **Phase 2 — Foundation Implementation**.

### 13.1 Authorized Scope

Implement Phase 2 only:

- Monorepo foundation.
- Shared package foundation.
- Prisma 7 schema and MySQL adapter configuration.
- Initial database migration.
- Idempotent seed data preserving all three mandatory assessment orders exactly.
- Minimal Next.js 16 / React 19 application foundation.
- Required Phase 2 acceptance checks.

### 13.2 Implementation Rules

- Follow the approved Architecture Blueprint and all other instructions in this AGENTS.md.
- Use the existing local MySQL development environment.
- Keep Docker Compose as the canonical repository setup for other developers.
- Do not hardcode database credentials or commit secrets.
- Do not modify AGENTS.md without explicit approval.
- Do not install unapproved dependencies or silently change dependencies, versions, or architecture.
- Do not begin Phase 3 or implement out-of-scope features.

### 13.3 Workspace Verification

Before implementation:

- Inspect the existing workspace and Git status.
- Identify completed and incomplete Phase 2 work.
- Continue from the existing state.
- Do not recreate completed work.
- Preserve unrelated files and existing project configuration.

### 13.4 Acceptance Checks

Run the required Phase 2 acceptance checks, including:

- Dependency installation and compatibility verification.
- Prisma client generation.
- MySQL database connectivity.
- Initial migration execution.
- Seed execution and idempotency verification.
- Type checking and required build checks.
- Verification that all mandatory seed orders match the assessment brief exactly.

Do not claim a check passed unless it was actually executed and its result verified.

### 13.5 Completion Report

Report:

- Files created or modified.
- Migration results.
- Seed results.
- Acceptance checks passed and failed.
- Remaining blockers or incomplete work.

Stop after Phase 2.

The Product Owner has already explicitly approved Phase 2 implementation. Do not request approval again for the authorized Phase 2 scope.
