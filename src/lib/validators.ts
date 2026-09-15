import { z } from "zod"

export const UuidSchema = z.string().uuid()

export const ImportanceSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
])

export const ReadingStatusSchema = z.enum([
  "want",
  "reading",
  "completed",
  "paused",
  "archived",
])

export const ConsolidationStateSchema = z.enum([
  "consolidating",
  "consolidated",
  "archived",
])

export const DifficultySchema = z.enum(["easy", "medium", "hard"])

export const PerformanceSchema = z.enum(["correct", "partial", "wrong"])

export const SessionModeSchema = z.enum(["direct", "guided", "recognition"])

// Inputs never accept id, userId, score from the client.
// consolidationState is omitted in CreateBookInput, but allowed in UpdateBookInput (BookModal edit mode).
export const CreateBookInputSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(300),
  author: z.string().trim().min(1, "Autor é obrigatório").max(200),
  status: ReadingStatusSchema.default("want"),
  importance: ImportanceSchema.default(2),
  totalChapters: z.coerce
    .number()
    .int()
    .min(1, "Livro deve ter ao menos 1 capítulo"),
  currentChapter: z.coerce.number().int().min(1).nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  lastRevision: z.coerce.date().nullable().optional(),
  nextRevision: z.coerce.date().nullable().optional(),
  summary: z.string().trim().nullable().optional(),
  pages: z.coerce.number().int().positive().nullable().optional(),
  year: z.coerce.number().int().min(0).max(2100).nullable().optional(),
  coverUrl: z.string().url().nullable().optional().or(z.literal("")),
  googleBooksId: z.string().nullable().optional(),
})

export const UpdateBookInputSchema = CreateBookInputSchema.partial().extend({
  consolidationState: ConsolidationStateSchema.optional(),
})

export const CreateChapterInputSchema = z.object({
  title: z.string().trim().min(1, "Título do capítulo é obrigatório").max(300),
  description: z.string().trim().max(1000).nullable().optional(),
})

export const UpdateChapterInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Título do capítulo é obrigatório")
    .max(300)
    .optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  summary: z.string().trim().nullable().optional(),
  isRead: z.boolean().optional(),
})

export const CreateQuestionInputSchema = z.object({
  text: z.string().trim().min(1, "Texto da pergunta é obrigatório"),
  answer: z.string().trim().min(1, "Resposta é obrigatória"),
  difficulty: DifficultySchema.default("medium"),
})

export const UpdateQuestionInputSchema = CreateQuestionInputSchema.partial()

export const StartSessionInputSchema = z.object({
  bookId: UuidSchema,
  chapterId: UuidSchema.optional(),
  mode: SessionModeSchema.optional(),
})

export const SessionPerformanceEntrySchema = z.object({
  questionId: UuidSchema,
  performance: PerformanceSchema,
  userAnswer: z.string().trim().max(4000).nullable().optional(),
})

export const CompleteSessionInputSchema = z.object({
  mode: SessionModeSchema,
  entries: z.array(SessionPerformanceEntrySchema).min(1),
})

export const CancelSessionInputSchema = z.object({
  sessionId: UuidSchema,
})

export const GoogleBooksSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Termo de busca é obrigatório"),
  startIndex: z.coerce.number().int().min(0).default(0),
  maxResults: z.coerce.number().int().min(1).max(40).default(10),
})

export type CreateBookInput = z.infer<typeof CreateBookInputSchema>
export type UpdateBookInput = z.infer<typeof UpdateBookInputSchema>
export type CreateChapterInput = z.infer<typeof CreateChapterInputSchema>
export type UpdateChapterInput = z.infer<typeof UpdateChapterInputSchema>
export type CreateQuestionInput = z.infer<typeof CreateQuestionInputSchema>
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionInputSchema>
export type StartSessionInput = z.infer<typeof StartSessionInputSchema>
export type CompleteSessionInput = z.infer<typeof CompleteSessionInputSchema>
export type CancelSessionInput = z.infer<typeof CancelSessionInputSchema>
export type SessionPerformanceEntry = z.infer<typeof SessionPerformanceEntrySchema>
export type GoogleBooksSearchQuery = z.infer<typeof GoogleBooksSearchQuerySchema>

export type ActionResult<T = void,> = {
  success: true
  data?: T
} | {
  success: false
  error: string
  fieldErrors?: Record<string, string[]>
}
