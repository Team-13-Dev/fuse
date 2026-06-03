"use client";

import { useEffect, useState } from "react";
import { lighten, withAlpha } from "../helpers/ColorHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductRow {
  product_id: string;
  cluster: number;
  cluster_name: "Fast Movers" | "Balanced Performance" | string;
  job_id: string;
  updated_at: string;
  // extend with any extra columns your table has
  [key: string]: unknown;
}

interface DynamicProductsBlockProps {
  /** How many products to show (starting from Fast Movers, then others) */
  count: number;
  /** Accent colour forwarded from the parent builder */
  accentColor: string;
  /** Background colour forwarded from the parent builder */
  bgColor: string;
  /** Section label override – defaults to "Featured Products" */
  sectionLabel?: string;
  /**
   * Async function that fetches products for a given businessId.
   * Swap this out for your real API/Supabase/React-Query call.
   *
   * The component sorts the results so that cluster_name === "Fast Movers"
   * rows come first, then fills up to `count` with the remaining rows.
   */
  fetchProducts?: (businessId: string) => Promise<ProductRow[]>;
}

// ─── Default mock fetcher (replace with your real data layer) ─────────────────

async function defaultFetchProducts(count: string): Promise<ProductRow[]> {
  const res = await fetch(`/api/products/fetch-top/${count}`);
  const data = await res.json();
  console.log(data);

  return [
    { product_id: "p-001", cluster: 1, cluster_name: "Fast Movers",          job_id: "j-1", updated_at: "2026-04-28", name: "Velocity Pro",    desc: "Top-selling, high-turn item",  price: "$49" },
    { product_id: "p-002", cluster: 1, cluster_name: "Fast Movers",          job_id: "j-1", updated_at: "2026-04-28", name: "Rapid Essentials", desc: "Fast-moving staple product",  price: "$29" },
    { product_id: "p-003", cluster: 1, cluster_name: "Fast Movers",          job_id: "j-1", updated_at: "2026-04-28", name: "QuickSell Bundle", desc: "High-demand bundle offer",    price: "$79" },
    { product_id: "p-004", cluster: 0, cluster_name: "Balanced Performance", job_id: "j-1", updated_at: "2026-04-28", name: "Steady Growth",   desc: "Consistent revenue driver",  price: "$59" },
    { product_id: "p-005", cluster: 0, cluster_name: "Balanced Performance", job_id: "j-1", updated_at: "2026-04-28", name: "Core Value",      desc: "Reliable margin contributor", price: "$39" },
  ];
}

// ─── Colour helpers (duplicated here so the file is self-contained) ───────────

function clusterBadgeStyle(
  clusterName: string,
  accentColor: string,
  accentBorder: string,
  accentSoft: string
) {
  if (clusterName === "Fast Movers") {
    return {
      background: accentSoft,
      border: `1px solid ${accentBorder}`,
      color: accentColor,
    };
  }
  return {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    color: "#64748b",
  };
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard({ bgColor }: { bgColor: string }) {
  return (
    <div
      style={{
        background: bgColor,
        border: "1px solid #e2e8f0",
        borderRadius: 9,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {[100, 60, 80, 40].map((w, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 28 : 8,
            width: i === 0 ? 28 : `${w}%`,
            borderRadius: i === 0 ? 7 : 4,
            background: "#e2e8f0",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DynamicProductsBlock({
  count,
  accentColor,
  bgColor,
  sectionLabel = "Featured Products",
  fetchProducts = defaultFetchProducts,
}: DynamicProductsBlockProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Derived colour tokens (mirrors RenderedBlock conventions)
  const accentSoft   = withAlpha(accentColor, 0.08);
  const accentMid    = withAlpha(accentColor, 0.15);
  const accentBorder = withAlpha(accentColor, 0.25);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchProducts(count.toString())
      .then((rows) => {
        // Sort: Fast Movers first, then everything else
        const sorted = [
          ...rows.filter((r) => r.cluster_name === "Fast Movers"),
          ...rows.filter((r) => r.cluster_name !== "Fast Movers"),
        ];
        // Slice to the requested count
        setProducts(sorted.slice(0, count));
      })
      .catch((err) => setError(err?.message ?? "Failed to load products"))
      .finally(() => setLoading(false));
  }, [count]); 

  const base: React.CSSProperties = {
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: bgColor,
    overflow: "hidden",
    padding: 18,
  };

  // ── Resolve grid columns: 1–2 → stack, 3+ → 3-col ──────────────────────────
  const cols =
    products.length === 1
      ? "1fr"
      : products.length === 2
      ? "1fr 1fr"
      : "repeat(3, 1fr)";

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ ...base, color: "#ef4444", fontSize: 13 }}>
        ⚠ {error}
      </div>
    );
  }

  return (
    <div style={base}>
      {/* Section label */}
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#94a3b8",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 14,
          margin: "0 0 14px",
        }}
      >
        {sectionLabel}
      </p>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: loading ? "repeat(3, 1fr)" : cols,
          gap: 10,
        }}
      >
        {loading
          ? // Render `count` skeleton cards while fetching
            Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} bgColor={bgColor} />
            ))
          : products.map((product, i) => {
              const isFastMover = product.cluster_name === "Fast Movers";
              const badgeStyle  = clusterBadgeStyle(
                product.cluster_name,
                accentColor,
                accentBorder,
                accentSoft
              );

              // Resolve display fields with safe fallbacks
              const name  = (product.name  as string) ?? product.product_id;
              const desc  = (product.desc  as string) ?? product.cluster_name;
              const price = (product.price as string) ?? "—";

              return (
                <div
                  key={product.product_id ?? i}
                  style={{
                    background: isFastMover ? accentSoft : bgColor,
                    border: `1px solid ${isFastMover ? accentBorder : "#e2e8f0"}`,
                    borderRadius: 9,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {/* Cluster badge */}
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      borderRadius: 100,
                      padding: "3px 8px",
                      alignSelf: "flex-start",
                      ...badgeStyle,
                    }}
                  >
                    {isFastMover ? "★ " : ""}
                    {product.cluster_name}
                  </span>

                  {/* Icon placeholder */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: accentMid,
                      border: `1px solid ${accentBorder}`,
                    }}
                  />

                  {/* Name */}
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>
                    {name}
                  </p>

                  {/* Description */}
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
                    {desc}
                  </p>

                  {/* Price */}
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "4px 0 0" }}>
                    {price}
                    <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8" }}>/mo</span>
                  </p>
                </div>
              );
            })}
      </div>
    </div>
  );
}