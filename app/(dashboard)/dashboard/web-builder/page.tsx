"use client"
import React, { useState, useId } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay, pointerWithin } from "@dnd-kit/core";
import {
  Menu, Square, LayoutGrid, List, AlignJustify, MessageSquare,
  Trash2, GripVertical, Plus, Layers, X, ChevronRight
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type BlockType = "header" | "hero" | "products" | "contact" | "footer" | "testimonials";

interface PlacedBlock {
  instanceId: string;
  type: BlockType;
}

interface BlockDef {
  type: BlockType;
  label: string;
  icon: React.ElementType;
  description: string;
}

// ── Block Catalogue ─────────────────────────────────────────────────────────
const BLOCK_DEFS: BlockDef[] = [
  { type: "header",       label: "Header",       icon: Menu,          description: "Navigation bar" },
  { type: "hero",         label: "Hero",          icon: Square,        description: "Full-width banner" },
  { type: "products",     label: "Products",      icon: LayoutGrid,    description: "Product grid" },
  { type: "contact",      label: "Contact",       icon: List,          description: "Contact form" },
  { type: "footer",       label: "Footer",        icon: AlignJustify,  description: "Page footer" },
  { type: "testimonials", label: "Testimonials",  icon: MessageSquare, description: "Customer reviews" },
];

// ── Sidebar Block (Draggable) ────────────────────────────────────────────────
function SidebarBlock({ def }: { def: BlockDef }) {
  const Icon = def.icon;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar__${def.type}`,
    data: { type: def.type, source: "sidebar" },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1, transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined }}
      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab select-none
                 bg-[#f2f2f2] text-black border border-[#898989] hover:border-[#6c63ff] hover:text-white hover:bg-[#4d4d4d]
                 transition-all duration-150 active:cursor-grabbing"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[#6c63ff]/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#6c63ff]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-none">{def.label}</p>
        <p className="text-[10px] text-[#888] mt-0.5 truncate">{def.description}</p>
      </div>
      <Plus className="w-3.5 h-3.5 text-[#555] group-hover:text-[#6c63ff] transition-colors" />
    </div>
  );
}

// ── Canvas Drop Zone ─────────────────────────────────────────────────────────
function Canvas({ blocks, onRemove, activeId }: { blocks: PlacedBlock[]; onRemove: (id: string) => void; activeId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[600px] rounded-xl transition-all duration-200
        ${isOver ? "ring-2 ring-[#6c63ff] bg-[#6c63ff]/5" : "bg-[#0f0f1a]"}
        border ${isOver ? "border-[#6c63ff]" : "border-[#1e1e3a]"}`}
    >
      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 pointer-events-none">
          <div className="w-14 h-14 rounded-xl bg-[#1a1a2e] border border-dashed border-[#2a2a4a] flex items-center justify-center">
            <Layers className="w-6 h-6 text-[#333]" />
          </div>
          <p className="text-[#444] text-sm font-medium">Drop blocks here to build your page</p>
        </div>
      ) : (
        <div className="p-5 space-y-2">
          {blocks.map((block) => (
            <CanvasBlock key={block.instanceId} block={block} onRemove={onRemove} />
          ))}

          {/* Ghost drop indicator */}
          {activeId && (
            <div className="border-2 border-dashed border-[#6c63ff]/40 rounded-lg h-12 flex items-center justify-center text-[#6c63ff]/50 text-xs font-medium">
              Drop here
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Canvas Placed Block ───────────────────────────────────────────────────────
function CanvasBlock({ block, onRemove }: { block: PlacedBlock; onRemove: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative group rounded-lg overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Controls overlay */}
      <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 transition-opacity duration-150 ${hovered ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
          <span className="text-[10px] font-mono text-[#888] uppercase tracking-wider mr-1">{block.type}</span>
          <button
            onClick={() => onRemove(block.instanceId)}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
            title="Remove block"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Grip indicator */}
      <div className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 transition-opacity duration-150 ${hovered ? "opacity-100" : "opacity-0"}`}>
        <GripVertical className="w-4 h-4 text-white/30" />
      </div>

      <RenderedBlock type={block.type} />
    </div>
  );
}

// ── Block Renderers ─────────────────────────────────────────────────────────
function RenderedBlock({ type }: { type: BlockType }) {
  switch (type) {
    case "header":
      return (
        <div className="bg-[#f2f2f2] border border-[#1e1e3a] px-6 py-3 flex items-center justify-between rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6c63ff]" />
            <span className="text-white font-bold text-sm tracking-tight">YourBrand</span>
          </div>
          <div className="flex items-center gap-5">
            {["Home","About","Services","Contact"].map(n => (
              <span key={n} className="text-[#888] text-xs hover:text-white transition-colors cursor-pointer">{n}</span>
            ))}
          </div>
          <button className="bg-[#6c63ff] text-white text-xs font-semibold px-3 py-1.5 rounded-md">Get Started</button>
        </div>
      );

    case "hero":
      return (
        <div className="bg-gradient-to-br from-[#0d0d26] via-[#12122e] to-[#0d0d26] border border-[#1e1e3a] rounded-lg px-10 py-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#6c63ff18_0%,transparent_70%)]" />
          <div className="relative">
            <span className="inline-block text-[10px] font-semibold tracking-widest text-[#6c63ff] uppercase border border-[#6c63ff]/30 rounded-full px-3 py-1 mb-4">
              Welcome to the future
            </span>
            <h1 className="text-3xl font-black text-white leading-tight mb-3">
              Build Something <span className="text-[#6c63ff]">Extraordinary</span>
            </h1>
            <p className="text-[#666] text-sm max-w-md mx-auto mb-6">
              Drag, drop, and compose beautiful pages in seconds with our intuitive visual builder.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button className="bg-[#6c63ff] hover:bg-[#7b73ff] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                Start Building
              </button>
              <button className="text-[#888] text-sm flex items-center gap-1 hover:text-white transition-colors">
                Learn more <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );

    case "products":
      return (
        <div className="bg-[#0c0c1e] border border-[#1e1e3a] rounded-lg p-5">
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">Featured Products</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Pro Plan", price: "$29", color: "#6c63ff" },
              { name: "Team Plan", price: "$79", color: "#ff6584" },
              { name: "Enterprise", price: "$199", color: "#43d8a0" },
            ].map((p) => (
              <div key={p.name} className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-4 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ background: p.color + "33", border: `1px solid ${p.color}44` }} />
                <p className="text-white text-xs font-semibold">{p.name}</p>
                <p className="text-[#888] text-[10px]">Everything you need</p>
                <p className="text-white font-bold text-sm mt-1">{p.price}<span className="text-[#555] font-normal text-[10px]">/mo</span></p>
              </div>
            ))}
          </div>
        </div>
      );

    case "contact":
      return (
        <div className="bg-[#0c0c1e] border border-[#1e1e3a] rounded-lg p-5">
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">Get in Touch</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-[#12122a] border border-[#1e1e3a] rounded-md px-3 py-2">
              <p className="text-[10px] text-[#555] mb-1">Name</p>
              <div className="h-1.5 w-24 bg-[#1e1e3a] rounded" />
            </div>
            <div className="bg-[#12122a] border border-[#1e1e3a] rounded-md px-3 py-2">
              <p className="text-[10px] text-[#555] mb-1">Email</p>
              <div className="h-1.5 w-28 bg-[#1e1e3a] rounded" />
            </div>
          </div>
          <div className="bg-[#12122a] border border-[#1e1e3a] rounded-md px-3 py-2 mb-3">
            <p className="text-[10px] text-[#555] mb-1">Message</p>
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-[#1e1e3a] rounded" />
              <div className="h-1.5 w-3/4 bg-[#1e1e3a] rounded" />
            </div>
          </div>
          <button className="bg-[#6c63ff] text-white text-xs font-semibold px-4 py-2 rounded-md">Send Message</button>
        </div>
      );

    case "footer":
      return (
        <div className="bg-[#080816] border border-[#1e1e3a] rounded-lg px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#6c63ff]" />
              <span className="text-[#555] text-xs font-semibold">YourBrand</span>
            </div>
            <div className="flex items-center gap-4">
              {["Privacy","Terms","Contact"].map(l => (
                <span key={l} className="text-[10px] text-[#444] hover:text-[#888] cursor-pointer transition-colors">{l}</span>
              ))}
            </div>
            <p className="text-[10px] text-[#333]">© 2026 All rights reserved</p>
          </div>
        </div>
      );

    case "testimonials":
      return (
        <div className="bg-[#0c0c1e] border border-[#1e1e3a] rounded-lg p-5">
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">What People Say</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Sarah K.", role: "Designer", text: "Absolutely transformed how our team ships landing pages." },
              { name: "Marco R.", role: "Developer", text: "Incredibly fast workflow — what used to take days now takes minutes." },
            ].map((t) => (
              <div key={t.name} className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-4">
                <div className="flex mb-2 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[#6c63ff] text-xs">★</span>
                  ))}
                </div>
                <p className="text-[#aaa] text-xs leading-relaxed mb-3">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#ff6584]" />
                  <div>
                    <p className="text-white text-[10px] font-semibold leading-none">{t.name}</p>
                    <p className="text-[#555] text-[9px] mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ── Drag Overlay Ghost ────────────────────────────────────────────────────────
function DragGhost({ type }: { type: BlockType | null }) {
  if (!type) return null;
  const def = BLOCK_DEFS.find(d => d.type === type);
  if (!def) return null;
  const Icon = def.icon;
  return (
    <div className="flex items-center gap-2 bg-[#6c63ff] text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl shadow-[#6c63ff]/40 opacity-95 pointer-events-none">
      <Icon className="w-4 h-4" />
      {def.label}
    </div>
  );
}

// ── Main Builder ─────────────────────────────────────────────────────────────
export default function WebsiteBuilder() {
  const [blocks, setBlocks] = useState<PlacedBlock[]>([
    { instanceId: "init-header", type: "header" },
    { instanceId: "init-hero",   type: "hero" },
  ]);
  const [activeType, setActiveType] = useState<BlockType | null>(null);

  const handleDragStart = (event: any) => {
    const { type } = event.active.data?.current ?? {};
    setActiveType(type ?? null);
  };

  const handleDragEnd = (event: any) => {
    setActiveType(null);
    const { active, over } = event;
    if (over?.id === "canvas") {
      const type: BlockType = active.data?.current?.type ?? active.id.replace("sidebar__", "");
      const instanceId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setBlocks(prev => [...prev, { instanceId, type }]);
    }
  };

  const handleRemove = (instanceId: string) => {
    setBlocks(prev => prev.filter(b => b.instanceId !== instanceId));
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-[#fff] font-sans overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[#12122a] bg-[#fff]">
          {/* Block list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <p className="text-[#444] text-[10px] font-semibold uppercase tracking-widest px-1 mb-2">Components</p>
            {BLOCK_DEFS.map(def => (
              <SidebarBlock key={def.type} def={def} />
            ))}
          </div>

          {/* Block count badge */}
          <div className="px-4 py-3 border-t border-[#454545]">
            <div className="flex items-center justify-between text-[10px] text-[#444]">
              <span>Placed blocks</span>
              <span className="bg-[#6c63ff]/20 text-[#6c63ff] font-bold px-2 py-0.5 rounded-full">
                {blocks.length}
              </span>
            </div>
          </div>
        </aside>

        {/* ── Main canvas area ──────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#5c5c5c] bg-[#f2f2f2]">

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBlocks([])}
                disabled={blocks.length === 0}
                className="flex items-center gap-1.5 text-[10px] text-[#555] hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-colors px-2 py-1 rounded border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>
          </div>

          {/* Scrollable canvas */}
          <div className="flex-1 overflow-y-auto p-6">
            <Canvas blocks={blocks} onRemove={handleRemove} activeId={activeType} />
          </div>
        </main>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        <DragGhost type={activeType} />
      </DragOverlay>
    </DndContext>
  );
}