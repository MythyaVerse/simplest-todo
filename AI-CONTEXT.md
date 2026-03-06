# AI-CONTEXT.md

## Project snapshot
- Purpose: Minimal Next.js todo app with Neon Postgres backend
- Current state: working - Neon database connected
- Key entry points: `app/` (Next.js App Router), `lib/db.ts` (database layer)

## How to run
- Install: `npm install`
- Dev: `npm run dev` → http://localhost:3000
- Build: `npm run build`
- Start: `npm start`

## Environment & configuration
- Required env vars:
  - `DATABASE_URL` - Neon Postgres connection string (in `.env.local`)
- Where config is defined: `.env.local` (local), Vercel env vars (production)

## Database
- DB type/version: Neon Serverless Postgres v17
- Project ID: `wispy-cherry-34906598`
- Connection: pooled connection via `@neondatabase/serverless`
- High-level schema:
  ```sql
  CREATE TABLE todos (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false
  );
  ```

## Repo structure
- `app/` - Next.js App Router pages and API routes
- `lib/db.ts` - Database helper with CRUD operations for todos
- `src/` - Legacy source directory (may contain old code)

## Known issues and fixes
- None yet

## Recent changes / decisions
- 2026-03-06:
  - Change: Added Neon Postgres integration
  - Reason: Replace local storage with persistent database

## HANDOFF (for the next agent)
- Current objective: Neon integration complete, ready for UI integration
- What I changed:
  - Created `lib/db.ts` with todo CRUD operations
  - Created `.env.local` with DATABASE_URL
  - Installed `@neondatabase/serverless`
  - Created `todos` table in Neon
- What to do next:
  1. Update UI components to use `lib/db.ts` instead of local storage
  2. Create API routes if needed for client-side fetching
  3. Add error handling for database operations
