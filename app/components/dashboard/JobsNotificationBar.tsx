"use client"
//
// app/components/dashboard/JobsNotificationBar.tsx
//
// Polls /api/me/jobs/active every 5s. Shows a slim banner when any jobs
// are running. Auto-hides on completion and shows a brief toast.

import { useEffect, useRef, useState } from "react"
import { Sparkles, X, CheckCircle2 } from "lucide-react"

interface ActiveJob {
  id:         string
  type:       string
  status:     "queued" | "running"
  progress:   number
  detail:     string | null
  startedAt:  string | null
  createdAt:  string
}

const POLL_INTERVAL_MS = 5000

const JOB_LABELS: Record<string, string> = {
  product_segmentation: "Refreshing product insights",
}

function jobLabel(type: string): string {
  return JOB_LABELS[type] ?? type.replace(/_/g, " ")
}

export default function JobsNotificationBar() {
  const [jobs,      setJobs]      = useState<ActiveJob[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [toast,     setToast]     = useState<string | null>(null)
  const prevIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch("/api/me/jobs/active", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json() as { jobs: ActiveJob[] }
        if (cancelled) return

        // Detect transitions: jobs that disappeared = completed
        const currentIds = new Set(data.jobs.map(j => j.id))
        const justFinished = [...prevIds.current].filter(id => !currentIds.has(id))
        if (justFinished.length > 0) {
          setToast("Insights updated ✓")
          setTimeout(() => setToast(null), 4000)
        }
        prevIds.current = currentIds
        setJobs(data.jobs)
      } catch { /* swallow */ }
    }

    poll()
    const t = setInterval(poll, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const visible = jobs.filter(j => !dismissed.has(j.id))

  return (
    <>
      {/* Active jobs bar */}
      {visible.length > 0 && (
        <div style={{
          background: "linear-gradient(90deg, #eef2ff 0%, #f0f9ff 100%)",
          borderBottom: "1px solid #c7d2fe",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 13,
          color: "#3730a3",
        }}>
          <Sparkles size={15} style={{ flexShrink: 0 }}/>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {visible.map(j => (
              <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 600 }}>{jobLabel(j.type)}…</span>
                {j.detail && <span style={{ color: "#6366f1" }}>· {j.detail}</span>}
                <div style={{
                  marginLeft: "auto",
                  width: 100, height: 4, background: "#c7d2fe",
                  borderRadius: 2, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${j.progress}%`,
                    background: "#6366f1",
                    transition: "width 0.4s",
                  }}/>
                </div>
                <span style={{ fontSize: 11, color: "#6366f1", minWidth: 30 }}>
                  {j.progress}%
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setDismissed(new Set(visible.map(j => j.id)))}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, borderRadius: 4,
              display: "flex", alignItems: "center",
            }}
            aria-label="Dismiss"
          >
            <X size={14} color="#6366f1"/>
          </button>
        </div>
      )}

      {/* Completion toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24, right: 24,
          background: "#10b981",
          color: "#fff",
          padding: "10px 16px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 6px 20px rgba(16,185,129,0.3)",
          display: "flex", alignItems: "center", gap: 8,
          zIndex: 9999,
        }}>
          <CheckCircle2 size={15}/>
          {toast}
        </div>
      )}
    </>
  )
}