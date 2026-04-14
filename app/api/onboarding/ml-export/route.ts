// Generates a clean Excel dataset containing only ML-required columns.
// Uses ExcelJS (pure JS, no native deps) so it works on Vercel Edge-compatible runtimes.

import { NextRequest, NextResponse } from "next/server"
import { getBusinessContext } from "@/lib/get-business-context"
import ExcelJS from "exceljs"
import type { CleanResponse } from "@/lib/pipeline/types"

// ML columns we extract — matches ml_config.py ML_REQUIRED_KEYS + derived fields
const ML_COLUMNS = [
  { key: "order_id",       header: "Order ID",         width: 16 },
  { key: "customer_id",    header: "Customer ID",       width: 16 },
  { key: "product_name",   header: "Product Name",      width: 24 },
  { key: "order_date",     header: "Order Date",        width: 18 },
  { key: "quantity",       header: "Quantity",          width: 12 },
  { key: "price",          header: "Unit Price (EGP)",  width: 16 },
  { key: "cost",           header: "Unit Cost (EGP)",   width: 16 },
  { key: "stock",          header: "Stock",             width: 12 },
  { key: "revenue",        header: "Revenue (EGP)",     width: 16 },
  { key: "profit",         header: "Profit (EGP)",      width: 16 },
  { key: "profit_margin",  header: "Profit Margin (%)", width: 18 },
  { key: "status",         header: "Order Status",      width: 14 },
  { key: "gender",         header: "Gender",            width: 12 },
  { key: "segment",        header: "Segment",           width: 14 },
]

export async function POST(req: NextRequest) {
  const ctx = await getBusinessContext(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let cleanResult: CleanResponse
  try {
    cleanResult = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { entities } = cleanResult

  // Build a lookup maps for cross-entity joins
  const customerMap = new Map(
    entities.customers.map((c) => [c.clerkId ?? c.email ?? c.fullName ?? "", c]),
  )
  const productMap = new Map(
    entities.products.map((p) => [p.name, p]),
  )
  const orderMap = new Map(
    entities.orders.map((o) => [o.externalOrderId ?? "", o]),
  )

  // ── Build rows ────────────────────────────────────────────────────────────
  const rows: Record<string, unknown>[] = []

  for (const item of entities.order_items) {
    const ord  = item.orderExternalId ? orderMap.get(item.orderExternalId) : undefined
    const prod = item.productName     ? productMap.get(item.productName)    : undefined
    const cust = ord?.customerExternalId
      ? customerMap.get(ord.customerExternalId)
      : undefined

    const price   = item.unitPrice ?? prod?.price ?? null
    const cost    = prod?.cost ?? null
    const qty     = item.quantity ?? 1
    const revenue = ord?.revenue  ?? (price !== null ? price * qty : null)
    const profit  = ord?.profit   ?? (revenue !== null && cost !== null ? revenue - cost : null)
    const margin  = ord?.profit_margin ?? (profit !== null && revenue !== null && revenue !== 0
      ? (profit / revenue) * 100 : null)

    rows.push({
      order_id:      ord?.externalOrderId ?? null,
      customer_id:   cust?.clerkId ?? cust?.email ?? null,
      product_name:  prod?.name ?? item.productName ?? null,
      order_date:    ord?.createdAt ?? null,
      quantity:      qty,
      price:         price,
      cost:          cost,
      stock:         prod?.stock ?? null,
      revenue:       revenue,
      profit:        profit,
      profit_margin: margin !== null ? parseFloat(margin.toFixed(2)) : null,
      status:        ord?.status ?? null,
      gender:        (item.attributes as Record<string, unknown>)?.gender ?? null,
      segment:       cust?.segment ?? null,
    })
  }

  // ── Build Excel workbook ──────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator = "FUSE CRM"
  wb.created = new Date()

  const ws = wb.addWorksheet("ML Dataset", {
    views: [{ state: "frozen", ySplit: 1 }],
  })

  // Header row styling
  const HEADER_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3344FC" }, // FUSE accent blue
  }

  ws.columns = ML_COLUMNS.map((col) => ({
    header: col.header,
    key:    col.key,
    width:  col.width,
  }))

  const headerRow = ws.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill   = HEADER_FILL
    cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Arial" }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF3344FC" } },
    }
  })
  headerRow.height = 22

  // Data rows
  rows.forEach((row, i) => {
    const wsRow = ws.addRow(row)
    wsRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colKey = ML_COLUMNS[colNumber - 1]?.key ?? ""
      cell.font = { name: "Arial", size: 10 }
      cell.alignment = { vertical: "middle" }

      // Alternate row fill
      if (i % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } }
      }

      // Number formatting
      if (["price", "cost", "revenue", "profit"].includes(colKey)) {
        cell.numFmt = '#,##0.00'
      }
      if (colKey === "profit_margin") {
        cell.numFmt = '0.00'
      }
      if (colKey === "quantity" || colKey === "stock") {
        cell.numFmt = '#,##0'
      }
    })
    wsRow.height = 18
  })

  // Summary sheet
  const summary = wb.addWorksheet("Summary")
  summary.getColumn(1).width = 28
  summary.getColumn(2).width = 18

  const summaryData = [
    ["FUSE ML Dataset Export", ""],
    ["Generated", new Date().toISOString().split("T")[0]],
    ["", ""],
    ["Total rows", rows.length],
    ["Unique customers", entities.customers.length],
    ["Unique products", entities.products.length],
    ["Orders", entities.orders.length],
    ["ML Coverage", `${cleanResult.summary.ml_coverage_pct}%`],
    ["Derived fields", cleanResult.derived_fields.join(", ") || "none"],
    ["Failed rows (excluded)", cleanResult.summary.failed_rows],
  ]

  summaryData.forEach(([label, value], i) => {
    const row = summary.addRow([label, value])
    if (i === 0) {
      row.getCell(1).font = { bold: true, size: 13, name: "Arial", color: { argb: "FF3344FC" } }
    } else {
      row.getCell(1).font = { bold: true, size: 10, name: "Arial" }
      row.getCell(2).font = { size: 10, name: "Arial" }
    }
  })

  // Serialize to buffer
  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="fuse-ml-dataset-${Date.now()}.xlsx"`,
    },
  })
}