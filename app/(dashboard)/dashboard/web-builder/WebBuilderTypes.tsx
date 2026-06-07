import { pgEnum } from "drizzle-orm/pg-core";

export type BlockTextMap = typeof DEFAULT_TEXT;

const DEFAULT_TEXT: Record<BlockType, any> = {
  header:      { brand:"YourBrand", nav1:"Home", nav2:"About", nav3:"Services", nav4:"Contact", cta:"Get Started" },
  hero:        { eyebrow:"Welcome to the future", heading:"Build Something Extraordinary", subheading:"Drag, drop, and compose beautiful pages in seconds with our intuitive visual builder.", primaryCta:"Start Building", secondaryCta:"Learn more" },
  products:    { sectionLabel:"Featured Products", p1Name:"Pro Plan", p1Desc:"For individuals", p1Price:"$29", p2Name:"Team Plan", p2Desc:"Up to 10 members", p2Price:"$79", p2Badge:"Popular", p3Name:"Enterprise", p3Desc:"Unlimited scale", p3Price:"$199" },
  contact:     { sectionLabel:"Get in Touch", fieldName:"Name", fieldEmail:"Email", fieldMessage:"Message", cta:"Send Message" },
  footer:      { brand:"YourBrand", link1:"Privacy", link2:"Terms", link3:"Contact", copy:"© 2026 All rights reserved" },
  testimonials:{ sectionLabel:"What People Say", t1Name:"Sarah K.", t1Role:"Designer", t1Text:"Absolutely transformed how our team ships landing pages.", t2Name:"Marco R.", t2Role:"Developer", t2Text:"Incredibly fast workflow — days now take minutes." },
  productList: { sectionLabel:"Our Products", emptyState:"No products yet." },
  cart:        { sectionLabel:"Your Cart", emptyState:"Your cart is empty.", ctaCheckout:"Proceed to Checkout", ctaContinue:"Continue Shopping", summaryTitle:"Order Summary", labelSubtotal:"Subtotal", labelShipping:"Shipping", labelTotal:"Total", shippingValue:"Free" },
  orderReview: { sectionLabel:"Review Your Order", labelSubtotal:"Subtotal", labelShipping:"Shipping", labelTax:"Tax (8%)", labelTotal:"Total", shippingValue:"Free" },
  checkoutForm:{ sectionLabel:"Checkout", stepContact:"Contact Information", fieldFirstName:"First Name", fieldLastName:"Last Name", fieldEmail:"Email Address", stepShipping:"Shipping", fieldAddress:"Street Address", fieldCity:"City", fieldState:"State", fieldZip:"ZIP Code", shipStandard:"Standard Shipping", shipStandardDays:"5–7 business days", shipExpress:"Express Shipping", shipExpressDays:"1–2 business days", shippingValue:"Free", stepPayment:"Payment", fieldCardNumber:"Card Number", fieldExpiry:"Expiry Date", fieldCVV:"CVV", ctaPlace:"Place Order", secureNote:"Payments are encrypted and secure" },
  orderConfirmation: { eyebrow:"Order Confirmed", heading:"Thank you for your order!", subheading:"We've received your order and will send a confirmation email shortly. Your items are being prepared.", metaOrderLabel:"Order", metaOrderVal:"#ORD-4821", metaDateLabel:"Date", metaDateVal:"Jun 7, 2026", metaEtaLabel:"Estimated Arrival", metaEtaVal:"Jun 10–12", labelTotal:"Total", ctaPrimary:"Track Order", ctaSecondary:"Continue Shopping" },
};

export type BlockType =
  | "header" | "hero" | "products" | "productList"
  | "cart" | "contact" | "footer" | "testimonials"
  | "orderReview" | "checkoutForm" | "orderConfirmation";  // ← new

export type BlockInstance = {
  instanceId:   string;
  type:         BlockType;
  accentColor?: string;
  bgColor?:     string;
  text?:        Partial<BlockTextMap[BlockType]>;
  /** For product grid / product list blocks: how many products to fetch */
  productCount?: number;
};
// WebBuilderTypes.ts — add to BlockType


// schema.ts — extend the pg enum
export const blockTypeEnum = pgEnum("block_type", [
  "header", "hero", "products", "productList",
  "cart", "contact", "footer", "testimonials",
  "orderReview", "checkoutForm", "orderConfirmation",   // ← new
]);