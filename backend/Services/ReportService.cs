using System.Globalization;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs;
using FinTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ReportService(ApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    private string GetRequiredUserId()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }
        return userId;
    }

    private (DateTime? start, DateTime? end, string label) ResolveDateRange(ReportFilterRequest filter)
    {
        var now = DateTime.UtcNow;

        if (filter.StartDate.HasValue || filter.EndDate.HasValue)
        {
            var s = filter.StartDate?.Date;
            var e = filter.EndDate?.Date.AddDays(1).AddTicks(-1);
            var label = (filter.StartDate.HasValue, filter.EndDate.HasValue) switch
            {
                (true, true) => $"{s:yyyy-MM-dd} to {filter.EndDate:yyyy-MM-dd}",
                (true, false) => $"Since {s:yyyy-MM-dd}",
                (false, true) => $"Up to {filter.EndDate:yyyy-MM-dd}",
                _ => "Custom Range"
            };
            return (s, e, label);
        }

        return (filter.Period?.ToLower()) switch
        {
            "7d" => (now.Date.AddDays(-7), null, "Last 7 Days"),
            "30d" => (now.Date.AddDays(-30), null, "Last 30 Days"),
            "6m" => (now.Date.AddMonths(-6), null, "Last 6 Months"),
            "1y" => (now.Date.AddYears(-1), null, "Last 12 Months"),
            "this-year" => (new DateTime(now.Year, 1, 1), new DateTime(now.Year, 12, 31, 23, 59, 59), $"{now.Year}"),
            "this-month" => (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59), $"{now:MMMM yyyy}"),
            _ => (null, null, "All Time")
        };
    }

    public async Task<FinancialSummaryDto> GetSummaryAsync(ReportFilterRequest filter)
    {
        var userId = GetRequiredUserId();
        var (start, end, label) = ResolveDateRange(filter);

        var query = _context.Transactions.AsNoTracking().Where(t => t.UserId == userId);

        if (start.HasValue)
            query = query.Where(t => t.TransactionDate >= start.Value);
        if (end.HasValue)
            query = query.Where(t => t.TransactionDate <= end.Value);

        var transactions = await query
            .Select(t => new { t.Amount, t.Type })
            .ToListAsync();

        decimal totalIncome = 0m;
        decimal totalExpenses = 0m;

        foreach (var t in transactions)
        {
            if (t.Type == TransactionType.Income)
                totalIncome += t.Amount;
            else if (t.Type == TransactionType.Expense)
                totalExpenses += t.Amount;
        }

        var netCashFlow = totalIncome - totalExpenses;
        var netSavings = netCashFlow > 0 ? netCashFlow : 0m;

        return new FinancialSummaryDto
        {
            TotalIncome = Math.Round(totalIncome, 2),
            TotalExpenses = Math.Round(totalExpenses, 2),
            NetCashFlow = Math.Round(netCashFlow, 2),
            NetSavings = Math.Round(netSavings, 2),
            TransactionCount = transactions.Count,
            Currency = "EGP",
            PeriodLabel = label,
            StartDate = start,
            EndDate = end
        };
    }

    public async Task<IEnumerable<CategoryBreakdownDto>> GetCategoryBreakdownAsync(ReportFilterRequest filter, TransactionType type)
    {
        var userId = GetRequiredUserId();
        var (start, end, _) = ResolveDateRange(filter);

        var query = _context.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.Type == type);

        if (start.HasValue)
            query = query.Where(t => t.TransactionDate >= start.Value);
        if (end.HasValue)
            query = query.Where(t => t.TransactionDate <= end.Value);

        var list = await query
            .GroupBy(t => t.Category)
            .Select(g => new
            {
                Category = g.Key,
                TotalAmount = g.Sum(x => x.Amount),
                Count = g.Count()
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToListAsync();

        var grandTotal = list.Sum(x => x.TotalAmount);

        return list.Select(e => new CategoryBreakdownDto
        {
            Category = e.Category,
            Type = type.ToString(),
            TotalAmount = Math.Round(e.TotalAmount, 2),
            Percentage = grandTotal > 0 ? Math.Round((e.TotalAmount / grandTotal) * 100m, 2) : 0m,
            TransactionCount = e.Count
        }).ToList();
    }

    public Task<IEnumerable<CategoryBreakdownDto>> GetExpenseBreakdownAsync(ReportFilterRequest filter)
    {
        return GetCategoryBreakdownAsync(filter, TransactionType.Expense);
    }

    public async Task<IEnumerable<MonthlyTrendDto>> GetMonthlyTrendAsync(ReportFilterRequest filter)
    {
        var userId = GetRequiredUserId();
        var targetYear = filter.Year ?? (filter.StartDate?.Year ?? DateTime.UtcNow.Year);

        // Fetch user's transactions for target year
        var yearStart = new DateTime(targetYear, 1, 1);
        var yearEnd = new DateTime(targetYear, 12, 31, 23, 59, 59);

        var transactions = await _context.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.TransactionDate >= yearStart && t.TransactionDate <= yearEnd)
            .Select(t => new { t.Amount, t.Type, t.TransactionDate.Month })
            .ToListAsync();

        var trends = new List<MonthlyTrendDto>();

        for (int month = 1; month <= 12; month++)
        {
            var monthTransactions = transactions.Where(t => t.Month == month).ToList();
            var income = monthTransactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var expenses = monthTransactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

            trends.Add(new MonthlyTrendDto
            {
                Year = targetYear,
                Month = month,
                MonthLabel = CultureInfo.InvariantCulture.DateTimeFormat.GetAbbreviatedMonthName(month) + " " + targetYear,
                Income = Math.Round(income, 2),
                Expenses = Math.Round(expenses, 2),
                NetCashFlow = Math.Round(income - expenses, 2)
            });
        }

        return trends;
    }
}
