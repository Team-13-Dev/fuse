export interface SalesItem {
  order_date: string; // YYYY-MM-DD
  revenue: number;
}

export interface ForecastRequest {
  business_id?: string;
  frequency_code?: 'D' | 'W' | 'M' | 'YE';
  frequency_name?: string;
  force_refresh?: boolean;
  sales_data: SalesItem[];
}

export interface Recommendation {
  priority: number;
  category: 'revenue_protection' | 'growth' | 'planning' | 'risk_management' | 'seasonality';
  period_targeted: string;
  insight: string;
  action: string;
  expected_impact: string;
  confidence: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'this_week' | 'this_month';
}

export interface ForecastResponse {
  metrics: {
    frequency_evaluated: string;
    calculated_accuracy_pct: number;
    optimal_weights: {
      lstm_weight: number;
      gbr_weight: number;
    };
    mae: number;
  };
  forecast_summary: {
    frequency: string;
    n_periods_forecasted: number;
    model_accuracy: number;
    total_forecasted_revenue: number;
    avg_revenue_per_period: number;
  };
  signals: {
    direction: 'growing' | 'declining' | 'stable';
    trend_pct_change: number;
    avg_volatility_pct: number;
    min_period_revenue: number;
    max_period_revenue: number;
    peak_period: { date: string; predicted_sales: number };
    trough_period: { date: string; predicted_sales: number };
  };
  strategic_recommendations: Recommendation[];
}