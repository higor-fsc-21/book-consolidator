import { notFound } from "next/navigation"
import { MemorizationSession } from "@/views/MemorizationSession"
import { getCurrentUser } from "@/lib/auth"
import { getSessionForUser } from "@/domain/queries/sessions"

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await getCurrentUser()
  const result = await getSessionForUser(user.id, sessionId)
  if (!result) notFound()

  const { session, book } = result
  const chapter = session.chapterId
    ? book.chapters.find((c) => c.id === session.chapterId)
    : undefined

  return <MemorizationSession session={session} book={book} chapter={chapter} />
}
