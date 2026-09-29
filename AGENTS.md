# AGENTS.md — AI Cyber Security Framework

## Stack
- **Next.js 15** (App Router, TypeScript) — single-origin fullstack app on port 3000
- **Prisma + PostgreSQL 16** — database ORM and storage
- **Tailwind CSS** — styling (dark theme)
- **jose** — JWT signing/verification (edge-compatible, used in middleware)
- **bcryptjs** — password hashing
- **openai** SDK — optional AI-powered security analysis

## Architecture
- Auth: JWT in httpOnly cookie. Middleware (`src/middleware.ts`) protects all non-auth routes.
- Route groups: `(auth)` for login/register (no shell), `(dashboard)` for authenticated pages (wrapped in `Shell` component with sidebar).
- API routes under `src/app/api/` handle auth, scans, and team management.
- Scanner: rule-based regex scanner (`src/lib/scanner.ts`) always runs; AI analysis (`src/lib/ai.ts`) runs only when a valid `OPENAI_API_KEY` is set.

## Setup & Run
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
The web service auto-runs `prisma db push` + seed on startup. Seed creates a default workspace with 3 demo users:
- admin@example.com / admin123 (ADMIN)
- analyst@example.com / analyst123 (ANALYST)
- viewer@example.com / viewer123 (VIEWER)

## Environment Variables
- `DATABASE_URL` — set inline in compose (local Postgres)
- `JWT_SECRET` — required for boot, auto-generated dev placeholder in `/run/base44/app.env`
- `OPENAI_API_KEY` — optional; enables AI security analysis. Without it, only rule-based scanning works.
- `BASE44_PUBLIC_HOST_SUFFIX` — passed from platform env for Next.js `allowedDevOrigins`

## Health Check
- `GET /api/health` returns `{ "status": "ok" }`
- Compose healthcheck polls this endpoint via `node -e "fetch(...)"`

## Key Files
- `prisma/schema.prisma` — database schema (Workspace, User, Scan, Finding)
- `src/lib/scanner.ts` — 15 rule-based security patterns
- `src/lib/ai.ts` — OpenAI integration for AI-powered findings
- `src/middleware.ts` — route protection
- `src/components/Shell.tsx` — sidebar + topbar layout
