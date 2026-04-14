"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown,
  ChevronUp, Download, ArrowRight, Loader2, SkipForward,
  Database, Users, Package, ShoppingCart, Sparkles,
  FileSpreadsheet, RefreshCw, Eye, EyeOff,
} from "lucide-react"
import type {
  ParseResponse,
  ConfirmedMapping,
  CleanResponse,
  MissingFieldAction,
} from "../../../../lib/pipeline/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "idle"
  | "parsing"
  | "confirming"
  | "deciding"
  | "cleaning"
  | "storing"
  | "done"
  | "skipped"
  | "error"

interface StoreStats {
  customers_inserted: number
  customers_skipped: number
  products_inserted: number
  products_skipped: number
  orders_inserted: number
  order_items_inserted: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confidentColor(score: number): string {
  if (score >= 95) return "#10b981"
  if (score >= 80) return "#f59e0b"
  return "#ef4444"
}

function targetLabel(target: string): string {
  if (target.startsWith("__attributes__")) return `attr: ${target.split(".")[1]}`
  if (target === "__unmapped__") return "unmapped"
  return target
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseIndicator({ phase }: { phase: Phase }) {
  const steps: { key: Phase | Phase[]; label: string }[] = [
    { key: "parsing",    label: "Parsing"    },
    { key: "confirming", label: "Mapping"    },
    { key: ["deciding", "cleaning"], label: "Cleaning"   },
    { key: "storing",   label: "Storing"    },
    { key: "done",      label: "Complete"   },
  ]

  const phaseIndex = (p: Phase) => {
    const order: Phase[] = ["idle","parsing","confirming","deciding","cleaning","storing","done"]
    return order.indexOf(p)
  }
  const current = phaseIndex(phase)

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {steps.map((step, i) => {
        const keys = Array.isArray(step.key) ? step.key : [step.key]
        const stepIdx = phaseIndex(keys[0])
        const isDone    = current > stepIdx
        const isActive  = keys.includes(phase) || (current === stepIdx)

        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: isDone ? "#10b981" : isActive ? "#3344FC" : "#e5e7eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
                boxShadow: isActive ? "0 0 0 4px rgba(51,68,252,0.15)" : "none",
              }}>
                {isDone
                  ? <CheckCircle2 size={16} color="#fff" />
                  : isActive
                    ? <Loader2 size={14} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                    : <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: isDone ? "#10b981" : isActive ? "#3344FC" : "#9ca3af", whiteSpace: "nowrap" }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: 2, flex: 1, margin: "0 8px", marginBottom: 18,
                background: isDone ? "#10b981" : "#e5e7eb",
                transition: "background 0.3s",
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingSyncPage() {
  const router = useRouter()

  const [phase,         setPhase]         = useState<Phase>("idle")
  const [error,         setError]         = useState<string | null>(null)
  const [file,          setFile]          = useState<File | null>(null)
  const [parseResult,   setParseResult]   = useState<ParseResponse | null>(null)
  const [cleanResult,   setCleanResult]   = useState<CleanResponse | null>(null)
  const [storeStats,    setStoreStats]    = useState<StoreStats | null>(null)
  const [downloading,   setDownloading]   = useState(false)

  // Mapping confirmation state
  const [confirmedMap,  setConfirmedMap]  = useState<Record<string, string>>({})
  const [attrCols,      setAttrCols]      = useState<Record<string, string>>({})
  const [ignoredCols,   setIgnoredCols]   = useState<Set<string>>(new Set())
  const [costPct,       setCostPct]       = useState<string>("")

  // ML decision state
  const [decisions,     setDecisions]     = useState<Record<string, "placeholder" | "skip_feature">>({})
  const [pendingActions, setPendingActions] = useState<MissingFieldAction[]>([])

  // UI toggles
  const [showSample,    setShowSample]    = useState(false)
  const [showWarnings,  setShowWarnings]  = useState(false)
  const [showFailed,    setShowFailed]    = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Read file from sessionStorage on mount ──────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("fuse_import_file")
    if (!stored) return

    // sessionStorage can only store strings — we stored a data URL
    fetch(stored)
      .then(r => r.blob())
      .then(blob => {
        const name = sessionStorage.getItem("fuse_import_filename") ?? "upload.xlsx"
        const restored = new File([blob], name, { type: blob.type })
        setFile(restored)
        sessionStorage.removeItem("fuse_import_file")
        sessionStorage.removeItem("fuse_import_filename")
      })
      .catch(() => {
        // File not available from sessionStorage — user must re-upload
      })
  }, [])

  // ── Parse ──────────────────────────────────────────────────────────────
  const runParse = useCallback(async (f: File) => {
    setPhase("parsing")
    setError(null)

    const formData = new FormData()
    formData.append("file", f)

    try {
      const res = await fetch("/api/onboarding/parse", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Parse failed" }))
        throw new Error(err.error ?? "Parse failed")
      }
      const data: ParseResponse = await res.json()
      setParseResult(data)
      setConfirmedMap({ ...data.detected_mapping })
      setAttrCols({ ...data.attribute_columns })
      setPhase("confirming")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error during parse")
      setPhase("error")
    }
  }, [])

  // Auto-parse when file is ready
  useEffect(() => {
    if (file && phase === "idle") {
      runParse(file)
    }
  }, [file, phase, runParse])

  // ── Build ConfirmedMapping ─────────────────────────────────────────────
  function buildMapping(): ConfirmedMapping {
    const parsedCostPct = costPct ? parseFloat(costPct) / 100 : null
    const allDecisions: Record<string, "placeholder" | "skip_feature"> = {}

    if (parseResult) {
      for (const field of parseResult.truly_missing) {
        allDecisions[field] = decisions[field] ?? "skip_feature"
      }
    }

    return {
      header_row_index:        parseResult?.header_row_index ?? 0,
      confirmed:               confirmedMap,
      attribute_columns:       attrCols,
      ignored_columns:         Array.from(ignoredCols),
      cost_pct:                parsedCostPct,
      missing_field_decisions: allDecisions,
    }
  }

  // ── Clean ──────────────────────────────────────────────────────────────
  const runClean = useCallback(async () => {
    if (!file) return
    setPhase("cleaning")
    setError(null)

    const mapping = buildMapping()
    const formData = new FormData()
    formData.append("file", file)
    formData.append("mapping", JSON.stringify(mapping))

    try {
      const res = await fetch("/api/onboarding/clean", { method: "POST", body: formData })
      const data: CleanResponse = await res.json()

      if (res.status === 202 && data.action_required) {
        setPendingActions(data.action_required.fields)
        setPhase("deciding")
        return
      }

      if (!res.ok) {
        throw new Error((data as unknown as { error?: string }).error ?? "Clean failed")
      }

      setCleanResult(data)
      await runStore(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error during clean")
      setPhase("error")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, confirmedMap, attrCols, ignoredCols, costPct, decisions, parseResult])

  // ── Store ──────────────────────────────────────────────────────────────
  async function runStore(data: CleanResponse) {
    setPhase("storing")
    try {
      const res = await fetch("/api/onboarding/store", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data.entities),
      })
      if (!res.ok) throw new Error("Failed to store data")
      const stats = await res.json()
      setStoreStats(stats.stats)
      setPhase("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error during store")
      setPhase("error")
    }
  }

  // ── Download ML Excel ──────────────────────────────────────────────────
  async function downloadML() {
    if (!cleanResult) return
    setDownloading(true)
    try {
      const res = await fetch("/api/onboarding/ml-export", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(cleanResult),
      })
      if (!res.ok) throw new Error("Export failed")
      const blob  = await res.blob()
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement("a")
      a.href      = url
      a.download  = `fuse-ml-dataset-${Date.now()}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed")
    } finally {
      setDownloading(false)
    }
  }

  // ── Render: file picker (when no file from sessionStorage) ─────────────
  if (phase === "idle" && !file) {
    return (
      <Shell>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#111" }}>
          Import your data
        </h2>
        <p style={{ color: "#6b7280", marginBottom: 28, fontSize: 14 }}>
          Upload the Excel or CSV file you prepared during onboarding.
        </p>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed #d1d5db", borderRadius: 16, padding: "48px 32px",
            textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#3344FC")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "#d1d5db")}
        >
          <FileSpreadsheet size={40} color="#9ca3af" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Drop your file here or click to browse</p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>.xlsx, .xls, .csv — max 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) setFile(f)
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: "transparent", color: "#6b7280", cursor: "pointer", fontSize: 14,
            }}
          >
            Skip for now
          </button>
        </div>
      </Shell>
    )
  }

  // ── Render: parsing ────────────────────────────────────────────────────
  if (phase === "parsing") {
    return (
      <Shell>
        <PhaseIndicator phase={phase} />
        <LoadingState
          title="Analysing your file…"
          subtitle={`Detecting columns and mapping them to your store schema in ${file?.name ?? ""}`}
        />
      </Shell>
    )
  }

  // ── Render: confirming (mapping review) ────────────────────────────────
  if (phase === "confirming" && parseResult) {
    const allCols = Object.keys(parseResult.detected_mapping)
    const unmapped = parseResult.unmapped_columns

    return (
      <Shell wide>
        <PhaseIndicator phase={phase} />

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 4 }}>
              Review column mapping
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              We detected {allCols.length} columns. Confirm or edit each mapping before cleaning.
            </p>
          </div>
          <CoverageChip pct={parseResult.ml_coverage_pct} />
        </div>

        {/* Mapped columns table */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Mapped columns ({allCols.length})
            </span>
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {allCols.map(col => {
              const score = parseResult.confidence_scores[col] ?? 0
              const current = confirmedMap[col] ?? parseResult.detected_mapping[col]
              const isAttr = current?.startsWith("__attributes__")
              const isIgnored = ignoredCols.has(col)

              return (
                <div key={col} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr auto",
                  gap: 12, padding: "10px 16px",
                  borderBottom: "1px solid #f9fafb",
                  opacity: isIgnored ? 0.4 : 1,
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{col}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {score > 0 && (
                        <span style={{ color: confidentColor(score), fontWeight: 600 }}>
                          {score.toFixed(0)}% · {parseResult.match_methods[col]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isAttr ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                          background: "#f3e8ff", color: "#7c3aed",
                        }}>
                          attribute: {current.split(".")[1]}
                        </span>
                      </div>
                    ) : (
                      <input
                        value={isIgnored ? "" : (current ?? "")}
                        disabled={isIgnored}
                        onChange={e => setConfirmedMap(m => ({ ...m, [col]: e.target.value }))}
                        placeholder="e.g. customer.email"
                        style={{
                          width: "100%", padding: "6px 10px", fontSize: 12,
                          border: "1px solid #e5e7eb", borderRadius: 6,
                          background: isIgnored ? "#f9fafb" : "#fff",
                          color: "#111", outline: "none",
                          fontFamily: "monospace",
                        }}
                      />
                    )}
                  </div>

                  <button
                    onClick={() => setIgnoredCols(s => {
                      const next = new Set(s)
                      next.has(col) ? next.delete(col) : next.add(col)
                      return next
                    })}
                    title={isIgnored ? "Restore" : "Ignore this column"}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "1px solid #e5e7eb",
                      background: "transparent", cursor: "pointer", fontSize: 11,
                      color: isIgnored ? "#10b981" : "#9ca3af",
                    }}
                  >
                    {isIgnored ? "Restore" : "Ignore"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Unmapped columns */}
        {unmapped.length > 0 && (
          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
            padding: "12px 16px", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={14} color="#f59e0b" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>
                {unmapped.length} unmapped column{unmapped.length > 1 ? "s" : ""} — stored in metadata
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {unmapped.map((col: string) => (
                <span key={col} style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 20,
                  background: "#fef3c7", color: "#78350f", fontWeight: 500,
                }}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Truly missing ML fields */}
        {parseResult.truly_missing.length > 0 && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
            padding: "12px 16px", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <XCircle size={14} color="#ef4444" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#7f1d1d" }}>
                {parseResult.truly_missing.length} ML field{parseResult.truly_missing.length > 1 ? "s" : ""} not found
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {parseResult.truly_missing.includes("cost") && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#374151", minWidth: 80 }}>cost %</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={costPct}
                    onChange={e => setCostPct(e.target.value)}
                    placeholder="e.g. 60 (cost = 60% of price)"
                    style={{
                      flex: 1, padding: "5px 10px", fontSize: 12,
                      border: "1px solid #e5e7eb", borderRadius: 6, outline: "none",
                    }}
                  />
                </div>
              )}
              {parseResult.truly_missing.map((field: string) => (
                <div key={field} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code style={{ fontSize: 11, background: "#fee2e2", padding: "2px 6px", borderRadius: 4, color: "#b91c1c", minWidth: 120 }}>
                    {field}
                  </code>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>→ will be decided before cleaning</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost % optional if not in truly_missing but still useful */}
        {!parseResult.truly_missing.includes("cost") && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Cost % (optional):</span>
            <input
              type="number" min={0} max={100} value={costPct}
              onChange={e => setCostPct(e.target.value)}
              placeholder="e.g. 60"
              style={{
                width: 120, padding: "5px 10px", fontSize: 12,
                border: "1px solid #e5e7eb", borderRadius: 6, outline: "none",
              }}
            />
          </div>
        )}

        {/* Sample rows toggle */}
        <button
          onClick={() => setShowSample(s => !s)}
          style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: "#6b7280", padding: 0,
          }}
        >
          {showSample ? <EyeOff size={13} /> : <Eye size={13} />}
          {showSample ? "Hide" : "Show"} sample rows ({parseResult.sample_rows.length})
        </button>

        {showSample && (
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  {Object.keys(parseResult.sample_rows[0] ?? {}).map((k: string) => (
                    <th key={k} style={{
                      padding: "6px 10px", textAlign: "left", background: "#f9fafb",
                      border: "1px solid #e5e7eb", color: "#374151", fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parseResult.sample_rows.map((row: Record<string, unknown>, i: number) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j: number) => (
                      <td key={j} style={{
                        padding: "5px 10px", border: "1px solid #e5e7eb",
                        color: "#374151", maxWidth: 160, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {v === null || v === undefined ? <span style={{ color: "#d1d5db" }}>—</span> : String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => { setPhase("skipped"); router.push("/dashboard") }}
            style={{
              padding: "10px 18px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: "transparent", color: "#6b7280", cursor: "pointer",
              fontSize: 13, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <SkipForward size={14} /> Skip import
          </button>
          <button
            onClick={runClean}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: "#3344FC", color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            Clean & Import <ArrowRight size={14} />
          </button>
        </div>
      </Shell>
    )
  }

  // ── Render: deciding (action_required from /clean) ─────────────────────
  if (phase === "deciding" && pendingActions.length > 0) {
    return (
      <Shell>
        <PhaseIndicator phase={phase} />

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>
          Some ML fields need your input
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
          These fields couldn't be found or derived. Choose what to do with each one.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {pendingActions.map((action) => (
            <div key={action.field} style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
              padding: "16px 20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <code style={{
                    fontSize: 13, background: "#fef3c7", padding: "2px 8px",
                    borderRadius: 6, color: "#92400e", fontWeight: 700,
                  }}>
                    {action.field}
                  </code>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{action.reason}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>
                    Affects: {action.affects.join(", ")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {action.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setDecisions(d => ({ ...d, [action.field]: opt as "placeholder" | "skip_feature" }))}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                        border: "1px solid",
                        borderColor: decisions[action.field] === opt ? "#3344FC" : "#e5e7eb",
                        background: decisions[action.field] === opt ? "#eff0ff" : "transparent",
                        color: decisions[action.field] === opt ? "#3344FC" : "#6b7280",
                        fontWeight: decisions[action.field] === opt ? 700 : 400,
                        transition: "all 0.15s",
                      }}
                    >
                      {opt === "placeholder" ? "Use 0 as placeholder" : "Skip this feature"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              // Apply defaults for undecided fields
              const defaults: Record<string, "skip_feature"> = {}
              pendingActions.forEach(a => { if (!decisions[a.field]) defaults[a.field] = "skip_feature" })
              setDecisions(d => ({ ...d, ...defaults }))
              runClean()
            }}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: "#3344FC", color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            Continue with decisions <ArrowRight size={14} />
          </button>
        </div>
      </Shell>
    )
  }

  // ── Render: cleaning / storing ─────────────────────────────────────────
  if (phase === "cleaning" || phase === "storing") {
    return (
      <Shell>
        <PhaseIndicator phase={phase} />
        <LoadingState
          title={phase === "cleaning" ? "Cleaning your data…" : "Storing to your workspace…"}
          subtitle={
            phase === "cleaning"
              ? "Normalizing cells, deriving ML fields, assembling entities"
              : "Inserting customers, products, orders and order items"
          }
        />
      </Shell>
    )
  }

  // ── Render: done ───────────────────────────────────────────────────────
  if (phase === "done" && cleanResult) {
    const { summary, entities, warnings, derived_fields, failed_rows } = cleanResult

    return (
      <Shell wide>
        <PhaseIndicator phase={phase} />

        {/* Hero success */}
        <div style={{
          textAlign: "center", padding: "28px 0 20px",
          borderBottom: "1px solid #f3f4f6", marginBottom: 28,
        }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 6 }}>
            Import complete
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            {summary.clean_rows.toLocaleString()} of {summary.total_rows.toLocaleString()} rows imported
            successfully · ML coverage{" "}
            <strong style={{ color: "#3344FC" }}>{summary.ml_coverage_pct}%</strong>
          </p>
        </div>

        {/* Entity summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <SummaryCard icon={Users}        label="Customers"   value={entities.customers.length}    color="#3344FC" />
          <SummaryCard icon={Package}      label="Products"    value={entities.products.length}     color="#10b981" />
          <SummaryCard icon={ShoppingCart} label="Orders"      value={entities.orders.length}       color="#f59e0b" />
          <SummaryCard icon={Database}     label="Order Items" value={entities.order_items.length}  color="#8b5cf6" />
        </div>

        {/* DB store stats */}
        {storeStats && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
            padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#15803d",
            display: "flex", flexWrap: "wrap", gap: 16,
          }}>
            <span>✅ <strong>{storeStats.customers_inserted}</strong> customers added ({storeStats.customers_skipped} already existed)</span>
            <span>✅ <strong>{storeStats.products_inserted}</strong> products added ({storeStats.products_skipped} already existed)</span>
            <span>✅ <strong>{storeStats.orders_inserted}</strong> orders added</span>
            <span>✅ <strong>{storeStats.order_items_inserted}</strong> order items added</span>
          </div>
        )}

        {/* Derived fields */}
        {derived_fields.length > 0 && (
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
            padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
          }}>
            <Sparkles size={14} color="#3b82f6" />
            <span style={{ fontSize: 12, color: "#1d4ed8" }}>
              <strong>Auto-derived:</strong> {derived_fields.join(", ")}
            </span>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowWarnings(s => !s)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#f59e0b", padding: 0, marginBottom: 8,
              }}
            >
              <AlertTriangle size={13} />
              {warnings.length} warning{warnings.length > 1 ? "s" : ""}
              {showWarnings ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showWarnings && (
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px",
              }}>
                {warnings.map((w: string, i: number) => (
                  <p key={i} style={{ fontSize: 12, color: "#78350f", margin: "3px 0" }}>• {w}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Failed rows */}
        {failed_rows.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => setShowFailed(s => !s)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#ef4444", padding: 0, marginBottom: 8,
              }}
            >
              <XCircle size={13} />
              {failed_rows.length} failed row{failed_rows.length > 1 ? "s" : ""} (excluded from DB)
              {showFailed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showFailed && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                padding: "10px 14px", maxHeight: 200, overflowY: "auto",
              }}>
                {failed_rows.map((r: { row_index: number; reason: string }, i: number) => (
                  <div key={i} style={{ fontSize: 11, color: "#7f1d1d", marginBottom: 4 }}>
                    Row {r.row_index}: {r.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
          <button
            onClick={downloadML}
            disabled={downloading}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid #3344FC",
              background: "transparent", color: "#3344FC", cursor: "pointer",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading
              ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
              : <><Download size={14} /> Download ML Dataset</>
            }
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: "#3344FC", color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            Go to Dashboard <ArrowRight size={14} />
          </button>
        </div>
      </Shell>
    )
  }

  // ── Render: error ──────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <XCircle size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, maxWidth: 420, margin: "0 auto 24px" }}>
            {error}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => { setPhase("idle"); setError(null); setFile(null) }}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e7eb",
                background: "transparent", color: "#374151", cursor: "pointer", fontSize: 13,
              }}
            >
              Try another file
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none",
                background: "#3344FC", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}
            >
              Skip to Dashboard
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  return null
}

// ─── Layout helpers ────────────────────────────────────────────────────────────

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', -apple-system, sans-serif; background: #f9fafb; }
      `}</style>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "flex-start",
        justifyContent: "center", padding: "40px 24px",
        background: "#f9fafb",
        backgroundImage: "radial-gradient(ellipse at 20% 30%, rgba(51,68,252,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(16,185,129,0.04) 0%, transparent 60%)",
      }}>
        <div style={{
          width: "100%", maxWidth: wide ? 860 : 600,
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 20, padding: "36px 40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
        }}>
          {children}
        </div>
      </div>
    </>
  )
}

function LoadingState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        border: "3px solid #e5e7eb", borderTopColor: "#3344FC",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto 20px",
      }} />
      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "#9ca3af" }}>{subtitle}</p>
    </div>
  )
}

function CoverageChip({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"
  const bg    = pct >= 80 ? "#f0fdf4" : pct >= 50 ? "#fffbeb" : "#fef2f2"
  return (
    <div style={{
      padding: "4px 12px", borderRadius: 20, background: bg,
      fontSize: 12, fontWeight: 700, color, border: `1px solid ${color}30`,
      display: "flex", alignItems: "center", gap: 4,
    }}>
      <Sparkles size={11} /> ML coverage: {pct}%
    </div>
  )
}

// Keep formatBytes referenced to avoid lint error
void formatBytes
void targetLabel