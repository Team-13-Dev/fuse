"use client";

import { ChevronRight, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { lighten, withAlpha } from "../helpers/ColorHelpers";
import { BlockType } from "../WebBuilderTypes";
import DynamicProductsBlock from "./DynamicProducts";

export default function RenderedBlock({
  type,
  accentColor,
  bgColor,
  text,
  productCount,
}: {
  type:          BlockType;
  accentColor:   string;
  bgColor:       string;
  text:          any;
  productCount?: number;
}) {
  const accentLight  = lighten(accentColor, 0.88);
  const accentSoft   = withAlpha(accentColor, 0.08);
  const accentMid    = withAlpha(accentColor, 0.15);
  const accentBorder = withAlpha(accentColor, 0.25);
  const base = { borderRadius:10, border:"1px solid #e2e8f0", background:bgColor, overflow:"hidden" };

  switch (type) {
    // ── Header ────────────────────────────────────────────────────────────────
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
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:7, background:accentSoft, border:`1px solid ${accentBorder}`, cursor:"pointer" }}>
              <ShoppingCart size={14} color={accentColor} />
            </button>
            <button style={{ background:accentColor, color:"#fff", fontSize:11, fontWeight:600, padding:"6px 14px", borderRadius:7, border:"none", cursor:"pointer" }}>{text.cta}</button>
          </div>
        </div>
      );

    // ── Hero ──────────────────────────────────────────────────────────────────
    case "hero":
      return (
        <div style={{ ...base, background:`linear-gradient(135deg, ${bgColor} 0%, ${accentLight} 100%)`, padding:"44px 40px", textAlign:"center", position:"relative" }}>
          <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 0%, ${withAlpha(accentColor,0.06)} 0%, transparent 60%)`, pointerEvents:"none" }} />
          <div style={{ position:"relative" }}>
            <span style={{ display:"inline-block", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:accentColor, border:`1px solid ${accentBorder}`, borderRadius:100, padding:"4px 12px", marginBottom:14, background:accentSoft }}>{text.eyebrow}</span>
            <h1 style={{ fontSize:26, fontWeight:800, color:"#0f172a", margin:"0 0 10px", lineHeight:1.2 }}>
              {(() => { const words = text.heading.split(" "); return words.map((w:any,i:any) => i===words.length-1 ? <span key={i} style={{ color:accentColor }}>{i>0?" ":""}{w}</span> : <span key={i}>{w}{" "}</span>); })()}
            </h1>
            <p style={{ color:"#64748b", fontSize:13, maxWidth:360, margin:"0 auto 20px", lineHeight:1.6 }}>{text.subheading}</p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
              <button style={{ background:accentColor, color:"#fff", fontSize:12, fontWeight:600, padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer" }}>{text.primaryCta}</button>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", fontSize:12, display:"flex", alignItems:"center", gap:3 }}>{text.secondaryCta} <ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      );

    // ── Products (static preview grid, uses DynamicProductsBlock when productCount set) ──
    case "products": {
      const count = productCount ?? 3;
      return (
        <DynamicProductsBlock
          accentColor={accentColor}
          bgColor={bgColor}
          sectionLabel={text.sectionLabel}
          displayMode="grid"
        />
      );
    }

    // ── Product List (fetches real data) ──────────────────────────────────────
    case "productList": {
      const count = productCount ?? 3;
      return (
        <DynamicProductsBlock
            accentColor={accentColor}
            bgColor={bgColor}
            sectionLabel={text.sectionLabel}
            displayMode="list"
          />
      );
    }

    // ── Cart ──────────────────────────────────────────────────────────────────
    case "cart":
      return (
        <div style={{ ...base, padding:18 }}>
          <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>{text.sectionLabel}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:14 }}>
            {/* Cart items */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { name:"Velocity Pro", price:"$49", qty:2, badge:"Fast Movers", badgeBg:accentSoft, badgeBorder:accentBorder, badgeColor:accentColor },
                { name:"Premium Bundle", price:"$99", qty:1, badge:"Premium Stars", badgeBg:"#fef9c3", badgeBorder:"#fde047", badgeColor:"#854d0e" },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:9, padding:"10px 12px" }}>
                  <div style={{ width:36, height:36, borderRadius:7, background:accentMid, border:`1px solid ${accentBorder}`, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                      <p style={{ fontSize:12, fontWeight:600, color:"#0f172a", margin:0 }}>{item.name}</p>
                      <span style={{ fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", borderRadius:100, padding:"2px 6px", background:item.badgeBg, border:`1px solid ${item.badgeBorder}`, color:item.badgeColor }}>{item.badge}</span>
                    </div>
                    <p style={{ fontSize:11, fontWeight:700, color:accentColor, margin:0 }}>{item.price}</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <button style={{ width:20, height:20, borderRadius:5, background:accentSoft, border:`1px solid ${accentBorder}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Minus size={9} color={accentColor} />
                    </button>
                    <span style={{ fontSize:11, fontWeight:600, color:"#0f172a", minWidth:14, textAlign:"center" }}>{item.qty}</span>
                    <button style={{ width:20, height:20, borderRadius:5, background:accentSoft, border:`1px solid ${accentBorder}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Plus size={9} color={accentColor} />
                    </button>
                  </div>
                  <button style={{ width:22, height:22, borderRadius:5, background:"#fef2f2", border:"1px solid #fecaca", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginLeft:4 }}>
                    <Trash2 size={10} color="#ef4444" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:9, padding:14, display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#0f172a", margin:0 }}>{text.summaryTitle}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  { label:text.labelSubtotal, val:"$197.00" },
                  { label:text.labelShipping, val:text.shippingValue },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:11, color:"#64748b" }}>{r.label}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:"#0f172a" }}>{r.val}</span>
                  </div>
                ))}
                <div style={{ borderTop:"1px solid #e2e8f0", paddingTop:8, marginTop:2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{text.labelTotal}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:accentColor }}>$197.00</span>
                </div>
              </div>
              <button style={{ background:accentColor, color:"#fff", fontSize:12, fontWeight:700, padding:"9px 14px", borderRadius:8, border:"none", cursor:"pointer", textAlign:"center", marginTop:4 }}>{text.ctaCheckout}</button>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", fontSize:11, textAlign:"center", textDecoration:"underline" }}>{text.ctaContinue}</button>
            </div>
          </div>
        </div>
      );

    // ── Contact ───────────────────────────────────────────────────────────────
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
    // ── Order Review ──────────────────────────────────────────────────────────────
    case "orderReview":
      return (
        <div style={{ ...base, padding: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>{text.sectionLabel}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {[
              { name: "Velocity Pro",    qty: 2, price: "$49.00", sub: "$98.00",  badgeBg: accentSoft,   badgeBorder: accentBorder, badgeColor: accentColor,  badge: "Fast Movers"   },
              { name: "Premium Bundle",  qty: 1, price: "$99.00", sub: "$99.00",  badgeBg: "#fef9c3",    badgeBorder: "#fde047",    badgeColor: "#854d0e",    badge: "Premium Stars" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "10px 12px" }}>
                <div style={{ width: 38, height: 38, borderRadius: 7, background: accentMid, border: `1px solid ${accentBorder}`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>{item.name}</p>
                    <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderRadius: 100, padding: "2px 6px", background: item.badgeBg, border: `1px solid ${item.badgeBorder}`, color: item.badgeColor }}>{item.badge}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>Qty: {item.qty} × {item.price}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Totals breakdown */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { label: text.labelSubtotal,  val: "$197.00",  muted: false },
              { label: text.labelShipping,  val: text.shippingValue, muted: true  },
              { label: text.labelTax,       val: "$15.76",   muted: true  },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: r.muted ? "#94a3b8" : "#64748b" }}>{r.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0f172a" }}>{r.val}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{text.labelTotal}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: accentColor }}>$212.76</span>
            </div>
          </div>
        </div>
      );

    // ── Checkout Form ─────────────────────────────────────────────────────────────
    case "checkoutForm":
      return (
        <div style={{ ...base, padding: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>{text.sectionLabel}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Contact */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{text.stepContact}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[text.fieldFirstName, text.fieldLastName].map(label => (
                  <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 12px" }}>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 5px" }}>{label}</p>
                    <div style={{ height: 6, width: 70, background: "#e2e8f0", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 12px", marginTop: 8 }}>
                <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 5px" }}>{text.fieldEmail}</p>
                <div style={{ height: 6, width: 130, background: "#e2e8f0", borderRadius: 4 }} />
              </div>
            </div>

            {/* Shipping */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{text.stepShipping}</p>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 12px", marginBottom: 8 }}>
                <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 5px" }}>{text.fieldAddress}</p>
                <div style={{ height: 6, width: "85%", background: "#e2e8f0", borderRadius: 4 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[text.fieldCity, text.fieldState, text.fieldZip].map(label => (
                  <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 12px" }}>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 5px" }}>{label}</p>
                    <div style={{ height: 6, width: 50, background: "#e2e8f0", borderRadius: 4 }} />
                  </div>
                ))}
              </div>

              {/* Shipping method picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {[
                  { label: text.shipStandard, sub: text.shipStandardDays, price: text.shippingValue, selected: false },
                  { label: text.shipExpress,  sub: text.shipExpressDays,  price: "$9.99",            selected: true  },
                ].map((opt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: opt.selected ? accentSoft : "#f8fafc", border: `1px solid ${opt.selected ? accentBorder : "#e2e8f0"}`, borderRadius: 8, padding: "9px 12px" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${opt.selected ? accentColor : "#cbd5e1"}`, background: opt.selected ? accentColor : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {opt.selected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", margin: 0 }}>{opt.label}</p>
                      <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{opt.sub}</p>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: opt.selected ? accentColor : "#0f172a", margin: 0 }}>{opt.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{text.stepPayment}</p>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 12px", marginBottom: 8 }}>
                <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 5px" }}>{text.fieldCardNumber}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ height: 6, width: 100, background: "#e2e8f0", borderRadius: 4 }} />
                  <div style={{ display: "flex", gap: 4 }}>
                    {["#1a1f71", "#f79e1b", "#EB001B"].map((c, i) => (
                      <div key={i} style={{ width: 22, height: 14, borderRadius: 3, background: i === 0 ? c : "transparent", border: i > 0 ? `1px solid #e2e8f0` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {i === 1 && <div style={{ display: "flex" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EB001B", opacity: 0.9 }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F79E1B", marginLeft: -4, opacity: 0.9 }} /></div>}
                        {i === 2 && <div style={{ fontSize: 6, fontWeight: 800, color: "#006FCF" }}>AMEX</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[text.fieldExpiry, text.fieldCVV].map(label => (
                  <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 12px" }}>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 5px" }}>{label}</p>
                    <div style={{ height: 6, width: 50, background: "#e2e8f0", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            </div>

            <button style={{ background: accentColor, color: "#fff", fontSize: 12, fontWeight: 700, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "center" }}>{text.ctaPlace}</button>
            <p style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", margin: 0 }}>🔒 {text.secureNote}</p>
          </div>
        </div>
      );

    // ── Order Confirmation ────────────────────────────────────────────────────────
    case "orderConfirmation":
      return (
        <div style={{ ...base, padding: "32px 24px", textAlign: "center" }}>
          {/* Checkmark */}
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: accentSoft, border: `2px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor, border: `1px solid ${accentBorder}`, borderRadius: 100, padding: "4px 12px", marginBottom: 12, background: accentSoft }}>{text.eyebrow}</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>{text.heading}</h2>
          <p style={{ fontSize: 12, color: "#64748b", maxWidth: 320, margin: "0 auto 20px", lineHeight: 1.6 }}>{text.subheading}</p>

          {/* Order meta pill row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: text.metaOrderLabel, val: text.metaOrderVal  },
              { label: text.metaDateLabel,  val: text.metaDateVal   },
              { label: text.metaEtaLabel,   val: text.metaEtaVal    },
            ].map(m => (
              <div key={m.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", textAlign: "center" }}>
                <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: 0 }}>{m.val}</p>
              </div>
            ))}
          </div>

          {/* Compact item recap */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "10px 14px", marginBottom: 16, textAlign: "left", display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { name: "Velocity Pro",   qty: 2, price: "$98.00",  badgeBg: accentSoft,  badgeBorder: accentBorder, badgeColor: accentColor, badge: "Fast Movers"   },
              { name: "Premium Bundle", qty: 1, price: "$99.00",  badgeBg: "#fef9c3",   badgeBorder: "#fde047",    badgeColor: "#854d0e",   badge: "Premium Stars" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: accentMid, border: `1px solid ${accentBorder}`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", margin: 0 }}>{item.name}</p>
                    <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderRadius: 100, padding: "1px 5px", background: item.badgeBg, border: `1px solid ${item.badgeBorder}`, color: item.badgeColor }}>{item.badge}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>Qty: {item.qty}</p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: 0 }}>{item.price}</p>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 7, marginTop: 2, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{text.labelTotal}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: accentColor }}>$212.76</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button style={{ background: accentColor, color: "#fff", fontSize: 11, fontWeight: 700, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer" }}>{text.ctaPrimary}</button>
            <button style={{ background: accentSoft, color: accentColor, fontSize: 11, fontWeight: 600, padding: "8px 18px", borderRadius: 8, border: `1px solid ${accentBorder}`, cursor: "pointer" }}>{text.ctaSecondary}</button>
          </div>
        </div>
      );
    // ── Footer ────────────────────────────────────────────────────────────────
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

    // ── Testimonials ──────────────────────────────────────────────────────────
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