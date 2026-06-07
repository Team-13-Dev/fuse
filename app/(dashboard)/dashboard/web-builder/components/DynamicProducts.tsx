"use client";

import { useEffect, useState } from "react";
import { withAlpha } from "../helpers/ColorHelpers";
import { ChevronDown } from "lucide-react";

type TopProduct = {
  id:           string;
  name:         string;
  description:  string | null;
  price:        string;
  imagesUrl:    string[] | null;
  stock:        number | null;
  clusterName:  string | null;
  totalRevenue: number;
  totalSold:    number;
};

// Badge styling per segment
const SEGMENT_BADGE: Record<string, { bg: string; border: string; color: string; label: string }> = {
  "Premium Stars": {
    bg: "#fef9c3", border: "#fde047", color: "#854d0e", label: "★ Premium Stars",
  },
  "Fast Movers": {
    bg: "", border: "", color: "", label: "⚡ Fast Movers",   // filled dynamically with accent
  },
  "Balanced Performance": {
    bg: "#f0fdf4", border: "#86efac", color: "#166534", label: "◎ Balanced",
  },
};

export default function DynamicProductsBlock({
  accentColor,
  bgColor,
  sectionLabel,
  displayMode,
}: {
  accentColor:  string;
  bgColor:      string;
  sectionLabel: string;
  displayMode:  "grid" | "list";
}) {
  const [count,    setCount]    = useState(3);
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const accentSoft   = withAlpha(accentColor, 0.08);
  const accentBorder = withAlpha(accentColor, 0.25);
  const accentMid    = withAlpha(accentColor, 0.15);

  // Fill accent-dependent Fast Movers badge
  SEGMENT_BADGE["Fast Movers"].bg     = accentSoft;
  SEGMENT_BADGE["Fast Movers"].border = accentBorder;
  SEGMENT_BADGE["Fast Movers"].color  = accentColor;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/products/top?count=${count}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => setProducts(data.products ?? []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [count]);

  const base = {
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: bgColor,
    overflow: "hidden",
    padding: 18,
  };

  function SegmentBadge({ name }: { name: string | null }) {
    if (!name) return null;
    const badge = SEGMENT_BADGE[name];
    if (!badge) return null;
    return (
      <span style={{
        fontSize: 8, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", borderRadius: 100, padding: "2px 6px",
        background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color,
      }}>
        {badge.label}
      </span>
    );
  }

  function CountSelector() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>Show</span>
        <div style={{ position: "relative" }}>
          <select
            value={count}
            onChange={e => setCount(Math.max(3, parseInt(e.target.value, 10)))}
            style={{
              appearance: "none",
              fontSize: 11, fontWeight: 600, color: "#0f172a",
              background: accentSoft, border: `1px solid ${accentBorder}`,
              borderRadius: 6, padding: "3px 22px 3px 8px",
              cursor: "pointer", outline: "none",
            }}
          >
            {[3, 5, 6, 9, 12].map(n => (
              <option key={n} value={n}>{n} products</option>
            ))}
          </select>
          <ChevronDown
            size={10}
            color={accentColor}
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
        </div>
      </div>
    );
  }

  const cols = count <= 3 ? 3 : count <= 6 ? 3 : 4;

  return (
    <div style={base}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
          {sectionLabel}
        </p>
        <CountSelector />
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 100 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Loading products…</span>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 100 }}>
          <span style={{ fontSize: 12, color: "#ef4444" }}>Failed to load: {error}</span>
        </div>
      )}

      {!loading && !error && displayMode === "grid" && (
        <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
    paddingTop: 8,
  }}
>
  {products.map((p, i) => (
      <div
        key={p.id}
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          transition: "all .25s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow =
            "0 8px 24px rgba(0,0,0,0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 2px 8px rgba(0,0,0,0.04)";
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
            }}
          >
            #{i + 1}
          </span>

          <SegmentBadge name={p.clusterName} />
        </div>

        {/* Product */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          {p.imagesUrl?.[0] ? (
            <img
              src={p.imagesUrl[0]}
              alt={p.name}
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                objectFit: "cover",
                border: "1px solid #e2e8f0",
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: accentMid,
                border: `1px solid ${accentBorder}`,
              }}
            />
          )}

          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: 14,
                color: "#0f172a",
              }}
            >
              {p.name}
            </p>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                color: "#94a3b8",
              }}
            >
              {p.totalSold} units sold
            </p>
          </div>
        </div>

        {/* Bottom stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 10,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "#94a3b8",
              }}
            >
              Price
            </p>

            <p
              style={{
                margin: "2px 0 0",
                fontSize: 15,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              EGP {parseFloat(p.price).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
        ))}
      </div>
      )}

      {!loading && !error && displayMode === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map((p, i) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 9, padding: "10px 12px",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1", minWidth: 18 }}>#{i + 1}</span>
              {p.imagesUrl?.[0] ? (
                <img src={p.imagesUrl[0]} alt={p.name}
                  style={{ width: 36, height: 36, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 7, background: accentMid, border: `1px solid ${accentBorder}`, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>{p.name}</p>
                  <SegmentBadge name={p.clusterName} />
                </div>
                <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{p.totalSold} units sold</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}