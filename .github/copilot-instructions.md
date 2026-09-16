# GitHub Copilot Instructions — Book Consolidator

Book Consolidator is a personal knowledge consolidation system built with Next.js 15 (App Router), React 19, and Tailwind CSS v4.

For full project architecture, commands, directory structure, and conventions, refer to [AGENTS.md](../AGENTS.md).

## Quick Reference

### Commands

- Dev Server: `pnpm dev` (`next dev -p ${PORT:-8443}`, default 8443)
- Build: `pnpm build`
- Typecheck: `pnpm exec tsc --noEmit`
- Format: `pnpm format`

### Key Architectural Guidelines

- **FAST Method**: Forced Retrieval, Alternating Approaches, Spaced Repetition, and Tracking. The method is grounded in _Make It Stick_ and _A Mind for Numbers_.

- **Navigation**: Real URL routes via the App Router (`src/app/(app)/...`). Use `<Link href="...">` / `useRouter()`. Do NOT reintroduce `react-router-dom` or a `NavState`-style client router.
- **Domain Models**: Types live in `src/domain/types.ts` (mirrors `prisma/schema.prisma`), derived view-models in `src/domain/derived.ts`, read layer in `src/domain/queries/*`.
- **Mutations**: Go through Server Actions in `src/app/actions/*.ts` (`"use server"`), which validate with Zod (`src/lib/validators.ts`), call `src/domain/services/*` (thin Prisma wrappers, transactions for composite writes, soft-delete for books) and `revalidateTag(...)`/`revalidatePath(...)` affected routes. `getCurrentUser()` from `src/lib/auth.ts` resolves the authenticated Supabase user and JIT-provisions the local `User` record; never query Prisma directly from a view.
- **Three Consolidation Modes**:
  1. `direct` ("Lembrar") — Recall without clues
  2. `guided` ("Explicar") — Feynman technique explanation
  3. `recognition` ("Reconhecer e Aplicar") — Real-world scenarios
- **UI Copy**: Keep user-facing strings in Portuguese as established in `docs/knowledge-consolidation-app.md`.
- **Styling**: Tailwind CSS v4 `@theme` in `src/app/globals.css`. Use editorial typography (`font-display` / Libre Caslon Text, `font-sans` / Hanken Grotesk, `font-mono` / JetBrains Mono) and paper shadows (`shadow-paper`).
