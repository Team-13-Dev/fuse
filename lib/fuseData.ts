/**
 * lib/fuseData.ts
 * ──────────────────────────────────────────────────────────────
 * Handles Excel loading, aggregation, ChromaDB indexing, and
 * the rich data summary string injected into the system prompt.
 * ──────────────────────────────────────────────────────────────
 */

import * as XLSX from "xlsx";
import { ChromaClient, Collection } from "chromadb";
import { pipeline } from "@xenova/transformers";

// ── Types ──────────────────────────────────────────────────────

export interface Row {
  order_date: Date;
  product_id: string;
  revenue: number;
  profit: number;
  profit_margin: number;
  quantity: number;
  price: number;
  year: number;
  month: string; // "YYYY-MM"
}

export interface YearlyStats {
  year: number;
  revenue: number;
  profit: number;
  orders: number;
  margin: number;
  rev_growth: number | null;
  profit_growth: number | null;
}

// ── Singleton state ────────────────────────────────────────────

let _rows: Row[] | null = null;
let _collection: Collection | null = null;
let _dataSummary: string | null = null;
let _yearlyStats: YearlyStats[] | null = null;
let _embedder: ((texts: string[]) => Promise<number[][]>) | null = null;

// ── Helpers ────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function fmtPct(n: number) {
  return (n * 100).toFixed(1) + "%";
}
function toYYYYMM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Embedding helper ───────────────────────────────────────────

async function getEmbedder() {
  if (!_embedder) {
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    _embedder = async (texts: string[]) => {
      const results: number[][] = [];
      for (const text of texts) {
        const out = await extractor(text, {
          pooling: "mean",
          normalize: true,
        });
        results.push(Array.from(out.data as Float32Array));
      }
      return results;
    };
  }
  return _embedder;
}

// ── 1. Load Excel ──────────────────────────────────────────────

export function loadData(filePath: string): Row[] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: null,
  });

  const rows: Row[] = [];
  for (const r of raw) {
    // Normalise column names (strip whitespace)
    const rec: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) rec[k.trim()] = v;

    const order_date_raw = rec["order_date"];
    const product_id = rec["product_id"];
    const revenue = Number(rec["revenue"]);

    if (!order_date_raw || !product_id || isNaN(revenue)) continue;

    // Excel serial date or string
    let order_date: Date;
    if (typeof order_date_raw === "number") {
      order_date = XLSX.SSF.parse_date_code
        ? new Date(
            XLSX.SSF.parse_date_code(order_date_raw).y,
            XLSX.SSF.parse_date_code(order_date_raw).m - 1,
            XLSX.SSF.parse_date_code(order_date_raw).d
          )
        : new Date(Math.round((order_date_raw - 25569) * 86400 * 1000));
    } else {
      order_date = new Date(order_date_raw as string);
    }
    if (isNaN(order_date.getTime())) continue;

    rows.push({
      order_date,
      product_id: String(product_id),
      revenue,
      profit: Number(rec["profit"]) || 0,
      profit_margin: Number(rec["profit_margin"]) || 0,
      quantity: Number(rec["quantity"]) || 0,
      price: Number(rec["price"]) || 0,
      year: order_date.getFullYear(),
      month: toYYYYMM(order_date),
    });
  }

  return rows;
}

// ── 2. Build aggregate RAG chunks ─────────────────────────────

