"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { logger } from "@/lib/logger"
import * as usersService from "@/domain/services/users"
import {
  UpdateUserProfileSchema,
  UpdateUserGoalsSchema,
  type ActionResult,
} from "@/lib/validators"
import type { UserProfile } from "@/domain/types"

export async function updateUserProfileAction(
  input: unknown,
): Promise<ActionResult<UserProfile>> {
  const user = await getCurrentUser()
  const parsed = UpdateUserProfileSchema.safeParse(input)
  if (!parsed.success) {
    logger.info("profile.update.validation_failed", {
      userId: user.id,
      issues: parsed.error.issues.map((i) => i.path.join(".")),
    })
    return {
      success: false,
      error: "Dados de perfil inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const updated = await usersService.updateUserProfile(user.id, parsed.data)
    logger.info("profile.update.success", { userId: user.id })
    revalidatePath("/", "layout")
    revalidatePath("/configuracoes")
    revalidatePath("/painel")
    return { success: true, data: updated }
  } catch (error) {
    logger.error("profile.update.failed", error, { userId: user.id })
    return { success: false, error: "Erro ao atualizar perfil" }
  }
}

export async function updateUserGoalsAction(
  input: unknown,
): Promise<ActionResult<UserProfile>> {
  const user = await getCurrentUser()
  const parsed = UpdateUserGoalsSchema.safeParse(input)
  if (!parsed.success) {
    logger.info("goals.update.validation_failed", {
      userId: user.id,
      issues: parsed.error.issues.map((i) => i.path.join(".")),
    })
    return {
      success: false,
      error: "Metas inválidas",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const updated = await usersService.updateUserGoals(user.id, parsed.data)
    logger.info("goals.update.success", { userId: user.id })
    revalidatePath("/configuracoes")
    revalidatePath("/painel")
    return { success: true, data: updated }
  } catch (error) {
    logger.error("goals.update.failed", error, { userId: user.id })
    return { success: false, error: "Erro ao atualizar metas" }
  }
}
