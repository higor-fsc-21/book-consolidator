# GitHub Copilot Instructions — Memora

Memora is a personal knowledge consolidation system built with React 19, Vite, and Tailwind CSS v4 running inside Figma Make.

For full project architecture, commands, directory structure, and conventions, refer to [AGENTS.md](../AGENTS.md).

## Quick Reference

### Commands

- Dev Server: Pre-running on `$PORT` (default 8443)
- Build: `pnpm build`
- Typecheck: `pnpm exec tsc --noEmit`
- Format: `pnpm format`

### Key Architectural Guidelines

- **Navigation**: State-based navigation via `NavState` in `src/App.tsx`. Do NOT add `react-router-dom`.
- **Domain Models**: Types and mock data live in `src/data.ts`. Always use `generateId()` when instantiating new records.
- **Three Consolidation Modes**:
  1. `direct` ("Lembrar") — Recall without clues
  2. `guided` ("Explicar") — Feynman technique explanation
  3. `recognition` ("Reconhecer e Aplicar") — Real-world scenarios
- **UI Copy**: Keep user-facing strings in Portuguese as established in `docs/knowledge-consolidation-app.md`.
- **Styling**: Tailwind CSS v4 `@theme` in `src/index.css`. Use editorial typography (`font-display` / Libre Caslon Text, `font-sans` / Hanken Grotesk, `font-mono` / JetBrains Mono) and paper shadows (`shadow-paper`).
