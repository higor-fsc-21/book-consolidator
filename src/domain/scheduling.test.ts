import { describe, expect, it } from "vitest";
import {
  addUtcDays,
  consolidationStateFor,
  nextRevisionDate,
  rebuildRevisionQueue,
  startOfUtcDay,
  utcDayDiff,
} from "./scheduling";

describe("scheduling domain rules", () => {
  describe("UTC day helpers", () => {
    it("normalizes date to start of UTC day", () => {
      const date = new Date("2026-05-10T15:30:00.000Z");
      const normalized = startOfUtcDay(date);
      expect(normalized.toISOString()).toBe("2026-05-10T00:00:00.000Z");
    });

    it("adds UTC days correctly", () => {
      const date = new Date("2026-05-10T00:00:00.000Z");
      const result = addUtcDays(date, 5);
      expect(result.toISOString()).toBe("2026-05-15T00:00:00.000Z");
    });

    it("calculates difference in days", () => {
      const d1 = new Date("2026-05-10T00:00:00.000Z");
      const d2 = new Date("2026-05-17T12:00:00.000Z");
      expect(utcDayDiff(d2, d1)).toBe(7);
    });
  });

  describe("nextRevisionDate (D50)", () => {
    const anchor = new Date("2026-01-01T00:00:00.000Z");
    const completedAt = new Date("2026-01-02T00:00:00.000Z");

    it("schedules first revision at 3 days from anchor", () => {
      const next = nextRevisionDate({
        endDate: anchor,
        firstCompletedSessionDate: null,
        completedAt,
        completedCount: 1,
      });
      expect(next.toISOString()).toBe("2026-01-04T00:00:00.000Z");
    });

    it("schedules second revision at 7 days from anchor", () => {
      const next = nextRevisionDate({
        endDate: anchor,
        firstCompletedSessionDate: null,
        completedAt,
        completedCount: 2,
      });
      expect(next.toISOString()).toBe("2026-01-08T00:00:00.000Z");
    });

    it("clamps next revision to at least completedAt + 1d when anchor offset is in the past", () => {
      const oldAnchor = new Date("2025-01-01T00:00:00.000Z");
      const currentCompleted = new Date("2026-01-01T00:00:00.000Z");

      const next = nextRevisionDate({
        endDate: oldAnchor,
        firstCompletedSessionDate: null,
        completedAt: currentCompleted,
        completedCount: 1,
      });
      expect(next.toISOString()).toBe("2026-01-02T00:00:00.000Z");
    });

    it("schedules 365 days out past the ladder", () => {
      const currentCompleted = new Date("2026-01-01T00:00:00.000Z");
      const next = nextRevisionDate({
        endDate: anchor,
        firstCompletedSessionDate: null,
        completedAt: currentCompleted,
        completedCount: 8,
      });
      expect(next.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    });
  });

  describe("consolidationStateFor (D49)", () => {
    const now = new Date("2026-05-01T00:00:00.000Z");

    it("preserves archived state regardless of scores", () => {
      const state = consolidationStateFor({
        current: "archived",
        completedSessions: [
          { score: 100, completedAt: now },
          { score: 100, completedAt: now },
          { score: 100, completedAt: now },
        ],
        now,
      });
      expect(state).toBe("archived");
    });

    it("returns consolidating when fewer than 3 sessions completed", () => {
      const state = consolidationStateFor({
        current: "consolidating",
        completedSessions: [
          { score: 90, completedAt: now },
          { score: 95, completedAt: now },
        ],
        now,
      });
      expect(state).toBe("consolidating");
    });

    it("returns consolidating when avg score of last 3 sessions is under 80", () => {
      const state = consolidationStateFor({
        current: "consolidating",
        completedSessions: [
          { score: 70, completedAt: addUtcDays(now, -10) },
          { score: 80, completedAt: addUtcDays(now, -5) },
          { score: 75, completedAt: now },
        ],
        now,
      });
      expect(state).toBe("consolidating");
    });

    it("returns consolidating when last session is older than 90 days", () => {
      const oldDate = addUtcDays(now, -95);
      const state = consolidationStateFor({
        current: "consolidating",
        completedSessions: [
          { score: 90, completedAt: addUtcDays(oldDate, -10) },
          { score: 90, completedAt: addUtcDays(oldDate, -5) },
          { score: 90, completedAt: oldDate },
        ],
        now,
      });
      expect(state).toBe("consolidating");
    });

    it("returns consolidated when >= 3 sessions, avg >= 80, and within 90 days", () => {
      const state = consolidationStateFor({
        current: "consolidating",
        completedSessions: [
          { score: 80, completedAt: addUtcDays(now, -20) },
          { score: 85, completedAt: addUtcDays(now, -10) },
          { score: 90, completedAt: now },
        ],
        now,
      });
      expect(state).toBe("consolidated");
    });
  });

  describe("rebuildRevisionQueue", () => {
    const now = new Date("2026-05-10T15:30:00.000Z");
    const future = new Date("2026-05-20T00:00:00.000Z");

    const book = (overrides: Record<string, unknown> = {}) => ({
      id: "book-1",
      status: "completed" as const,
      consolidationState: "consolidating" as const,
      nextRevision: future,
      importance: 2 as const,
      ...overrides,
    });

    it("assigns eligible books to consecutive UTC calendar days", () => {
      const queue = rebuildRevisionQueue(
        [book(), book({ id: "book-2", nextRevision: addUtcDays(future, 1) })],
        now,
      );

      expect(queue).toEqual([
        {
          bookId: "book-1",
          revisionDate: new Date("2026-05-10T00:00:00.000Z"),
        },
        {
          bookId: "book-2",
          revisionDate: new Date("2026-05-11T00:00:00.000Z"),
        },
      ]);
    });

    it("excludes books outside the active revision cycle", () => {
      const queue = rebuildRevisionQueue(
        [
          book(),
          book({ id: "reading", status: "reading" }),
          book({ id: "paused", status: "paused" }),
          book({ id: "wanted", status: "want" }),
          book({ id: "archived", consolidationState: "archived" }),
          book({ id: "unscheduled", nextRevision: null }),
        ],
        now,
      );

      expect(queue.map((entry) => entry.bookId)).toEqual(["book-1"]);
    });

    it("uses importance and then id as stable tie breakers", () => {
      const sameDate = new Date("2026-05-01T00:00:00.000Z");
      const queue = rebuildRevisionQueue(
        [
          book({ id: "low", importance: 3, nextRevision: sameDate }),
          book({ id: "high", importance: 1, nextRevision: sameDate }),
          book({ id: "medium", importance: 2, nextRevision: sameDate }),
        ],
        now,
      );

      expect(queue.map((entry) => entry.bookId)).toEqual([
        "high",
        "medium",
        "low",
      ]);
    });
  });
});
