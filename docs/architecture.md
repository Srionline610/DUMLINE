# Dumline – Phase 2 Architecture Diagram

> **Note:** This diagram reflects the approved architecture defined in `AGENTS.md` and the Dumline assessment brief. It is intended for documentation purposes only; implementation details may evolve.

```mermaid
flowchart TD
    %% Frontend Layer
    subgraph Frontend[Frontend (Next.js 16 / React 19 / TypeScript)]
        FE[Customer UI] -->|HTTPS (REST) / WS| BE[Backend API]
        Admin[Admin Dashboard] -->|HTTPS (REST) / WS| BE
    end

    %% Backend Layer
    subgraph Backend[Backend (Node.js / Express)]
        BE --> Auth[Authentication & Authorization]
        Auth --> Validation[Input Validation (Zod)]
        Validation --> Service[Business Logic Services]
        Service --> Prisma[Prisma ORM (MySQL)]
        Service --> SocketIO[Socket.IO (real‑time updates)]
        Service --> AI[AI‑powered Prep‑Time Estimation]
    end

    %% Database Layer
    subgraph Database[Database (MySQL + Prisma)]
        Prisma --> User[User Table]
        Prisma --> Outlet[Outlet Table]
        Prisma --> Order[Order Table]
        Prisma --> OrderItem[OrderItem Table]
        Prisma --> Payment[Payment Table]
    end

    %% Shared / Supporting Components
    subgraph Shared[Shared Packages]
        Types[Shared Types & Schemas]
        Env[Environment Config (.env)]
    end

    %% Data Flow Paths
    FE -->|User actions| Auth
    Admin -->|Admin actions| Auth
    Auth -->|Validated request| Validation
    Validation -->|Valid data| Service
    Service -->|CRUD ops| Prisma
    Service -->|Emit events| SocketIO
    Service -->|Request estimate| AI
    AI -->|Estimation result| Service
    SocketIO -->|Push updates| FE
    SocketIO -->|Push updates| Admin
    Types -->|Used by| FE
    Types -->|Used by| BE
    Env -->|Used by| BE
    Env -->|Used by| FE
```

---

### Components Overview

- **Frontend** – Next.js 16 with React 19, written in TypeScript. Provides the customer ordering flow, admin dashboard, and real‑time order status UI (via WebSocket). Responsive and mobile‑first.
- **Backend** – Express server exposing a REST API and a Socket.IO endpoint. Handles authentication (JWT/session), authorization (RBAC), input validation (Zod), business‑logic services, and delegates persistence to Prisma.
- **Database** – MySQL managed through Prisma 7. Models include `User`, `Outlet`, `Order`, `OrderItem`, and `Payment`.
- **AI Estimation** – Calls the Google Gemini API (real AI) to compute preparation‑time estimates; falls back to deterministic logic when unavailable.
- **Shared Packages** – Central `packages/shared` houses TypeScript types and Zod schemas used by both frontend and backend. Environment variables are loaded from `.env`/`.env.example`.

---

*This file is intended for inclusion in the repository under `docs/architecture.md`.*
