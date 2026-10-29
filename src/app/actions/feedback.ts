"use server"

import { getCurrentUser } from "@/lib/auth"
import { logger } from "@/lib/logger"
import * as feedbackService from "@/domain/services/feedback"
import { CreateFeedbackInputSchema, type ActionResult } from "@/lib/validators"

export async function sendFeedbackAction(
  input: unknown,
): Promise<ActionResult<{ id: string; emailSent: boolean }>> {
  const user = await getCurrentUser()
  const parsed = CreateFeedbackInputSchema.safeParse(input)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstErrorMessage =
      parsed.error.issues[0]?.message ?? "Dados do formulário inválidos"
    return {
      success: false,
      error: firstErrorMessage,
      fieldErrors,
    }
  }

  try {
    const result = await feedbackService.submitFeedbackMessage(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      parsed.data,
    )

    logger.info("feedback.submitted", {
      userId: user.id,
      messageId: result.id,
      emailSent: result.emailSent,
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    logger.error("feedback.submit_failed", error, {
      userId: user.id,
    })
    return {
      success: false,
      error:
        "Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.",
    }
  }
}
