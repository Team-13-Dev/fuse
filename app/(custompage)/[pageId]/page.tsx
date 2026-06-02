"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { DEFAULT_ACCENT, DEFAULT_BG } from '@/app/(dashboard)/dashboard/web-builder/components/CanvasBlock';
import { BlockInstance, BlockType } from '@/app/(dashboard)/dashboard/web-builder/WebBuilderTypes';
import RenderedBlock from '@/app/(dashboard)/dashboard/web-builder/components/RenderedBlock';
import { getText } from '@/app/(dashboard)/dashboard/web-builder/helpers/TextHelpers';

interface PageProps {
  params: Promise<{ pageId: string }> | { pageId: string };
}

export default function RenderPage({ params }: PageProps) {
  const [pageName, setPageName] = useState<string>("");
  const [blocks, setBlocks] = useState<BlockInstance[]>([]);
  const [loading, setLoading] = useState<boolean>(true); 
  const [error, setError] = useState<boolean>(false);

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Resolve params safely whether it's synchronous or a Promise
        const resolvedParams = await params;
        const pageId = resolvedParams?.pageId;
        
        if (!pageId) throw new Error("Missing pageId");

        const res = await fetch(`/api/pages/${pageId}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (cancelled) return;

        setPageName(data.name);
        setBlocks(data.blocks?.length ? blocksFromApi(data.blocks) : []);
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setBlocks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Loader2 size={24} color="#7c3aed" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Loading page layout…</span>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <AlertCircle size={24} color="#ef4444" />
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Failed to load page layout.</span>
      </div>
    );
  }

  // ── Render view ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <main style={{ display: "flex", flexDirection: "column" }}>
        {blocks.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: "#94a3b8", fontSize: 13 }}>
            This page has no components configured.
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