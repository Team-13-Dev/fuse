"use client"

import { useState, useEffect } from "react"

/**
 * Fetches the current user's role in the active business.
 * Returns null while loading, then "owner" | "manager" | "member" etc.
 */
export function useBusinessRole() {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/me/business-role")
      .then(r => r.json())
      .then(d => setRole(d.role ?? "member"))
      .catch(() => setRole("member"))
  }, [])

  return role
}