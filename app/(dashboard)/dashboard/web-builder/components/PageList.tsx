"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Loader2, Plus, Pencil, Trash2,
  AlertTriangle, Check, X, Clock, RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type PageRow = {
  id: string;
  name: string;
  updatedAt: string;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Inline rename ─────────────────────────────────────────────────────────────
function RenameInput({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }} onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && val.trim()) onSave(val.trim());
          if (e.key === "Escape") onCancel();
        }}
        style={{
          flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600,
          color: "#0f172a", background: "#fff",
          border: "1.5px solid #7c3aed", borderRadius: 5,
          padding: "2px 6px", outline: "none", fontFamily: "inherit",
        }}
      />
      <button
        onClick={() => val.trim() && onSave(val.trim())}
        style={{ display: "flex", padding: 3, background: "#ede9fe", border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        <Check size={10} color="#7c3aed" />
      </button>
      <button
        onClick={onCancel}
        style={{ display: "flex", padding: 3, background: "#f1f5f9", border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        <X size={10} color="#94a3b8" />
      </button>
    </div>
  );
}

// ── Delete confirm (inline, replaces the row) ─────────────────────────────────
function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 8px", borderRadius: 8,
        background: "#fef2f2", border: "1px solid #fecaca",
      }}
      onClick={e => e.stopPropagation()}
    >
      <AlertTriangle size={11} color="#ef4444" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: "#ef4444", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        Delete "{name}"?
      </span>
      <button
        onClick={onConfirm}
        disabled={loading}
        style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#ef4444", border: "none", borderRadius: 4, padding: "2px 7px", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 3 }}
      >
        {loading ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : null}
        Yes
      </button>
      <button
        onClick={onCancel}
        style={{ fontSize: 10, fontWeight: 600, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer" }}
      >
        No
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PagesList({ onNewPage }: { onNewPage: () => void }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const activePageId = searchParams.get("pageId");

  const [pages, setPages]         = useState<PageRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/pages?limit=50", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPages(data.data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRename = async (id: string, name: string) => {
    setRenamingId(null);
    // Optimistic
    setPages(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
    } catch {
      load(); // revert on failure
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPages(prev => prev.filter(p => p.id !== id));
      setDeletingId(null);
      // If we deleted the active page, go to new page
      if (activePageId === id) onNewPage();
    } catch {
      load();
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Empty / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 4px", color: "#94a3b8" }}>
        <Loader2 size={12} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
        <span style={{ fontSize: 11 }}>Loading pages…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 4px" }}>
        <span style={{ fontSize: 11, color: "#ef4444", flex: 1 }}>Failed to load</span>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          <RefreshCw size={10} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {pages.length === 0 && (
        <p style={{ fontSize: 11, color: "#94a3b8", padding: "6px 4px", margin: 0 }}>No saved pages yet.</p>
      )}

      {pages.map(page => {
        const isActive   = page.id === activePageId;
        const isRenaming = renamingId === page.id;
        const isDeleting = deletingId === page.id;

        if (isDeleting) {
          return (
            <DeleteConfirm
              key={page.id}
              name={page.name}
              loading={deleteLoading}
              onConfirm={() => handleDelete(page.id)}
              onCancel={() => setDeletingId(null)}
            />
          );
        }

        return (
          <div
            key={page.id}
            onClick={() => !isRenaming && router.push(`?pageId=${page.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 8px", borderRadius: 8, cursor: isRenaming ? "default" : "pointer",
              background: isActive ? "#ede9fe" : "transparent",
              border: `1px solid ${isActive ? "#c4b5fd" : "transparent"}`,
              transition: "all 0.12s",
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {/* Icon */}
            <FileText size={12} color={isActive ? "#7c3aed" : "#94a3b8"} style={{ flexShrink: 0 }} />

            {/* Name / rename input */}
            {isRenaming ? (
              <RenameInput
                initial={page.name}
                onSave={name => handleRename(page.id, name)}
                onCancel={() => setRenamingId(null)}
              />
            ) : (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? "#5b21b6" : "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {page.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                  <Clock size={9} color="#cbd5e1" />
                  <span style={{ fontSize: 9, color: "#cbd5e1" }}>{timeAgo(page.updatedAt)}</span>
                </div>
              </div>
            )}

            {/* Actions — only when not renaming */}
            {!isRenaming && (
              <div
                style={{ display: "flex", alignItems: "center", gap: 2, opacity: 0, transition: "opacity 0.12s" }}
                className="page-row-actions"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={e => { e.stopPropagation(); setRenamingId(page.id); }}
                  title="Rename"
                  style={{ display: "flex", padding: 4, background: "none", border: "none", borderRadius: 4, cursor: "pointer", color: "#94a3b8" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#e2e8f0")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDeletingId(page.id); }}
                  title="Delete"
                  style={{ display: "flex", padding: 4, background: "none", border: "none", borderRadius: 4, cursor: "pointer", color: "#94a3b8" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                >
                  <Trash2 size={10} />
                </button>
                <Link href={`/${page.id}`}>
                  <button 
                    title="Open Page"  
                    style={{ display: "flex", padding: 4, background: "none", border: "none", borderRadius: 4, cursor: "pointer", color: "#94a3b8" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                  >
                    <ArrowUpRight size={10}/>
                  </button>
                </Link>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        div:hover > .page-row-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}