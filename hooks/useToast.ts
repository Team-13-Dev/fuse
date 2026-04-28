"use client"

import { useState } from "react"

export type Toast = { id: number; msg: string; type: "success" | "error" }

let _toastId = 0

/**
 * Stacked toast notifications with auto-dismiss after 4 seconds.
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  function push(msg: string, type: "success" | "error") {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  function dismiss(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, push, dismiss }
}