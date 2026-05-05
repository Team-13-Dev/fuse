"use client"
import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DndContext, useDraggable, useDroppable, DragOverlay, pointerWithin } from "@dnd-kit/core";
import {
  Menu, Square, LayoutGrid, List, AlignJustify, MessageSquare,
  Trash2, Plus, Layers, X, Palette, Type, Save, Loader2,
  ArrowLeft, Check, AlertCircle, Pencil,
} from "lucide-react";
import SegmentedSwitch from "./components/Switcher";
import { DEFAULT_TEXT, getText, TEXT_FIELDS } from "./helpers/TextHelpers";
import RenderedBlock from "./components/RenderedBlock";
import { withAlpha } from "./helpers/ColorHelpers";
import CanvasBlock, { DEFAULT_ACCENT, DEFAULT_BG } from "./components/CanvasBlock";
import PagesList from "./components/PageList";

type BlockType =
  | "header"
  | "hero"
  | "products"
  | "contact"
  | "footer"
  | "testimonials";

type BlockTextMap = typeof DEFAULT_TEXT;

type BlockInstance = {
  instanceId: string;
  type: BlockType;
  accentColor?: string;
  bgColor?: string;
  text?: Partial<BlockTextMap[BlockType]>;
};

// ── Save status ───────────────────────────────────────────────────────────────
type SaveStatus = "idle" | "saving" | "saved" | "error";

// ── Constants ─────────────────────────────────────────────────────────────────
const ACCENT_SWATCHES = [
  { name: "Violet",  value: "#7c3aed" }, { name: "Rose",    value: "#e11d48" },
  { name: "Teal",    value: "#0d9488" }, { name: "Amber",   value: "#d97706" },
  { name: "Sky",     value: "#0284c7" }, { name: "Emerald", value: "#059669" },
  { name: "Fuchsia", value: "#a21caf" }, { name: "Slate",   value: "#475569" },
];
const BG_SWATCHES = [
  { name: "White",    value: "#ffffff" }, { name: "Cream",   value: "#faf9f6" },
  { name: "Stone",    value: "#f5f4f0" }, { name: "Blush",   value: "#fff5f5" },
  { name: "Ice",      value: "#f0f9ff" }, { name: "Mint",    value: "#f0fdf4" },
  { name: "Lavender", value: "#f5f3ff" }, { name: "Slate",   value: "#f8fafc" },
];

const BLOCK_DEFS : {
  type: BlockType;
  label: string;
  icon: any;
  description: string;
}[] = [
  { type: "header",       label: "Header",       icon: Menu,          description: "Navigation bar" },
  { type: "hero",         label: "Hero",          icon: Square,        description: "Full-width banner" },
  { type: "products",     label: "Products",      icon: LayoutGrid,    description: "Product grid" },
  { type: "contact",      label: "Contact",       icon: List,          description: "Contact form" },
  { type: "footer",       label: "Footer",        icon: AlignJustify,  description: "Page footer" },
  { type: "testimonials", label: "Testimonials",  icon: MessageSquare, description: "Customer reviews" },
];

// ── API helpers ───────────────────────────────────────────────────────────────

function blocksToApi(blocks: BlockInstance[]) {
  return blocks.map((b, i) => ({
    type:          b.type,
    position:      i,
    accentColor:   b.accentColor ?? null,
    bgColor:       b.bgColor ?? null,
    textOverrides: b.text && Object.keys(b.text).length > 0 ? b.text : null,
  }));
}

function blocksFromApi(apiBlocks: any[]): BlockInstance[] {
  return [...apiBlocks]
    .sort((a, b) => a.position - b.position)
    .map(b => ({
      instanceId:  `${b.type}-${b.id}`,
      type:        b.type as BlockType,
      accentColor: b.accentColor  ?? DEFAULT_ACCENT,
      bgColor:     b.bgColor      ?? DEFAULT_BG,
      text:        b.textOverrides ?? {},
    }));
}

