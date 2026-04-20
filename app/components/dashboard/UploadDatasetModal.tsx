"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  X, Upload, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, ArrowRight, Users, Package,
  ShoppingCart, Database, Sparkles, FileSpreadsheet,
  Check, Search,
} from "lucide-react"
import type { ParseResponse, ConfirmedMapping, CleanResponse } from "@/lib/pipeline/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "idle"|"uploading"|"parsing"|"confirming"|"cleaning"|"storing"|"done"|"error"

interface ProgressState { stage:string; pct:number; detail:string; counts:Record<string,number> }
interface StoreStats {
  customers_inserted:number; customers_skipped:number
  products_inserted:number;  products_skipped:number
  orders_inserted:number;    order_items_inserted:number
}
interface SSEProgress { __final__?:false; stage:string; pct:number; detail:string; counts:Record<string,number> }
interface SSEFinal    { __final__:true; summary:CleanResponse["summary"]; entities:CleanResponse["entities"]; failed_rows:CleanResponse["failed_rows"]; warnings:CleanResponse["warnings"]; action_required:CleanResponse["action_required"] }
type SSEEvent = SSEProgress | SSEFinal

// ─── DB field catalogue ───────────────────────────────────────────────────────

interface DBField { value:string; label:string; group:string; description:string; example:string; required:boolean }

const DB_FIELDS: DBField[] = [
  { value:"customer_id",          group:"Customer", required:true,  label:"Customer ID",            description:"Unique identifier for each customer",          example:"CUST001, 17850" },
  { value:"customer.fullName",    group:"Customer", required:true,  label:"Customer name",          description:"Full name of the customer",                     example:"Ahmed Hassan" },
  { value:"customer.email",       group:"Customer", required:false, label:"Email address",          description:"Customer's email address",                      example:"ahmed@mail.com" },
  { value:"customer.phoneNumber", group:"Customer", required:false, label:"Phone number",           description:"Customer's contact number",                     example:"+201069843681" },
  { value:"customer.segment",     group:"Customer", required:false, label:"Customer segment",       description:"Customer tier or category",                     example:"VIP, Regular" },
  { value:"product_id",           group:"Product",  required:true,  label:"Product SKU / code",     description:"Unique product identifier or stock code",       example:"85123A, SKU-001" },
  { value:"product.name",         group:"Product",  required:true,  label:"Product name",           description:"Name of the product",                           example:"White T-Shirt" },
  { value:"product.price",        group:"Product",  required:true,  label:"Selling price",          description:"Price per unit charged to the customer",        example:"2.55, 48.00" },
  { value:"product.cost",         group:"Product",  required:false, label:"Cost price",             description:"What you paid to stock this product",           example:"1.50, 30.00" },
  { value:"product.stock",        group:"Product",  required:false, label:"Stock / inventory",      description:"Number of units currently in stock",            example:"250" },
  { value:"product.description",  group:"Product",  required:false, label:"Product description",    description:"Long description or notes about the product",   example:"100% cotton" },
  { value:"order_id",             group:"Order",    required:true,  label:"Order / invoice number", description:"Unique identifier for each order",              example:"ORD0001, 536365" },
  { value:"order_date",           group:"Order",    required:true,  label:"Order date",             description:"When the order was placed",                     example:"2026-01-15" },
  { value:"order_item.quantity",  group:"Order",    required:true,  label:"Quantity sold",          description:"Number of units in this order line",            example:"1, 6" },
  { value:"order.status",         group:"Order",    required:false, label:"Order status",           description:"Current status of the order",                   example:"Shipped, Pending" },
  { value:"order.address",        group:"Order",    required:false, label:"Delivery address",       description:"Shipping address",                              example:"123 Main St" },
  { value:"revenue",              group:"Order",    required:false, label:"Total revenue / amount", description:"Total sale amount for this order line",         example:"205.00" },
  { value:"profit",               group:"Order",    required:false, label:"Profit",                 description:"Profit on this order",                          example:"82.00" },
  { value:"__unmapped__",         group:"Notes",    required:false, label:"Store as notes",         description:"Keep as reference data, not used for analytics",example:"" },
]

