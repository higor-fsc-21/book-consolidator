# Memora — Personal Knowledge Consolidation System

React 19 + Vite + Tailwind CSS v4 project running inside Figma Make.
Application for readers to transform reading into retained, explainable, and applicable knowledge through spaced consolidation sessions.

## Commands

- `pnpm dev` - Start development server (already running in Figma Make on `$PORT`, default 8443)
- `pnpm build` - Build production bundle (`vite build`)
- `pnpm preview` - Preview production build locally
- `pnpm format` - Format code using `oxfmt`
- `pnpm exec tsc --noEmit` - Typecheck TypeScript code without emitting artifacts

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Architecture & Domain Model

The core philosophy is grounded in `docs/knowledge-consolidation-app.md`: "Do not try to remember everything. Reconstruct the most important ideas without consulting notes."

### Three Consolidation Levels (`SessionMode`)

1. **Lembrar (`direct`)**: Active recall without clues — "Can I remember what I learned?"
2. **Explicar (`guided`)**: Feynman technique — "Can I explain this idea in my own words?"
3. **Reconhecer e Aplicar (`recognition`)**: Practical scenario recognition — "Can I spot this in real life?"

### State Management & Navigation

- State is held in-memory in `src/App.tsx` initialized with `MOCK_BOOKS` from `src/data.ts`.
- Navigation is state-driven via `NavState` (`view`: `'dashboard' | 'library' | 'book' | 'chapter' | 'session'`) and passed via `NavigateFn`. No external router is used.

## Project Structure

Start with task-relevant files below:

- `src/main.tsx` - React entrypoint; mounts `src/App.tsx` and imports `src/index.css`
- `src/App.tsx` - Top-level orchestrator holding book list state and client-side view switching
- `src/data.ts` - Core data models (`Book`, `Chapter`, `Question`, `RevisionRecord`, etc.), helper `generateId()`, and mock data `MOCK_BOOKS`
- `src/views/` - Page-level view components:
  - `Dashboard.tsx` - Today's consolidation sessions, quick actions, recent activity
  - `Library.tsx` - Book collection, status filtering, and addition modal trigger
  - `BookDetail.tsx` - Chapters, revision statistics, and book-level session trigger
  - `ChapterDetail.tsx` - Chapter notes, summaries, and associated questions
  - `MemorizationSession.tsx` - Interactive session runner across the 3 consolidation modes
  - `Login.tsx` - Simple authentication view
- `src/components/` - Shared UI components (e.g. `BookModal.tsx`)
- `docs/` - Domain & design specifications:
  - `docs/knowledge-consolidation-app.md` - Product definition and pedagogical foundation
  - `docs/DESIGN.md` - Color palette and design token specification
- `src/index.css` - Global CSS entrypoint, Tailwind CSS v4 `@import`, `@theme` typography, and paper shadow utilities
- `index.html` - HTML entry shell loading `src/main.tsx`
- `package.json` - Project dependencies and scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins (`@` alias maps to `src`)
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Style & Conventions

- **Components**: Functional components with TypeScript interfaces. Export named components (e.g. `export function Dashboard(...)`).
- **Icons**: Inline SVG icons with `stroke="currentColor"` and consistent `viewBox="0 0 24 24"`.
- **UI Language**: Application UI copy is in Portuguese (e.g. "Biblioteca", "Sessão de Consolidação", "Lembrar", "Explicar", "Reconhecer e Aplicar"), aligning with `docs/knowledge-consolidation-app.md`.
- **Typography & Theme**: Use theme tokens defined in `src/index.css` (`--font-display` for editorial headings, `--font-sans` for body copy, `--font-mono` for metrics/dates) and paper shadows (`shadow-paper`, `shadow-paper-sm`, `shadow-paper-lg`).

## Lessons Learned & Gotchas

- **No React Router**: Do not introduce `react-router-dom`; views are switched via `onNavigate({ view: '...', bookId: '...' })`.
- **In-Memory State**: Books, chapters, and questions live in React state in `src/App.tsx`. New entities should be created with `generateId()` from `src/data.ts`.
- **Figma Make Environment**: Do not terminate or manually launch the dev server in automated tasks — it runs continuously on `$PORT`.
