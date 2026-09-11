# Memora — Personal Knowledge Consolidation System

Next.js 15 (App Router) + React 19 + Tailwind CSS v4 project.
Application for readers to transform reading into retained, explainable, and applicable knowledge through spaced consolidation sessions.

## Commands

- `pnpm dev` - Start development server (`next dev -p ${PORT:-8443}`)
- `pnpm build` - Build production bundle (`next build`)
- `pnpm start` - Start the production server (`next start -p ${PORT:-8443}`)
- `pnpm format` - Format code using `oxfmt`
- `pnpm exec tsc --noEmit` - Typecheck TypeScript code without emitting artifacts
- `pnpm db:up` / `pnpm db:down` - Start/stop the local Postgres container (Docker Compose)
- `pnpm db:migrate` - Apply Prisma migrations (`prisma migrate dev`)
- `pnpm db:seed` - Seed the database from `src/domain/mock.ts` (`prisma/seed.ts`)
- `pnpm db:studio` - Open Prisma Studio to inspect data

## Architecture & Domain Model

The core philosophy is grounded in `docs/knowledge-consolidation-app.md`: "Do not try to remember everything. Reconstruct the most important ideas without consulting notes."

### Three Consolidation Levels (`SessionMode`)

1. **Lembrar (`direct`)**: Active recall without clues — "Can I remember what I learned?"
2. **Explicar (`guided`)**: Feynman technique — "Can I explain this idea in my own words?"
3. **Reconhecer e Aplicar (`recognition`)**: Practical scenario recognition — "Can I spot this in real life?"

### Routing & Navigation

- App Router with real URL routes under `src/app/(app)/` (protected shell) and `src/app/(auth)/login/` (public). No client-side `NavState`/`onNavigate` — use `<Link href="...">` and `useRouter()` from `next/navigation`.
- Routes: `/` (Dashboard), `/biblioteca` (Library), `/livros/[bookId]` (BookDetail, tab state in `?tab=`), `/livros/[bookId]/capitulos/[chapterId]` (ChapterDetail), `/sessoes/[sessionId]` (MemorizationSession), `/login`.
- `src/middleware.ts` gates all `(app)` routes behind a `memora_session` cookie, redirecting to `/login` when absent.

### Data & Mutations (Prisma-backed)

- Domain types/logic live in `src/domain/` (`types.ts`, `constants.ts`, `prompts.ts`, `derived.ts`, `services/*.ts`). `src/domain/types.ts` mirrors `prisma/schema.prisma` field-for-field (`Date | null`, `sessions`/`attempts` instead of a `revisions` array); `src/domain/derived.ts` projects that shape back into UI view-models (`revisionRecords(book)`, `lastPerformance(question, book)`, `coverGradient(bookId)`).
- `src/domain/queries/` (`books.ts`, `sessions.ts`, `shared.ts`) holds the read layer: `getBooksForUser`, `getBookWithEverything`, `getChapterWithQuestions`, `getSessionForUser`. Every query filters by `userId` + `deletedAt: null`, loads the whole book in one round trip, and is wrapped in `unstable_cache` tagged via `src/lib/cache-tags.ts`.
- `src/lib/db.ts` holds the `PrismaClient` singleton (guarded by `import "server-only"`, pinned on `globalThis` for HMR). `src/lib/auth.ts` exposes `getCurrentUser()`, which currently resolves the single dev user by `SEED_USER_EMAIL` — the only seam a future auth phase needs to replace.
- All mutations go through Server Actions in `src/app/actions/*.ts` (`"use server"`), which call the pure-ish `src/domain/services/*` functions (thin Prisma wrappers), then call `revalidateTag(...)` (via `src/lib/cache-tags.ts`) and `revalidatePath(...)` for the affected routes. There is no Zod validation or real per-request authorization yet — only `userId` ownership checks.
- Starting a session (`startSessionAction`) creates a `RevisionSession` row (`completedAt: null`) and redirects to `/sessoes/[sessionId]`; completing one (`completeSessionAction`) inserts `SessionAttempt` rows and sets `score`/`completedAt` on the session, then updates `Book.lastRevision`.

## Project Structure

Start with task-relevant files below:

- `src/app/layout.tsx` - Root layout; loads `next/font/google` fonts and `globals.css`
- `src/app/(auth)/login/` - Public login route + `actions.ts` (sets/clears the `memora_session` cookie)
- `src/app/(app)/layout.tsx` - Protected shell rendering `Sidebar` + `{children}`
- `src/app/(app)/**/page.tsx` - Route pages; Server Components that read `src/domain/store.ts` and pass plain props into the view components
- `src/app/actions/{books,chapters,questions,sessions}.ts` - Server Actions (mutations)
- `src/domain/` - Types (mirroring `prisma/schema.prisma`), constants, prompt templates, derived view-model selectors, and `services/*` (thin Prisma-backed mutation functions)
- `src/domain/queries/` - Read layer: `getBooksForUser`, `getBookWithEverything`, `getChapterWithQuestions`, `getSessionForUser`, all cached via `unstable_cache` + tags
- `src/lib/db.ts` - `PrismaClient` singleton; `src/lib/auth.ts` - `getCurrentUser()` (dev-user seam); `src/lib/cache-tags.ts` - cache tag builders
- `src/views/` - Page-level view components (mostly client components):
  - `Dashboard.tsx` - Today's consolidation sessions, quick actions, recent activity
  - `Library.tsx` - Book collection, status filtering, and addition modal trigger
  - `BookDetail.tsx` - Chapters, revision statistics, and book-level session trigger
  - `ChapterDetail.tsx` - Chapter notes, summaries, and associated questions
  - `MemorizationSession.tsx` - Interactive session runner across the 3 consolidation modes
  - `Login.tsx` - Simple authentication view (form posts to a Server Action)
- `src/components/` - Shared UI components (`Sidebar.tsx`, `BookModal.tsx`)
- `docs/` - Domain & design specifications:
  - `docs/knowledge-consolidation-app.md` - Product definition and pedagogical foundation
  - `docs/DESIGN.md` - Color palette and design token specification
  - `docs/MIGRATION-PHASES.md` - Multi-phase migration plan (this Next.js conversion is Phase 1)
- `src/app/globals.css` - Global CSS entrypoint, Tailwind CSS v4 `@import`, `@theme` typography, and paper shadow utilities
- `src/middleware.ts` - Cookie-based auth gate for `(app)` routes
- `package.json` - Project dependencies and scripts
- `next.config.ts` / `postcss.config.mjs` - Next.js and Tailwind v4 (`@tailwindcss/postcss`) configuration (`@` alias maps to `src`)
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: Next.js 15 (App Router), React 19 and React DOM 19, `server-only`
- Styling: Tailwind CSS v4 via the `@tailwindcss/postcss` PostCSS plugin
- Build tooling: TypeScript 5.7
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/postcss` plugin configured in `postcss.config.mjs`. `src/app/globals.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/app/globals.css`. This scaffold does not need a separate Tailwind config file.

Fonts (Libre Caslon Text, Hanken Grotesk, JetBrains Mono) are loaded via `next/font/google` in `src/app/layout.tsx` and exposed as CSS variables consumed by `--font-display` / `--font-sans` / `--font-mono` in `globals.css`.

## Style & Conventions

- **Components**: Functional components with TypeScript interfaces. Export named components (e.g. `export function Dashboard(...)`).
- **Client vs Server**: Route `page.tsx` files are Server Components that read `src/domain/store.ts` directly; add `"use client"` to view/component files that use hooks (`useState`, `useMemo`, `usePathname`, etc.).
- **Icons**: Inline SVG icons with `stroke="currentColor"` and consistent `viewBox="0 0 24 24"`.
- **UI Language**: Application UI copy is in Portuguese (e.g. "Biblioteca", "Sessão de Consolidação", "Lembrar", "Explicar", "Reconhecer e Aplicar"), aligning with `docs/knowledge-consolidation-app.md`.
- **Typography & Theme**: Use theme tokens defined in `src/app/globals.css` (`--font-display` for editorial headings, `--font-sans` for body copy, `--font-mono` for metrics/dates) and paper shadows (`shadow-paper`, `shadow-paper-sm`, `shadow-paper-lg`).

## Lessons Learned & Gotchas

- **No React Router**: Do not introduce `react-router-dom`; navigate with `<Link href="...">` / `useRouter()`. There is no `NavState`/`onNavigate` anymore.
- **No in-memory store**: `src/domain/store.ts` and `src/domain/mock.ts` were removed in the Prisma migration. Books/chapters/questions/sessions live in Postgres, read through `src/domain/queries/*` and mutated only through Server Actions calling `src/domain/services/*`. New entities get DB-generated UUIDs (no more client-side `newId()`).
- **Server Actions can be called directly from Client Components** (not just via `<form action={...}>`) — e.g. `onClick={() => startSessionAction(bookId)}`. If the action calls `redirect()`, Next.js handles client navigation automatically.
- **`RevisionSession.mode` is optional**: session creation doesn't require a mode up front; `MemorizationSession` lets the user pick a mode client-side when none was set at creation time. A pending (not yet completed) session has `completedAt: null`, `score: null`.
- **Domain types mirror Prisma, not the UI**: `Book.sessions` holds raw `RevisionSession[]` with nested `attempts`. Views consume the derived `revisionRecords(book)` / `lastPerformance(question, book)` / `coverGradient(bookId)` helpers from `src/domain/derived.ts` instead of reading persisted fields directly.
- Some original inline object type annotations (pre-Next.js) were missing separators (e.g. `{ book: Book onClick: () => void }`) and never actually type-checked under Vite/esbuild. Watch for this pattern if more legacy code surfaces; `tsc --noEmit` now catches it.