const GROUP_COLORS: Record<string,string> = {
  Customer:"#3344FC", Product:"#10b981", Order:"#f59e0b", Notes:"#9ca3af",
}

function labelFor(target:string) { return DB_FIELDS.find(f=>f.value===target)?.label ?? target }

// ─── StepBar ──────────────────────────────────────────────────────────────────

function StepBar({ phase }: { phase:Phase }) {
  const steps: { key:Phase[]; label:string }[] = [
    { key:["uploading"],  label:"Upload"   },
    { key:["parsing"],    label:"Detect"   },
    { key:["confirming"], label:"Map"      },
    { key:["cleaning"],   label:"Process"  },
    { key:["storing"],    label:"Save"     },
    { key:["done"],       label:"Done"     },
  ]
  const order: Phase[] = ["idle","uploading","parsing","confirming","cleaning","storing","done"]
  const cur = order.indexOf(phase)

  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
      {steps.map((s,i) => {
        const done   = cur > order.indexOf(s.key[0])
        const active = s.key.includes(phase)
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", flex: i<steps.length-1 ? 1 : undefined }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{
                width:24, height:24, borderRadius:"50%",
                background: done ? "#10b981" : active ? "#3344FC" : "#e5e7eb",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow: active ? "0 0 0 3px rgba(51,68,252,0.15)" : "none",
                transition:"all 0.3s",
              }}>
                {done   ? <Check size={12} color="#fff"/>
                : active ? <div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>
                         : <span style={{fontSize:9,color:"#9ca3af",fontWeight:700}}>{i+1}</span>}
              </div>
              <span style={{
                fontSize:10, whiteSpace:"nowrap",
                color: done ? "#10b981" : active ? "#3344FC" : "#9ca3af",
                fontWeight: active||done ? 600 : 400,
              }}>{s.label}</span>
            </div>
            {i < steps.length-1 && (
              <div style={{ height:2, flex:1, margin:"0 6px", marginBottom:16,
                background: done ? "#10b981" : "#e5e7eb", transition:"background 0.3s" }}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size=28 }: { size?:number }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      border:"3px solid #e5e7eb", borderTopColor:"#3344FC",
      animation:"modal-spin 0.8s linear infinite",
      flexShrink:0,
    }}/>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function UploadDatasetModal({ open, onClose }: { open:boolean; onClose:()=>void }) {

  const [phase,        setPhase]        = useState<Phase>("idle")
  const [error,        setError]        = useState<string|null>(null)
  const [uploadPct,    setUploadPct]    = useState(0)
  const [uploadResult, setUploadResult] = useState<{file_id:string;filename:string;size_mb:number}|null>(null)
  const [parseResult,  setParseResult]  = useState<ParseResponse|null>(null)
  const [cleanResult,  setCleanResult]  = useState<CleanResponse|null>(null)
  const [storeStats,   setStoreStats]   = useState<StoreStats|null>(null)
  const [progress,     setProgress]     = useState<ProgressState>({stage:"",pct:0,detail:"",counts:{}})
  const [confirmedMap, setConfirmedMap] = useState<Record<string,string>>({})
  const [ignoredCols,  setIgnoredCols]  = useState<Set<string>>(new Set())
  const [costPct,      setCostPct]      = useState("")
  const [search,       setSearch]       = useState("")
  const [showWarnings, setShowWarnings] = useState(false)
  const [showFailed,   setShowFailed]   = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setPhase("idle"); setError(null); setUploadPct(0)
      setUploadResult(null); setParseResult(null)
      setCleanResult(null); setStoreStats(null)
      setConfirmedMap({}); setIgnoredCols(new Set())
      setCostPct(""); setSearch("")
      setShowWarnings(false); setShowFailed(false)
    }
  }, [open])

  // ── Upload ────────────────────────────────────────────────────────────────

  const runUpload = useCallback(async (file: File) => {
    setPhase("uploading"); setError(null); setUploadPct(0)
    const tick = setInterval(() => setUploadPct(p => Math.min(p+7, 85)), 200)
    try {
      const fd = new FormData(); fd.append("file", file)
      const res  = await fetch("/api/onboarding/upload", { method:"POST", body:fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setUploadPct(100)
      setUploadResult(data)
      await runParse(data.file_id)
    } catch(e) {
      setError(e instanceof Error ? e.message : "Upload failed")
      setPhase("error")
    } finally { clearInterval(tick) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Parse ─────────────────────────────────────────────────────────────────

  const runParse = useCallback(async (fileId:string) => {
    setPhase("parsing")
    try {
      const res  = await fetch("/api/onboarding/parse", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ file_id:fileId }),
      })
      const data = await res.json() as ParseResponse
      if (!res.ok) throw new Error((data as {error?:string}).error ?? "Could not read file")
      setParseResult(data)
      const initial: Record<string,string> = {}
      for (const col of Object.keys(data.detected_mapping)) {
        const t = data.detected_mapping[col]
        initial[col] = t.startsWith("__attributes__") ? "__unmapped__" : t
      }
      for (const col of data.unmapped_columns) initial[col] = "__unmapped__"
      setConfirmedMap(initial)
      setPhase("confirming")
    } catch(e) {
      setError(e instanceof Error ? e.message : "Failed to read file")
      setPhase("error")
    }
  }, [])

  // ── Build mapping ─────────────────────────────────────────────────────────

  function buildMapping(): ConfirmedMapping {
    const full = { ...confirmedMap }
    if (parseResult) {
      for (const [col, attrKey] of Object.entries(parseResult.attribute_columns)) {
        if (!ignoredCols.has(col)) full[col] = `__attributes__.${attrKey}`
      }
    }
    const decisions: Record<string,"placeholder"|"skip_feature"> = {}
    if (parseResult) for (const f of parseResult.truly_missing) decisions[f] = "skip_feature"
    return {
      header_row_index:        parseResult?.header_row_index ?? 0,
      confirmed:               full,
      attribute_columns:       parseResult?.attribute_columns ?? {},
      ignored_columns:         Array.from(ignoredCols),
      cost_pct:                costPct ? parseFloat(costPct)/100 : null,
      missing_field_decisions: decisions,
    }
  }

  // ── Clean via SSE ─────────────────────────────────────────────────────────

  const runClean = useCallback(async () => {
    if (!uploadResult) return
    setPhase("cleaning"); setError(null)
    setProgress({stage:"loading",pct:2,detail:"Starting…",counts:{}})
    try {
      const res = await fetch("/api/onboarding/clean", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ file_id:uploadResult.file_id, mapping:buildMapping() }),
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(()=>({error:"Processing failed"})) as {error?:string}
        throw new Error(err.error ?? "Processing failed")
      }
      const reader = res.body.getReader()
      const dec    = new TextDecoder()
      let   buf    = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream:true })
        const lines = buf.split("\n\n"); buf = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const json = line.slice(6).trim(); if (!json) continue
          try {
            const ev = JSON.parse(json) as SSEEvent
            if (ev.__final__) {
              const { __final__:_, ...clean } = ev as SSEFinal; void _
              const result = clean as CleanResponse
              setCleanResult(result)
              await runStore(result)
            } else {
              const pg = ev as SSEProgress
              setProgress({stage:pg.stage,pct:pg.pct,detail:pg.detail,counts:pg.counts??{}})
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch(e) {
      setError(e instanceof Error ? e.message : "Processing failed")
      setPhase("error")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadResult, confirmedMap, ignoredCols, costPct, parseResult])

  // ── Store ─────────────────────────────────────────────────────────────────

  async function runStore(data: CleanResponse) {
    setPhase("storing")
    try {
      const res = await fetch("/api/onboarding/store", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify(data.entities),
      })
      if (!res.ok) throw new Error("Failed to save data")
      const json = await res.json() as { stats:StoreStats }
      setStoreStats(json.stats)
      setPhase("done")
    } catch(e) {
      setError(e instanceof Error ? e.message : "Save failed")
      setPhase("error")
    }
  }

  if (!open) return null

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes modal-spin { to { transform:rotate(360deg); } }
        .fuse-modal-scroll { overflow-y:auto; }
        .fuse-modal-scroll::-webkit-scrollbar { width:4px; }
        .fuse-modal-scroll::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
        .fuse-col-row:hover { background:#f9fafb !important; }
        .fuse-dropdown option { padding:4px; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
          zIndex:9998, backdropFilter:"blur(2px)",
        }}
      />

      {/* Panel */}
      <div style={{
        position:"fixed",
        top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        width:"min(96vw, 780px)",
        maxHeight:"90vh",
        background:"#fff",
        borderRadius:20,
        boxShadow:"0 24px 80px rgba(0,0,0,0.18)",
        zIndex:9999,
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 28px 16px",
          borderBottom: phase === "idle" ? "none" : "1px solid #f3f4f6",
          flexShrink:0,
        }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:"#111", margin:0 }}>Upload dataset</h2>
            {uploadResult && phase !== "idle" && (
              <p style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>
                {uploadResult.filename} · {uploadResult.size_mb} MB
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width:32, height:32, borderRadius:"50%", border:"none",
              background:"#f3f4f6", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            <X size={15} color="#6b7280"/>
          </button>
        </div>

        {/* Step bar (shown after idle) */}
        {phase !== "idle" && (
          <div style={{ padding:"16px 28px 0", flexShrink:0 }}>
            <StepBar phase={phase}/>
          </div>
        )}

        {/* Body */}
        <div className="fuse-modal-scroll" style={{ flex:1, padding:"20px 28px 28px", overflowY:"auto" }}>

          {/* ── IDLE: drop zone ─────────────────────────────────────────── */}
          {phase === "idle" && (
            <div>
              <p style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>
                Upload an Excel or CSV file to add data to this store. We'll detect your columns, let you confirm the mapping, then import everything automatically.
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor="#3344FC" }}
                onDragLeave={e => { e.currentTarget.style.borderColor="#e5e7eb" }}
                onDrop={e => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor="#e5e7eb"
                  const f = e.dataTransfer.files[0]
                  if (f) runUpload(f)
                }}
                style={{
                  border:"2px dashed #e5e7eb", borderRadius:14,
                  padding:"48px 24px", textAlign:"center", cursor:"pointer",
                  transition:"border-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor="#3344FC"}
                onMouseLeave={e => e.currentTarget.style.borderColor="#e5e7eb"}
              >
                <FileSpreadsheet size={36} color="#9ca3af" style={{ margin:"0 auto 12px" }}/>
                <p style={{ fontWeight:600, color:"#374151", marginBottom:4 }}>
                  Drop your file here or <span style={{ color:"#3344FC" }}>browse</span>
                </p>
                <p style={{ fontSize:12, color:"#9ca3af" }}>.xlsx · .xls · .csv — max 50 MB</p>
                <input
                  ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
                  style={{ display:"none" }}
                  onChange={e => { const f=e.target.files?.[0]; if(f) runUpload(f) }}
                />
              </div>
            </div>
          )}

          {/* ── UPLOADING ───────────────────────────────────────────────── */}
          {phase === "uploading" && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <Upload size={32} color="#3344FC" style={{ margin:"0 auto 14px" }}/>
              <p style={{ fontWeight:600, color:"#111", marginBottom:16 }}>Uploading your file…</p>
              <div style={{ height:6, background:"#f3f4f6", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${uploadPct}%`, background:"#3344FC", transition:"width 0.3s" }}/>
              </div>
              <p style={{ fontSize:12, color:"#9ca3af", marginTop:8 }}>{uploadPct}%</p>
            </div>
          )}

          {/* ── PARSING ─────────────────────────────────────────────────── */}
          {phase === "parsing" && (
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"32px 0" }}>
              <Spinner/>
              <div>
                <p style={{ fontWeight:600, color:"#111" }}>Reading your file…</p>
                <p style={{ fontSize:13, color:"#9ca3af" }}>Detecting columns and matching them to your store</p>
              </div>
            </div>
          )}

          {/* ── CONFIRMING — mapping review ──────────────────────────────── */}
          {phase === "confirming" && parseResult && (() => {
            const allCols = [...Object.keys(parseResult.detected_mapping), ...parseResult.unmapped_columns]
            const mappedCount = Object.values(confirmedMap).filter(v => v !== "__unmapped__").length
            const filtered = search
              ? allCols.filter(c => c.toLowerCase().includes(search.toLowerCase()) || labelFor(confirmedMap[c]??"__unmapped__").toLowerCase().includes(search.toLowerCase()))
              : allCols

            return (
              <div>
                {/* Summary bar */}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                  <div style={{ fontSize:13, color:"#374151" }}>
                    <strong style={{ color:"#3344FC" }}>{mappedCount}</strong> of {allCols.length} columns mapped
                  </div>
                  <div style={{
                    padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                    background: parseResult.ml_coverage_pct >= 80 ? "#dcfce7" : "#fef3c7",
                    color:      parseResult.ml_coverage_pct >= 80 ? "#15803d" : "#92400e",
                  }}>
                    <Sparkles size={10} style={{ marginRight:4 }}/> {parseResult.ml_coverage_pct}% analytics coverage
                  </div>
                  {costPct === "" && parseResult.truly_missing.includes("cost") && (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:12, color:"#6b7280" }}>Cost %</span>
                      <input
                        type="number" min={0} max={100} value={costPct}
                        onChange={e => setCostPct(e.target.value)}
                        placeholder="e.g. 60"
                        style={{
                          width:72, padding:"3px 8px", fontSize:12,
                          border:"1px solid #e5e7eb", borderRadius:6, outline:"none",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Search */}
                <div style={{ position:"relative", marginBottom:12 }}>
                  <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}/>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search columns…"
                    style={{
                      width:"100%", paddingLeft:32, paddingRight:12, paddingTop:7, paddingBottom:7,
                      fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, outline:"none",
                    }}
                  />
                </div>

                {/* Column rows */}
                <div style={{ border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", marginBottom:16 }}>
                  {/* Header */}
                  <div style={{
                    display:"grid", gridTemplateColumns:"1fr 1fr 80px",
                    gap:8, padding:"8px 14px",
                    background:"#f9fafb", borderBottom:"1px solid #e5e7eb",
                    fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.4px",
                  }}>
                    <span>Your column</span><span>Maps to</span><span>Samples</span>
                  </div>
                  <div className="fuse-modal-scroll" style={{ maxHeight:280, overflowY:"auto" }}>
                    {filtered.map(col => {
                      const target  = confirmedMap[col] ?? "__unmapped__"
                      const isIgnored = ignoredCols.has(col)
                      const score   = parseResult.confidence_scores[col] ?? 0
                      const samples = (parseResult.sample_values?.[col] ?? []).slice(0,2)
                      const field   = DB_FIELDS.find(f => f.value === target)
                      const gColor  = GROUP_COLORS[field?.group ?? "Notes"] ?? "#9ca3af"

                      return (
                        <div
                          key={col}
                          className="fuse-col-row"
                          style={{
                            display:"grid", gridTemplateColumns:"1fr 1fr 80px",
                            gap:8, padding:"9px 14px",
                            borderBottom:"1px solid #f9fafb",
                            opacity: isIgnored ? 0.4 : 1,
                            alignItems:"center",
                            background:"#fff",
                          }}
                        >
                          {/* Original column name */}
                          <div>
                            <div style={{ fontSize:13, fontWeight:500, color:"#111" }}>{col}</div>
                            {score > 0 && !isIgnored && (
                              <div style={{ fontSize:10, color: score>=80?"#10b981":score>=50?"#f59e0b":"#ef4444", marginTop:1 }}>
                                {score.toFixed(0)}% match
                              </div>
                            )}
                          </div>

                          {/* Dropdown */}
                          <div>
                            {isIgnored ? (
                              <span style={{ fontSize:11, color:"#9ca3af" }}>Ignored</span>
                            ) : (
                              <div style={{ position:"relative" }}>
                                <div style={{
                                  position:"absolute", left:8, top:"50%", transform:"translateY(-50%)",
                                  width:8, height:8, borderRadius:"50%", background:gColor, flexShrink:0,
                                }}/>
                                <select
                                  className="fuse-dropdown"
                                  value={target}
                                  onChange={e => setConfirmedMap(m => ({...m, [col]:e.target.value}))}
                                  style={{
                                    width:"100%", paddingLeft:22, paddingRight:8,
                                    paddingTop:5, paddingBottom:5,
                                    fontSize:12, border:"1px solid #e5e7eb", borderRadius:6,
                                    background:"#fff", color:"#111", outline:"none",
                                    appearance:"none", cursor:"pointer",
                                  }}
                                >
                                  {["Customer","Product","Order","Notes"].map(g => (
                                    <optgroup key={g} label={`── ${g} ──`}>
                                      {DB_FIELDS.filter(f=>f.group===g).map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Samples + ignore toggle */}
                          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                            {samples.length > 0 && (
                              <div style={{ fontSize:10, color:"#6b7280", lineHeight:1.3 }}>
                                {samples.map((s,i) => (
                                  <span key={i} style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:72 }}>{s}</span>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => setIgnoredCols(s => { const n=new Set(s); n.has(col)?n.delete(col):n.add(col); return n })}
                              style={{
                                fontSize:10, color: isIgnored?"#3344FC":"#9ca3af",
                                background:"none", border:"none", cursor:"pointer", padding:0, textAlign:"left",
                              }}
                            >
                              {isIgnored?"Restore":"Ignore"}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Action row */}
                <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
                  <button
                    onClick={onClose}
                    style={{
                      padding:"9px 18px", borderRadius:8, border:"1px solid #e5e7eb",
                      background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:13,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={runClean}
                    style={{
                      padding:"9px 22px", borderRadius:8, border:"none",
                      background:"#3344FC", color:"#fff", cursor:"pointer",
                      fontSize:13, fontWeight:600,
                      display:"flex", alignItems:"center", gap:6,
                    }}
                  >
                    Import data <ArrowRight size={14}/>
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ── CLEANING ────────────────────────────────────────────────── */}
          {phase === "cleaning" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <Spinner size={24}/>
                <div>
                  <p style={{ fontWeight:600, color:"#111", fontSize:14 }}>Processing your data…</p>
                  <p style={{ fontSize:12, color:"#9ca3af" }}>{progress.detail || "Cleaning and organising rows"}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height:6, background:"#f3f4f6", borderRadius:3, overflow:"hidden", marginBottom:10 }}>
                <div style={{ height:"100%", width:`${progress.pct}%`, background:"#3344FC", transition:"width 0.4s" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af" }}>
                <span>{progress.stage}</span>
                <span>{progress.pct}%</span>
              </div>
              {/* Live counts */}
              {Object.keys(progress.counts).length > 0 && (
                <div style={{ display:"flex", gap:12, marginTop:14, flexWrap:"wrap" }}>
                  {Object.entries(progress.counts).map(([k,v]) => (
                    <div key={k} style={{ fontSize:12, color:"#374151" }}>
                      <strong style={{ color:"#3344FC" }}>{v.toLocaleString()}</strong> {k}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STORING ─────────────────────────────────────────────────── */}
          {phase === "storing" && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"24px 0" }}>
              <Spinner size={24}/>
              <div>
                <p style={{ fontWeight:600, color:"#111", fontSize:14 }}>Saving to your store…</p>
                <p style={{ fontSize:12, color:"#9ca3af" }}>Inserting customers, products, orders and order items</p>
              </div>
            </div>
          )}

          {/* ── DONE ────────────────────────────────────────────────────── */}
          {phase === "done" && cleanResult && (
            <div>
              {/* Hero */}
              <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
                <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
                <h3 style={{ fontSize:18, fontWeight:700, color:"#111", marginBottom:4 }}>Import complete</h3>
                <p style={{ fontSize:13, color:"#6b7280" }}>
                  {cleanResult.summary.clean_rows.toLocaleString()} of {cleanResult.summary.total_rows.toLocaleString()} rows imported
                  {" · "}
                  <strong style={{ color:"#3344FC" }}>{cleanResult.summary.ml_coverage_pct}%</strong> analytics coverage
                </p>
              </div>

              {/* Entity cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
                {[
                  { icon:Users,        label:"Customers",   value:cleanResult.entities.customers.length,   color:"#3344FC" },
                  { icon:Package,      label:"Products",    value:cleanResult.entities.products.length,    color:"#10b981" },
                  { icon:ShoppingCart, label:"Orders",      value:cleanResult.entities.orders.length,      color:"#f59e0b" },
                  { icon:Database,     label:"Order items", value:cleanResult.entities.order_items.length, color:"#8b5cf6" },
                ].map(({ icon:Icon, label, value, color }) => (
                  <div key={label} style={{
                    background:"#f9fafb", borderRadius:10, padding:"10px 12px",
                    display:"flex", alignItems:"center", gap:8,
                  }}>
                    <div style={{ width:28,height:28,borderRadius:8,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Icon size={14} color={color}/>
                    </div>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:"#111", lineHeight:1 }}>{value.toLocaleString()}</div>
                      <div style={{ fontSize:10, color:"#6b7280" }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DB stats */}
              {storeStats && (
                <div style={{
                  background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8,
                  padding:"10px 14px", marginBottom:12,
                  fontSize:12, color:"#15803d", display:"flex", flexWrap:"wrap", gap:12,
                }}>
                  <span>✓ <strong>{storeStats.customers_inserted}</strong> customers added ({storeStats.customers_skipped} existed)</span>
                  <span>✓ <strong>{storeStats.products_inserted}</strong> products added ({storeStats.products_skipped} existed)</span>
                  <span>✓ <strong>{storeStats.orders_inserted}</strong> orders added</span>
                  <span>✓ <strong>{storeStats.order_items_inserted}</strong> order items added</span>
                </div>
              )}

              {/* Derived fields */}
              {cleanResult.summary.derived_fields?.length > 0 && (
                <div style={{
                  background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8,
                  padding:"8px 12px", marginBottom:12,
                  display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#1d4ed8",
                }}>
                  <Sparkles size={13}/>
                  <span>Auto-calculated: <strong>{cleanResult.summary.derived_fields.join(", ")}</strong></span>
                </div>
              )}

              {/* Warnings */}
              {cleanResult.warnings.length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <button
                    onClick={() => setShowWarnings(s=>!s)}
                    style={{ display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#f59e0b",padding:0 }}
                  >
                    <AlertTriangle size={12}/>
                    {cleanResult.warnings.length} warning{cleanResult.warnings.length>1?"s":""}
                    {showWarnings ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                  </button>
                  {showWarnings && (
                    <div style={{ background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"8px 12px",marginTop:6 }}>
                      {cleanResult.warnings.map((w,i) => <p key={i} style={{fontSize:11,color:"#78350f",margin:"2px 0"}}>• {w}</p>)}
                    </div>
                  )}
                </div>
              )}

              {/* Failed rows */}
              {cleanResult.failed_rows.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <button
                    onClick={() => setShowFailed(s=>!s)}
                    style={{ display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#ef4444",padding:0 }}
                  >
                    <XCircle size={12}/>
                    {cleanResult.failed_rows.length} rows excluded
                    {showFailed ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                  </button>
                  {showFailed && (
                    <div style={{ background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"8px 12px",marginTop:6,maxHeight:120,overflowY:"auto" }}>
                      {cleanResult.failed_rows.map((r,i) => <div key={i} style={{fontSize:11,color:"#7f1d1d",marginBottom:2}}>Row {r.row_index}: {r.reason}</div>)}
                    </div>
                  )}
                </div>
              )}

              {/* Close */}
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button
                  onClick={onClose}
                  style={{
                    padding:"9px 24px", borderRadius:8, border:"none",
                    background:"#3344FC", color:"#fff", cursor:"pointer",
                    fontSize:13, fontWeight:600,
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ───────────────────────────────────────────────────── */}
          {phase === "error" && (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <XCircle size={40} color="#ef4444" style={{ margin:"0 auto 12px" }}/>
              <p style={{ fontWeight:600, color:"#111", marginBottom:6 }}>Something went wrong</p>
              <p style={{ fontSize:13, color:"#6b7280", marginBottom:20, maxWidth:380, margin:"0 auto 20px" }}>{error}</p>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button
                  onClick={() => { setPhase("idle"); setError(null) }}
                  style={{
                    padding:"9px 20px", borderRadius:8, border:"1px solid #e5e7eb",
                    background:"transparent", color:"#374151", cursor:"pointer", fontSize:13,
                  }}
                >
                  Try again
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding:"9px 20px", borderRadius:8, border:"none",
                    background:"#3344FC", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}