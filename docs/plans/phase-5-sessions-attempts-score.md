# Phase 5 — Sessions, Attempts, and Score

Mirrors the structure of [docs/MIGRATION-PHASES.md](../MIGRATION-PHASES.md) (Fase 5), covering
persisted consolidation sessions, backend score and scheduling, external-result entry, and the
book/dashboard history surfaces.

## Objective

Make the consolidation flow produce real `RevisionSession` rows with `SessionAttempt`s, a
server-computed score, and book-level `lastRevision` / `nextRevision` / `consolidationState`
updates inside a transaction. Direct sessions flush buffered ratings on completion; guided and
recognition sessions collect a per-question grid after the external AI prompt. Completed session
URLs are read-only; pending sessions can be resumed from the start or cancelled.

**Decisions applied:** D14 (attempts), D15 (session model), D16 (backend score), D17/D49
(consolidation threshold), D22 (client prompts), D23 (`TutorProvider` interface only), D26
(transactions), D34 (pessimistic feedback), D39 (no rate limiting), D50 (revision ladder), D51
(`recordAttempt` deferred).

## Scope

- **Domain rules** (`src/domain/`):
  - `constants.ts`: `REVISION_INTERVALS_DAYS = [3, 7, 14, 30, 60, 90, 365]`,
    `CONSOLIDATION_MIN_SESSIONS = 3`, `CONSOLIDATION_MIN_AVG_SCORE = 80`,
    `CONSOLIDATION_RECENCY_DAYS = 90`.
  - `scheduling.ts` (pure): `nextRevisionDate` (fixed ladder from
    `endDate ?? firstCompletedSessionDate ?? completedAt`, clamped to `completedAt + 1d`) and
    `consolidationStateFor` (D49). Day-precision helpers for `@db.Date`.
  - `derived.ts`: `effectiveConsolidationState`, `sessionHistory`, `pendingSessions` /
    `pendingSessionsFor`. `revisionRecords` kept only as the timeline projection.
  - `tutor.ts`: `TutorProvider` / `EvaluationInput` / `EvaluationResult` (D23, interface-only).
  - `prompts.ts`: `generateGuidedPrompt` (Feynman); recognition unchanged.

- **Session writes**:
  - `completeSession` in `src/domain/services/sessions.ts` runs inside `db.$transaction`:
    guard `completedAt === null`, `createMany` attempts, aggregate score from **persisted**
    attempts, update session (`mode`, `score`, `completedAt`), then book
    (`lastRevision`, `nextRevision`, `consolidationState`).
  - `cancelSession` deletes an abandoned pending session.
  - No Prisma migration. `questionId` is required on complete-session input; `userAnswer`
    remains optional and unused in the UI.
  - Deviation from MIGRATION-PHASES 5.1: single nullable `chapterId`, not `chapterIds?`.
    Multi-chapter sessions are out of scope.

- **Actions & validation**:
  - `SessionPerformanceEntrySchema.questionId` is a required UUID; `entries.min(1)`;
    `CancelSessionInputSchema` added.
  - `startSessionAction` returns `ActionResult` on validation failure (no throw) and
    revalidates `booksTag` / `bookTag`. `completeSessionAction` keeps the existing tag/path
    set. `cancelSessionAction` added.

- **Session UI** (`src/views/MemorizationSession.tsx`,
  `src/app/(app)/sessoes/[sessionId]/page.tsx`):
  - Page passes the full session (attempts, score, `completedAt`).
  - Completed session → read-only `ResultsScreen` from persisted data.
  - Direct and external modes `await completeSessionAction` inside `useTransition`; loading +
    inline error; advance only on success.
  - Guided/recognition: chapter-grouped per-question grid (correct / partial / wrong) instead
    of aggregate counts; both now reach `ResultsScreen`.
  - Results use the **server** score and persisted `nextRevision`.
  - “Nova sessão” calls `startSessionAction(book.id)` (new row). Guided uses
    `generateGuidedPrompt`.

- **History & surfacing**:
  - BookDetail revisions tab: `sessionHistory` with expandable per-question breakdown;
    pending sessions as “Em andamento” with resume + cancel; start-session triggers wrapped
    in `useTransition`.
  - BookDetail badge, Library filter/sort, and Dashboard “Em consolidação” use
    `effectiveConsolidationState`.
  - Dashboard: pending/continue surface; `getRecommendedBook` only picks books whose
    `nextRevision` is on or before today; “hoje” badge and importance bullet are real.

## Deliverables

- `src/domain/scheduling.ts`, `src/domain/tutor.ts`.
- Updated `src/domain/constants.ts`, `derived.ts`, `prompts.ts`, `services/sessions.ts`.
- Updated `src/lib/validators.ts`, `src/app/actions/sessions.ts`.
- Updated `src/app/(app)/sessoes/[sessionId]/page.tsx`, `src/views/MemorizationSession.tsx`,
  `BookDetail.tsx`, `Dashboard.tsx`, `Library.tsx`, `ChapterDetail.tsx`.
- `docs/plans/phase-5-sessions-attempts-score.md`; D49–D51 in `docs/DECISIONS.md`; Fase 5
  criteria ticked in `docs/MIGRATION-PHASES.md`.

## Completion criteria

- [x] Direct, guided, and recognition sessions persist attempts with non-null `questionId`.
- [x] Score is computed on the server from persisted attempts; the client never submits it.
- [x] Completing a session is transactional and updates `lastRevision`, `nextRevision`, and
      `consolidationState`.
- [x] Book history shows per-question attempts; pending sessions can be resumed or cancelled.
- [x] A completed session URL is read-only; “Nova sessão” creates a new row.
- [x] `tsc --noEmit` and `pnpm build` pass without errors.

## Risks

- Recency on `consolidated` is a no-op if only written at completion — mitigated by
  `effectiveConsolidationState` at read time (D49).
- Resume is session-level, not attempt-level (D51); abandoning mid-direct-session loses
  in-progress ratings.
- `@db.Date` fields are day-precision; ladder math must stay on UTC calendar days to avoid
  off-by-one around timezones.
