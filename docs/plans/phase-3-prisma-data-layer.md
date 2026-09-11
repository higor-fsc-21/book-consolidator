# Phase 3 — Prisma Data Layer

Mirrors the structure of [docs/MIGRATION-PHASES.md](../MIGRATION-PHASES.md) (Fase 3), extended to
also cover the write path: reads and mutations both move onto Postgres/Prisma in this phase, so
the app stays usable end-to-end (D01) without depending on Phase 4's authentication and
validation work.

## Objective

Replace the in-memory mock store (`src/domain/store.ts`, `src/domain/mock.ts`) with real
Postgres reads and writes through Prisma. The domain layer is reshaped to mirror the Prisma
schema instead of the old mock shape, a single dev user resolves every query until Supabase Auth
lands in Phase 4, and Next.js cache tags replace ad-hoc `revalidatePath` calls as the primary
invalidation mechanism.

**Decisions applied:** D08 (user isolation), D19 (Server Components/Server Actions), D21
(answers exposed alongside questions), D24 (whole-book queries), D25 (Next.js cache), D27
(soft-delete filtering), D29 (derived data computed on demand), D33 (server-based state).

## Scope

- **Infrastructure**:
  - `src/lib/db.ts`: `PrismaClient` singleton pinned on `globalThis` (mirrors the old
    `globalThis.__memoraStore` HMR pattern).
  - `src/lib/auth.ts`: `getCurrentUser()` resolves the single dev `User` row by
    `process.env.SEED_USER_EMAIL`. This is the only seam Phase 4 needs to replace with Supabase
    Auth — call sites are unaffected.
  - `src/lib/cache-tags.ts`: `booksTag`, `bookTag`, `sessionTag` tag builders.

- **Domain reshape** (`src/domain/types.ts`): `Book`, `Chapter`, `Question`, `RevisionSession`,
  `SessionAttempt` now mirror `prisma/schema.prisma` field-for-field (`Date | null` instead of
  `string | undefined`, `sessions`/`attempts` instead of the old `revisions: RevisionRecord[]`).
  `coverGradient` and `Question.lastPerformance` are dropped from storage — they become derived
  view-model helpers.

- **Query layer** (`src/domain/queries/`): `getBooksForUser`, `getBookWithEverything`,
  `getChapterWithQuestions` (books.ts) and `getSessionForUser` (sessions.ts), sharing one
  `bookInclude` (`shared.ts`). Every query filters `userId` + `deletedAt: null` and loads the
  whole book (chapters, questions with `answer` alongside `text`, sessions, attempts) in one
  round trip. Reads are wrapped in `unstable_cache`, tagged per user/book/session, and revived
  back into real `Date` instances (the Data Cache round-trips through serialization).

- **Derived view-models** (`src/domain/derived.ts`): `revisionRecords(book)` projects
  `sessions`+`attempts` back into the UI's original `RevisionRecord` shape (date, mode, score,
  questionsCount, difficultTopics — the last derived from non-`correct` attempts' chapter
  titles). `lastPerformance(question, book)` finds a question's latest attempt.
  `coverGradient(bookId)` deterministically hashes the id into `COVER_GRADIENTS` as a fallback
  for books without a `coverUrl` (D30). `getRecommendedBook` now picks the most overdue
  `nextRevision` instead of a hardcoded mock id.

- **Services and actions**: `src/domain/services/*.ts` become thin Prisma-backed functions
  (`addBook`, `updateBook`, `startReading`, `addChapter`, `toggleChapterRead`, `addQuestion`,
  `startSession`, `completeSession`). `src/app/actions/*.ts` call them, then `revalidateTag` (new)
  alongside the existing `revalidatePath` calls. No Zod validation, transactions, or real
  authorization yet — see Risks and Phase 4 below.

- **Routes**: all 5 pages under `src/app/(app)/**/page.tsx` resolve `getCurrentUser()` and call
  the query layer instead of reading `store`.

- **Views**: `BookDetail`, `Dashboard`, `Library`, `ChapterDetail`, `MemorizationSession`,
  `BookModal` updated for the reshaped types; the cover-gradient picker step is removed from
  `BookModal` since covers are now either a real `coverUrl` (Phase 4/Google Books) or the
  deterministic fallback gradient.

- **Seed data**: `src/domain/mock.ts` moves to `prisma/seed-data.ts` (seed-only fixture, no
  longer imported by the app). `prisma/seed.ts` now synthesizes `SessionAttempt` rows for every
  `RevisionSession`, not just the latest, so revision history isn't empty for older sessions —
  earlier sessions get untied (`questionId: null`) synthetic attempts that reproduce the stored
  score, while the latest session keeps the real per-question `lastPerformance` mapping.

## Deliverables

- `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/cache-tags.ts`.
- `src/domain/queries/shared.ts`, `src/domain/queries/books.ts`, `src/domain/queries/sessions.ts`.
- Reshaped `src/domain/types.ts` and `src/domain/derived.ts`.
- Prisma-backed `src/domain/services/*.ts` and `src/app/actions/*.ts`.
- `prisma/seed-data.ts` (renamed from `src/domain/mock.ts`), updated `prisma/seed.ts`.
- `src/domain/store.ts`, `src/domain/mock.ts`, and `src/domain/ids.ts` deleted.

## Completion criteria

- [x] No screen imports `src/domain/store` or `src/domain/mock`.
- [x] Dashboard, Biblioteca, BookDetail, ChapterDetail, and the session screen all load from
      Postgres via the query layer.
- [x] Creating/editing a book, adding a chapter/question, toggling a chapter as read, and
      starting/completing a revision session all persist through Prisma.
- [x] Derived metrics (avg score, progress, difficult topics, last performance) match the
      pre-migration mock behavior for the seeded data.
- [x] `pnpm exec tsc --noEmit` and `pnpm build` pass.
- [x] `pnpm db:seed` populates all 9 books with chapters, questions, sessions, and attempts on
      every session (not just the latest).

## Risks

- No Zod validation and no real authorization checks yet — every action trusts its caller and
  only enforces `userId` ownership at the query/service level. Acceptable for a single-dev-user
  app; Phase 4 adds validation and swaps in real per-request auth.
- No `$transaction` around composite writes (e.g. completing a session updates the session and
  the book in two separate statements). Low risk while single-user and single-request, revisited
  in Phase 4 (D26).
- `unstable_cache` may serialize `Date` values to strings on a cache hit; the query layer revives
  every date field defensively, but any new Prisma field must be added to the revive helpers too.
- Synthetic (untied) `SessionAttempt` rows for older seeded sessions don't map to real questions,
  so their `difficultTopics` will be empty — only the latest session per book carries real
  per-question attempts in the seed.
