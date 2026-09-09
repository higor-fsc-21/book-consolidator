# Phase 1 — Next.js App Router Foundation

Mirrors the structure of [docs/MIGRATION-PHASES.md](../MIGRATION-PHASES.md) (Fase 1) in English,
with the concrete execution plan from [plan-phase1NextjsFoundation.prompt.md](./plan-phase1NextjsFoundation.prompt.md).

## Objective

Convert the repo **in-place** from Vite/Figma Make to a Next.js App Router application,
navigable by real URLs, with the domain reorganized out of `src/data.ts` — still without a
database. No Prisma/Supabase yet: mutations run through Server Actions against a server-side
mutable mock store that Phase 3 swaps for real persistence.

**Decisions applied:** D02 (App Router), D03 (real routes), D04 (domain organization),
D18 (business logic in domain services), D33 (server-based frontend state, preparation),
D22 (prompt generation extraction).

## Scope

- **Next.js project**: App Router, TypeScript, Tailwind CSS v4 via `@tailwindcss/postcss`.
  Port `src/index.css` (`@theme` tokens, editorial typography, `shadow-paper`) to the root
  layout. Migrate the inline `Sidebar` from `App.tsx` into a shared layout for the
  authenticated route group.
- **Route structure**:
  ```text
  app/
  ├── (auth)/login/page.tsx
  └── (app)/
      ├── layout.tsx                                      Sidebar + shell
      ├── page.tsx                                         Dashboard
      ├── biblioteca/page.tsx                              Library
      ├── livros/[bookId]/page.tsx                         BookDetail
      ├── livros/[bookId]/capitulos/[chapterId]/page.tsx   ChapterDetail
      └── sessoes/[sessionId]/page.tsx                     MemorizationSession
  ```
  `View`, `NavState`, and `NavigateFn` are removed; `onNavigate({ view, bookId })` is replaced
  by `<Link>` and `useRouter`.
- **Domain separation**:
  ```text
  src/domain/types.ts       Book, Chapter, Question, RevisionRecord + enums
  src/domain/constants.ts   statusLabels, consolidationLabels, modeLabels,
                            COVER_GRADIENTS, ANNUAL_GOAL, PLACEHOLDER_USER
  src/domain/prompts.ts     generateDirectPrompt, generateRecognitionPrompt
  src/domain/derived.ts     avgScore, progress, counts, getRecommendedBook
  src/domain/ids.ts         newId()
  src/domain/mock.ts        MOCK_BOOKS (temporary, removed in Phase 3)
  src/domain/services/      addBook, updateBook, addChapter, addQuestion, addRevision,
                            toggleChapterRead, startReading, startSession, completeSession
  ```
- **Business logic extraction**: moved from `App.tsx` into `src/domain/services/` as pure
  array functions.
- **Server store + Server Actions**: `src/domain/store.ts` (a `globalThis`-pinned mutable
  store seeded from `mock.ts`) and `src/app/actions/*.ts` (`"use server"` wrappers that call
  domain services, write the store, and `revalidatePath`).
- **Login placeholder**: dedicated `/login` screen, still without real authentication
  (replaced in Phase 4), backed by a `memora_session` cookie and `middleware.ts` redirect.

## Deliverables

- Functional Next.js project with all current screens.
- `src/domain/` created; `src/data.ts` removed.
- Zero business logic inside components.

## Completion criteria

- [ ] All screens reachable by direct URL.
- [ ] Browser refresh preserves the current screen.
- [ ] Browser back button works correctly.
- [ ] No component contains business rules.
- [ ] `pnpm build` and `pnpm exec tsc --noEmit` pass with no errors.

## Risks

- Components using `useState`/`useEffect`/browser APIs need the `"use client"` directive.
- The UI is in Portuguese ([AGENTS.md](../../AGENTS.md)); all existing strings must be kept
  verbatim.
- `Library`'s `ImportanceDots` uses an inverted level (`i <= 4 - level`) relative to its own
  label — preserved verbatim this phase (behavior-preserving migration), tracked separately.
- Node 22 is pinned in `.mise.toml`; confirmed compatible with the installed Next.js version.
