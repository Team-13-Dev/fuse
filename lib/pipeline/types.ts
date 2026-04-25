export interface DerivableField {
  field:          string
  formula:        string
  requires:       string[]
  source_columns: string[]
}

export interface ParseResponse {
  header_row_index:  number
  detected_mapping:  Record<string, string>
  confidence_scores: Record<string, number>
  match_methods:     Record<string, string>
  human_labels:      Record<string, string>   // plain-English label per column
  groups:            Record<string, string>   // group name per column
  sample_values:     Record<string, string[]> // up to 3 sample values per column
  ml_required:       string[]
  ml_missing:        string[]
  ml_coverage_pct:   number
  derivable_fields:  DerivableField[]
  truly_missing:     string[]
  attribute_columns: Record<string, string>
  unmapped_columns:  string[]
  total_rows:        number
  total_columns:     number
  warnings:          string[],
}

// ─── /clean input ─────────────────────────────────────────────────────────────

export interface ConfirmedMapping {
  header_row_index:        number
  confirmed:               Record<string, string>
  attribute_columns:       Record<string, string>
  ignored_columns:         string[]
  cost_pct:                number | null
  missing_field_decisions: Record<string, "placeholder" | "skip_feature">
}

// ─── /clean entity models ─────────────────────────────────────────────────────

export interface CleanedCustomer {
  clerkId:     string | null
  fullName:    string | null
  email:       string | null
  phoneNumber: string | null
  segment:     string | null
  metadata:    Record<string, unknown>
}

export interface CleanedProduct {
  name:          string
  externalAccId: string | null  // StockCode / SKU — primary dedup key
  price:         number | null
  cost:          number | null
  stock:         number | null
  description:   string | null
}

export interface CleanedOrder {
  externalOrderId:    string | null
  customerExternalId: string | null  // clerkId used to link customer
  status:             string
  total:              number | null
  revenue:            number | null
  profit:             number | null
  profit_margin:      number | null
  createdAt:          string | null
  address:            string | null
  orderVoucher:       string | null
}

export interface CleanedOrderItem {
  orderExternalId: string | null
  productAccId:    string | null  // externalAccId — primary product link
  productName:     string | null  // fallback when no SKU
  quantity:        number
  unitPrice:       number | null
  itemDiscount:    number
  revenue:         number | null
  profit:          number | null
  attributes:      Record<string, unknown>
  metadata:        Record<string, unknown>
}

// ─── /clean summary + response ────────────────────────────────────────────────

export interface CleanSummary {
  total_rows:        number
  clean_rows:        number
  failed_rows:       number
  cancelled_rows:    number
  customers_found:   number
  products_found:    number
  orders_found:      number
  order_items_found: number
  ml_coverage_pct:   number
  derived_fields:    string[]
}

export interface FailedRow {
  row_index: number
  reason:    string
}

export interface MissingFieldAction {
  field:   string
  reason:  string
  options: string[]
  affects: string[]
}

export interface ActionRequired {
  fields:  MissingFieldAction[]
  message: string
}

export interface CleanResponse {
  summary:  CleanSummary
  entities: {
    customers:   CleanedCustomer[]
    products:    CleanedProduct[]
    orders:      CleanedOrder[]
    order_items: CleanedOrderItem[],
  }
  failed_rows:     FailedRow[]
  warnings:        string[]
  action_required: ActionRequired | null,
  derived_fields:    string[]
}