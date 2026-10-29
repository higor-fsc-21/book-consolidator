"use client"

import { useCallback, useRef, useTransition } from "react"

export function useSingleFlightTransition() {
  const [isPending, startTransition] = useTransition()
  const isRunning = useRef(false)

  const runTransition = useCallback(
    (action: () => void | Promise<void>) => {
      if (isRunning.current) return

      isRunning.current = true
      startTransition(async () => {
        try {
          await action()
        } finally {
          isRunning.current = false
        }
      })
    },
    [startTransition],
  )

  return [isPending, runTransition] as const
}