export function buildAggregateDocs(rows: Row[]): {
  documents: string[];
  ids: string[];
} {
  const documents: string[] = [];
  const ids: string[] = [];

  // Monthly aggregates
  const monthMap = new Map<
    string,
    { revenue: number; profit: number; orders: number; margin: number; qty: number }
  >();
  for (const r of rows) {
    const key = r.month;
    const cur = monthMap.get(key) ?? {
      revenue: 0,
      profit: 0,
      orders: 0,
      margin: 0,
      qty: 0,
    };
    monthMap.set(key, {
      revenue: cur.revenue + r.revenue,
      profit: cur.profit + r.profit,
      orders: cur.orders + 1,
      margin: cur.margin + r.profit_margin,
      qty: cur.qty + r.quantity,
    });
  }
  for (const [month, v] of [...monthMap.entries()].sort()) {
    const count = rows.filter((r) => r.month === month).length;
    documents.push(
      `Month ${month}: Revenue=${fmt(v.revenue)} EGP, ` +
        `Profit=${fmt(v.profit)} EGP, Orders=${fmt(v.orders)}, ` +
        `Margin=${fmtPct(v.margin / count)}, Units Sold=${fmt(v.qty)}`
    );
    ids.push(`monthly_${month}`);
  }

  // Product aggregates
  const prodMap = new Map<
    string,
    {
      revenue: number;
      profit: number;
      orders: number;
      margin: number;
      qty: number;
      price: number;
      count: number;
    }
  >();
  for (const r of rows) {
    const cur = prodMap.get(r.product_id) ?? {
      revenue: 0,
      profit: 0,
      orders: 0,
      margin: 0,
      qty: 0,
      price: 0,
      count: 0,
    };
    prodMap.set(r.product_id, {
      revenue: cur.revenue + r.revenue,
      profit: cur.profit + r.profit,
      orders: cur.orders + 1,
      margin: cur.margin + r.profit_margin,
      qty: cur.qty + r.quantity,
      price: cur.price + r.price,
      count: cur.count + 1,
    });
  }
  for (const [pid, v] of prodMap) {
    documents.push(
      `Product ${pid}: Total Revenue=${fmt(v.revenue)} EGP, ` +
        `Total Profit=${fmt(v.profit)} EGP, Orders=${fmt(v.orders)}, ` +
        `Avg Margin=${fmtPct(v.margin / v.count)}, Units Sold=${fmt(v.qty)}, ` +
        `Avg Price=${fmt(v.price / v.count)} EGP`
    );
    ids.push(`product_${pid}`);
  }

  // Yearly aggregates
  const yearMap = new Map<
    number,
    { revenue: number; profit: number; orders: number; margin: number; qty: number; count: number }
  >();
  for (const r of rows) {
    const cur = yearMap.get(r.year) ?? {
      revenue: 0,
      profit: 0,
      orders: 0,
      margin: 0,
      qty: 0,
      count: 0,
    };
    yearMap.set(r.year, {
      revenue: cur.revenue + r.revenue,
      profit: cur.profit + r.profit,
      orders: cur.orders + 1,
      margin: cur.margin + r.profit_margin,
      qty: cur.qty + r.quantity,
      count: cur.count + 1,
    });
  }
  for (const [year, v] of [...yearMap.entries()].sort((a, b) => a[0] - b[0])) {
    documents.push(
      `Year ${year}: Revenue=${fmt(v.revenue)} EGP, ` +
        `Profit=${fmt(v.profit)} EGP, Orders=${fmt(v.orders)}, ` +
        `Avg Margin=${fmtPct(v.margin / v.count)}, Units Sold=${fmt(v.qty)}`
    );
    ids.push(`year_${year}`);
  }

  // Product × Year aggregates
  const pyMap = new Map<
    string,
    { revenue: number; profit: number; margin: number; count: number }
  >();
  for (const r of rows) {
    const key = `${r.product_id}__${r.year}`;
    const cur = pyMap.get(key) ?? {
      revenue: 0,
      profit: 0,
      margin: 0,
      count: 0,
    };
    pyMap.set(key, {
      revenue: cur.revenue + r.revenue,
      profit: cur.profit + r.profit,
      margin: cur.margin + r.profit_margin,
      count: cur.count + 1,
    });
  }
  for (const [key, v] of pyMap) {
    const [pid, year] = key.split("__");
    documents.push(
      `Product ${pid} in ${year}: Revenue=${fmt(v.revenue)} EGP, ` +
        `Profit=${fmt(v.profit)} EGP, Margin=${fmtPct(v.margin / v.count)}`
    );
    ids.push(`prod_year_${pid}_${year}`);
  }

  return { documents, ids };
}

// ── 3. Index into ChromaDB ─────────────────────────────────────

