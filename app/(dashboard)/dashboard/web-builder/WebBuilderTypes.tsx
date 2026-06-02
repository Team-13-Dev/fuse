export type BlockTextMap = typeof DEFAULT_TEXT;

const DEFAULT_TEXT: Record<BlockType, any> = {
  header: { brand:"YourBrand", nav1:"Home", nav2:"About", nav3:"Services", nav4:"Contact", cta:"Get Started" },
  hero: { eyebrow:"Welcome to the future", heading:"Build Something Extraordinary", subheading:"Drag, drop, and compose beautiful pages in seconds with our intuitive visual builder.", primaryCta:"Start Building", secondaryCta:"Learn more" },
  products: { sectionLabel:"Featured Products", p1Name:"Pro Plan", p1Desc:"For individuals", p1Price:"$29", p2Name:"Team Plan", p2Desc:"Up to 10 members", p2Price:"$79", p2Badge:"Popular", p3Name:"Enterprise", p3Desc:"Unlimited scale", p3Price:"$199" },
  contact: { sectionLabel:"Get in Touch", fieldName:"Name", fieldEmail:"Email", fieldMessage:"Message", cta:"Send Message" },
  footer: { brand:"YourBrand", link1:"Privacy", link2:"Terms", link3:"Contact", copy:"© 2026 All rights reserved" },
  testimonials: { sectionLabel:"What People Say", t1Name:"Sarah K.", t1Role:"Designer", t1Text:"Absolutely transformed how our team ships landing pages.", t2Name:"Marco R.", t2Role:"Developer", t2Text:"Incredibly fast workflow — days now take minutes." },
};

export type BlockType =
  | "header"
  | "hero"
  | "products"
  | "contact"
  | "footer"
  | "testimonials"
  | "productList";


export type BlockInstance = {
  instanceId: string;
  type: BlockType;
  accentColor?: string;
  bgColor?: string;
  text?: Partial<BlockTextMap[BlockType]>;
};