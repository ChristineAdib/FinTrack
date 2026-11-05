export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  netSavings: number;
  transactionCount: number;
  currency: string;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
}

export interface CategoryBreakdown {
  category: string;
  type: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  monthLabel: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  period?: '7d' | '30d' | '6m' | '1y' | 'this-year' | 'this-month' | 'all' | 'custom';
  year?: number;
}
