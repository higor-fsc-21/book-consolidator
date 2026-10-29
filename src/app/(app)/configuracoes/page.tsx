import { getCurrentUser } from "@/lib/auth"
import { getBooksForUser } from "@/domain/queries/books"
import { ProfileSettingsView } from "@/views/ProfileSettings"
import type { UserProfile } from "@/domain/types"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const books = await getBooksForUser(user.id)

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    annualBooksGoal: user.annualBooksGoal,
    weeklyRevisionsGoal: user.weeklyRevisionsGoal,
    createdAt: user.createdAt,
  }

  return <ProfileSettingsView profile={profile} books={books} />
}