// ── Edit Panel ────────────────────────────────────────────────────────────────
function EditPanel({
  block,
  onTextChange,
  onColorChange,
  onClose,
}: {
  block: BlockInstance;
  onTextChange: (id: string, key: string, value: string) => void;
  onColorChange: (id: string, key: "accentColor" | "bgColor", value: string) => void;
  onClose: () => void;
}){
  const [tab, setTab] = useState("text");
  const text = getText(block);
  const fields = TEXT_FIELDS[block.type] || [];
  const accent = block.accentColor || DEFAULT_ACCENT;
  const bg = block.bgColor || DEFAULT_BG;
  const def = BLOCK_DEFS.find(d => d.type === block.type);
  const Icon = def?.icon;

  return (
    <div style={{ width:272, flexShrink:0, borderLeft:"1px solid #e2e8f0", background:"#fff", display:"flex", flexDirection:"column", overflowY:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid #f1f5f9", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:26, height:26, borderRadius:6, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {Icon && <Icon size={13} color="#7c3aed" />}
            </div>
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:"#0f172a", margin:0 }}>Edit {def?.label}</p>
              <p style={{ fontSize:10, color:"#94a3b8", margin:0 }}>block properties</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", padding:2, display:"flex" }}><X size={15} /></button>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", gap:4, background:"#f8fafc", borderRadius:8, padding:3 }}>
          {[{ id:"text", Icon:Type, label:"Text" }, { id:"colors", Icon:Palette, label:"Colors" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:11, fontWeight:600, padding:"5px 0", borderRadius:6, border:"none", cursor:"pointer", background:tab===t.id?"#fff":"none", color:tab===t.id?"#7c3aed":"#94a3b8", boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s" }}>
              <t.Icon size={11} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:14 }}>
        {tab === "text" && (
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            {fields.map((f : any ) => (
              <div key={f.key}>
                <label style={{ display:"block", fontSize:10, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{f.label}</label>
                {f.multiline
                  ? <textarea value={text[f.key]??""} rows={3} onChange={e => onTextChange(block.instanceId, f.key, e.target.value)} style={{ width:"100%", boxSizing:"border-box", fontSize:12, color:"#0f172a", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:7, padding:"6px 9px", outline:"none", fontFamily:"inherit", resize:"vertical", lineHeight:1.5 }} />
                  : <input type="text" value={text[f.key]??""} onChange={e => onTextChange(block.instanceId, f.key, e.target.value)} style={{ width:"100%", boxSizing:"border-box", fontSize:12, color:"#0f172a", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:7, padding:"6px 9px", outline:"none", fontFamily:"inherit" }} />
                }
              </div>
            ))}
          </div>
        )}
        {tab === "colors" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Accent color</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5, marginBottom:8 }}>
                {ACCENT_SWATCHES.map(s => (
                  <button key={s.value} title={s.name} onClick={() => onColorChange(block.instanceId,"accentColor",s.value)} style={{ width:"100%", aspectRatio:"1", borderRadius:7, background:s.value, border:accent===s.value?"2.5px solid #0f172a":"2.5px solid transparent", cursor:"pointer", outline:"none" }} />
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <input type="color" value={accent} onChange={e => onColorChange(block.instanceId,"accentColor",e.target.value)} style={{ width:28, height:28, borderRadius:6, border:"1px solid #e2e8f0", padding:1, cursor:"pointer" }} />
                <span style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{accent}</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Background</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5, marginBottom:8 }}>
                {BG_SWATCHES.map(s => (
                  <button key={s.value} title={s.name} onClick={() => onColorChange(block.instanceId,"bgColor",s.value)} style={{ width:"100%", aspectRatio:"1", borderRadius:7, background:s.value, border:bg===s.value?"2.5px solid #0f172a":"2.5px solid #e2e8f0", cursor:"pointer", outline:"none" }} />
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <input type="color" value={bg} onChange={e => onColorChange(block.instanceId,"bgColor",e.target.value)} style={{ width:28, height:28, borderRadius:6, border:"1px solid #e2e8f0", padding:1, cursor:"pointer" }} />
                <span style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{bg}</span>
              </div>
            </div>
            {/* Preview */}
            <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:14 }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Preview</p>
              <div style={{ borderRadius:9, overflow:"hidden", border:"1px solid #e2e8f0" }}>
                <div style={{ background:bg, padding:"12px 14px", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:20, height:20, borderRadius:5, background:accent }} />
                  <div style={{ flex:1 }}>
                    <div style={{ height:5, borderRadius:3, background:accent, width:"55%", marginBottom:4 }} />
                    <div style={{ height:4, borderRadius:3, background:withAlpha(accent,0.2), width:"75%" }} />
                  </div>
                  <div style={{ background:accent, borderRadius:5, padding:"3px 8px" }}>
                    <div style={{ height:4, width:24, borderRadius:2, background:"#fff" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar Block ─────────────────────────────────────────────────────────────
function SidebarBlock({ def, onHover, onLeave }: any) {
  const Icon = def.icon;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id:`sidebar__${def.type}`, data:{ type:def.type, source:"sidebar" } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      style={{ opacity:isDragging?0.4:1, transform:transform?`translate(${transform.x}px,${transform.y}px)`:undefined, display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:9, cursor:"grab", userSelect:"none", background:"#f8fafc", border:"1px solid #e2e8f0", transition:"all 0.15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.borderColor="#cbd5e1"; onHover(def.type)}}
      onMouseLeave={e=>{ e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#e2e8f0"; onLeave()}}
    >
      <div style={{ flexShrink:0, width:30, height:30, borderRadius:7, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={14} color="#7c3aed" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12, fontWeight:600, color:"#0f172a", margin:0 }}>{def.label}</p>
        <p style={{ fontSize:10, color:"#94a3b8", margin:0 }}>{def.description}</p>
      </div>
      <Plus size={12} color="#cbd5e1" />
    </div>
  );
}

// ── Canvas ────────────────────────────────────────────────────────────────────
function Canvas({ blocks, onRemove, activeId, selectedId, onSelect, hoverPreviewType }: any) {
  const { setNodeRef, isOver } = useDroppable({ id:"canvas" });
  const previewExists = blocks.some((b: any) => b.type === hoverPreviewType);
  return (
    <div ref={setNodeRef} style={{ minHeight:600, borderRadius:14, transition:"all 0.2s", background:isOver?"#f5f3ff":"#f8fafc", border:`1.5px ${isOver?"solid #7c3aed":"dashed #e2e8f0"}` }}>
      {blocks.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", minHeight:400, gap:12, pointerEvents:"none" }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"#fff", border:"1.5px dashed #cbd5e1", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Layers size={22} color="#cbd5e1" />
          </div>
          <p style={{ color:"#94a3b8", fontSize:13, fontWeight:500, margin:0 }}>Drop blocks here to build your page</p>
        </div>
      ) : (
        <div style={{ padding:18, display:"flex", flexDirection:"column", gap:10 }}>
          {blocks.map((block : any) => (
            <CanvasBlock key={block.instanceId} block={block} onRemove={onRemove} onSelect={onSelect} isSelected={selectedId===block.instanceId} />
          ))}
          {activeId && (
            <div style={{ border:"2px dashed #c4b5fd", borderRadius:10, height:48, display:"flex", alignItems:"center", justifyContent:"center", color:"#a78bfa", fontSize:12, fontWeight:600 }}>Drop here</div>
          )}
        </div>
      )}
      {hoverPreviewType && !previewExists && (
        <div style={{ opacity: 0.8, padding: 18 }}>
          <RenderedBlock
            type={hoverPreviewType}
            accentColor={DEFAULT_ACCENT}
            bgColor={DEFAULT_BG}
            text={getText({ instanceId: "preview", type: hoverPreviewType })}
          />
        </div>
      )}
    </div>
  );
}

// ── Drag Ghost ────────────────────────────────────────────────────────────────
function DragGhost({ type }: { type: BlockType | null }) {
  if (!type) return null;
  const def = BLOCK_DEFS.find(d => d.type === type);
  if (!def) return null;
  const Icon = def.icon;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7, background:"#7c3aed", color:"#fff", fontSize:12, fontWeight:600, padding:"7px 14px", borderRadius:9, boxShadow:"0 8px 24px rgba(124,58,237,0.35)", opacity:0.96, pointerEvents:"none" }}>
      <Icon size={14} />{def.label}
    </div>
  );
}

// ── Inline page name editor ───────────────────────────────────────────────────
function PageNameEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        style={{ fontSize:13, fontWeight:600, color:"#0f172a", border:"1.5px solid #7c3aed", borderRadius:7, padding:"3px 8px", outline:"none", fontFamily:"inherit", width:200 }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", padding:"3px 6px", borderRadius:6 }}
      title="Rename page"
    >
      <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{value}</span>
      <Pencil size={11} color="#94a3b8" />
    </button>
  );
}

// ── Save button with status ───────────────────────────────────────────────────
function SaveButton({ status, onClick }: { status: SaveStatus; onClick: () => void }) {
  const cfg = {
    idle:   { bg:"#7c3aed", label:"Save",    Icon: Save,        disabled: false },
    saving: { bg:"#7c3aed", label:"Saving…", Icon: Loader2,     disabled: true  },
    saved:  { bg:"#059669", label:"Saved",   Icon: Check,       disabled: false },
    error:  { bg:"#ef4444", label:"Retry",   Icon: AlertCircle, disabled: false },
  }[status];

  return (
    <button
      onClick={onClick}
      disabled={cfg.disabled}
      style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:"#fff", background:cfg.bg, border:"none", borderRadius:8, padding:"7px 14px", cursor:cfg.disabled?"default":"pointer", transition:"background 0.2s", opacity:cfg.disabled?0.8:1 }}
    >
      <cfg.Icon size={13} style={status === "saving" ? { animation:"spin 1s linear infinite" } : undefined} />
      {cfg.label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WebsiteBuilder() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const pageId       = searchParams.get("pageId");  // null = new page (unsaved)

  const [blocks, setBlocks]         = useState<BlockInstance[]>([]);
  const [pageName, setPageName]     = useState("Untitled page");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading]       = useState(!!pageId);
  const [activeType, setActiveType] = useState<BlockType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverPreviewType, setHoverPreviewType] = useState<BlockType | null>(null);

  const selectedBlock = blocks.find(b => b.instanceId === selectedId) || null;

  // ── Load existing page ──────────────────────────────────────────────────────
  useEffect(() => {
    // Reset canvas state immediately on every pageId change
    setSelectedId(null);
    setActiveType(null);

    if (!pageId) {
      setPageName("Untitled page");
      setBlocks([
        { instanceId: "init-header", type: "header", accentColor: DEFAULT_ACCENT, bgColor: DEFAULT_BG, text: {} },
        { instanceId: "init-hero",   type: "hero",   accentColor: DEFAULT_ACCENT, bgColor: DEFAULT_BG, text: {} },
      ]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setBlocks([]);  // clear immediately so old page doesn't flash

    (async () => {
      try {
        const res = await fetch(`/api/pages/${pageId}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log(data);
        if (cancelled) return;
        setPageName(data.name);
        setBlocks(data.blocks?.length ? blocksFromApi(data.blocks) : []);
      } catch {
        if (!cancelled) setBlocks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pageId]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const payload = { name: pageName, blocks: blocksToApi(blocks) };

      if (pageId) {
        // Update existing
        await fetch(`/api/pages/${pageId}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        }).then(r => { if (!r.ok) throw new Error(); });
      } else {
        // Create new — then redirect to the same builder with the new id
        const res = await fetch("/api/pages", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        router.replace(`?pageId=${created.id}`);
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [pageId, pageName, blocks, router]);

  // ── Keyboard shortcut Cmd/Ctrl+S ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (saveStatus !== "saving") handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, saveStatus]);

  // ── Builder handlers ────────────────────────────────────────────────────────
  const handleDragStart = (e : any) => setActiveType(e.active.data?.current?.type ?? null);
  const handleDragEnd   = (e : any) => {
    setActiveType(null);
    const { active, over } = e;
    if (over?.id === "canvas") {
      const type = active.data?.current?.type ?? active.id.replace("sidebar__","");
      const instanceId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      setBlocks(prev => [...prev, { instanceId, type, accentColor:DEFAULT_ACCENT, bgColor:DEFAULT_BG, text:{} }]);
    }
  };
  const handleRemove      = (id: any) => { setBlocks(prev => prev.filter(b => b.instanceId!==id)); if (selectedId===id) setSelectedId(null); };
  const handleColorChange = useCallback((id: any, key: any, val: any) => setBlocks(prev => prev.map(b => b.instanceId===id?{...b,[key]:val}:b)), []);
  const handleTextChange  = useCallback((id: any, key: any, val: any) => setBlocks(prev => prev.map(b => b.instanceId===id?{...b,text:{...b.text,[key]:val}}:b)), []);
  const handleSelect      = (id: any) => setSelectedId(prev => prev===id ? null : id);

  // ── Loading state ───────────────────────────────────────────────────────────
  return (
    <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display:"flex", height:"100vh", background:"#f1f5f9", fontFamily:"'Inter', system-ui, sans-serif", overflow:"hidden" }}>

        {/* Sidebar */}
        <aside style={{ width:288, flexShrink:0, display:"flex", flexDirection:"column", borderRight:"1px solid #e2e8f0", background:"#fff" }}>
          <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid #f1f5f9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:7, background:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Layers size={12} color="#fff" />
              </div>
              <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>PageBuilder</span>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", minHeight:0 }}>

            {/* Pages list */}
            <div style={{ padding:"12px 10px 8px", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94a3b8", margin:0 }}>Pages</p>
                <button
                  onClick={() => router.push("?")}
                  title="New page"
                  style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, fontWeight:600, color:"#7c3aed", background:"#ede9fe", border:"none", borderRadius:6, padding:"3px 8px", cursor:"pointer" }}
                >
                  <Plus size={10} /> New
                </button>
              </div>
              <PagesList onNewPage={() => router.push("?")} />
            </div>

            {/* Components */}
            <div style={{ padding:"12px 10px", display:"flex", flexDirection:"column", gap:5 }}>
              <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94a3b8", padding:"0 4px", marginBottom:6 }}>Components</p>
              <SegmentedSwitch options={["Landing", "Products", "Cart"]}/>
              {BLOCK_DEFS.map(def => (
                <SidebarBlock
                  key={def.type}
                  def={def}
                  onHover={(type: BlockType) => setHoverPreviewType(type)}
                  onLeave={() => setHoverPreviewType(null)}
                />
              ))}
            </div>

          </div>
          <div style={{ padding:"12px 14px", borderTop:"1px solid #f1f5f9" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:11, color:"#94a3b8" }}>Placed blocks</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#7c3aed", background:"#ede9fe", padding:"2px 8px", borderRadius:100 }}>{blocks.length}</span>
            </div>
          </div>
        </aside>

        {/* Canvas area */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* Toolbar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px", borderBottom:"1px solid #e2e8f0", background:"#fff", flexShrink:0, gap:12 }}>

            {/* Left: back + page name */}
            <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
              <button
                onClick={() => router.back()}
                title="Back"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:7, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", flexShrink:0 }}
              >
                <ArrowLeft size={13} color="#64748b" />
              </button>
              <PageNameEditor value={pageName} onChange={setPageName} />
              {!pageId && (
                <span style={{ fontSize:10, color:"#94a3b8", background:"#f1f5f9", padding:"2px 8px", borderRadius:100, flexShrink:0 }}>unsaved</span>
              )}
            </div>

            {/* Right: clear + save */}
            <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
              <button
                onClick={() => { setBlocks([]); setSelectedId(null); }}
                disabled={blocks.length===0}
                style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:blocks.length===0?"#cbd5e1":"#ef4444", background:"none", border:"1px solid", borderColor:blocks.length===0?"#e2e8f0":"#fecaca", borderRadius:7, padding:"5px 10px", cursor:blocks.length===0?"default":"pointer", transition:"all 0.15s" }}
              >
                <Trash2 size={12} />Clear
              </button>
              <SaveButton status={saveStatus} onClick={handleSave} />
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:20, position:"relative" }}>
            {loading ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, gap:12 }}>
                <Loader2 size={22} color="#7c3aed" style={{ animation:"spin 1s linear infinite" }} />
                <span style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>Loading blocks…</span>
              </div>
            ) : (
              <Canvas
                blocks={blocks}
                onRemove={handleRemove}
                activeId={activeType}
                selectedId={selectedId}
                onSelect={handleSelect}
                hoverPreviewType={hoverPreviewType}
              />
            )}
          </div>
        </main>

        {/* Edit panel */}
        {selectedBlock && (
          <EditPanel block={selectedBlock} onTextChange={handleTextChange} onColorChange={handleColorChange} onClose={() => setSelectedId(null)} />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        <DragGhost type={activeType} />
      </DragOverlay>
    </DndContext>
  );
}