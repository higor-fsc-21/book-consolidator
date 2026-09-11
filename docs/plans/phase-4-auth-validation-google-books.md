# Phase 4 — Auth, Validation & Google Books

Mirrors the structure of [docs/MIGRATION-PHASES.md](../MIGRATION-PHASES.md) (Fase 4), covering
the implementation of Supabase Auth (Google OAuth), Zod validation across all Server Actions,
Prisma transactions and soft-delete/extended CRUD operations, Google Books API hybrid search,
and pessimistic loading states.

## Objective

Replace the fixed dev user seam from Phase 3 with real authentication (Supabase Auth + Google
OAuth), validate all action payloads at the application boundary using Zod, enforce atomic
writes via Prisma transactions, support book deletion (soft delete) and chapter/question
deletion/editing, and enable automated book metadata retrieval with cover images via the
Google Books API with pessimistic feedback.

**Decisions applied:** D08 (user isolation), D09 (Supabase Auth), D10 (user identity), D19
(Server Components/Server Actions), D20 (data validation), D26 (composite operations in
transactions), D27 (soft-delete for books, physical for chapters/questions), D30 (book covers &
remote patterns), D31 (hybrid search strategy), D32 (search pagination), D34 (pessimistic
mutation feedback), D37 (secret environment variables).

## Scope

- **Supabase Auth (Google OAuth)**:
  - `@supabase/supabase-js` and `@supabase/ssr` installed.
  - `src/lib/supabase/server.ts`: cookie-based server client helper.
  - `src/lib/supabase/middleware.ts` & `src/middleware.ts`: session refresh and auth route gating
    for all `(app)` routes while excluding static assets and `/auth/callback`.
  - `src/app/auth/callback/route.ts`: code exchange route handler redirecting to `next ?? "/"`.
  - `src/app/(auth)/login/actions.ts`: `signInWithOAuth` Google provider and `signOut`.
  - `src/lib/auth.ts`: `getCurrentUser()` resolves session from Supabase, looking up the local
    `User` row by `authUserId`. If absent, JIT-provisions the user with `authUserId`, `email`,
    and `name`. Call signatures in actions and Server Components remain identical.
  - `prisma/seed.ts`: requires `SEED_USER_AUTH_ID` and links the seeded user to the Supabase
    auth user ID.
  - `src/app/(app)/layout.tsx`: resolves `getCurrentUser()` and passes user details to `Sidebar`.

- **Zod Validation** (`src/lib/validators.ts`):
  - Schemas for `CreateBookInput`, `UpdateBookInput`, `CreateChapterInput`, `UpdateChapterInput`,
    `CreateQuestionInput`, `UpdateQuestionInput`, `StartSessionInput`, `CompleteSessionInput`,
    `GoogleBooksSearchQuery`, and `Uuid`.
  - Sensitive or auto-generated fields (`id`, `userId`, `score`) are rejected from client input.
  - All Server Actions in `src/app/actions/*.ts` parse inputs with `safeParse`, returning a typed
    `ActionResult` on failure without throwing unhandled exceptions.

- **Transactions & Extended CRUD**:
  - `src/domain/services/books.ts`: `addBook` (atomic nested create), `updateBook`, `startReading`,
    and new `softDeleteBook(userId, id)` setting `deletedAt`.
  - `src/domain/services/chapters.ts`: `addChapter` and `toggleChapterRead` wrapped in
    `db.$transaction`; new `updateChapter` and `deleteChapter` (with cascade cleanup of question
    attempts and chapter questions).
  - `src/domain/services/questions.ts`: `addQuestion` verifies chapter belongs to the book; new
    `updateQuestion` and `deleteQuestion` wrapped in `$transaction`.
  - `src/domain/services/sessions.ts`: `completeSession` wrapped in `$transaction`.

- **Google Books Search & Cover Images**:
  - Route handler `src/app/api/books/search/route.ts`: authenticated endpoint querying
    Google Books API with server-side `GOOGLE_BOOKS_API_KEY` and hybrid local library search.
    Implements pagination (`startIndex`, `maxResults`) and 1-hour cache.
  - `next.config.ts`: `images.remotePatterns` configured for `books.google.com` and
    `books.googleusercontent.com`.
  - `src/components/BookModal.tsx`: step 0 search with debounced input, thumbnail covers,
    pagination, local library duplicates indicator, and manual fill fallback.
  - `src/views/Library.tsx` & `src/views/BookDetail.tsx`: updated to render real covers with
    `next/image` when `coverUrl` is present, falling back to `coverGradient`.

- **Pessimistic Feedback**:
  - `useTransition` and loading spinners added to `BookModal`, `BookDetail` (start reading, toggle
    read, add chapter, delete book), and `ChapterDetail` (create question, delete question, delete
    chapter).
  - Confirmation modals for deleting books and chapters.

## Deliverables

- `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/app/auth/callback/route.ts`.
- `src/lib/validators.ts`.
- `src/app/api/books/search/route.ts`.
- Updated `src/middleware.ts`, `src/lib/auth.ts`, `src/app/(auth)/login/actions.ts`.
- Updated services (`books.ts`, `chapters.ts`, `questions.ts`, `sessions.ts`).
- Updated actions (`books.ts`, `chapters.ts`, `questions.ts`, `sessions.ts`).
- Updated views and components (`BookModal.tsx`, `Sidebar.tsx`, `Library.tsx`, `BookDetail.tsx`,
  `ChapterDetail.tsx`, `next.config.ts`).
- Updated `prisma/seed.ts` and `.env.example`.

## Completion criteria

- [x] Login and logout flow functional with Supabase Auth (Google OAuth).
- [x] User data isolated by `userId` resolved from `authUserId`.
- [x] Create, edit, and delete operations for books, chapters, and questions persist correctly.
- [x] Composite operations (`completeSession`, `addChapter`, `deleteChapter`, `toggleChapterRead`)
      execute inside `db.$transaction`.
- [x] Adding books supports searching Google Books with pagination and cover previews.
- [x] Cache revalidated after every mutation via cache tags and paths.
- [x] `tsc --noEmit` and `pnpm build` pass without errors.
