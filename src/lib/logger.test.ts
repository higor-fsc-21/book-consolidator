import { describe, expect, it, vi } from "vitest"
import { ConsoleLogger } from "./logger"

describe("ConsoleLogger", () => {
  it("logs info messages with and without metadata", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
    const logger = new ConsoleLogger()

    logger.info("action.completed")
    expect(infoSpy).toHaveBeenCalledWith("[INFO] action.completed")

    logger.info("book.created", { bookId: "123" })
    expect(infoSpy).toHaveBeenCalledWith("[INFO] book.created", {
      bookId: "123",
    })

    infoSpy.mockRestore()
  })

  it("logs error messages with error object and metadata", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const logger = new ConsoleLogger()
    const testError = new Error("Something broke")

    logger.error("action.failed", testError, { context: "test" })
    expect(errorSpy).toHaveBeenCalledWith(
      "[ERROR] action.failed",
      expect.objectContaining({
        context: "test",
        error: expect.objectContaining({ message: "Something broke" }),
      }),
    )

    logger.error("action.failed", "raw error string")
    expect(errorSpy).toHaveBeenCalledWith("[ERROR] action.failed", {
      error: "raw error string",
    })

    errorSpy.mockRestore()
  })
})
