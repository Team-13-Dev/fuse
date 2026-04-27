"use client"
import React, { useState, useCallback } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay, pointerWithin } from "@dnd-kit/core";
import {
  Menu, Square, LayoutGrid, List, AlignJustify, MessageSquare,
  Trash2, GripVertical, Plus, Layers, X, ChevronRight, Palette, Type
} from "lucide-react";

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
const DEFAULT_ACCENT = "#7c3aed";
const DEFAULT_BG = "#ffffff";

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

const DEFAULT_TEXT: Record<BlockType, any> = {
  header: { brand:"YourBrand", nav1:"Home", nav2:"About", nav3:"Services", nav4:"Contact", cta:"Get Started" },
  hero: { eyebrow:"Welcome to the future", heading:"Build Something Extraordinary", subheading:"Drag, drop, and compose beautiful pages in seconds with our intuitive visual builder.", primaryCta:"Start Building", secondaryCta:"Learn more" },
  products: { sectionLabel:"Featured Products", p1Name:"Pro Plan", p1Desc:"For individuals", p1Price:"$29", p2Name:"Team Plan", p2Desc:"Up to 10 members", p2Price:"$79", p2Badge:"Popular", p3Name:"Enterprise", p3Desc:"Unlimited scale", p3Price:"$199" },
  contact: { sectionLabel:"Get in Touch", fieldName:"Name", fieldEmail:"Email", fieldMessage:"Message", cta:"Send Message" },
  footer: { brand:"YourBrand", link1:"Privacy", link2:"Terms", link3:"Contact", copy:"© 2026 All rights reserved" },
  testimonials: { sectionLabel:"What People Say", t1Name:"Sarah K.", t1Role:"Designer", t1Text:"Absolutely transformed how our team ships landing pages.", t2Name:"Marco R.", t2Role:"Developer", t2Text:"Incredibly fast workflow — days now take minutes." },
};

const TEXT_FIELDS : Record<
  BlockType,
  { key: string; label: string; multiline?: boolean }[]> = {
  header: [
    { key:"brand", label:"Brand name" },
    { key:"nav1", label:"Nav 1" }, { key:"nav2", label:"Nav 2" }, { key:"nav3", label:"Nav 3" }, { key:"nav4", label:"Nav 4" },
    { key:"cta", label:"Button label" },
  ],
  hero: [
    { key:"eyebrow", label:"Eyebrow tag" },
    { key:"heading", label:"Heading", multiline:true },
    { key:"subheading", label:"Body text", multiline:true },
    { key:"primaryCta", label:"Primary button" },
    { key:"secondaryCta", label:"Secondary link" },
  ],
  products: [
    { key:"sectionLabel", label:"Section label" },
    { key:"p1Name", label:"Card 1 — name" }, { key:"p1Desc", label:"Card 1 — desc" }, { key:"p1Price", label:"Card 1 — price" },
    { key:"p2Name", label:"Card 2 — name" }, { key:"p2Desc", label:"Card 2 — desc" }, { key:"p2Price", label:"Card 2 — price" }, { key:"p2Badge", label:"Card 2 — badge" },
    { key:"p3Name", label:"Card 3 — name" }, { key:"p3Desc", label:"Card 3 — desc" }, { key:"p3Price", label:"Card 3 — price" },
  ],
  contact: [
    { key:"sectionLabel", label:"Section label" },
    { key:"fieldName", label:"Field 1 label" }, { key:"fieldEmail", label:"Field 2 label" }, { key:"fieldMessage", label:"Field 3 label" },
    { key:"cta", label:"Button label" },
  ],
  footer: [
    { key:"brand", label:"Brand name" },
    { key:"link1", label:"Link 1" }, { key:"link2", label:"Link 2" }, { key:"link3", label:"Link 3" },
    { key:"copy", label:"Copyright" },
  ],
  testimonials: [
    { key:"sectionLabel", label:"Section label" },
    { key:"t1Name", label:"Review 1 — name" }, { key:"t1Role", label:"Review 1 — role" }, { key:"t1Text", label:"Review 1 — quote", multiline:true },
    { key:"t2Name", label:"Review 2 — name" }, { key:"t2Role", label:"Review 2 — role" }, { key:"t2Text", label:"Review 2 — quote", multiline:true },
  ],
};

function getText(block: BlockInstance) {
  return {
    ...DEFAULT_TEXT[block.type],
    ...(block.text || {}),
  };
}

