using FinTrack.Api.DTOs;

namespace FinTrack.Api.Services;

public interface IReportService
{
    Task<FinancialSummaryDto> GetSummaryAsync(ReportFilterRequest filter);
    Task<IEnumerable<CategoryBreakdownDto>> GetExpenseBreakdownAsync(ReportFilterRequest filter);
    Task<IEnumerable<MonthlyTrendDto>> GetMonthlyTrendAsync(ReportFilterRequest filter);
}
