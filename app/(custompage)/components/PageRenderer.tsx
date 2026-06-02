"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { getText } from "@/app/(dashboard)/dashboard/web-builder/helpers/TextHelpers";
import RenderedBlock from "@/app/(dashboard)/dashboard/web-builder/components/RenderedBlock";
import { DEFAULT_ACCENT, DEFAULT_BG } from "@/app/(dashboard)/dashboard/web-builder/components/CanvasBlock";
RenderedBlock
type BlockType =
  | "header"
  | "hero"
  | "products"
  | "contact"
  | "footer"
  | "testimonials";

type BlockInstance = {
  instanceId: string;
  type: BlockType;
  accentColor?: string;
  bgColor?: string;
  text?: Record<string, string>;
};

// ── API Helper ────────────────────────────────────────────────────────────────
function blocksFromApi(apiBlocks: any[]): BlockInstance[] {
  return [...apiBlocks]
    .sort((a, b) => a.position - b.position)
    .map((b) => ({
      instanceId:  `${b.type}-${b.id}`,
      type:        b.type as BlockType,
      accentColor: b.accentColor  ?? DEFAULT_ACCENT,
      bgColor:     b.bgColor      ?? DEFAULT_BG,
      text:        b.textOverrides ?? {},
    }));
}

export default function PageRenderer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get("pageId");

  const [blocks, setBlocks] = useState<BlockInstance[]>([]);
  const [pageName, setPageName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ── Load Page Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pageId) {
      setLoading(false);
      setError(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const res = await fetch(`/api/pages/${pageId}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        if (cancelled) return;
        
        setPageName(data.name);
        setBlocks(data.blocks?.length ? blocksFromApi(data.blocks) : []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  // ── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 12, background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Loader2 size={28} color="#7c3aed" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Loading page layout…</span>
      </div>
    );
  }

  // ── Error / Missing ID State ────────────────────────────────────────────────
  if (error || !pageId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif", padding: 20, textAlign: "center" }}>
        <AlertCircle size={40} color="#ef4444" />
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Failed to load page</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>The requested page could not be found or failed to load.</p>
        </div>
        <button
          onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#475569", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    );
  }

  // ── Rendered View ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* Optional: Simple floating/fixed admin preview top-bar (Remove if you want a pure user-facing look) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            title="Return to builder"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}
          >
            <ArrowLeft size={13} color="#64748b" />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{pageName}</span>
          <span style={{ fontSize: 11, color: "#059669", background: "#dcfce7", padding: "2px 8px", borderRadius: 100, fontWeight: 500 }}>Live View</span>
        </div>
      </div>

      {/* Main Page Layout Output */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {blocks.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
            This page does not contain any components yet.
          </div>
        ) : (
          blocks.map((block) => (
            <RenderedBlock
              key={block.instanceId}
              type={block.type}
              accentColor={block.accentColor ?? DEFAULT_ACCENT}
              bgColor={block.bgColor ?? DEFAULT_BG}
              text={getText(block)}
            />
          ))
        )}
      </main>
      
    </div>
  );
}