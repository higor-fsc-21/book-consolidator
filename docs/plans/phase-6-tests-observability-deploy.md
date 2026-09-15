# Phase 6 — Tests, Observability, and Deploy Prep

Mirrors the structure of [docs/MIGRATION-PHASES.md](../MIGRATION-PHASES.md) (Fase 6), covering
unit and integration test suites, structured logging across all mutations and Route Handlers,
and production deployment preparation for Vercel and Supabase.

## Objective

Harden the application through automated tests (unit and integration), introduce structured
logging with an abstracted interface ready for monitoring providers, and prepare the project
for production deployment on Vercel with PostgreSQL on Supabase.

**Decisions applied:** D35 (testing strategy: unit + integration, no E2E), D36 (deploy on
Vercel + Supabase), D37 (environment variables segregation), D38 (observability via logger
interface), D40 (no formal API docs).

## Scope

- **Unit Testing (Vitest)**:
  - Add `vitest` and `@vitest/coverage-v8` to `devDependencies`.
  - Configure `vitest.config.ts` for Node/TS environment, colocating unit tests next to
    source files (`src/**/*.test.ts`).
  - Unit test coverage:
    - `src/domain/scheduling.test.ts`: test `nextRevisionDate` (fixed ladder, clamping to
      `completedAt + 1d`, boundary dates) and `consolidationStateFor` (D49 criteria: min
      sessions, min average score, 90-day recency).
    - `src/domain/derived.test.ts`: test `effectiveConsolidationState`, `revisionRecords`,
      `lastPerformance`, `coverGradient`, progress/score metrics, `sessionHistory`,
      `pendingSessions`.
    - `src/domain/prompts.test.ts`: test prompt generation for `generateDirectPrompt`,
      `generateGuidedPrompt`, and `generateRecognitionPrompt`.
    - `src/lib/validators.test.ts`: test Zod schemas (`CreateBookInputSchema`,
      `UpdateBookInputSchema`, `CreateChapterInputSchema`, `CreateQuestionInputSchema`,
      `CompleteSessionInputSchema`, `CancelSessionInputSchema`) ensuring invalid or injected
      client-side fields (`id`, `userId`, `score`, `consolidationState`) are rejected.
    - `src/lib/logger.test.ts`: test logger output and redaction guarantees.

- **Integration Testing (Vitest + Testcontainers)**:
  - Add `@testcontainers/postgresql` (or `testcontainers`) to `devDependencies`.
  - Configure `vitest.integration.config.ts` targeting `tests/integration/**/*.test.ts` with
    longer timeouts.
  - Setup and teardown in `tests/integration/setup.ts` to spin up an ephemeral PostgreSQL
    container and run Prisma migrations (`prisma migrate deploy`).
  - Test database helpers in `tests/integration/helpers/db.ts`: test `PrismaClient` singleton,
    test user creation, and FK-safe truncation reset.
  - Integration test suites:
    - `tests/integration/books.integration.test.ts`: test `addBook` transaction (creating book
      and initial chapters atomically, verifying rollback on error).
    - `tests/integration/sessions.integration.test.ts`: test `startSession` and `completeSession`
      transaction (creating attempts, computing score from persisted attempts, updating session
      and book schedule/state).
    - `tests/integration/authorization.integration.test.ts`: verify user data isolation (D08),
      ensuring queries in `src/domain/queries/*` never return another user's records.
    - `tests/integration/soft-delete.integration.test.ts`: verify soft deletion (D27), ensuring
      soft-deleted books are omitted from listings and detail queries.

- **Observability (Logger)**:
  - Create `src/lib/logger.ts` implementing the `Logger` interface from D38:
    ```ts
    export interface Logger {
      info(event: string, meta?: Record<string, unknown>): void;
      error(
        event: string,
        error: unknown,
        meta?: Record<string, unknown>,
      ): void;
    }
    ```
  - Standard implementation backed by `console.info` / `console.error` with timestamp and
    structured metadata, ready for future Sentry/Datadog integration.
  - Wire logger into all Server Actions (`src/app/actions/{books,chapters,questions,sessions}.ts`)
    and Route Handlers (`src/app/api/books/search/route.ts`).
  - Strict compliance with D38: never log secrets, full answers, or sensitive personal data.

- **Deploy Preparation (Vercel + Supabase)**:
  - Verify Prisma datasource configuration for serverless connection pooling (`url` with
    Supabase pooler / PgBouncer, `directUrl` for direct migrations).
  - Verify client/server environment variable separation per D37: ensure only
    `NEXT_PUBLIC_*` variables are bundled client-side.
  - Document deployment checklist and production environment variables.

## Deliverables

- `src/lib/logger.ts` and `src/lib/logger.test.ts`.
- Unit test suites in `src/domain/` and `src/lib/`.
- Integration test setup and suites under `tests/integration/`.
- `vitest.config.ts` and `vitest.integration.config.ts`.
- Updated `package.json` with test scripts and dependencies.
- Logger integration across all Server Actions and Route Handlers.
- `docs/plans/phase-6-tests-observability-deploy.md`.

## Completion criteria

- [x] Unit tests pass via `pnpm test`.
- [x] Integration tests pass via `pnpm test:integration`.
- [x] No E2E tests created (explicitly excluded per D35).
- [x] No OpenAPI documentation generated (explicitly excluded per D40).
- [x] Logger interface implemented and applied across all Server Actions and Route Handlers.
- [x] Environment variable segregation verified (no secrets in client bundle).
- [x] `pnpm typecheck` (`tsc --noEmit`) and `pnpm build` pass without errors.

## Production Deployment Checklist

1. **Supabase Production Project**:
   - Create Supabase project in the desired region.
   - Note down:
     - Transaction pooler connection string (port 6543, `?pgbouncer=true`) -> `DATABASE_URL`
     - Direct connection string (port 5432) -> `DIRECT_URL`
     - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
     - Publishable/Anon key -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
2. **Migrations & Seed**:
   - Run `pnpm prisma migrate deploy` with `DATABASE_URL` / `DIRECT_URL` pointed at production.
   - If initial seed data is desired, set `SEED_USER_AUTH_ID` and `SEED_USER_EMAIL`, then run
     `pnpm db:seed`.
3. **Vercel Project Setup**:
   - Link repository to Vercel.
   - Configure Environment Variables in Project Settings:
     - `DATABASE_URL`: Supabase pooler URL with `?pgbouncer=true&connection_limit=1`
     - `DIRECT_URL`: Supabase direct database URL
     - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/publishable key
     - `GOOGLE_BOOKS_API_KEY`: Secret Google Books API key (server-side only)
4. **Post-Deploy Smoke Test**:
   - Authenticate via Supabase Auth / Google OAuth.
   - Add a book using Google Books search.
   - Run and complete a consolidation session.
   - Verify server logs show structured events without sensitive data leaks.

## Risks

- PostgreSQL serverless connection exhaustion: mitigated by configuring connection pooling
  with `connection_limit=1` on Vercel serverless functions.
- Ephemeral test containers require Docker running locally: mitigated by separating fast unit
  tests (`pnpm test`, no Docker) from integration tests (`pnpm test:integration`).
