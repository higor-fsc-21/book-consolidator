import { describe, expect, it } from "vitest"
import {
  generateDirectPrompt,
  generateGuidedPrompt,
  generateRecognitionPrompt,
} from "./prompts"
import type { Book } from "./types"

const mockBook: Book = {
  id: "b1",
  userId: "u1",
  title: "Atomic Habits",
  author: "James Clear",
  status: "reading",
  importance: 2,
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  endDate: null,
  currentChapter: 1,
  totalChapters: 1,
  consolidationState: "consolidating",
  nextRevision: null,
  lastRevision: null,
  summary: null,
  pages: 300,
  year: 2018,
  coverUrl: null,
  googleBooksId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  chapters: [
    {
      id: "c1",
      bookId: "b1",
      number: 1,
      title: "The Fundamentals",
      description: "Why tiny changes make a big difference",
      summary: null,
      isRead: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      questions: [
        {
          id: "q1",
          chapterId: "c1",
          text: "What is the 1% rule?",
          answer: "Small improvements compound into massive results over time.",
          difficulty: "easy",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
    },
  ],
  sessions: [],
}

describe("prompt generation (D22)", () => {
  it("generates direct recall prompt with book context and questions", () => {
    const prompt = generateDirectPrompt(mockBook)
    expect(prompt).toContain("LIVRO: Atomic Habits")
    expect(prompt).toContain("AUTOR: James Clear")
    expect(prompt).toContain("CAPÍTULO 1: The Fundamentals")
    expect(prompt).toContain("Q1: What is the 1% rule?")
    expect(prompt).toContain("recuperação ativa")
  })

  it("generates guided (Feynman) prompt", () => {
    const prompt = generateGuidedPrompt(mockBook)
    expect(prompt).toContain("LIVRO: Atomic Habits")
    expect(prompt).toContain("técnica de Feynman")
    expect(prompt).toContain("CAPÍTULO 1: The Fundamentals")
    expect(prompt).toContain("Q1: What is the 1% rule?")
  })

  it("generates recognition and application prompt", () => {
    const prompt = generateRecognitionPrompt(mockBook)
    expect(prompt).toContain("LIVRO: Atomic Habits")
    expect(prompt).toContain("situações do mundo real")
    expect(prompt).toContain(
      "Small improvements compound into massive results over time",
    )
  })

  it("filters chapters when chapterIds is provided", () => {
    const prompt = generateDirectPrompt(mockBook, ["other-id"])
    expect(prompt).not.toContain("CAPÍTULO 1: The Fundamentals")
  })
})
