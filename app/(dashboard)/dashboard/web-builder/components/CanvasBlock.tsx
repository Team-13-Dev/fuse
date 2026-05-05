import { useState } from "react";
import {
GripVertical, X, Type
} from "lucide-react";
import { BlockInstance } from "../WebBuilderTypes";
import RenderedBlock from "./RenderedBlock";
import { getText } from "../helpers/TextHelpers";


export const DEFAULT_ACCENT = "#7c3aed";
export const DEFAULT_BG = "#ffffff";

export default function CanvasBlock({
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