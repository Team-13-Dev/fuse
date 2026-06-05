/**
 * lib/fuseData.ts
 * ──────────────────────────────────────────────────────────────
 * No ChromaDB. No external vector DB.
 *
 * Embeddings are computed once via @xenova/transformers and
 * stored in the module-level cache as plain Float32Arrays.
 * Retrieval is cosine similarity — fast enough for hundreds of
 * chunks and zero extra infrastructure.
 *
 * CACHE BEHAVIOUR
 * ───────────────
 * _cache    — Map<businessId, FuseState>  warm results
 * _inflight — Map<businessId, Promise>    dedup concurrent cold starts
 *
 * Long-running server (Docker / Railway): lives for process lifetime.
 * Vercel serverless: lives within Lambda warm window (~5 min idle).
 * ──────────────────────────────────────────────────────────────
 */

import { db } from "@/db";
import { order, orderItem, product, business } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────

export interface Row {
  order_date:    Date;
  product_id:    string;
  product_name:  string;
  revenue:       number;
  profit:        number;
  profit_margin: number;
  quantity:      number;
  price:         number;
  cost:          number;
  year:          number;
  month:         string;
}

export interface YearlyStats {
  year:          number;
  revenue:       number;
  profit:        number;
  orders:        number;
  margin:        number;
  rev_growth:    number | null;
  profit_growth: number | null;
}

interface VectorChunk {
  id:        string;
  document:  string;
  embedding: Float32Array;
}

export interface FuseState {
  rows:        Row[];
  chunks:      VectorChunk[];
  dataSummary: string;
  yearlyStats: YearlyStats[];
}

// ── Module-level cache ─────────────────────────────────────────

const _cache:    Map<string, FuseState>           = new Map();
const _inflight: Map<string, Promise<FuseState>>  = new Map();

// ── Embedder singleton ─────────────────────────────────────────
// 1. Define the type clearly at the top
type EmbedderFn = (texts: string[]) => Promise<Float32Array[]>;

const globalForTransformers = globalThis as unknown as {
  _embedder: EmbedderFn | null;
};

async function getEmbedder(): Promise<EmbedderFn> {
  if (!globalForTransformers._embedder) {
    // 1. Import the library and the environment configuration
    const { pipeline, env } = await import("@xenova/transformers");

    // 2. CRITICAL: Force the library to use the Web-based WASM backend.
    // This prevents the search for .so files on the Linux host.
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.backends.onnx.wasm.proxy = false; 
    
    // Explicitly point to the CDN for the WASM files
    env.backends.onnx.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";

    // 3. Initialize the pipeline with the quantized model
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { quantized: true }
    );

    globalForTransformers._embedder = async (texts: string[]): Promise<Float32Array[]> => {
      const out: Float32Array[] = [];
      for (const text of texts) {
        const result = await extractor(text, {
          pooling: "mean",
          normalize: true,
        });
        out.push(new Float32Array(result.data as Float32Array));
      }
      return out;
    };
  }

  return globalForTransformers._embedder!;
}
// ── Cosine similarity retrieval ────────────────────────────────

function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

