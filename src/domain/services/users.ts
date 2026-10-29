import "server-only"
import { db } from "@/lib/db"
import type {
  UpdateUserProfileInput,
  UpdateUserGoalsInput,
} from "@/lib/validators"

export async function getUserProfile(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      annualBooksGoal: true,
      weeklyRevisionsGoal: true,
      createdAt: true,
    },
  })
}

export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileInput,
) {
  return db.user.update({
    where: { id: userId },
    data: {
      name: data.name,
    },
    select: {
      id: true,
      name: true,
      email: true,
      annualBooksGoal: true,
      weeklyRevisionsGoal: true,
      createdAt: true,
    },
  })
}

export async function updateUserGoals(
  userId: string,
  data: UpdateUserGoalsInput,
) {
  return db.user.update({
    where: { id: userId },
    data: {
      annualBooksGoal: data.annualBooksGoal,
      weeklyRevisionsGoal: data.weeklyRevisionsGoal,
    },
    select: {
      id: true,
      name: true,
      email: true,
      annualBooksGoal: true,
      weeklyRevisionsGoal: true,
      createdAt: true,
    },
  })
}
