"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Download, ArrowRight, SkipForward, Users, Package,
  ShoppingCart, Database, Sparkles, RefreshCw, Info,
  Check, ChevronRight, Search,
} from "lucide-react"
import type {
  ParseResponse,
  ConfirmedMapping,
  CleanResponse,
} from "@/lib/pipeline/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "idle"
  | "parsing"
  | "confirming"
  | "cleaning"
  | "storing"
  | "done"
  | "error"

interface ProgressState {
  stage:  string
  pct:    number
  detail: string
  counts: Record<string, number>
}

interface StoreStats {
  customers_inserted:   number
  customers_skipped:    number
  products_inserted:    number
  products_skipped:     number
  orders_inserted:      number
  order_items_inserted: number
}

// SSE wire shapes
interface SSEProgress {
  __final__?: false
  stage:  string
  pct:    number
  detail: string
  counts: Record<string, number>
}

interface SSEFinal {
  __final__: true
  summary:  CleanResponse["summary"]
  stats:    StoreStats
  warnings: string[]
  error?:   string
}

type SSEEvent = SSEProgress | SSEFinal

// ─── DB field catalogue — every mappable field with metadata ─────────────────

interface DBField {
  value:       string   // the target key sent to the pipeline
  label:       string   // plain English shown to user
  group:       string   // Customer | Product | Order | Notes
  description: string   // one-line explanation
  example:     string   // example value
  required:    boolean
}

const DB_FIELDS: DBField[] = [
  // ── Customer ──────────────────────────────────────────────────────────────
  { value:"customer_id",          group:"Customer", required:true,  label:"Customer ID",           description:"Unique identifier for each customer",          example:"CUST001, 17850" },
  { value:"customer.fullName",    group:"Customer", required:true,  label:"Customer name",         description:"Full name of the customer",                     example:"Ahmed Hassan, Mona Ali" },
  { value:"customer.email",       group:"Customer", required:false, label:"Email address",         description:"Customer's email address",                      example:"ahmed@mail.com" },
  { value:"customer.phoneNumber", group:"Customer", required:false, label:"Phone number",          description:"Customer's contact number",                     example:"+201069843681" },
  { value:"customer.segment",     group:"Customer", required:false, label:"Customer segment",      description:"Customer tier or category",                     example:"VIP, Regular, New" },
  // ── Product ───────────────────────────────────────────────────────────────
  { value:"product_id",           group:"Product",  required:true,  label:"Product SKU / code",    description:"Unique product identifier or stock code",       example:"85123A, SKU-001" },
  { value:"product.name",         group:"Product",  required:true,  label:"Product name",          description:"Name of the product",                           example:"White T-Shirt, Sneakers" },
  { value:"product.price",        group:"Product",  required:true,  label:"Selling price",         description:"Price per unit charged to the customer",        example:"2.55, 48.00" },
  { value:"product.cost",         group:"Product",  required:false, label:"Cost price",            description:"What you paid to stock this product",           example:"1.50, 30.00" },
  { value:"product.stock",        group:"Product",  required:false, label:"Stock / inventory",     description:"Number of units currently in stock",            example:"250, 0" },
  { value:"product.description",  group:"Product",  required:false, label:"Product description",   description:"Long description or notes about the product",   example:"100% cotton, machine washable" },
  // ── Order ─────────────────────────────────────────────────────────────────
  { value:"order_id",             group:"Order",    required:true,  label:"Order / invoice number",description:"Unique identifier for each order or invoice",   example:"ORD0001, 536365" },
  { value:"order_date",           group:"Order",    required:true,  label:"Order date",            description:"When the order was placed",                     example:"2026-01-15, 01/15/2026" },
  { value:"order_item.quantity",  group:"Order",    required:true,  label:"Quantity sold",         description:"Number of units in this order line",            example:"1, 6, 12" },
  { value:"order.status",         group:"Order",    required:false, label:"Order status",          description:"Current status of the order",                   example:"Shipped, Pending, Cancelled" },
  { value:"order.address",        group:"Order",    required:false, label:"Delivery address",      description:"Shipping or delivery address",                  example:"123 Main St, Cairo" },
  { value:"order.orderVoucher",   group:"Order",    required:false, label:"Voucher / coupon code", description:"Discount code applied to the order",            example:"SAVE10, PROMO2026" },
  { value:"revenue",              group:"Order",    required:false, label:"Total revenue / amount",description:"Total sale amount for this order or line item", example:"205.00, 440.00" },
  { value:"profit",               group:"Order",    required:false, label:"Profit",                description:"Profit on this order (revenue minus cost)",     example:"82.00" },
  // ── Notes ─────────────────────────────────────────────────────────────────
  { value:"__unmapped__",         group:"Notes",    required:false, label:"Store as notes",        description:"Ignore for analytics, keep as reference data",  example:"" },
]