export async function initCollection(
  rows: Row[],
  chromaPath = "./chroma_db_v2"
): Promise<Collection> {
  if (_collection) return _collection;

  const client = new ChromaClient({ path: chromaPath });
  const embedder = await getEmbedder();

  const embeddingFunction = {
    generate: async (texts: string[]) => embedder(texts),
  };

  const collection = await client.getOrCreateCollection({
    name: "fuse_aggregates",
    embeddingFunction,
  });

  const existing = await collection.count();
  if (existing > 0) {
    console.log(`Already indexed (${existing} chunks)`);
  } else {
    const { documents, ids } = buildAggregateDocs(rows);
    console.log(`Indexing ${documents.length} aggregate chunks...`);
    const BATCH = 200;
    for (let i = 0; i < documents.length; i += BATCH) {
      const batch_docs = documents.slice(i, i + BATCH);
      const batch_ids = ids.slice(i, i + BATCH);
      const embeddings = await embedder(batch_docs);
      await collection.add({
        documents: batch_docs,
        ids: batch_ids,
        embeddings,
      });
      console.log(`  → ${i} to ${Math.min(i + BATCH, documents.length)}`);
    }
    console.log("Indexing done.");
  }

  _collection = collection;
  return collection;
}

// ── 4. Build yearly stats ──────────────────────────────────────

export function buildYearlyStats(rows: Row[]): YearlyStats[] {
  const yearMap = new Map<
    number,
    { revenue: number; profit: number; orders: number; marginSum: number; count: number }
  >();
  for (const r of rows) {
    const cur = yearMap.get(r.year) ?? {
      revenue: 0,
      profit: 0,
      orders: 0,
      marginSum: 0,
      count: 0,
    };
    yearMap.set(r.year, {
      revenue: cur.revenue + r.revenue,
      profit: cur.profit + r.profit,
      orders: cur.orders + 1,
      marginSum: cur.marginSum + r.profit_margin,
      count: cur.count + 1,
    });
  }

  const sorted = [...yearMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, v]) => ({
      year,
      revenue: v.revenue,
      profit: v.profit,
      orders: v.orders,
      margin: v.marginSum / v.count,
      rev_growth: null as number | null,
      profit_growth: null as number | null,
    }));

  for (let i = 1; i < sorted.length; i++) {
    sorted[i].rev_growth =
      ((sorted[i].revenue - sorted[i - 1].revenue) / sorted[i - 1].revenue) * 100;
    sorted[i].profit_growth =
      ((sorted[i].profit - sorted[i - 1].profit) / sorted[i - 1].profit) * 100;
  }

  return sorted;
}

// ── 5. Build rich data summary string ─────────────────────────

