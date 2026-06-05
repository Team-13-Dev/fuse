// lib/jobs/types.ts

export type JobStatus = "queued" | "running" | "done" | "failed" | "skipped"

export type JobType = "product_segmentation" | string  // open-ended for future types

export interface AnalysisJob {
  id:           string
  businessId:   string
  type:         JobType
  status:       JobStatus
  progress:     number     // 0-100
  detail:       string | null
  error:        string | null
  resultMeta:   Record<string, unknown> | null
  triggeredBy:  string
  startedAt:    string | null
  finishedAt:   string | null
  createdAt:    string
}

export interface ProductSegment {
  productId:    string
  cluster:      number
  clusterName:  string
  updatedAt:    string
}

export interface ProductClusterSummary {
  id:               string
  cluster:          number
  clusterName:      string
  numProducts:      number
  avgProfit:        number | null
  totalProfit:      number | null
  avgRevenue:       number | null
  totalRevenue:     number | null
  avgPrice:         number | null
  avgCost:          number | null
  avgMargin:        number | null
  avgStock:         number | null
  avgQuantity:      number | null
  revenueSharePct:  number | null
  profitSharePct:   number | null
  topProducts:      Array<{ product_id: string; name: string | null; price: number | null; profit: number }>
  bottomProducts:   Array<{ product_id: string; name: string | null; price: number | null; profit_margin: number }>
}

export interface SegmentsResponse {
  hasResults:        boolean
  productCount:      number
  minProductsNeeded: number
  lastJobAt:         string | null
  segments:          ProductSegment[]
  clusters:          ProductClusterSummary[]
}

// ─── Customer segmentation ────────────────────────────────────────────────────

export interface CustomerClusterSummary {
  id:              string
  cluster:         number
  segmentName:     string
  numCustomers:    number
  recencyMedian:   number       // days since last order
  frequencyMedian: number       // unique orders
  monetaryMedian:  number       // total spend median (EGP)
  monetarySum:     number       // total revenue from this segment
  aovMedian:       number | null
  tenureMedian:    number | null // days between first and last order
  revenuePct:      number       // % of total revenue
  customerPct:     number       // % of total customers
  churnRisk:       string       // "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH" | "CRITICAL"
  priority:        string
  channel:         string
  offer:           string
  upsell:          string
  campaignFreq:    string
  topCustomers:    Array<{
    customer_id: string
    name:        string | null
    monetary:    number
    frequency:   number
    recency:     number
  }>
}

export interface CustomerSegmentsResponse {
  hasResults:         boolean
  customerCount:      number
  minCustomersNeeded: number
  lastJobAt:          string | null
  clusters:           CustomerClusterSummary[]
}