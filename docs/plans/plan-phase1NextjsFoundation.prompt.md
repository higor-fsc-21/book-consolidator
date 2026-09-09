# Plan: Phase 1 — Next.js App Router Foundation

Convert the repo **in-place** from Vite/Figma Make to Next.js App Router, split [src/data.ts](src/data.ts) into `src/domain/`, and replace `NavState` navigation with real URLs. No database yet — mutations run through Server Actions against a server-side mutable mock store that Phase 3 swaps for Prisma. Step 0: write this plan to [docs/plans/phase-1-nextjs-foundation.md](docs/plans/phase-1-nextjs-foundation.md) (English, mirroring the Objective / Scope / Deliverables / Completion criteria / Risks structure of [docs/MIGRATION-PHASES.md](docs/MIGRATION-PHASES.md)).

## Steps

### A. Next.js scaffolding _(blocking — everything else depends on it)_

1. Swap dependencies: add `next` (latest stable) + `@tailwindcss/postcss`; remove `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`. Tailwind v4 on Next needs a `postcss.config.mjs` — the Vite plugin does not work.
2. Delete [vite.config.ts](vite.config.ts) (407 lines, 4 Figma Make plugins + gitignored `./.figma/make/site.json`), [index.html](index.html), [src/main.tsx](src/main.tsx), [src/vite-env.d.ts](src/vite-env.d.ts). Add `next.config.ts`, `next-env.d.ts`, `middleware.ts`.
3. Update [tsconfig.json](tsconfig.json): `jsx: "preserve"`, `incremental`, `plugins: [{ name: "next" }]`, include `next-env.d.ts` + `.next/types/**/*.ts`, drop `allowImportingTsExtensions` and the `vite.config.ts` include. Keep the `@/*` → `./src/*` path.
4. Scripts in [package.json](package.json): `dev: next dev -p ${PORT:-8443}`, `build: next build`, `start`, `typecheck`.
5. Move [src/index.css](src/index.css) → `src/app/globals.css`: drop the three Google Fonts `@import url(...)` lines (moving to `next/font/google`), replace the `#root` selector with `body`, keep `@theme` tokens, `.shadow-paper*`, scrollbar rules.
6. `src/app/layout.tsx`: `<html lang="pt-BR">`, `next/font/google` wiring Libre Caslon Text / Hanken Grotesk / JetBrains Mono into `--font-display|sans|mono`, plus `metadata` (title/description previously injected by `figmaSiteConfiguration`).
7. Update [AGENTS.md](AGENTS.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md) — new commands, no Figma Make, no `NavState`.

### B. Domain extraction _(parallel with A)_

8. Split [src/data.ts](src/data.ts) into `src/domain/types.ts` (L1–L60), `constants.ts` (`COVER_GRADIENTS` L62, `ANNUAL_GOAL` L85, `statusLabels` L823, `consolidationLabels` L831, `modeLabels` L837), `prompts.ts` (`generateDirectPrompt` L728, `generateRecognitionPrompt` L779 — stay pure and client-importable per D22), `mock.ts` (`MOCK_BOOKS` L88–L721).
9. `src/domain/derived.ts`: move `avgScore` (L78), `getReadingBook` (L723), `getCompletedBooks` (L725), plus the logic currently inline in views — `readingProgress`, chapter counts, revision `timeline`, `daysSince`, annual-goal percentages, and `calculateScore(performances)` (the `((correct + partial*0.5)/total)*100` formula duplicated in `DirectSession` and `PromptDisplay`). Add `getRecommendedBook(books)` to replace `Dashboard`'s hardcoded `books.find(b => b.id === "b1")`.
10. `src/domain/ids.ts`: `newId()` using `crypto.randomUUID()`, replacing `generateId` (L75–L76 — `Date.now()` + module-level mutable counter is SSR-hostile).
11. `src/domain/services/`: move the seven handlers out of [src/App.tsx](src/App.tsx) as pure array functions — `addBook` (L185, auto-creates `totalChapters` chapters), `updateBook` (L204), `addRevision` (L209), `addQuestion` (L222), `addChapter` (L248, derives `number` from max+1), `toggleChapterRead` (L274, recomputes `currentChapter`), `startReading` (L290) — plus new `startSession` / `completeSession`. Delete [src/data.ts](src/data.ts).

### C. Server store + Server Actions _(depends on B)_

12. `src/domain/store.ts` — `import "server-only"`, a `globalThis`-pinned mutable `{ books, sessions }` seeded from `mock.ts` (the `globalThis` pin survives HMR). This is the seam Phase 3 replaces with `src/domain/queries/`.
13. `src/app/actions/{books,chapters,questions,sessions}.ts` with `"use server"`. Each action: run the domain service → write the store → `revalidatePath`. Naming mirrors Phase 4 (`createBook`, `updateBook`, `createChapter`, `toggleChapterRead`, `createQuestion`, `startReading`) so Phase 4 only swaps the body.
14. `startSessionAction(bookId, { mode?, chapterId? })` creates a session record with a generated id and `redirect('/sessoes/' + id)`.

### D. Routes & layouts _(depends on A + C)_

