# Book Consolidator — Personal Knowledge Consolidation System

Application for readers to transform reading into retained, explainable, and applicable knowledge through spaced consolidation sessions.

## Commands

- `pnpm dev` - Start development server (`next dev -p ${PORT:-8443}`)
- `pnpm format` - Format code using `oxfmt`
- `pnpm exec tsc --noEmit` - Typecheck TypeScript code without emitting artifacts
- `pnpm db:up` / `pnpm db:down` - Start/stop the local Postgres container (Docker Compose)
- `pnpm db:migrate` - Apply Prisma migrations (`prisma migrate dev`)
- `pnpm db:seed` - Seed the database from `prisma/seed-data.ts` (`prisma/seed.ts`)
- `pnpm db:studio` - Open Prisma Studio to inspect data

## Architecture & Domain Model

The core philosophy is grounded in `docs/knowledge-consolidation-app.md`: "Do not try to remember everything. Reconstruct the most important ideas without consulting notes."

### FAST Method

The product method is FAST:

1. **F — Forced Retrieval**: reconstruct ideas before viewing the answers.
2. **A — Alternating Approaches**: alternate Direct, Guided, and Practical modalities.
3. **S — Spaced Repetition**: review concepts at expanding, optimized intervals.
4. **T — Tracking**: log progress visually as knowledge consolidates.

The method is grounded in _Make It Stick: The Science of Successful Learning_ by Peter C. Brown, Henry L. Roediger III, and Mark A. McDaniel, and _A Mind for Numbers: How to Excel at Math and Science (Even If You Flunked Algebra)_ by Barbara Oakley.

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
- `src/lib/db.ts` holds the `PrismaClient` singleton (guarded by `import "server-only"`, pinned on `globalThis` for HMR). `src/lib/auth.ts` exposes `getCurrentUser()`, which resolves the authenticated Supabase user and links to the local `User` record via `authUserId` (JIT-provisioned if not present).
- All mutations go through Server Actions in `src/app/actions/*.ts` (`"use server"`), which validate inputs with Zod (`src/lib/validators.ts`), call `src/domain/services/*` (using `prisma.$transaction` for composite writes and soft-delete for books), then call `revalidateTag(...)` (via `src/lib/cache-tags.ts`) and `revalidatePath(...)` for the affected routes.
- Starting a session (`startSessionAction`) creates a `RevisionSession` row (`completedAt: null`) and redirects to `/sessoes/[sessionId]`; completing one (`completeSessionAction`) inserts `SessionAttempt` rows and sets `score`/`completedAt` on the session within a transaction, then updates `Book.lastRevision`.

## Styling & Conventions

- **Tailwind CSS v4**: Configured via `@tailwindcss/postcss` and `src/app/globals.css` with `@import 'tailwindcss';`. Do not create a separate tailwind config file.
- **Typography & Theme**: Use theme tokens in `src/app/globals.css` (`--font-display` / Libre Caslon Text for editorial headings, `--font-sans` / Hanken Grotesk for body copy, `--font-mono` / JetBrains Mono for metrics/dates) and paper shadows (`shadow-paper`, `shadow-paper-sm`, `shadow-paper-lg`).
- **Components**: Functional components with TypeScript interfaces. Export named components (e.g. `export function Dashboard(...)`).
- **Client vs Server**: Route `page.tsx` files are Server Components that fetch data via `src/domain/queries/*` and pass plain props into view components; add `"use client"` to view/component files that use hooks (`useState`, `useMemo`, `usePathname`, etc.).
- **Icons**: Inline SVG icons with `stroke="currentColor"` and consistent `viewBox="0 0 24 24"`.
- **UI Language**: Application UI copy must remain in Portuguese (e.g. "Biblioteca", "Sessão de Consolidação", "Lembrar", "Explicar", "Reconhecer e Aplicar"), aligning with `docs/knowledge-consolidation-app.md`.

## Lessons Learned & Gotchas

- **No React Router**: Do not introduce `react-router-dom`; navigate with `<Link href="...">` / `useRouter()`. There is no `NavState`/`onNavigate` anymore.
- **No in-memory store**: `src/domain/store.ts` and `src/domain/mock.ts` were removed in the Prisma migration. Books/chapters/questions/sessions live in Postgres, read through `src/domain/queries/*` and mutated only through Server Actions calling `src/domain/services/*`. New entities get DB-generated UUIDs (no more client-side `newId()`).
- **Server Actions can be called directly from Client Components** (not just via `<form action={...}>`) — e.g. `onClick={() => startSessionAction(bookId)}`. If the action calls `redirect()`, Next.js handles client navigation automatically.
- **`RevisionSession.mode` is optional**: session creation doesn't require a mode up front; `MemorizationSession` lets the user pick a mode client-side when none was set at creation time. A pending (not yet completed) session has `completedAt: null`, `score: null`.
- **Domain types mirror Prisma, not the UI**: `Book.sessions` holds raw `RevisionSession[]` with nested `attempts`. Views consume the derived `revisionRecords(book)` / `lastPerformance(question, book)` / `coverGradient(bookId)` helpers from `src/domain/derived.ts` instead of reading persisted fields directly.
- Some original inline object type annotations (pre-Next.js) were missing separators (e.g. `{ book: Book onClick: () => void }`) and never actually type-checked under Vite/esbuild. Watch for this pattern if more legacy code surfaces; `tsc --noEmit` now catches it.
