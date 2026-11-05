namespace FinTrack.Api.DTOs;

public class FinancialSummaryDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetCashFlow { get; set; }
    public decimal NetSavings { get; set; }
    public int TransactionCount { get; set; }
    public string Currency { get; set; } = "EGP";
    public string PeriodLabel { get; set; } = "All Time";
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class CategoryBreakdownDto
{
    public string Category { get; set; } = string.Empty;
    public string Type { get; set; } = "Expense";
    public decimal TotalAmount { get; set; }
    public decimal Percentage { get; set; }
    public int TransactionCount { get; set; }
}

public class MonthlyTrendDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthLabel { get; set; } = string.Empty; // e.g. "Oct 2026"
    public decimal Income { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetCashFlow { get; set; }
}

public class ReportFilterRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Period { get; set; } // "7d", "30d", "6m", "1y", "custom", "all"
    public int? Year { get; set; }
}