export function buildDataSummary(rows: Row[]): string {
  const yearly = buildYearlyStats(rows);

  // Yearly string
  let yearlyStr = "";
  for (const r of yearly) {
    const growth =
      r.rev_growth !== null
        ? ` (YoY: ${r.rev_growth >= 0 ? "+" : ""}${r.rev_growth.toFixed(1)}%)`
        : " (base year)";
    yearlyStr +=
      `  ${r.year}: Revenue=${fmt(r.revenue).padStart(14)} EGP | ` +
      `Profit=${fmt(r.profit).padStart(12)} EGP | ` +
      `Margin=${fmtPct(r.margin)} | Orders=${fmt(r.orders)}${growth}\n`;
  }

  // CAGR
  let cagrStr = "";
  const yearsRange = yearly[yearly.length - 1].year - yearly[0].year;
  if (yearsRange > 0) {
    const cagr =
      ((yearly[yearly.length - 1].revenue / yearly[0].revenue) **
        (1 / yearsRange) -
        1) *
      100;
    cagrStr = `  Revenue CAGR (${yearly[0].year}–${yearly[yearly.length - 1].year}): ${cagr.toFixed(1)}%\n`;
  }

  // Last 12 months monthly revenue
  const monthRevMap = new Map<string, number>();
  for (const r of rows) {
    monthRevMap.set(r.month, (monthRevMap.get(r.month) ?? 0) + r.revenue);
  }
  const last12 = [...monthRevMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12);
  const monthlyStr = last12.map(([m, v]) => `  ${m}: ${fmt(v)} EGP`).join("\n");

  // Product leaderboards
  const prodRevMap = new Map<string, number>();
  const prodProfMap = new Map<string, number>();
  const prodMarginMap = new Map<string, { sum: number; count: number }>();
  const prodUnitsMap = new Map<string, number>();
  for (const r of rows) {
    prodRevMap.set(r.product_id, (prodRevMap.get(r.product_id) ?? 0) + r.revenue);
    prodProfMap.set(r.product_id, (prodProfMap.get(r.product_id) ?? 0) + r.profit);
    const m = prodMarginMap.get(r.product_id) ?? { sum: 0, count: 0 };
    prodMarginMap.set(r.product_id, {
      sum: m.sum + r.profit_margin,
      count: m.count + 1,
    });
    prodUnitsMap.set(r.product_id, (prodUnitsMap.get(r.product_id) ?? 0) + r.quantity);
  }

  const top5Rev = [...prodRevMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const top5Prof = [...prodProfMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const top5Marg = [...prodMarginMap.entries()]
    .sort((a, b) => b[1].sum / b[1].count - a[1].sum / a[1].count)
    .slice(0, 5);
  const top5Units = [...prodUnitsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const worst3Marg = [...prodMarginMap.entries()]
    .sort((a, b) => a[1].sum / a[1].count - b[1].sum / b[1].count)
    .slice(0, 3);

  // Seasonality
  const monthAvgMap = new Map<number, { sum: number; count: number }>();
  for (const r of rows) {
    const mo = r.order_date.getMonth() + 1;
    const cur = monthAvgMap.get(mo) ?? { sum: 0, count: 0 };
    monthAvgMap.set(mo, { sum: cur.sum + r.revenue, count: cur.count + 1 });
  }
  const MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthAvgs = [...monthAvgMap.entries()].map(([mo, v]) => ({
    mo,
    avg: v.sum / v.count,
  }));
  const bestMonth = MONTHS[monthAvgs.sort((a, b) => b.avg - a.avg)[0].mo];
  const worstMonth = MONTHS[monthAvgs.sort((a, b) => a.avg - b.avg)[0].mo];

  // Portfolio snapshot
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const avgPrice = rows.reduce((s, r) => s + r.price, 0) / rows.length;
  const avgMargin = rows.reduce((s, r) => s + r.profit_margin, 0) / rows.length;
  const dates = rows.map((r) => r.order_date).sort((a, b) => +a - +b);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return `
════════════════════════════════════════════════
FUSE BUSINESS INTELLIGENCE REPORT
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
  Best month (avg): ${bestMonth} | Worst month (avg): ${worstMonth}

▸ TOP 5 PRODUCTS — REVENUE
${top5Rev.map(([p, v]) => `  ${p}: ${fmt(v)} EGP`).join("\n")}

▸ TOP 5 PRODUCTS — PROFIT
${top5Prof.map(([p, v]) => `  ${p}: ${fmt(v)} EGP`).join("\n")}

▸ TOP 5 PRODUCTS — MARGIN
${top5Marg.map(([p, v]) => `  ${p}: ${fmtPct(v.sum / v.count)}`).join("\n")}

▸ TOP 5 PRODUCTS — UNITS SOLD
${top5Units.map(([p, v]) => `  ${p}: ${fmt(v)} units`).join("\n")}

▸ LOWEST MARGIN PRODUCTS (watch list)
${worst3Marg.map(([p, v]) => `  ${p}: ${fmtPct(v.sum / v.count)}`).join("\n")}
════════════════════════════════════════════════
`;
}

// ── 6. Top-level init (call once at startup) ───────────────────

export async function initFuse(filePath: string) {
  if (_rows && _collection && _dataSummary) {
    return { rows: _rows, collection: _collection, dataSummary: _dataSummary, yearlyStats: _yearlyStats! };
  }

  const rows = loadData(filePath);
  console.log(
    `Loaded ${rows.length} rows | ${Math.min(...rows.map((r) => r.year))} → ${Math.max(...rows.map((r) => r.year))}`
  );

  const collection = await initCollection(rows);
  const dataSummary = buildDataSummary(rows);
  const yearlyStats = buildYearlyStats(rows);

  _rows = rows;
  _collection = collection;
  _dataSummary = dataSummary;
  _yearlyStats = yearlyStats;

  return { rows, collection, dataSummary, yearlyStats };
}