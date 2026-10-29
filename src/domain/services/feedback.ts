import "server-only"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { FEEDBACK_CATEGORY_LABELS } from "../helpContent"
import type { CreateFeedbackInput } from "@/lib/validators"

export interface SubmitFeedbackUser {
  id: string
  name: string
  email: string
}

export interface SubmitFeedbackResult {
  id: string
  emailSent: boolean
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export async function submitFeedbackMessage(
  user: SubmitFeedbackUser,
  input: CreateFeedbackInput,
): Promise<SubmitFeedbackResult> {
  const categoryInfo = FEEDBACK_CATEGORY_LABELS[input.category]
  const categoryLabel = categoryInfo ? categoryInfo.label : input.category

  // 1. Create message in DB with pending email status
  const messageRecord = await db.feedbackMessage.create({
    data: {
      userId: user.id,
      category: input.category,
      subject: input.subject,
      message: input.message,
      emailStatus: "pending",
    },
  })

  const resendApiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.FEEDBACK_TO_EMAIL || "hc.job.21@gmail.com"
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Book Consolidator <onboarding@resend.dev>"

  if (!resendApiKey) {
    const errorMsg = "RESEND_API_KEY não configurada no ambiente"
    logger.error("feedback.email_skipped", new Error(errorMsg), {
      messageId: messageRecord.id,
      userId: user.id,
    })
    await db.feedbackMessage.update({
      where: { id: messageRecord.id },
      data: {
        emailStatus: "failed",
        emailError: errorMsg,
      },
    })
    return { id: messageRecord.id, emailSent: false }
  }

  try {
    const emailSubject = `[Book Consolidator - ${categoryLabel}] ${input.subject}`
    const textContent = [
      `Nova mensagem enviada através da Central de Ajuda do Book Consolidator:`,
      ``,
      `De: ${user.name} (${user.email})`,
      `User ID: ${user.id}`,
      `Categoria: ${categoryLabel} (${input.category})`,
      `Assunto: ${input.subject}`,
      `Data: ${new Date().toISOString()}`,
      ``,
      `Mensagem:`,
      input.message,
    ].join("\n")

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e2e2; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #1a2e44; margin-top: 0; border-bottom: 2px solid #f2d492; padding-bottom: 8px;">
          Mensagem da Central de Ajuda
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #74777d; width: 120px;"><strong>Usuário:</strong></td>
            <td style="padding: 6px 0; color: #1b1c1c;">${escapeHtml(user.name)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #74777d;"><strong>E-mail:</strong></td>
            <td style="padding: 6px 0; color: #1b1c1c;"><a href="mailto:${escapeHtml(user.email)}" style="color: #1a2e44;">${escapeHtml(user.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #74777d;"><strong>Categoria:</strong></td>
            <td style="padding: 6px 0; color: #1b1c1c;"><span style="background-color: #f5f3f3; padding: 3px 8px; border-radius: 4px; font-weight: 500;">${escapeHtml(categoryLabel)}</span></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #74777d;"><strong>Assunto:</strong></td>
            <td style="padding: 6px 0; color: #1b1c1c; font-weight: 600;">${escapeHtml(input.subject)}</td>
          </tr>
        </table>
        <div style="background-color: #fbf9f8; border-left: 4px solid #1a2e44; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #74777d;">Mensagem:</h3>
          <p style="white-space: pre-wrap; color: #1b1c1c; font-size: 14px; line-height: 1.6; margin: 0;">${escapeHtml(input.message)}</p>
        </div>
        <p style="font-size: 11px; color: #74777d; margin-bottom: 0;">
          Enviado pelo sistema Book Consolidator em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Horário de Brasília).
        </p>
      </div>
    `

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: user.email,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Resend API error (${res.status}): ${errorBody}`)
    }

    await db.feedbackMessage.update({
      where: { id: messageRecord.id },
      data: {
        emailStatus: "sent",
        sentAt: new Date(),
        emailError: null,
      },
    })

    logger.info("feedback.email_sent", {
      messageId: messageRecord.id,
      userId: user.id,
      category: input.category,
    })

    return { id: messageRecord.id, emailSent: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error("feedback.email_failed", err, {
      messageId: messageRecord.id,
      userId: user.id,
    })

    await db.feedbackMessage.update({
      where: { id: messageRecord.id },
      data: {
        emailStatus: "failed",
        emailError: errorMessage.slice(0, 1000),
      },
    })

    return { id: messageRecord.id, emailSent: false }
  }
}