export async function queryChunks(
  query:  string,
  chunks: VectorChunk[],
  topK = 12
): Promise<string[]> {
  const embedder   = await getEmbedder();
  const [queryVec] = await embedder([query]);

  return chunks
    .map((c) => ({ doc: c.document, score: cosineSim(queryVec, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((c) => c.doc);
}

// ── Formatters ─────────────────────────────────────────────────

export const fmt    = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
export const fmtPct = (n: number) => (n * 100).toFixed(1) + "%";
const toYYYYMM      = (d: Date)   =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// ── 1. Load from Postgres via Drizzle ─────────────────────────

async function loadDataFromDB(businessId: string): Promise<Row[]> {
  const raw = await db
    .select({
      order_date:    order.createdAt,
      product_id:    orderItem.productId,
      product_name:  product.name,
      unit_price:    orderItem.unitPrice,
      quantity:      orderItem.quantity,
      item_discount: orderItem.itemDiscount,
      cost:          product.cost,
    })
    .from(order)
    .innerJoin(orderItem, eq(orderItem.orderId, order.id))
    .innerJoin(product,   eq(product.id, orderItem.productId))
    .where(
      and(
        eq(order.businessId, businessId),
        sql`${order.status} NOT IN ('cancelled', 'refunded')`
      )
    );

  return raw
    .filter((r: any) => r.order_date && r.product_id && r.unit_price !== null)
    .map((r: any) => {
      const price    = Number(r.unit_price    ?? 0);
      const qty      = r.quantity             ?? 1;
      const discount = Number(r.item_discount ?? 0);
      const cost     = Number(r.cost          ?? 0);
      const revenue  = (price - discount) * qty;
      const profit   = revenue - cost * qty;
      const d        = new Date(r.order_date!);
      return {
        order_date:    d,
        product_id:    r.product_id,
        product_name:  r.product_name,
        revenue,
        profit,
        profit_margin: revenue > 0 ? profit / revenue : 0,
        quantity:      qty,
        price,
        cost,
        year:          d.getFullYear(),
        month:         toYYYYMM(d),
      };
    });
}

// ── 2. Build aggregate text chunks ────────────────────────────

function buildAggregateDocuments(rows: Row[]): { id: string; document: string }[] {
  const out: { id: string; document: string }[] = [];

  type Agg = { revenue: number; profit: number; orders: number; marginSum: number; qty: number; count: number };
  const merge = (c: Agg | undefined, r: Row): Agg => ({
    revenue:   (c?.revenue   ?? 0) + r.revenue,
    profit:    (c?.profit    ?? 0) + r.profit,
    orders:    (c?.orders    ?? 0) + 1,
    marginSum: (c?.marginSum ?? 0) + r.profit_margin,
    qty:       (c?.qty       ?? 0) + r.quantity,
    count:     (c?.count     ?? 0) + 1,
  });

  // Monthly
  const monthMap = new Map<string, Agg>();
  for (const r of rows) monthMap.set(r.month, merge(monthMap.get(r.month), r));
  for (const [month, v] of [...monthMap.entries()].sort())
    out.push({ id: `monthly_${month}`, document: `Month ${month}: Revenue=${fmt(v.revenue)} EGP, Profit=${fmt(v.profit)} EGP, Orders=${fmt(v.orders)}, Margin=${fmtPct(v.marginSum / v.count)}, Units Sold=${fmt(v.qty)}` });

  // Product
  const prodMap = new Map<string, Agg & { name: string; priceSum: number }>();
  for (const r of rows) {
    const c = prodMap.get(r.product_id);
    prodMap.set(r.product_id, { ...merge(c, r), name: r.product_name, priceSum: (c?.priceSum ?? 0) + r.price });
  }
  for (const [pid, v] of prodMap)
    out.push({ id: `product_${pid}`, document: `Product "${v.name}": Total Revenue=${fmt(v.revenue)} EGP, Total Profit=${fmt(v.profit)} EGP, Orders=${fmt(v.orders)}, Avg Margin=${fmtPct(v.marginSum / v.count)}, Units Sold=${fmt(v.qty)}, Avg Price=${fmt(v.priceSum / v.count)} EGP` });

  // Yearly
  const yearMap = new Map<number, Agg>();
  for (const r of rows) yearMap.set(r.year, merge(yearMap.get(r.year), r));
  for (const [year, v] of [...yearMap.entries()].sort((a, b) => a[0] - b[0]))
    out.push({ id: `year_${year}`, document: `Year ${year}: Revenue=${fmt(v.revenue)} EGP, Profit=${fmt(v.profit)} EGP, Orders=${fmt(v.orders)}, Avg Margin=${fmtPct(v.marginSum / v.count)}, Units Sold=${fmt(v.qty)}` });

  // Product × Year
  const pyMap = new Map<string, Agg & { name: string }>();
  for (const r of rows) {
    const key = `${r.product_id}__${r.year}`;
    pyMap.set(key, { ...merge(pyMap.get(key), r), name: r.product_name });
  }
  for (const [key, v] of pyMap) {
    const [pid, year] = key.split("__");
    out.push({ id: `prod_year_${pid}_${year}`, document: `Product "${v.name}" in ${year}: Revenue=${fmt(v.revenue)} EGP, Profit=${fmt(v.profit)} EGP, Margin=${fmtPct(v.marginSum / v.count)}` });
  }

  return out;
}

// ── 3. Embed all chunks into memory ───────────────────────────

async function buildVectorChunks(rows: Row[]): Promise<VectorChunk[]> {
  const embedder = await getEmbedder();
  const docs     = buildAggregateDocuments(rows);

  // Embed in batches to avoid memory spikes
  const BATCH  = 64;
  const chunks: VectorChunk[] = [];

  for (let i = 0; i < docs.length; i += BATCH) {
    const slice      = docs.slice(i, i + BATCH);
    const embeddings = await embedder(slice.map((d) => d.document));
    for (let j = 0; j < slice.length; j++) {
      chunks.push({ id: slice[j].id, document: slice[j].document, embedding: embeddings[j] });
    }
  }
  return chunks;
}

// ── 4. Yearly stats ────────────────────────────────────────────

export function buildYearlyStats(rows: Row[]): YearlyStats[] {
  const map = new Map<number, { revenue: number; profit: number; orders: number; marginSum: number; count: number }>();
  for (const r of rows) {
    const c = map.get(r.year) ?? { revenue: 0, profit: 0, orders: 0, marginSum: 0, count: 0 };
    map.set(r.year, { revenue: c.revenue + r.revenue, profit: c.profit + r.profit, orders: c.orders + 1, marginSum: c.marginSum + r.profit_margin, count: c.count + 1 });
  }
  const sorted = [...map.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({
    year, revenue: v.revenue, profit: v.profit, orders: v.orders,
    margin: v.marginSum / v.count, rev_growth: null as number | null, profit_growth: null as number | null,
  }));
  for (let i = 1; i < sorted.length; i++) {
    sorted[i].rev_growth    = ((sorted[i].revenue - sorted[i-1].revenue) / sorted[i-1].revenue) * 100;
    sorted[i].profit_growth = ((sorted[i].profit  - sorted[i-1].profit)  / sorted[i-1].profit)  * 100;
  }
  return sorted;
}

// ── 5. Data summary string ─────────────────────────────────────

export function buildDataSummary(rows: Row[], businessName = "Your Business"): string {
  if (rows.length === 0) return "No order data available for this business yet.";

  const yearly = buildYearlyStats(rows);
  let yearlyStr = "";
  for (const r of yearly) {
    const g = r.rev_growth !== null ? ` (YoY: ${r.rev_growth >= 0 ? "+" : ""}${r.rev_growth.toFixed(1)}%)` : " (base year)";
    yearlyStr += `  ${r.year}: Revenue=${fmt(r.revenue).padStart(14)} EGP | Profit=${fmt(r.profit).padStart(12)} EGP | Margin=${fmtPct(r.margin)} | Orders=${fmt(r.orders)}${g}\n`;
  }

  let cagrStr = "";
  if (yearly.length > 1) {
    const range = yearly[yearly.length - 1].year - yearly[0].year;
    if (range > 0) {
      const cagr = ((yearly[yearly.length - 1].revenue / yearly[0].revenue) ** (1 / range) - 1) * 100;
      cagrStr = `  Revenue CAGR (${yearly[0].year}–${yearly[yearly.length - 1].year}): ${cagr.toFixed(1)}%\n`;
    }
  }

  const monthRevMap = new Map<string, number>();
  for (const r of rows) monthRevMap.set(r.month, (monthRevMap.get(r.month) ?? 0) + r.revenue);
  const last12     = [...monthRevMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  const monthlyStr = last12.map(([m, v]) => `  ${m}: ${fmt(v)} EGP`).join("\n");

  const pRev = new Map<string, { name: string; val: number }>();
  const pPro = new Map<string, { name: string; val: number }>();
  const pMar = new Map<string, { name: string; sum: number; count: number }>();
  const pUnt = new Map<string, { name: string; val: number }>();
  for (const r of rows) {
    const { product_id: pid, product_name: name } = r;
    pRev.set(pid, { name, val: (pRev.get(pid)?.val ?? 0) + r.revenue  });
    pPro.set(pid, { name, val: (pPro.get(pid)?.val ?? 0) + r.profit   });
    const m = pMar.get(pid) ?? { name, sum: 0, count: 0 };
    pMar.set(pid, { name, sum: m.sum + r.profit_margin, count: m.count + 1 });
    pUnt.set(pid, { name, val: (pUnt.get(pid)?.val ?? 0) + r.quantity });
  }

  const top5  = (m: Map<string, { name: string; val: number }>) =>
    [...m.entries()].sort((a, b) => b[1].val - a[1].val).slice(0, 5);
  const top5m = (m: Map<string, { name: string; sum: number; count: number }>, asc = false) =>
    [...m.entries()].sort((a, b) => asc
      ? (a[1].sum/a[1].count) - (b[1].sum/b[1].count)
      : (b[1].sum/b[1].count) - (a[1].sum/a[1].count)
    ).slice(0, asc ? 3 : 5);

  const MONTHS  = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
  const moAvg   = new Map<number, { sum: number; count: number }>();
  for (const r of rows) {
    const mo = r.order_date.getMonth() + 1;
    const c  = moAvg.get(mo) ?? { sum: 0, count: 0 };
    moAvg.set(mo, { sum: c.sum + r.revenue, count: c.count + 1 });
  }
  const moArr   = [...moAvg.entries()].map(([mo, v]) => ({ mo, avg: v.sum / v.count }));
  const bestMo  = MONTHS[moArr.slice().sort((a, b) => b.avg - a.avg)[0]?.mo ?? 1];
  const worstMo = MONTHS[moArr.slice().sort((a, b) => a.avg - b.avg)[0]?.mo ?? 1];

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit  = rows.reduce((s, r) => s + r.profit, 0);
  const avgPrice     = rows.reduce((s, r) => s + r.price, 0) / rows.length;
  const avgMargin    = rows.reduce((s, r) => s + r.profit_margin, 0) / rows.length;
  const dates        = rows.map((r) => r.order_date).sort((a, b) => +a - +b);
  const fmtDate      = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return `
════════════════════════════════════════════════
FUSE BUSINESS INTELLIGENCE — ${businessName.toUpperCase()}
════════════════════════════════════════════════

▸ PORTFOLIO SNAPSHOT
  Total Orders  : ${fmt(rows.length)}
  Total Revenue : ${fmt(totalRevenue)} EGP
  Total Profit  : ${fmt(totalProfit)} EGP
  Avg Order Size: ${fmt(avgPrice)} EGP
  Avg Margin    : ${fmtPct(avgMargin)}
  Data Range    : ${fmtDate(dates[0])} → ${fmtDate(dates[dates.length - 1])}

▸ YEAR-ON-YEAR PERFORMANCE
${yearlyStr}${cagrStr}
▸ LAST 12 MONTHS — MONTHLY REVENUE
${monthlyStr}

▸ SEASONALITY
  Best month (avg): ${bestMo} | Worst month (avg): ${worstMo}

▸ TOP 5 PRODUCTS — REVENUE
${top5(pRev).map(([, v]) => `  ${v.name}: ${fmt(v.val)} EGP`).join("\n")}

▸ TOP 5 PRODUCTS — PROFIT
${top5(pPro).map(([, v]) => `  ${v.name}: ${fmt(v.val)} EGP`).join("\n")}

▸ TOP 5 PRODUCTS — MARGIN
${top5m(pMar).map(([, v]) => `  ${v.name}: ${fmtPct(v.sum / v.count)}`).join("\n")}

▸ TOP 5 PRODUCTS — UNITS SOLD
${top5(pUnt).map(([, v]) => `  ${v.name}: ${fmt(v.val)} units`).join("\n")}

▸ LOWEST MARGIN PRODUCTS (watch list)
${top5m(pMar, true).map(([, v]) => `  ${v.name}: ${fmtPct(v.sum / v.count)}`).join("\n")}
════════════════════════════════════════════════
`;
}

// ── 6. initFuse ────────────────────────────────────────────────

async function _init(businessId: string): Promise<FuseState> {
  const [biz] = await db
    .select({ name: business.name })
    .from(business)
    .where(eq(business.id, businessId))
    .limit(1);

  const rows        = await loadDataFromDB(businessId);
  const chunks      = await buildVectorChunks(rows);
  const yearlyStats = buildYearlyStats(rows);
  const dataSummary = buildDataSummary(rows, biz?.name ?? "Business");

  console.log(`[Fuse] Ready — ${rows.length} rows, ${chunks.length} chunks for "${biz?.name}"`);
  return { rows, chunks, dataSummary, yearlyStats };
}

export async function initFuse(businessId: string): Promise<FuseState> {
  const cached = _cache.get(businessId);
  if (cached) return cached;

  const inflight = _inflight.get(businessId);
  if (inflight) return inflight;

  const promise = _init(businessId)
    .then((state) => { _cache.set(businessId, state); _inflight.delete(businessId); return state; })
    .catch((err)  => { _inflight.delete(businessId); throw err; });

  _inflight.set(businessId, promise);
  return promise;
}

export function bustFuseCache(businessId: string) {
  _cache.delete(businessId);
  _inflight.delete(businessId);
}