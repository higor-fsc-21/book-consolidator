const SENSITIVE_KEYS = new Set([
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "session",
  "apiKey",
  "googleBooksApiKey",
  "email",
])

function sanitizeValue(value: unknown): unknown {
  if (value == null) return value

  if (typeof value === "string") {
    return value.length > 0 && value.includes("@") ? "[REDACTED_EMAIL]" : value
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item))
  }

  if (typeof value === "object") {
    const redacted: Record<string, unknown> = {}
    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        redacted[key] = "[REDACTED]"
        continue
      }

      if (
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("token")
      ) {
        redacted[key] = "[REDACTED]"
        continue
      }

      redacted[key] = sanitizeValue(nestedValue)
    }
    return redacted
  }

  return String(value)
}

export interface Logger {
  info(event: string, meta?: Record<string, unknown>): void
  error(event: string, error: unknown, meta?: Record<string, unknown>): void
}

export class ConsoleLogger implements Logger {
  info(event: string, meta?: Record<string, unknown>): void {
    const safeMeta = meta ? sanitizeValue(meta) : undefined
    if (
      safeMeta &&
      Object.keys(safeMeta as Record<string, unknown>).length > 0
    ) {
      console.info(`[INFO] ${event}`, safeMeta)
    } else {
      console.info(`[INFO] ${event}`)
    }
  }

  error(event: string, error: unknown, meta?: Record<string, unknown>): void {
    const sanitizedMeta = meta ? sanitizeValue(meta) : {}
    const details: Record<string, unknown> =
      typeof sanitizedMeta === "object" &&
      sanitizedMeta !== null &&
      !Array.isArray(sanitizedMeta)
        ? { ...sanitizedMeta as Record<string, unknown> }
        : {}

    details.error =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : sanitizeValue(error)

    console.error(`[ERROR] ${event}`, details)
  }
}

export const logger: Logger = new ConsoleLogger()
