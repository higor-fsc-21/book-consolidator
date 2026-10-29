import { describe, expect, it } from "vitest"
import {
  CancelSessionInputSchema,
  CompleteSessionInputSchema,
  CreateBookInputSchema,
  CreateChapterInputSchema,
  CreateFeedbackInputSchema,
  CreateQuestionInputSchema,
  FeedbackCategorySchema,
  GoogleBooksSearchQuerySchema,
  StartSessionInputSchema,
  UpdateBookInputSchema,
  UpdateChapterInputSchema,
  UpdateUserGoalsSchema,
  UpdateUserProfileSchema,
} from "./validators"

describe("validation schemas (D20)", () => {
  describe("CreateBookInputSchema", () => {
    it("validates valid book input", () => {
      const result = CreateBookInputSchema.safeParse({
        title: "Clean Code",
        author: "Robert Martin",
        totalChapters: 10,
        status: "reading",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe("Clean Code")
        expect(result.data.importance).toBe(2)
      }
    })

    it("fails when title or author is empty", () => {
      const result = CreateBookInputSchema.safeParse({
        title: "",
        author: "Author",
        totalChapters: 5,
      })
      expect(result.success).toBe(false)
    })

    it("fails when totalChapters is less than 1", () => {
      const result = CreateBookInputSchema.safeParse({
        title: "Title",
        author: "Author",
        totalChapters: 0,
      })
      expect(result.success).toBe(false)
    })

    it("strips or ignores untrusted properties like id, userId, score", () => {
      const raw = {
        title: "Title",
        author: "Author",
        totalChapters: 5,
        id: "123",
        userId: "user-abc",
        score: 100,
      }
      const parsed = CreateBookInputSchema.parse(raw)
      expect(parsed).not.toHaveProperty("id")
      expect(parsed).not.toHaveProperty("userId")
      expect(parsed).not.toHaveProperty("score")
    })
  })

  describe("UpdateBookInputSchema", () => {
    it("allows partial updates and consolidationState", () => {
      const result = UpdateBookInputSchema.safeParse({
        consolidationState: "consolidated",
        importance: 3,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.consolidationState).toBe("consolidated")
        expect(result.data.importance).toBe(3)
      }
    })
  })

  describe("Chapter and Question schemas", () => {
    it("validates chapter input", () => {
      expect(
        CreateChapterInputSchema.safeParse({ title: "Intro" }).success,
      ).toBe(true)
      expect(CreateChapterInputSchema.safeParse({ title: "" }).success).toBe(
        false,
      )
      expect(
        UpdateChapterInputSchema.safeParse({ isRead: true, summary: "Summary" })
          .success,
      ).toBe(true)
    })

    it("validates question input", () => {
      expect(
        CreateQuestionInputSchema.safeParse({
          text: "What is X?",
          answer: "X is Y",
          difficulty: "hard",
        }).success,
      ).toBe(true)

      expect(
        CreateQuestionInputSchema.safeParse({ text: "", answer: "Y" }).success,
      ).toBe(false)
    })
  })

  describe("Session schemas", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000"

    it("validates StartSessionInputSchema with valid UUIDs", () => {
      expect(
        StartSessionInputSchema.safeParse({ bookId: validUuid }).success,
      ).toBe(true)
      expect(
        StartSessionInputSchema.safeParse({ bookId: "not-a-uuid" }).success,
      ).toBe(false)
    })

    it("validates CompleteSessionInputSchema requires at least 1 entry", () => {
      expect(
        CompleteSessionInputSchema.safeParse({
          mode: "direct",
          entries: [],
        }).success,
      ).toBe(false)

      expect(
        CompleteSessionInputSchema.safeParse({
          mode: "direct",
          entries: [
            {
              questionId: validUuid,
              performance: "correct",
            },
          ],
        }).success,
      ).toBe(true)
    })

    it("validates CancelSessionInputSchema", () => {
      expect(
        CancelSessionInputSchema.safeParse({ sessionId: validUuid }).success,
      ).toBe(true)
      expect(
        CancelSessionInputSchema.safeParse({ sessionId: "bad" }).success,
      ).toBe(false)
    })
  })

  describe("GoogleBooksSearchQuerySchema", () => {
    it("validates search query and parses defaults", () => {
      const result = GoogleBooksSearchQuerySchema.safeParse({
        q: "Clean Architecture",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.startIndex).toBe(0)
        expect(result.data.maxResults).toBe(10)
      }
    })

    it("rejects empty query", () => {
      expect(GoogleBooksSearchQuerySchema.safeParse({ q: "   " }).success).toBe(
        false,
      )
    })
  })

  describe("UpdateUserProfileSchema", () => {
    it("validates valid profile name", () => {
      const result = UpdateUserProfileSchema.safeParse({ name: "Jane Doe" })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Jane Doe")
      }
    })

    it("fails when name is empty or whitespace only", () => {
      expect(UpdateUserProfileSchema.safeParse({ name: "" }).success).toBe(
        false,
      )
      expect(UpdateUserProfileSchema.safeParse({ name: "   " }).success).toBe(
        false,
      )
    })

    it("fails when name exceeds 120 chars", () => {
      const tooLong = "a".repeat(121)
      expect(UpdateUserProfileSchema.safeParse({ name: tooLong }).success).toBe(
        false,
      )
    })
  })

  describe("UpdateUserGoalsSchema", () => {
    it("validates valid goals", () => {
      const result = UpdateUserGoalsSchema.safeParse({
        annualBooksGoal: 15,
        weeklyRevisionsGoal: 5,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.annualBooksGoal).toBe(15)
        expect(result.data.weeklyRevisionsGoal).toBe(5)
      }
    })

    it("coerces string numbers correctly", () => {
      const result = UpdateUserGoalsSchema.safeParse({
        annualBooksGoal: "20",
        weeklyRevisionsGoal: "4",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.annualBooksGoal).toBe(20)
        expect(result.data.weeklyRevisionsGoal).toBe(4)
      }
    })

    it("fails on out of range values", () => {
      expect(
        UpdateUserGoalsSchema.safeParse({
          annualBooksGoal: 0,
          weeklyRevisionsGoal: 3,
        }).success,
      ).toBe(false)

      expect(
        UpdateUserGoalsSchema.safeParse({
          annualBooksGoal: 201,
          weeklyRevisionsGoal: 3,
        }).success,
      ).toBe(false)

      expect(
        UpdateUserGoalsSchema.safeParse({
          annualBooksGoal: 10,
          weeklyRevisionsGoal: 0,
        }).success,
      ).toBe(false)

      expect(
        UpdateUserGoalsSchema.safeParse({
          annualBooksGoal: 10,
          weeklyRevisionsGoal: 51,
        }).success,
      ).toBe(false)
    })
  })

  describe("Feedback schemas", () => {
    it("validates valid categories", () => {
      expect(FeedbackCategorySchema.safeParse("question").success).toBe(true)
      expect(FeedbackCategorySchema.safeParse("suggestion").success).toBe(true)
      expect(FeedbackCategorySchema.safeParse("bug").success).toBe(true)
      expect(FeedbackCategorySchema.safeParse("other").success).toBe(false)
    })

    it("validates valid feedback input", () => {
      const result = CreateFeedbackInputSchema.safeParse({
        category: "suggestion",
        subject: "Melhoria na página inicial",
        message:
          "Seria excelente adicionar um gráfico de revisão no painel principal.",
      })
      expect(result.success).toBe(true)
    })

    it("rejects subject shorter than 3 characters", () => {
      const result = CreateFeedbackInputSchema.safeParse({
        category: "question",
        subject: "Oi",
        message: "Tenho uma dúvida sobre a repetição espaçada.",
      })
      expect(result.success).toBe(false)
    })

    it("rejects message shorter than 10 characters", () => {
      const result = CreateFeedbackInputSchema.safeParse({
        category: "bug",
        subject: "Erro no salvamento",
        message: "Quebrou",
      })
      expect(result.success).toBe(false)
    })

    it("rejects message longer than 3000 characters", () => {
      const result = CreateFeedbackInputSchema.safeParse({
        category: "question",
        subject: "Dúvida extensa",
        message: "a".repeat(3001),
      })
      expect(result.success).toBe(false)
    })
  })
})
