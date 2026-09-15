import type { ConsolidationState } from "./types";
import {
  CONSOLIDATION_MIN_AVG_SCORE,
  CONSOLIDATION_MIN_SESSIONS,
  CONSOLIDATION_RECENCY_DAYS,
  REVISION_INTERVALS_DAYS,
} from "./constants";

const MS_PER_DAY = 86_400_000;

/** Calendar day in UTC, matching Prisma `@db.Date` fields. */
export const startOfUtcDay = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

export const addUtcDays = (date: Date, days: number): Date => {
  const base = startOfUtcDay(date);
  return new Date(base.getTime() + days * MS_PER_DAY);
};

export const utcDayDiff = (later: Date, earlier: Date): number =>
  Math.floor(
    (startOfUtcDay(later).getTime() - startOfUtcDay(earlier).getTime()) /
      MS_PER_DAY,
  );

const laterDate = (a: Date, b: Date): Date =>
  a.getTime() >= b.getTime() ? a : b;

export interface NextRevisionInput {
  endDate: Date | null;
  firstCompletedSessionDate: Date | null;
  completedAt: Date;
  /** Count of completed sessions including the one just finished. */
  completedCount: number;
}

/**
 * Fixed ladder anchored at when the book was read/completed (D50):
 * `3d → 7d → 14d → 30d → 60d → 90d → 365d` as offsets from the anchor.
 * Past the ladder → `completedAt + 365d`. Always at least `completedAt + 1d`.
 */
export function nextRevisionDate({
  endDate,
  firstCompletedSessionDate,
  completedAt,
  completedCount,
}: NextRevisionInput): Date {
  const completedDay = startOfUtcDay(completedAt);
  const minDate = addUtcDays(completedDay, 1);

  if (completedCount > REVISION_INTERVALS_DAYS.length) {
    return laterDate(addUtcDays(completedDay, 365), minDate);
  }

  const offset =
    REVISION_INTERVALS_DAYS[Math.max(0, completedCount - 1)] ?? 365;
  const anchor = startOfUtcDay(
    endDate ?? firstCompletedSessionDate ?? completedAt,
  );
  return laterDate(addUtcDays(anchor, offset), minDate);
}

export interface CompletedSessionScore {
  score: number;
  completedAt: Date;
}

export interface ConsolidationInput {
  current: ConsolidationState;
  completedSessions: CompletedSessionScore[];
  now?: Date;
}

/**
 * `consolidated` when ≥ 3 completed sessions, avg of the last 3 scores ≥ 80,
 * and the last completed session is within 90 days (D49). `archived` is
 * user-set only. Recency is also re-evaluated at read time.
 */
export function consolidationStateFor({
  current,
  completedSessions,
  now = new Date(),
}: ConsolidationInput): ConsolidationState {
  if (current === "archived") return "archived";

  const completed = [...completedSessions].sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime(),
  );
  if (completed.length < CONSOLIDATION_MIN_SESSIONS) return "consolidating";

  const lastThree = completed.slice(-CONSOLIDATION_MIN_SESSIONS);
  const avg =
    lastThree.reduce((sum, session) => sum + session.score, 0) /
    lastThree.length;
  if (avg < CONSOLIDATION_MIN_AVG_SCORE) return "consolidating";

  const last = lastThree[lastThree.length - 1];
  if (utcDayDiff(now, last.completedAt) > CONSOLIDATION_RECENCY_DAYS) {
    return "consolidating";
  }

  return "consolidated";
}
