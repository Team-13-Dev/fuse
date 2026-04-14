// lib/pipeline/types.ts
// Shared types for the FUSE data pipeline integration.
// These mirror the FastAPI Pydantic models exactly.

// ─── /parse response ─────────────────────────────────────────────────────────

export interface DerivableField {
  field: string
  formula: string
  requires: string[]
  source_columns: string[]
}

export interface ParseResponse {
  header_row_index: number
  detected_mapping: Record<string, string>
  confidence_scores: Record<string, number>
  match_methods: Record<string, string>
  ml_required: string[]
  ml_missing: string[]
  ml_coverage_pct: number
  derivable_fields: DerivableField[]
  truly_missing: string[]
  attribute_columns: Record<string, string>
  unmapped_columns: string[]
  sample_rows: Record<string, unknown>[]
  warnings: string[]
}

// ─── /clean input ─────────────────────────────────────────────────────────────

export interface ConfirmedMapping {
  header_row_index: number
  confirmed: Record<string, string>
  attribute_columns: Record<string, string>
  ignored_columns: string[]
  cost_pct: number | null
  missing_field_decisions: Record<string, "placeholder" | "skip_feature">
}

// ─── /clean response ──────────────────────────────────────────────────────────

export interface CleanedCustomer {
  clerkId: string | null
  fullName: string | null
  email: string | null
  phoneNumber: string | null
  segment: string | null
  metadata: Record<string, unknown>
}

export interface CleanedProduct {
  name: string
  price: number | null
  cost: number | null
  stock: number | null
  description: string | null
  externalAccId: string | null
}

export interface CleanedOrder {
  externalOrderId: string | null
  status: string
  total: number | null
  orderVoucher: string | null
  address: string | null
  createdAt: string | null
  customerExternalId: string | null
  revenue: number | null
  profit: number | null
  profit_margin: number | null
}

export interface CleanedOrderItem {
  orderExternalId: string | null
  productName: string | null
  quantity: number
  unitPrice: number | null
  itemDiscount: number
  attributes: Record<string, unknown>
  metadata: Record<string, unknown>
}

export interface CleanSummary {
  total_rows: number
  clean_rows: number
  failed_rows: number
  customers_found: number
  products_found: number
  orders_found: number
  order_items_found: number
  ml_coverage_pct: number
}

export interface FailedRow {
  row_index: number
  raw_data: Record<string, unknown>
  reason: string
}

export interface MissingFieldAction {
  field: string
  reason: string
  options: string[]
  affects: string[]
}

export interface ActionRequired {
  fields: MissingFieldAction[]
  message: string
}

export interface CleanResponse {
  summary: CleanSummary
  entities: {
    customers: CleanedCustomer[]
    products: CleanedProduct[]
    orders: CleanedOrder[]
    order_items: CleanedOrderItem[]
  }
  failed_rows: FailedRow[]
  derived_fields: string[]
  warnings: string[]
  action_required: ActionRequired | null
}