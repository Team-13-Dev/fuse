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
  topProducts:      Array<{ product_id: string; profit: number; revenue: number }>
  bottomProducts:   Array<{ product_id: string; profit_margin: number }>
}

export interface SegmentsResponse {
  hasResults:        boolean
  productCount:      number
  minProductsNeeded: number
  lastJobAt:         string | null
  segments:          ProductSegment[]
  clusters:          ProductClusterSummary[]
}