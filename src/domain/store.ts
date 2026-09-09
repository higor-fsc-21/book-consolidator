import "server-only";

import type { Book, RevisionSession } from "./types";
import { MOCK_BOOKS } from "./mock";

interface Store {
  books: Book[];
  sessions: RevisionSession[];
}

// Pinned on globalThis so the mutable mock store survives Next.js HMR reloads in dev.
// Phase 3 replaces this file with src/domain/queries/ backed by Prisma.
const globalForStore = globalThis as unknown as { __memoraStore?: Store };

export const store: Store =
  globalForStore.__memoraStore ??
  (globalForStore.__memoraStore = {
    books: MOCK_BOOKS,
    sessions: [],
  });
