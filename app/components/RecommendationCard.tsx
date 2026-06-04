// components/RecommendationCard.tsx
"use client";
import { Recommendation } from "@/lib/llm";

const LEVEL_CONFIG = {
  high: { label: "HIGH", color: "var(--high)", bg: "var(--high-bg)", bar: 100 },
  medium: { label: "MED", color: "var(--medium)", bg: "var(--medium-bg)", bar: 66 },
  low: { label: "LOW", color: "var(--low)", bg: "var(--low-bg)", bar: 33 },
};

export default function RecommendationCard({
  rec,
  index,
}: {
  rec: Recommendation;
  index: number;
}) {
  const cfg = LEVEL_CONFIG[rec.priority_level];

  return (
    <article
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        animationDelay: `${index * 80}ms`,
        animationFillMode: "both",
      }}
      className="card-enter"
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 500,
              color: cfg.color,
              background: cfg.bg,
              border: `1px solid ${cfg.color}33`,
              borderRadius: "4px",
              padding: "3px 8px",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            }}
          >
            {cfg.label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--muted)",
            }}
          >
            #{rec.priority}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 500,
            color: cfg.color,
            textAlign: "right",
            lineHeight: 1.3,
          }}
        >
          {rec.impact}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "17px",
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1.25,
        }}
      >
        {rec.title}
      </h3>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--border)" }} />

      {/* Insight */}
      <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
        <span style={{ color: "var(--text)", fontWeight: 500 }}>Insight: </span>
        {rec.insight}
      </p>

      {/* Action */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderLeft: `3px solid ${cfg.color}`,
          borderRadius: "6px",
          padding: "12px 14px",
          fontSize: "13px",
          color: "var(--text)",
          lineHeight: 1.6,
        }}
      >
        → {rec.action}
      </div>

      {/* Priority bar */}
      <div>
        <div
          style={{
            height: "3px",
            background: "var(--border)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${cfg.bar}%`,
              background: cfg.color,
              borderRadius: "2px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-enter {
          animation: cardEnter 0.4s ease both;
        }
      `}</style>
    </article>
  );
}