// ── Color helpers ─────────────────────────────────────────────────────────────
function hexToRgb(hex : string) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}
function withAlpha(hex : string,a : any) { const [r,g,b]=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function lighten(hex : string ,amt=0.9) {
  const [r,g,b]=hexToRgb(hex);
  return `rgb(${Math.round(r+(255-r)*amt)},${Math.round(g+(255-g)*amt)},${Math.round(b+(255-b)*amt)})`;
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

  const inp = { width:"100%", boxSizing:"border-box", fontSize:12, color:"#0f172a", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:7, padding:"6px 9px", outline:"none", fontFamily:"inherit", resize:"vertical", lineHeight:1.5 };

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
                  ? <textarea value={text[f.key]??""} rows={3} onChange={e => onTextChange(block.instanceId, f.key, e.target.value)}  />
                  : <input type="text" value={text[f.key]??""} onChange={e => onTextChange(block.instanceId, f.key, e.target.value)}  />
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
              text={getText({
                instanceId: "preview",
                type: hoverPreviewType,
              })}
            />
          </div>
        )}
    </div>
  );
}

// ── Canvas Block ──────────────────────────────────────────────────────────────
function CanvasBlock({
  block,
  onRemove,
  onSelect,
  isSelected,
}: {
  block: BlockInstance;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position:"relative", borderRadius:10, overflow:"visible", outline:isSelected?"2px solid #7c3aed":"2px solid transparent", outlineOffset:2, transition:"outline 0.15s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position:"absolute", top:8, right:8, zIndex:10, display:"flex", alignItems:"center", gap:5, opacity:hovered||isSelected?1:0, transition:"opacity 0.15s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:3, background:"rgba(255,255,255,0.97)", borderRadius:8, padding:"4px 8px", border:"1px solid #e2e8f0", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
          <span style={{ fontSize:10, fontFamily:"monospace", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", marginRight:3 }}>{block.type}</span>
          <button onClick={() => onSelect(block.instanceId)} title="Edit" style={{ display:"flex", alignItems:"center", gap:3, background:isSelected?"#ede9fe":"none", border:"none", cursor:"pointer", borderRadius:5, padding:"3px 6px", color:isSelected?"#7c3aed":"#64748b", fontSize:11, fontWeight:600 }}>
            <Type size={11} />Edit
          </button>
          <button onClick={() => onRemove(block.instanceId)} style={{ display:"flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:5, background:"none", border:"none", cursor:"pointer", color:"#ef4444" }} title="Remove">
            <X size={12} />
          </button>
        </div>
      </div>
      <div style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", zIndex:10, opacity:hovered?1:0, transition:"opacity 0.15s" }}>
        <GripVertical size={14} color="#cbd5e1" />
      </div>
      <RenderedBlock type={block.type} accentColor={block.accentColor||DEFAULT_ACCENT} bgColor={block.bgColor||DEFAULT_BG} text={getText(block)} />
    </div>
  );
}

// ── Block Renderers ───────────────────────────────────────────────────────────
function RenderedBlock({
  type,
  accentColor,
  bgColor,
  text,
}: {
  type: BlockType;
  accentColor: string;
  bgColor: string;
  text: any;
}){
  const accentLight  = lighten(accentColor, 0.88);
  const accentSoft   = withAlpha(accentColor, 0.08);
  const accentMid    = withAlpha(accentColor, 0.15);
  const accentBorder = withAlpha(accentColor, 0.25);
  const base = { borderRadius:10, border:"1px solid #e2e8f0", background:bgColor, overflow:"hidden" };

  switch (type) {
    case "header":
      return (
        <div style={{ ...base, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:24, height:24, borderRadius:7, background:accentColor }} />
            <span style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{text.brand}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            {[text.nav1, text.nav2, text.nav3, text.nav4].map((n,i) => <span key={i} style={{ color:"#64748b", fontSize:12, cursor:"pointer" }}>{n}</span>)}
          </div>
          <button style={{ background:accentColor, color:"#fff", fontSize:11, fontWeight:600, padding:"6px 14px", borderRadius:7, border:"none", cursor:"pointer" }}>{text.cta}</button>
        </div>
      );

    case "hero":
      return (
        <div style={{ ...base, background:`linear-gradient(135deg, ${bgColor} 0%, ${accentLight} 100%)`, padding:"44px 40px", textAlign:"center", position:"relative" }}>
          <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 0%, ${withAlpha(accentColor,0.06)} 0%, transparent 60%)`, pointerEvents:"none" }} />
          <div style={{ position:"relative" }}>
            <span style={{ display:"inline-block", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:accentColor, border:`1px solid ${accentBorder}`, borderRadius:100, padding:"4px 12px", marginBottom:14, background:accentSoft }}>{text.eyebrow}</span>
            <h1 style={{ fontSize:26, fontWeight:800, color:"#0f172a", margin:"0 0 10px", lineHeight:1.2 }}>
              {(() => { const words = text.heading.split(" "); return words.map((w : any,i : any) => i === words.length-1 ? <span key={i} style={{ color:accentColor }}>{i>0?" ":""}{w}</span> : <span key={i}>{w}{" "}</span>); })()}
            </h1>
            <p style={{ color:"#64748b", fontSize:13, maxWidth:360, margin:"0 auto 20px", lineHeight:1.6 }}>{text.subheading}</p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
              <button style={{ background:accentColor, color:"#fff", fontSize:12, fontWeight:600, padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer" }}>{text.primaryCta}</button>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", fontSize:12, display:"flex", alignItems:"center", gap:3 }}>{text.secondaryCta} <ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      );

    case "products":
      return (
        <div style={{ ...base, padding:18 }}>
          <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>{text.sectionLabel}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {[
              { name:text.p1Name, desc:text.p1Desc, price:text.p1Price, featured:false },
              { name:text.p2Name, desc:text.p2Desc, price:text.p2Price, featured:true, badge:text.p2Badge },
              { name:text.p3Name, desc:text.p3Desc, price:text.p3Price, featured:false },
            ].map(p => (
              <div key={p.name} style={{ background:p.featured?accentSoft:bgColor, border:`1px solid ${p.featured?accentBorder:"#e2e8f0"}`, borderRadius:9, padding:14, display:"flex", flexDirection:"column", gap:6 }}>
                {p.featured && <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:accentColor }}>★ {p.badge}</span>}
                <div style={{ width:28, height:28, borderRadius:7, background:accentMid, border:`1px solid ${accentBorder}` }} />
                <p style={{ fontSize:12, fontWeight:600, color:"#0f172a", margin:0 }}>{p.name}</p>
                <p style={{ fontSize:10, color:"#94a3b8", margin:0 }}>{p.desc}</p>
                <p style={{ fontSize:16, fontWeight:700, color:"#0f172a", margin:"4px 0 0" }}>{p.price}<span style={{ fontSize:10, fontWeight:400, color:"#94a3b8" }}>/mo</span></p>
              </div>
            ))}
          </div>
        </div>
      );

    case "contact":
      return (
        <div style={{ ...base, padding:18 }}>
          <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>{text.sectionLabel}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            {[text.fieldName, text.fieldEmail].map(label => (
              <div key={label} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:7, padding:"8px 12px" }}>
                <p style={{ fontSize:10, color:"#94a3b8", marginBottom:5 }}>{label}</p>
                <div style={{ height:6, width:80, background:"#e2e8f0", borderRadius:4 }} />
              </div>
            ))}
          </div>
          <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:7, padding:"8px 12px", marginBottom:12 }}>
            <p style={{ fontSize:10, color:"#94a3b8", marginBottom:6 }}>{text.fieldMessage}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <div style={{ height:6, width:"100%", background:"#e2e8f0", borderRadius:4 }} />
              <div style={{ height:6, width:"75%", background:"#e2e8f0", borderRadius:4 }} />
            </div>
          </div>
          <button style={{ background:accentColor, color:"#fff", fontSize:11, fontWeight:600, padding:"7px 16px", borderRadius:7, border:"none", cursor:"pointer" }}>{text.cta}</button>
        </div>
      );

    case "footer":
      return (
        <div style={{ ...base, padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:16, height:16, borderRadius:4, background:accentColor }} />
              <span style={{ fontSize:12, fontWeight:600, color:"#64748b" }}>{text.brand}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              {[text.link1, text.link2, text.link3].map(l => <span key={l} style={{ fontSize:11, color:"#94a3b8", cursor:"pointer" }}>{l}</span>)}
            </div>
            <p style={{ fontSize:10, color:"#cbd5e1", margin:0 }}>{text.copy}</p>
          </div>
        </div>
      );

    case "testimonials":
      return (
        <div style={{ ...base, padding:18 }}>
          <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>{text.sectionLabel}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { name:text.t1Name, role:text.t1Role, quote:text.t1Text },
              { name:text.t2Name, role:text.t2Role, quote:text.t2Text },
            ].map(t => (
              <div key={t.name} style={{ background:accentSoft, border:`1px solid ${accentBorder}`, borderRadius:9, padding:14 }}>
                <div style={{ display:"flex", gap:2, marginBottom:8 }}>
                  {[...Array(5)].map((_,i) => <span key={i} style={{ color:accentColor, fontSize:12 }}>★</span>)}
                </div>
                <p style={{ color:"#475569", fontSize:12, lineHeight:1.6, marginBottom:12 }}>"{t.quote}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:26, height:26, borderRadius:100, background:`linear-gradient(135deg, ${accentColor}, ${withAlpha(accentColor,0.6)})` }} />
                  <div>
                    <p style={{ fontSize:11, fontWeight:600, color:"#0f172a", margin:0 }}>{t.name}</p>
                    <p style={{ fontSize:10, color:"#94a3b8", margin:0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default: return null;
  }
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WebsiteBuilder() {
  const [blocks, setBlocks] = useState<BlockInstance[]>([
    { instanceId: "init-header", type: "header", accentColor: DEFAULT_ACCENT, bgColor: DEFAULT_BG, text: {} },
    { instanceId: "init-hero", type: "hero", accentColor: DEFAULT_ACCENT, bgColor: DEFAULT_BG, text: {} },
  ]);

  const [activeType, setActiveType] = useState<BlockType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverPreviewType, setHoverPreviewType] = useState<BlockType | null>(null);

  const selectedBlock = blocks.find(b => b.instanceId === selectedId) || null;

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
  const handleRemove = (id: any) => { setBlocks(prev => prev.filter(b => b.instanceId!==id)); if (selectedId===id) setSelectedId(null); };
  const handleColorChange = useCallback((id : any, key : any, val: any) => setBlocks(prev => prev.map(b => b.instanceId===id?{...b,[key]:val}:b)), []);
  const handleTextChange  = useCallback((id : any, key : any, val : any) => setBlocks(prev => prev.map(b => b.instanceId===id?{...b,text:{...b.text,[key]:val}}:b)), []);
  const handleSelect = (id: any) => setSelectedId(prev => prev===id ? null : id);

  return (
    <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display:"flex", height:"100vh", background:"#f1f5f9", fontFamily:"'Inter', system-ui, sans-serif", overflow:"hidden" }}>

        {/* Sidebar */}
        <aside style={{ width:228, flexShrink:0, display:"flex", flexDirection:"column", borderRight:"1px solid #e2e8f0", background:"#fff" }}>
          <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid #f1f5f9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:7, background:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Layers size={12} color="#fff" />
              </div>
              <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>PageBuilder</span>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"12px 10px", display:"flex", flexDirection:"column", gap:5 }}>
            <div className="flex items-center gap-1 text-sm my-2">
              <button className="border bg-amber-100 rounded-xl px-1.5">Landing</button>
              <button>Products</button>
              <button>Checkout</button>
            </div>
            <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94a3b8", padding:"0 4px", marginBottom:6 }}>Components</p>
            {BLOCK_DEFS.map(def => (
              <SidebarBlock 
                key={def.type} 
                def={def} 
                onHover={(type: BlockType) => setHoverPreviewType(type)}
                onLeave={() => setHoverPreviewType(null)}
              />
            ))}
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
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", borderBottom:"1px solid #e2e8f0", background:"#fff", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>Canvas</span>
              <span style={{ fontSize:11, color:"#94a3b8" }}>— drag blocks · hover & click Edit to customize</span>
            </div>
            <button
              onClick={() => { setBlocks([]); setSelectedId(null); }}
              disabled={blocks.length===0}
              style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:blocks.length===0?"#cbd5e1":"#ef4444", background:"none", border:"1px solid", borderColor:blocks.length===0?"#e2e8f0":"#fecaca", borderRadius:7, padding:"5px 10px", cursor:blocks.length===0?"default":"pointer", transition:"all 0.15s" }}
            >
              <Trash2 size={12} />Clear all
            </button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            <Canvas
              blocks={blocks}
              onRemove={handleRemove}
              activeId={activeType}
              selectedId={selectedId}
              onSelect={handleSelect}
              hoverPreviewType={hoverPreviewType}
            />          
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