const GROUPS = ["Customer", "Product", "Order", "Notes"]

const GROUP_META: Record<string, { color: string; icon: React.ReactNode; description: string }> = {
  Customer: { color:"#3344FC", icon:<Users size={15}/>,        description:"Who bought from you" },
  Product:  { color:"#10b981", icon:<Package size={15}/>,      description:"What was sold" },
  Order:    { color:"#f59e0b", icon:<ShoppingCart size={15}/>, description:"When and how much" },
  Notes:    { color:"#9ca3af", icon:<Database size={15}/>,     description:"Extra data kept as reference" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupColor(g: string) { return GROUP_META[g]?.color ?? "#9ca3af" }

function confBadge(score: number) {
  if (score >= 90) return { label:"Auto-matched",  bg:"#dcfce7", color:"#15803d" }
  if (score >= 70) return { label:"Good match",    bg:"#fef9c3", color:"#854d0e" }
  if (score >= 40) return { label:"Possible match",bg:"#fef2f2", color:"#b91c1c" }
  return               { label:"Not matched",      bg:"#f3f4f6", color:"#6b7280" }
}

function labelFor(target: string): string {
  return DB_FIELDS.find(f => f.value === target)?.label ?? target
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family: -apple-system, 'DM Sans', sans-serif; background:#f9fafb; }
      `}</style>
      <div style={{
        minHeight:"100vh", display:"flex", alignItems:"flex-start",
        justifyContent:"center", padding:"40px 20px", background:"#f9fafb",
      }}>
        <div style={{
          width:"100%", maxWidth: wide ? 980 : 640,
          background:"#fff", border:"1px solid #e5e7eb",
          borderRadius:20, padding:"36px 40px",
          boxShadow:"0 4px 24px rgba(0,0,0,0.06)",
        }}>
          {children}
        </div>
      </div>
    </>
  )
}

// ─── StepBar ──────────────────────────────────────────────────────────────────

function StepBar({ phase }: { phase: Phase }) {
  const steps: { key: Phase[]; label: string }[] = [
    { key:["parsing"],   label:"Detecting" },
    { key:["confirming"],label:"Mapping"   },
    { key:["cleaning"],  label:"Processing"},
    { key:["storing"],   label:"Saving"    },
    { key:["done"],      label:"Complete"  },
  ]
  const order: Phase[] = ["idle","parsing","confirming","cleaning","storing","done"]
  const cur = order.indexOf(phase)

  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:32 }}>
      {steps.map((s, i) => {
        const done   = cur > order.indexOf(s.key[0])
        const active = s.key.includes(phase)
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", flex: i < steps.length-1 ? 1 : undefined }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <div style={{
                width:28, height:28, borderRadius:"50%",
                background: done ? "#10b981" : active ? "#3344FC" : "#e5e7eb",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow: active ? "0 0 0 4px rgba(51,68,252,0.12)" : "none",
                transition:"all 0.3s",
              }}>
                {done ? <CheckCircle2 size={14} color="#fff"/>
                      : active ? <div style={{ width:10, height:10, borderRadius:"50%", background:"#fff" }}/>
                               : <span style={{ fontSize:10, color:"#9ca3af", fontWeight:600 }}>{i+1}</span>}
              </div>
              <span style={{
                fontSize:11, whiteSpace:"nowrap",
                color: done ? "#10b981" : active ? "#3344FC" : "#9ca3af",
                fontWeight: active ? 600 : 400,
              }}>{s.label}</span>
            </div>
            {i < steps.length-1 && (
              <div style={{
                height:2, flex:1, margin:"0 8px", marginBottom:18,
                background: done ? "#10b981" : "#e5e7eb", transition:"background 0.3s",
              }}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ color = "#3344FC" }: { color?: string }) {
  return (
    <div style={{
      width:52, height:52, borderRadius:"50%",
      border:"3px solid #e5e7eb", borderTopColor:color,
      animation:"spin 0.9s linear infinite", margin:"0 auto 20px",
    }}/>
  )
}

// ─── ColumnMappingRow — one file column mapped to a DB field ──────────────────

function ColumnMappingRow({
  col, target, score, matchMethod, samples, onChangeTarget, onToggleIgnore, ignored,
}: {
  col:            string
  target:         string
  score:          number
  matchMethod:    string
  samples:        string[]
  onChangeTarget: (val: string) => void
  onToggleIgnore: () => void
  ignored:        boolean
}) {
  const [open, setOpen] = useState(false)
  const isMapped   = target !== "__unmapped__"
  const isAttr     = target.startsWith("__attributes__")
  const badge      = confBadge(score)
  const field      = DB_FIELDS.find(f => f.value === target)
  const color      = isMapped ? groupColor(field?.group ?? "Notes") : "#9ca3af"

  const displayTarget = isAttr
    ? `Attribute: ${target.split(".")[1]}`
    : (field?.label ?? target)

  return (
    <div style={{
      border:`1px solid ${ignored ? "#e5e7eb" : isMapped ? `${color}40` : "#e5e7eb"}`,
      borderRadius:10, overflow:"hidden", marginBottom:8,
      opacity: ignored ? 0.5 : 1,
      background: ignored ? "#f9fafb" : "#fff",
      transition:"all 0.2s",
    }}>
      {/* Header row */}
      <div
        onClick={() => !ignored && setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 14px", cursor: ignored ? "default" : "pointer",
          background: isMapped && !ignored ? `${color}06` : "transparent",
        }}
      >
        {/* File column name */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:13, fontWeight:600, color:"#111" }}>{col}</span>
            {score > 0 && matchMethod !== "unmatched" && (
              <span style={{
                fontSize:10, padding:"2px 7px", borderRadius:20,
                background:badge.bg, color:badge.color, fontWeight:500,
              }}>
                {badge.label}
              </span>
            )}
          </div>
          {samples.length > 0 && (
            <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
              {samples.slice(0,3).map((s,i) => (
                <span key={i} style={{
                  fontSize:10, padding:"1px 6px", borderRadius:4,
                  background:"#f3f4f6", color:"#6b7280",
                }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight size={14} color="#d1d5db" style={{ flexShrink:0 }}/>

        {/* Mapped to */}
        <div style={{
          display:"flex", alignItems:"center", gap:6, flexShrink:0,
          padding:"4px 10px", borderRadius:8,
          background: isMapped && !ignored ? `${color}12` : "#f3f4f6",
          border:`1px solid ${isMapped && !ignored ? `${color}30` : "#e5e7eb"}`,
          minWidth:160,
        }}>
          {isMapped && !ignored && (
            <span style={{ color, flexShrink:0 }}>
              {GROUP_META[field?.group ?? ""]?.icon ?? <Database size={12}/>}
            </span>
          )}
          <span style={{
            fontSize:12, fontWeight: isMapped ? 600 : 400,
            color: isMapped && !ignored ? color : "#9ca3af",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>
            {ignored ? "Excluded" : displayTarget}
          </span>
          {!ignored && (open ? <ChevronUp size={12} color="#9ca3af"/> : <ChevronDown size={12} color="#9ca3af"/>)}
        </div>

        {/* Ignore toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggleIgnore() }}
          style={{
            fontSize:10, padding:"3px 8px", borderRadius:6, flexShrink:0,
            border:"1px solid #e5e7eb", background:"transparent",
            cursor:"pointer", color: ignored ? "#10b981" : "#9ca3af",
          }}
        >
          {ignored ? "Restore" : "Exclude"}
        </button>
      </div>

      {/* Expanded picker */}
      {open && !ignored && (
        <div style={{
          borderTop:"1px solid #f3f4f6",
          padding:"14px",
          background:"#fafafa",
        }}>
          <p style={{ fontSize:12, color:"#6b7280", marginBottom:12 }}>
            Choose what this column maps to in your store:
          </p>

          {GROUPS.map(group => {
            const fields = DB_FIELDS.filter(f => f.group === group)
            const gColor = groupColor(group)
            return (
              <div key={group} style={{ marginBottom:10 }}>
                <div style={{
                  display:"flex", alignItems:"center", gap:6, marginBottom:6,
                }}>
                  <span style={{ color:gColor }}>{GROUP_META[group]?.icon}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                    {group}
                  </span>
                  <span style={{ fontSize:10, color:"#9ca3af" }}>— {GROUP_META[group]?.description}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, paddingLeft:22 }}>
                  {fields.map(f => {
                    const selected = target === f.value
                    return (
                      <button
                        key={f.value}
                        onClick={() => { onChangeTarget(f.value); setOpen(false) }}
                        style={{
                          display:"flex", alignItems:"flex-start", gap:10, textAlign:"left",
                          padding:"8px 10px", borderRadius:8, border:"1px solid",
                          borderColor: selected ? gColor : "#e5e7eb",
                          background: selected ? `${gColor}10` : "#fff",
                          cursor:"pointer", transition:"all 0.15s",
                        }}
                      >
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12, fontWeight:600, color: selected ? gColor : "#374151" }}>
                              {f.label}
                            </span>
                            {f.required && (
                              <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:"#fef3c7", color:"#92400e" }}>
                                recommended
                              </span>
                            )}
                            {selected && <Check size={12} color={gColor}/>}
                          </div>
                          <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>
                            {f.description}
                            {f.example && <span style={{ color:"#d1d5db" }}> — e.g. {f.example}</span>}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Progress screen ──────────────────────────────────────────────────────────

function ProgressScreen({ progress }: { progress: ProgressState }) {
  const LABELS: Record<string, string> = {
    loading:"Reading your file", mapping:"Applying column mapping",
    filtering:"Filtering invalid rows", products:"Finding unique products",
    customers:"Finding unique customers", orders:"Grouping orders",
    items:"Processing order lines", deriving:"Calculating profit & revenue", done:"Finishing up",
  }
  const COLORS: Record<string, string> = {
    customers:"#3344FC", products:"#10b981", orders:"#f59e0b", order_items:"#8b5cf6",
  }
  return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <Spinner/>
      <h3 style={{ fontSize:17, fontWeight:600, color:"#111", marginBottom:6 }}>
        {LABELS[progress.stage] ?? "Processing…"}
      </h3>
      <p style={{ fontSize:13, color:"#9ca3af", marginBottom:24 }}>{progress.detail}</p>
      <div style={{ height:6, background:"#f3f4f6", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
        <div style={{
          height:"100%", width:`${progress.pct}%`,
          background:"linear-gradient(90deg,#3344FC,#8b5cf6)",
          borderRadius:3, transition:"width 0.5s ease",
        }}/>
      </div>
      <p style={{ fontSize:12, color:"#9ca3af" }}>{progress.pct}%</p>
      {Object.keys(progress.counts).length > 0 && (
        <div style={{
          display:"flex", justifyContent:"center", gap:24, marginTop:24,
          padding:"12px 20px", background:"#f9fafb", borderRadius:12,
        }}>
          {Object.entries(progress.counts).map(([key, val]) => (
            <div key={key} style={{ textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:700, color:COLORS[key] ?? "#374151" }}>
                {val.toLocaleString()}
              </div>
              <div style={{ fontSize:11, color:"#9ca3af" }}>{key.replace("_"," ")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon:Icon, label, value, color }: {
  icon:React.ElementType; label:string; value:number|string; color:string
}) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
      padding:"14px 18px", display:"flex", alignItems:"center", gap:12,
    }}>
      <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={17} color={color}/>
      </div>
      <div>
        <div style={{ fontSize:22, fontWeight:700, color:"#111", lineHeight:1 }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{label}</div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function OnboardingSyncPage() {
  const router = useRouter()

  const [phase,        setPhase]        = useState<Phase>("idle")
  const [error,        setError]        = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{ file_id:string; filename:string } | null>(null)
  const [parseResult,  setParseResult]  = useState<ParseResponse | null>(null)
  const [cleanResult,  setCleanResult]  = useState<CleanResponse | null>(null)
  const [storeStats,   setStoreStats]   = useState<StoreStats | null>(null)
  const [progress,     setProgress]     = useState<ProgressState>({ stage:"loading", pct:0, detail:"", counts:{} })
  const [downloading,  setDownloading]  = useState(false)

  // Mapping state
  const [confirmedMap, setConfirmedMap] = useState<Record<string, string>>({})
  const [ignoredCols,  setIgnoredCols]  = useState<Set<string>>(new Set())
  const [costPct,      setCostPct]      = useState<string>("")
  const [search,       setSearch]       = useState<string>("")

  // Result toggles
  const [showWarnings, setShowWarnings] = useState(false)
  const [showFailed,   setShowFailed]   = useState(false)

  // ── Parse ──────────────────────────────────────────────────────────────────
  const runParse = useCallback(async (fileId: string) => {
    setPhase("parsing")
    try {
      const res  = await fetch("/api/onboarding/parse", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ file_id: fileId }),
      })
      const data = await res.json() as ParseResponse
      if (!res.ok) throw new Error((data as unknown as { error?:string }).error ?? "Could not read your file")

      setParseResult(data)

      // Build initial confirmed map
      const initial: Record<string, string> = {}
      for (const col of Object.keys(data.detected_mapping)) {
        const t = data.detected_mapping[col]
        initial[col] = t.startsWith("__attributes__") ? "__unmapped__" : t
      }
      for (const col of data.unmapped_columns) {
        initial[col] = "__unmapped__"
      }
      setConfirmedMap(initial)
      setPhase("confirming")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setPhase("error")
    }
  }, [])

  // ── Restore file_id from sessionStorage ───────────────────────────────────
  useEffect(() => {
    const fileId   = sessionStorage.getItem("fuse_import_file_id")
    const filename = sessionStorage.getItem("fuse_import_filename")
    if (!fileId) return
    sessionStorage.removeItem("fuse_import_file_id")
    sessionStorage.removeItem("fuse_import_filename")
    setUploadResult({ file_id:fileId, filename:filename ?? "upload" })
    setPhase("parsing")
    runParse(fileId)
  }, [runParse])

  // ── Build ConfirmedMapping ─────────────────────────────────────────────────
  function buildMapping(): ConfirmedMapping {
    const fullConfirmed = { ...confirmedMap }
    if (parseResult) {
      for (const [col, attrKey] of Object.entries(parseResult.attribute_columns)) {
        if (!ignoredCols.has(col)) fullConfirmed[col] = `__attributes__.${attrKey}`
      }
    }
    const allDecisions: Record<string, "placeholder"|"skip_feature"> = {}
    if (parseResult) {
      for (const field of parseResult.truly_missing) allDecisions[field] = "skip_feature"
    }
    return {
      header_row_index:        parseResult?.header_row_index ?? 0,
      confirmed:               fullConfirmed,
      attribute_columns:       parseResult?.attribute_columns ?? {},
      ignored_columns:         Array.from(ignoredCols),
      cost_pct:                costPct ? parseFloat(costPct) / 100 : null,
      missing_field_decisions: allDecisions,
    }
  }

  // ── Clean via SSE ──────────────────────────────────────────────────────────
  const runClean = useCallback(async () => {
    if (!uploadResult) return
    setPhase("cleaning")
    setError(null)
    setProgress({ stage:"loading", pct:2, detail:"Starting…", counts:{} })

    const mapping = buildMapping()

    try {
      const res = await fetch("/api/onboarding/clean", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ file_id:uploadResult.file_id, mapping }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error:"Processing failed" })) as { error?:string }
        throw new Error(err.error ?? "Processing failed")
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream:true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const json = line.slice(6).trim()
          if (!json) continue
          try {
            const ev = JSON.parse(json) as SSEEvent
            if (ev.__final__) {
              const final = ev as SSEFinal
              if (final.error) throw new Error(final.error)
              setStoreStats(final.stats)
              setPhase("done")
            } else {
              const pg = ev as SSEProgress
              setProgress({ stage:pg.stage, pct:pg.pct, detail:pg.detail, counts:pg.counts ?? {} })
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed")
      setPhase("error")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadResult, confirmedMap, ignoredCols, costPct, parseResult])

  // ── Download ───────────────────────────────────────────────────────────────
  async function downloadML() {
    if (!cleanResult) return
    setDownloading(true)
    try {
      const res = await fetch("/api/onboarding/ml-export", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify(cleanResult),
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url; a.download = `fuse-dataset-${Date.now()}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { setError(e instanceof Error ? e.message : "Download failed") }
    finally { setDownloading(false) }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDERS
  // ══════════════════════════════════════════════════════════════════════════

  if (phase === "idle" || phase === "parsing") {
    return (
      <Shell>
        <StepBar phase={phase}/>
        <div style={{ textAlign:"center", padding:"52px 0" }}>
          <Spinner/>
          <h3 style={{ fontSize:17, fontWeight:600, color:"#111", marginBottom:6 }}>Reading your file…</h3>
          {uploadResult?.filename && <p style={{ fontSize:13, color:"#9ca3af" }}>Analysing {uploadResult.filename}</p>}
        </div>
      </Shell>
    )
  }

  // ── CONFIRMING — the main mapping UI ──────────────────────────────────────
  if (phase === "confirming" && parseResult) {
    const allCols = [
      ...Object.keys(parseResult.detected_mapping),
      ...parseResult.unmapped_columns,
    ]

    // Stats
    const mappedCount   = Object.values(confirmedMap).filter(v => v !== "__unmapped__").length
    const unmappedCount = allCols.length - mappedCount
    const requiredMissing = DB_FIELDS
      .filter(f => f.required && !Object.values(confirmedMap).includes(f.value))
      .map(f => f.label)

    // Filter by search
    const filtered = search
      ? allCols.filter(col => {
          const target = confirmedMap[col] ?? "__unmapped__"
          return (
            col.toLowerCase().includes(search.toLowerCase()) ||
            labelFor(target).toLowerCase().includes(search.toLowerCase())
          )
        })
      : allCols

    // Group filtered cols by their mapped group
    const byGroup: Record<string, string[]> = {}
    for (const col of filtered) {
      const target = confirmedMap[col] ?? "__unmapped__"
      const field  = DB_FIELDS.find(f => f.value === target)
      const g      = target === "__unmapped__" ? "Notes" : (field?.group ?? "Notes")
      if (!byGroup[g]) byGroup[g] = []
      byGroup[g].push(col)
    }

    return (
      <Shell wide>
        <StepBar phase={phase}/>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#111", marginBottom:4 }}>
            Map your columns to your store
          </h2>
          <p style={{ fontSize:14, color:"#6b7280" }}>
            We found <strong>{parseResult.total_columns}</strong> columns
            in <strong>{uploadResult?.filename}</strong> with{" "}
            <strong>{parseResult.total_rows.toLocaleString()}</strong> rows.
            Click any row to change where it maps.
          </p>
        </div>

        {/* Coverage summary */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16,
        }}>
          <div style={{
            padding:"12px 14px", borderRadius:10, background:"#f0f7ff",
            border:"1px solid #bfdbfe",
          }}>
            <div style={{ fontSize:22, fontWeight:700, color:"#3344FC" }}>{mappedCount}</div>
            <div style={{ fontSize:12, color:"#6b7280" }}>columns mapped</div>
          </div>
          <div style={{
            padding:"12px 14px", borderRadius:10,
            background: unmappedCount > 0 ? "#fffbeb" : "#f0fdf4",
            border:`1px solid ${unmappedCount > 0 ? "#fde68a" : "#bbf7d0"}`,
          }}>
            <div style={{ fontSize:22, fontWeight:700, color: unmappedCount > 0 ? "#f59e0b" : "#10b981" }}>
              {unmappedCount}
            </div>
            <div style={{ fontSize:12, color:"#6b7280" }}>stored as notes</div>
          </div>
          <div style={{
            padding:"12px 14px", borderRadius:10,
            background: requiredMissing.length > 0 ? "#fef2f2" : "#f0fdf4",
            border:`1px solid ${requiredMissing.length > 0 ? "#fecaca" : "#bbf7d0"}`,
          }}>
            <div style={{ fontSize:22, fontWeight:700, color: requiredMissing.length > 0 ? "#ef4444" : "#10b981" }}>
              {requiredMissing.length > 0 ? requiredMissing.length : "✓"}
            </div>
            <div style={{ fontSize:12, color:"#6b7280" }}>
              {requiredMissing.length > 0 ? "recommended fields missing" : "all key fields mapped"}
            </div>
          </div>
        </div>

        {/* Missing recommended fields alert */}
        {requiredMissing.length > 0 && (
          <div style={{
            background:"#fff7ed", border:"1px solid #fed7aa",
            borderRadius:10, padding:"10px 14px", marginBottom:14,
            display:"flex", alignItems:"flex-start", gap:8,
          }}>
            <Info size={14} color="#f59e0b" style={{ marginTop:1, flexShrink:0 }}/>
            <div>
              <p style={{ fontSize:12, fontWeight:600, color:"#92400e", marginBottom:2 }}>
                Recommended fields not yet mapped:
              </p>
              <p style={{ fontSize:12, color:"#78350f" }}>
                {requiredMissing.join(", ")}
              </p>
              <p style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>
                These fields power your analytics. Map them for best results.
              </p>
            </div>
          </div>
        )}

        {/* Cost % banner */}
        {parseResult.truly_missing.includes("cost") && (
          <div style={{
            background:"#fffbeb", border:"1px solid #fde68a",
            borderRadius:10, padding:"12px 14px", marginBottom:14,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <Info size={13} color="#f59e0b"/>
              <span style={{ fontSize:12, fontWeight:600, color:"#92400e" }}>No cost column found</span>
            </div>
            <p style={{ fontSize:12, color:"#78350f", marginBottom:8 }}>
              Enter your average cost as a % of selling price to calculate profit automatically.
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input
                type="number" min={0} max={100} value={costPct}
                onChange={e => setCostPct(e.target.value)}
                placeholder="e.g. 60"
                style={{
                  width:80, padding:"5px 10px", fontSize:12,
                  border:"1px solid #fde68a", borderRadius:6, outline:"none", background:"#fff",
                }}
              />
              <span style={{ fontSize:12, color:"#92400e" }}>% of price is cost</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ position:"relative", marginBottom:14 }}>
          <Search size={13} color="#9ca3af" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search columns…"
            style={{
              width:"100%", padding:"8px 10px 8px 30px", fontSize:13,
              border:"1px solid #e5e7eb", borderRadius:8, outline:"none", background:"#fff",
              color:"#111",
            }}
          />
        </div>

        {/* DB field legend */}
        <div style={{
          background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:10,
          padding:"10px 14px", marginBottom:16,
        }}>
          <p style={{ fontSize:11, fontWeight:600, color:"#6b7280", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.5px" }}>
            Available fields in your store
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {DB_FIELDS.filter(f => f.value !== "__unmapped__").map(f => (
              <span key={f.value} style={{
                fontSize:11, padding:"2px 8px", borderRadius:20,
                background:`${groupColor(f.group)}12`,
                color:groupColor(f.group),
                border:`1px solid ${groupColor(f.group)}30`,
                fontWeight: f.required ? 600 : 400,
              }}>
                {f.label}{f.required ? " *" : ""}
              </span>
            ))}
          </div>
          <p style={{ fontSize:10, color:"#9ca3af", marginTop:6 }}>
            * recommended fields — map these for the best analytics experience
          </p>
        </div>

        {/* Column rows — grouped */}
        <div style={{ maxHeight:520, overflowY:"auto", paddingRight:2 }}>
          {GROUPS.map(group => {
            const cols = byGroup[group]
            if (!cols?.length) return null
            const color = groupColor(group)
            return (
              <div key={group} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ color }}>{GROUP_META[group]?.icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                    {group} — {GROUP_META[group]?.description}
                  </span>
                  <span style={{
                    fontSize:10, padding:"1px 6px", borderRadius:20,
                    background:`${color}12`, color,
                  }}>
                    {cols.length}
                  </span>
                </div>
                {cols.map(col => (
                  <ColumnMappingRow
                    key={col}
                    col={col}
                    target={confirmedMap[col] ?? "__unmapped__"}
                    score={parseResult.confidence_scores[col] ?? 0}
                    matchMethod={parseResult.match_methods[col] ?? "unmatched"}
                    samples={parseResult.sample_values[col] ?? []}
                    ignored={ignoredCols.has(col)}
                    onChangeTarget={val => setConfirmedMap(m => ({ ...m, [col]: val }))}
                    onToggleIgnore={() => setIgnoredCols(s => {
                      const n = new Set(s)
                      n.has(col) ? n.delete(col) : n.add(col)
                      return n
                    })}
                  />
                ))}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20, paddingTop:16, borderTop:"1px solid #f3f4f6" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding:"10px 18px", borderRadius:8, border:"1px solid #e5e7eb",
              background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:13,
              display:"flex", alignItems:"center", gap:6,
            }}
          >
            <SkipForward size={14}/> Skip for now
          </button>
          <button
            onClick={runClean}
            style={{
              padding:"10px 28px", borderRadius:8, border:"none",
              background:"#3344FC", color:"#fff", cursor:"pointer",
              fontSize:13, fontWeight:600,
              display:"flex", alignItems:"center", gap:6,
            }}
          >
            Import data <ArrowRight size={14}/>
          </button>
        </div>
      </Shell>
    )
  }

  if (phase === "cleaning") {
    return <Shell><StepBar phase={phase}/><ProgressScreen progress={progress}/></Shell>
  }

  if (phase === "storing") {
    return (
      <Shell>
        <StepBar phase={phase}/>
        <div style={{ textAlign:"center", padding:"52px 0" }}>
          <Spinner color="#10b981"/>
          <h3 style={{ fontSize:17, fontWeight:600, color:"#111", marginBottom:6 }}>Saving to your store…</h3>
          <p style={{ fontSize:13, color:"#9ca3af" }}>Adding customers, products, orders and transaction records</p>
        </div>
      </Shell>
    )
  }

  if (phase === "done" && cleanResult) {
    const { summary, entities, warnings, failed_rows } = cleanResult
    return (
      <Shell wide>
        <StepBar phase={phase}/>
        <div style={{ textAlign:"center", padding:"20px 0 24px", borderBottom:"1px solid #f3f4f6", marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#111", marginBottom:8 }}>Your data is in</h2>
          <p style={{ fontSize:14, color:"#6b7280" }}>
            {summary.clean_rows.toLocaleString()} records imported successfully.
            {summary.cancelled_rows > 0 && (
              <span style={{ color:"#9ca3af" }}> {summary.cancelled_rows.toLocaleString()} cancelled orders were skipped.</span>
            )}
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:20 }}>
          <StatCard icon={Users}        label="Customers imported"  value={entities.customers.length}   color="#3344FC"/>
          <StatCard icon={Package}      label="Products imported"   value={entities.products.length}    color="#10b981"/>
          <StatCard icon={ShoppingCart} label="Orders imported"     value={entities.orders.length}      color="#f59e0b"/>
          <StatCard icon={Database}     label="Transaction records" value={entities.order_items.length} color="#8b5cf6"/>
        </div>

        {storeStats && (
          <div style={{
            background:"#f0fdf4", border:"1px solid #bbf7d0",
            borderRadius:10, padding:"12px 16px", marginBottom:16,
            fontSize:13, color:"#15803d",
          }}>
            <p style={{ fontWeight:600, marginBottom:6 }}>Added to your store:</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 24px" }}>
              <span>✓ {storeStats.customers_inserted.toLocaleString()} new customers</span>
              <span>✓ {storeStats.products_inserted.toLocaleString()} new products</span>
              <span>✓ {storeStats.orders_inserted.toLocaleString()} orders</span>
              <span>✓ {storeStats.order_items_inserted.toLocaleString()} transaction records</span>
              {storeStats.customers_skipped > 0 && <span style={{ color:"#6b7280" }}>{storeStats.customers_skipped.toLocaleString()} customers already existed</span>}
              {storeStats.products_skipped  > 0 && <span style={{ color:"#6b7280" }}>{storeStats.products_skipped.toLocaleString()} products already existed</span>}
            </div>
          </div>
        )}

        {summary.derived_fields.length > 0 && (
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            <Sparkles size={13} color="#3b82f6"/>
            <span style={{ fontSize:12, color:"#1d4ed8" }}>
              <strong>Automatically calculated:</strong> {summary.derived_fields.join(", ")}
            </span>
          </div>
        )}

        {warnings.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <button onClick={() => setShowWarnings(s => !s)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#f59e0b", padding:0, marginBottom:6 }}>
              <AlertTriangle size={12}/>
              {warnings.length} note{warnings.length > 1 ? "s" : ""} about your data
              {showWarnings ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            {showWarnings && (
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px" }}>
                {warnings.map((w, i) => <p key={i} style={{ fontSize:12, color:"#78350f", margin:"2px 0" }}>• {w}</p>)}
              </div>
            )}
          </div>
        )}

        {failed_rows.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <button onClick={() => setShowFailed(s => !s)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#ef4444", padding:0, marginBottom:6 }}>
              <XCircle size={12}/>
              {failed_rows.length.toLocaleString()} rows couldn't be imported
              {showFailed ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            {showFailed && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", maxHeight:180, overflowY:"auto" }}>
                {failed_rows.slice(0,20).map((r,i) => (
                  <div key={i} style={{ fontSize:11, color:"#b91c1c", marginBottom:3 }}>Row {r.row_index}: {r.reason}</div>
                ))}
                {failed_rows.length > 20 && <div style={{ fontSize:11, color:"#9ca3af", marginTop:6 }}>…and {(failed_rows.length-20).toLocaleString()} more</div>}
              </div>
            )}
          </div>
        )}

        <div style={{ display:"flex", gap:12, justifyContent:"flex-end", paddingTop:8 }}>
          <button
            onClick={downloadML} disabled={downloading}
            style={{
              padding:"10px 20px", borderRadius:8, border:"1px solid #3344FC",
              background:"transparent", color:"#3344FC", cursor:"pointer",
              fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6,
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading
              ? <><RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/> Preparing…</>
              : <><Download size={13}/> Download dataset</>
            }
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding:"10px 28px", borderRadius:8, border:"none",
              background:"#3344FC", color:"#fff", cursor:"pointer",
              fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6,
            }}
          >
            Go to dashboard <ArrowRight size={14}/>
          </button>
        </div>
      </Shell>
    )
  }

  if (phase === "error") {
    return (
      <Shell>
        <div style={{ textAlign:"center", padding:"40px 0" }}>
          <XCircle size={44} color="#ef4444" style={{ margin:"0 auto 16px" }}/>
          <h2 style={{ fontSize:18, fontWeight:700, color:"#111", marginBottom:8 }}>Something went wrong</h2>
          <p style={{ fontSize:13, color:"#6b7280", maxWidth:380, margin:"0 auto 24px" }}>{error}</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button
              onClick={() => { setPhase("idle"); setError(null); setUploadResult(null) }}
              style={{ padding:"10px 20px", borderRadius:8, border:"1px solid #e5e7eb", background:"transparent", color:"#374151", cursor:"pointer", fontSize:13 }}
            >
              Try again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ padding:"10px 20px", borderRadius:8, border:"none", background:"#3344FC", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}
            >
              Skip to dashboard
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  return null
}