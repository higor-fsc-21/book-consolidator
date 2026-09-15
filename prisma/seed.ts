import "dotenv/config"
import { PrismaClient, type Prisma } from "@prisma/client"

import { MOCK_BOOKS } from "./seed-data"

const prisma = new PrismaClient()

const seedUserEmail = process.env.SEED_USER_EMAIL
if (!seedUserEmail) {
  throw new Error("SEED_USER_EMAIL must be set (see .env.example)")
}

const seedUserAuthId = process.env.SEED_USER_AUTH_ID
if (!seedUserAuthId) {
  throw new Error("SEED_USER_AUTH_ID must be set (see .env.example)")
}

function toUtcMidnight(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

async function main() {
  // FK-safe order: children before parents.
  await prisma.sessionAttempt.deleteMany()
  await prisma.revisionSession.deleteMany()
  await prisma.question.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.book.deleteMany()
  await prisma.user.deleteMany({
    where: {
      OR: [{ email: seedUserEmail }, { authUserId: seedUserAuthId }],
    },
  })

  const user = await prisma.user.create({
    data: {
      name: "Rafael",
      email: seedUserEmail,
      authUserId: seedUserAuthId,
    },
  })

  for (const book of MOCK_BOOKS) {
    const questionIdByMockId = new Map<string, string>()

    const createdBook = await prisma.book.create({
      data: {
        userId: user.id,
        title: book.title,
        author: book.author,
        status: book.status,
        importance: book.importance,
        startDate: book.startDate ? toUtcMidnight(book.startDate) : null,
        endDate: book.endDate ? toUtcMidnight(book.endDate) : null,
        currentChapter: book.currentChapter ?? null,
        totalChapters: book.totalChapters,
        consolidationState: book.consolidationState,
        lastRevision: book.lastRevision
          ? toUtcMidnight(book.lastRevision)
          : null,
        nextRevision: book.nextRevision
          ? toUtcMidnight(book.nextRevision)
          : null,
        summary: book.summary || null,
        pages: book.pages ?? null,
        year: book.year ?? null,
      },
    })

    for (const chapter of book.chapters) {
      const createdChapter = await prisma.chapter.create({
        data: {
          bookId: createdBook.id,
          number: chapter.number,
          title: chapter.title,
          description: chapter.description ?? null,
          summary: chapter.summary ?? null,
          isRead: chapter.isRead,
        },
      })

      for (const question of chapter.questions) {
        const createdQuestion = await prisma.question.create({
          data: {
            chapterId: createdChapter.id,
            text: question.text,
            answer: question.answer,
            difficulty: question.difficulty,
          },
        })
        questionIdByMockId.set(question.id, createdQuestion.id)
      }
    }

    const sortedRevisions = [...book.revisions].sort((a, b) =>
      a.date.localeCompare(b.date),
    )
    const latestRevision = sortedRevisions.at(-1)

    for (const revision of sortedRevisions) {
      const createdSession = await prisma.revisionSession.create({
        data: {
          userId: user.id,
          bookId: createdBook.id,
          mode: revision.mode,
          score: revision.score,
          startedAt: toUtcMidnight(revision.date),
          completedAt: toUtcMidnight(revision.date),
        },
      })

      // Only the latest session ties attempts to real questions (question.lastPerformance
      // has no history for earlier revisions); earlier sessions get synthetic untied
      // attempts that reproduce the stored score so history charts aren't empty.
      if (revision.id === latestRevision?.id) {
        const attempts: Prisma.SessionAttemptCreateManyInput[] = []
        for (const chapter of book.chapters) {
          for (const question of chapter.questions) {
            if (!question.lastPerformance) continue
            const questionId = questionIdByMockId.get(question.id)
            if (!questionId) continue
            attempts.push({
              sessionId: createdSession.id,
              questionId,
              performance: question.lastPerformance,
            })
          }
        }
        if (attempts.length > 0) {
          await prisma.sessionAttempt.createMany({ data: attempts })
        }
        continue
      }

      const correctCount = Math.round(
        (revision.score / 100) * revision.questionsCount,
      )
      const attempts: Prisma.SessionAttemptCreateManyInput[] = Array.from(
        { length: revision.questionsCount },
        (_, i) => ({
          sessionId: createdSession.id,
          questionId: null,
          performance: i < correctCount ? "correct" : "wrong",
        }),
      )
      if (attempts.length > 0) {
        await prisma.sessionAttempt.createMany({ data: attempts })
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
