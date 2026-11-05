using FinTrack.Api.DTOs;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] ReportFilterRequest filter)
    {
        var summary = await _reportService.GetSummaryAsync(filter);
        return Ok(summary);
    }

    [HttpGet("expense-breakdown")]
    public async Task<IActionResult> GetExpenseBreakdown([FromQuery] ReportFilterRequest filter)
    {
        var breakdown = await _reportService.GetExpenseBreakdownAsync(filter);
        return Ok(breakdown);
    }

    [HttpGet("monthly-trend")]
    public async Task<IActionResult> GetMonthlyTrend([FromQuery] ReportFilterRequest filter)
    {
        var trend = await _reportService.GetMonthlyTrendAsync(filter);
        return Ok(trend);
    }
}
