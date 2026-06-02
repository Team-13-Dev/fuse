import { BlockInstance, BlockType } from "../WebBuilderTypes";

export function getText(block: BlockInstance) {
  return {
    ...DEFAULT_TEXT[block.type],
    ...(block.text || {}),
  };
}

export const DEFAULT_TEXT: Record<BlockType, any> = {
  header: { brand:"YourBrand", nav1:"Home", nav2:"About", nav3:"Services", nav4:"Contact", cta:"Get Started" },
  hero: { eyebrow:"Welcome to the future", heading:"Build Something Extraordinary", subheading:"Drag, drop, and compose beautiful pages in seconds with our intuitive visual builder.", primaryCta:"Start Building", secondaryCta:"Learn more" },
  products: { sectionLabel:"Featured Products", p1Name:"Pro Plan", p1Desc:"For individuals", p1Price:"$29", p2Name:"Team Plan", p2Desc:"Up to 10 members", p2Price:"$79", p2Badge:"Popular", p3Name:"Enterprise", p3Desc:"Unlimited scale", p3Price:"$199" },
  contact: { sectionLabel:"Get in Touch", fieldName:"Name", fieldEmail:"Email", fieldMessage:"Message", cta:"Send Message" },
  footer: { brand:"YourBrand", link1:"Privacy", link2:"Terms", link3:"Contact", copy:"© 2026 All rights reserved" },
  testimonials: { sectionLabel:"What People Say", t1Name:"Sarah K.", t1Role:"Designer", t1Text:"Absolutely transformed how our team ships landing pages.", t2Name:"Marco R.", t2Role:"Developer", t2Text:"Incredibly fast workflow — days now take minutes." },
  productList: { sectionLabel: "Products"}
};

export const TEXT_FIELDS : Record<
  BlockType,
  { key: string; label: string; multiline?: boolean }[]> = {
  header: [
    { key:"brand", label:"Brand name" },
    { key:"nav1", label:"Nav 1" }, { key:"nav2", label:"Nav 2" }, { key:"nav3", label:"Nav 3" }, { key:"nav4", label:"Nav 4" },
    { key:"cta", label:"Button label" },
  ],
  hero: [
    { key:"eyebrow", label:"Eyebrow tag" },
    { key:"heading", label:"Heading", multiline:true },
    { key:"subheading", label:"Body text", multiline:true },
    { key:"primaryCta", label:"Primary button" },
    { key:"secondaryCta", label:"Secondary link" },
  ],
  products: [
    { key:"sectionLabel", label:"Section label" },
    { key:"p1Name", label:"Card 1 — name" }, { key:"p1Desc", label:"Card 1 — desc" }, { key:"p1Price", label:"Card 1 — price" },
    { key:"p2Name", label:"Card 2 — name" }, { key:"p2Desc", label:"Card 2 — desc" }, { key:"p2Price", label:"Card 2 — price" }, { key:"p2Badge", label:"Card 2 — badge" },
    { key:"p3Name", label:"Card 3 — name" }, { key:"p3Desc", label:"Card 3 — desc" }, { key:"p3Price", label:"Card 3 — price" },
  ],
  contact: [
    { key:"sectionLabel", label:"Section label" },
    { key:"fieldName", label:"Field 1 label" }, { key:"fieldEmail", label:"Field 2 label" }, { key:"fieldMessage", label:"Field 3 label" },
    { key:"cta", label:"Button label" },
  ],
  footer: [
    { key:"brand", label:"Brand name" },
    { key:"link1", label:"Link 1" }, { key:"link2", label:"Link 2" }, { key:"link3", label:"Link 3" },
    { key:"copy", label:"Copyright" },
  ],
  testimonials: [
    { key:"sectionLabel", label:"Section label" },
    { key:"t1Name", label:"Review 1 — name" }, { key:"t1Role", label:"Review 1 — role" }, { key:"t1Text", label:"Review 1 — quote", multiline:true },
    { key:"t2Name", label:"Review 2 — name" }, { key:"t2Role", label:"Review 2 — role" }, { key:"t2Text", label:"Review 2 — quote", multiline:true },
  ],
  productList: [
    { key: "sectionLabel", label: "Section label"}
  ]
};