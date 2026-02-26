# PriceMe — Claude Project Context

## What Is This

PriceMe is a SaaS pricing tool for small product-based businesses (e.g., Etsy sellers, makers). It lets users track product costs (materials, labor, overhead), calculate recommended prices, monitor competitor pricing, and record sales.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TypeScript, TailwindCSS, shadcn/ui (Radix primitives) |
| State / Data | TanStack Query v5 (server state), React Hook Form + Zod (forms) |
| Backend | Node.js, Express 4, TypeScript, `tsx` for dev |
| Database | PostgreSQL via `@vercel/postgres` (Vercel Postgres / Neon) |
| Auth | JWT (Bearer tokens), bcryptjs for password hashing |
| AI | Google Gemini 2.5 Flash (competitor analysis, market insights) |
| Monorepo | npm workspaces |
| Deployment | Vercel (web as static SPA, API as separate service) |

---

## Repository Structure

```
/
├── apps/
│   ├── web/          # React SPA (Vite)
│   │   └── src/
│   │       ├── components/   # Shared UI components + shadcn/ui primitives in ui/
│   │       ├── hooks/        # Data-fetching hooks (TanStack Query wrappers)
│   │       ├── lib/          # api.ts (axios client), utils.ts
│   │       ├── pages/        # Route-level page components
│   │       └── types/        # Frontend-only types
│   ├── api/          # Express REST API
│   │   └── src/
│   │       ├── controllers/  # Request handlers
│   │       ├── middleware/   # auth.ts (JWT), errorHandler.ts
│   │       ├── models/       # (reserved)
│   │       ├── routes/       # Express routers (one file per resource)
│   │       ├── services/     # ai.service.ts, notification.service.ts
│   │       ├── jobs/         # priceMonitor.ts (runs every 24h)
│   │       ├── utils/        # db.ts (re-exports @vercel/postgres sql tag)
│   │       └── server.ts     # Entry point
│   └── e2e/          # Playwright end-to-end tests
└── packages/
    └── shared/       # Zod schemas + TypeScript types shared by web and api
        └── src/
            ├── schemas/  # Zod validation schemas (single source of truth for API contracts)
            └── types/    # Shared TypeScript interfaces
```

---

## Key Commands

```bash
# Development (both web + api concurrently)
npm run dev

# Individual
npm run dev:web        # Vite on :5173
npm run dev:api        # tsx watch on :3001

# Build (builds shared first, then all workspaces)
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# E2E tests
npm run test:e2e
```

**Environment files:** `apps/api/.env.local` (local dev), `.env.custom` (overrides). Required vars: `POSTGRES_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `FRONTEND_URL`.

---

## Database

Schema is defined and migrated inline at startup via `apps/api/src/utils/db.ts:6` (`initializeDatabase()`). No separate migration tool — columns are added with `ALTER TABLE` guarded by `information_schema` checks.

Core tables: `users`, `user_settings`, `products`, `materials`, `labor_costs`, `other_costs`, `categories`, `user_materials`, `product_variants`, `variant_attributes`, `product_templates`, `sales`, `competitors`, `tracked_products`, `price_history`, `notifications`, `roadmap_features`, `roadmap_votes`.

---

## Additional Documentation

Check these files when working on relevant areas:

| Topic | File |
|---|---|
| Architecture & patterns | `.claude/docs/architectural_patterns.md` |
| Profit calculation logic | `docs/PROFIT_CALCULATION_SPEC.md` |
| Product spec | `docs/specs/products.md` |
| Sales transactions | `docs/specs/sales-transactions.md` |
| Product variants | `docs/specs/product-variants.md` |
| Product templates | `docs/specs/product-templates.md` |
| Competitor tracking plan | `docs/COMPETITOR_TRACKING_PLAN.md` |
| Deployment | `docs/DEPLOYMENT_GUIDE.md` |
| Local dev setup | `docs/LOCAL_DEV_SETUP.md` |
