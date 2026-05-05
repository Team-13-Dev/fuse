export function hexToRgb(hex : string) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}
export function withAlpha(hex : string,a : any) { const [r,g,b]=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
export function lighten(hex : string ,amt=0.9) {
  const [r,g,b]=hexToRgb(hex);
  return `rgb(${Math.round(r+(255-r)*amt)},${Math.round(g+(255-g)*amt)},${Math.round(b+(255-b)*amt)})`;
}