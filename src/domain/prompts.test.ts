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

  it("generates recognition and application prompt with the full annotation", () => {
    const prompt = generateRecognitionPrompt(mockBook)
    expect(prompt).toContain("LIVRO: Atomic Habits")
    expect(prompt).toContain("AUTOR: James Clear")
    expect(prompt).toContain("situações do mundo real")
    expect(prompt).toContain("CONCEITO 1 — Cap. 1: The Fundamentals")
    expect(prompt).toContain("Pergunta anotada: What is the 1% rule?")
    expect(prompt).toContain(
      "Anotação completa: Small improvements compound into massive results over time.",
    )
  })

  it("keeps the full answer text in the recognition prompt (no sentence slicing)", () => {
    const multiSentence = structuredClone(mockBook)
    multiSentence.chapters[0].questions[0].answer =
      "First sentence. Second sentence carries the critical nuance."

    const prompt = generateRecognitionPrompt(multiSentence)
    expect(prompt).toContain("Second sentence carries the critical nuance.")
  })

  it("numbers questions continuously across chapters", () => {
    const twoChapters = structuredClone(mockBook)
    const [first] = twoChapters.chapters
    twoChapters.chapters.push({
      ...first,
      id: "c2",
      number: 2,
      title: "The Second",
      questions: [
        {
          ...first.questions[0],
          id: "q2",
          chapterId: "c2",
          text: "What is habit stacking?",
          answer: "Attach a new habit to an existing one.",
        },
      ],
    })

    const prompt = generateDirectPrompt(twoChapters)
    expect(prompt).toContain("Q1: What is the 1% rule?")
    expect(prompt).toContain("Q2: What is habit stacking?")

    const recognition = generateRecognitionPrompt(twoChapters)
    expect(recognition).toContain("CONCEITO 1 — Cap. 1: The Fundamentals")
    expect(recognition).toContain("CONCEITO 2 — Cap. 2: The Second")
  })

  it("instructs the AI to stick strictly to the stored annotations", () => {
    for (const prompt of [
      generateDirectPrompt(mockBook),
      generateGuidedPrompt(mockBook),
      generateRecognitionPrompt(mockBook),
    ]) {
      expect(prompt).toContain("FIDELIDADE ÀS ANOTAÇÕES (OBRIGATÓRIO)")
      expect(prompt).toContain("Baseie-se exclusivamente")
    }
  })

  it("filters chapters when chapterIds is provided", () => {
    const prompt = generateDirectPrompt(mockBook, ["other-id"])
    expect(prompt).not.toContain("CAPÍTULO 1: The Fundamentals")
  })
})
