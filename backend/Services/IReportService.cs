using FinTrack.Api.DTOs;
using FinTrack.Api.Models;

namespace FinTrack.Api.Services;

public interface IReportService
{
    Task<FinancialSummaryDto> GetSummaryAsync(ReportFilterRequest filter);
    Task<IEnumerable<CategoryBreakdownDto>> GetExpenseBreakdownAsync(ReportFilterRequest filter);
    Task<IEnumerable<CategoryBreakdownDto>> GetCategoryBreakdownAsync(ReportFilterRequest filter, TransactionType type);
    Task<IEnumerable<MonthlyTrendDto>> GetMonthlyTrendAsync(ReportFilterRequest filter);
}