15. Build the route tree: `src/app/(auth)/login/page.tsx`, `src/app/(app)/layout.tsx`, `(app)/page.tsx`, `(app)/biblioteca/page.tsx`, `(app)/livros/[bookId]/page.tsx`, `(app)/livros/[bookId]/capitulos/[chapterId]/page.tsx`, `(app)/sessoes/[sessionId]/page.tsx`.
16. Extract the inline `Sidebar` ([src/App.tsx](src/App.tsx#L29-L173)) into `src/components/Sidebar.tsx` as a Client Component using `usePathname()` for active state (`/biblioteca` or `/livros` → "Biblioteca" active), `<Link>` instead of `onNavigate`, and a logout server action. Replace the hardcoded "Rafael / 🔥 18 dias" block with `PLACEHOLDER_USER` from constants.
17. Replace App.tsx's conditional render guards (L332–L375) with `notFound()` in each page.
18. Login placeholder: a server action sets a `memora_session` cookie and redirects to `/`; `middleware.ts` redirects unauthenticated requests to `/login`. Same shape Supabase Auth plugs into in Phase 4.
19. Delete [src/App.tsx](src/App.tsx) along with `View`, `NavState`, `NavigateFn`.

### E. Port views _(depends on D)_

20. Each page is a Server Component that reads from the store and passes plain props into a `"use client"` view. [Dashboard.tsx](src/views/Dashboard.tsx) can stay a Server Component (it has no hooks) — compute the PT-BR date string server-side and pass it as a prop to avoid hydration mismatch from `new Date()` in render (L59–L64).
21. [Library.tsx](src/views/Library.tsx): client, keeps its 7 `useState` filters and `useMemo`; drop the unused `onOpenEditBook` prop (L170); `BookModal` open state becomes local to a small client wrapper.
22. [BookDetail.tsx](src/views/BookDetail.tsx): client wrapper; move the `chapters | summary | revisions` tab into a `?tab=` search param for deep linking; session buttons call `startSessionAction`.
23. [ChapterDetail.tsx](src/views/ChapterDetail.tsx): prev/next chapter become `<Link>`; `onAddQuestion` becomes the server action.
24. [MemorizationSession.tsx](src/views/MemorizationSession.tsx): reads the session from the store by `sessionId`; mode selection stays local state; `handleFinish` and `PromptDisplay`'s result form both call `completeSessionAction` — this fixes the existing gap where guided/recognition results were never persisted.
25. [BookModal.tsx](src/components/BookModal.tsx): stays client, `onSave` routed to `createBook`/`updateBook` actions; drop the dead `totalSteps` ternary and the identical if/else in `handleSave`.

## Relevant files

- [src/App.tsx](src/App.tsx) — source of all seven mutation handlers and the inline `Sidebar`; deleted at the end
- [src/data.ts](src/data.ts) — split across `src/domain/*`; deleted
- [src/views/](src/views/) — all five views ported; every one except `Login` needs `"use client"`
- [vite.config.ts](vite.config.ts) — deleted; no Next equivalent for the 4 Figma Make plugins
- [tsconfig.json](tsconfig.json), [package.json](package.json), [index.html](index.html), [src/index.css](src/index.css) — rewritten for Next
- [docs/DECISIONS.md](docs/DECISIONS.md) — D02, D03, D04, D18, D22, D33 govern this phase
- [AGENTS.md](AGENTS.md) — must be updated; currently documents Vite/Figma Make as ground truth

## Verification

1. `pnpm exec tsc --noEmit` and `pnpm build` pass clean.
2. Load each of the 6 routes by direct URL, hard-refresh each, and confirm the browser back button walks the history correctly.
3. Mutation smoke test: add a book → its `totalChapters` chapters are auto-created; toggle a chapter read → `currentChapter` recomputes; add a chapter → number is max+1; add a question; run a `direct` session end-to-end → the revision appears in BookDetail's revisions tab.
4. Run a `guided` session → confirm the result form now persists a revision (new behavior).
5. Grep for `NavState`, `NavigateFn`, `onNavigate`, `from "../data"` — all must return zero hits.
6. Confirm no console hydration warnings on `/` (the Dashboard date path).

## Decisions

- In-place conversion; the Figma Make dev-server workflow is retired this phase.
- Mutations use a server-side mutable store rather than a client Context, so Phase 4's Server Actions only need their bodies swapped, not their call sites.
- `/sessoes/[sessionId]` is implemented literally per D03, with session ids minted in the mock store — a light preview of Phase 5's `RevisionSession`.
- Excluded: Prisma/Supabase, real auth, Google Books, design-token refactor of the ~3500 lines of hardcoded hex, tests, server-side score/consolidation recalculation.

## Further Considerations

1. `Library`'s `ImportanceDots` uses `i <= 4 - level`, inverted relative to its own label. Option A: preserve the quirk verbatim (pure migration). Option B: fix it now. **Recommend A** — keep Phase 1 behavior-preserving and file it separately.
2. Node 22 is pinned in [.mise.toml](.mise.toml). Next's latest stable is fine on 22, but if you want Next's newest features it may want Node 20.9+/22+ only — no change expected, just confirm at install time.
