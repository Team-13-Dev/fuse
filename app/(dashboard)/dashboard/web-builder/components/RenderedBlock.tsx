"use client"

import { ChevronRight } from "lucide-react";
import { lighten, withAlpha } from "../helpers/ColorHelpers";
import { BlockType } from "../WebBuilderTypes";

export default function RenderedBlock({
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