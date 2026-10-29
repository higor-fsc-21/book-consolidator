import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { submitFeedbackMessage } from "./feedback"
import { db } from "@/lib/db"

vi.mock("@/lib/db", () => ({
  db: {
    feedbackMessage: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe("feedback service", () => {
  const originalEnv = process.env
  const mockUser = {
    id: "user-123",
    name: "Higor",
    email: "higor@example.com",
  }
  const mockInput = {
    category: "suggestion" as const,
    subject: "Novo recurso de estatísticas",
    message: "Gostaria de sugerir gráficos detalhados de evolução.",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("creates feedback message and marks as failed if RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY

    vi.mocked(db.feedbackMessage.create).mockResolvedValue({
      id: "msg-1",
      userId: mockUser.id,
      category: mockInput.category,
      subject: mockInput.subject,
      message: mockInput.message,
      emailStatus: "pending",
      emailError: null,
      sentAt: null,
      createdAt: new Date(),
    } as never)

    vi.mocked(db.feedbackMessage.update).mockResolvedValue({} as never)

    const result = await submitFeedbackMessage(mockUser, mockInput)

    expect(db.feedbackMessage.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        category: mockInput.category,
        subject: mockInput.subject,
        message: mockInput.message,
        emailStatus: "pending",
      },
    })

    expect(db.feedbackMessage.update).toHaveBeenCalledWith({
      where: { id: "msg-1" },
      data: {
        emailStatus: "failed",
        emailError: "RESEND_API_KEY não configurada no ambiente",
      },
    })

    expect(result).toEqual({ id: "msg-1", emailSent: false })
  })

  it("sends email via Resend and updates status to sent when API key is present and fetch succeeds", async () => {
    process.env.RESEND_API_KEY = "re_test_123"
    process.env.FEEDBACK_TO_EMAIL = "hc.job.21@gmail.com"

    vi.mocked(db.feedbackMessage.create).mockResolvedValue({
      id: "msg-2",
      userId: mockUser.id,
      category: mockInput.category,
      subject: mockInput.subject,
      message: mockInput.message,
      emailStatus: "pending",
      emailError: null,
      sentAt: null,
      createdAt: new Date(),
    } as never)

    vi.mocked(db.feedbackMessage.update).mockResolvedValue({} as never)

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "resend-id" }),
    } as Response)

    const result = await submitFeedbackMessage(mockUser, mockInput)

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer re_test_123",
          "Content-Type": "application/json",
        },
      }),
    )

    expect(db.feedbackMessage.update).toHaveBeenCalledWith({
      where: { id: "msg-2" },
      data: expect.objectContaining({
        emailStatus: "sent",
        emailError: null,
      }),
    })

    expect(result).toEqual({ id: "msg-2", emailSent: true })
    fetchSpy.mockRestore()
  })

  it("handles Resend fetch error gracefully and updates status to failed", async () => {
    process.env.RESEND_API_KEY = "re_test_123"

    vi.mocked(db.feedbackMessage.create).mockResolvedValue({
      id: "msg-3",
      userId: mockUser.id,
      category: mockInput.category,
      subject: mockInput.subject,
      message: mockInput.message,
      emailStatus: "pending",
      emailError: null,
      sentAt: null,
      createdAt: new Date(),
    } as never)

    vi.mocked(db.feedbackMessage.update).mockResolvedValue({} as never)

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Forbidden: invalid api key",
    } as Response)

    const result = await submitFeedbackMessage(mockUser, mockInput)

    expect(db.feedbackMessage.update).toHaveBeenCalledWith({
      where: { id: "msg-3" },
      data: expect.objectContaining({
        emailStatus: "failed",
        emailError: expect.stringContaining("Resend API error (403)"),
      }),
    })

    expect(result).toEqual({ id: "msg-3", emailSent: false })
    fetchSpy.mockRestore()
  })
})
