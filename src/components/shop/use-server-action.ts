"use client"

import * as React from "react"

import type { ActionResult } from "@/app/app/actions"

/** Runs a Server Action in a transition and tracks its pending and error state. */
export function useServerAction() {
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const run = React.useCallback(
    <T>(action: () => Promise<ActionResult<T>>, onSuccess?: (data: T) => void) => {
      setError(null)
      startTransition(async () => {
        try {
          const result = await action()
          if (result.ok) onSuccess?.(result.data)
          else setError(result.error)
        } catch {
          setError("Something went wrong. Check your connection and try again.")
        }
      })
    },
    [],
  )

  return { run, pending, error, setError }
}

/** Short random id for client-side list keys (works on plain-http LAN addresses too). */
export function clientId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
