using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FinTrack.Api.DTOs;
using FinTrack.Api.Models;
using Xunit;

namespace FinTrack.Tests;

public class FinancialCalculationTests : IClassFixture<FinTrackApiFactory>
{
    private readonly FinTrackApiFactory _factory;

    public FinancialCalculationTests(FinTrackApiFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string username)
    {
        var client = _factory.CreateClient();
        var sanitized = username.ToLower().Replace(" ", "_");
        var email = $"{sanitized}_{Guid.NewGuid()}@example.com";
        var password = "Password123!";

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = username,
            Email = email,
            Password = password,
            ConfirmPassword = password
        });

        response.EnsureSuccessStatusCode();
        var authResult = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authResult.Token);
        return client;
    }

    [Fact]
    public async Task FinancialCalculations_MatchSpecificationExactValues()
    {
        var client = await CreateAuthenticatedClientAsync("Finance Auditor");

        var now = DateTime.UtcNow;

        // Income 1: Salary: EGP 10,000
        await client.PostAsJsonAsync("/api/transactions", new CreateTransactionRequest
        {
            Amount = 10000m,
            Type = TransactionType.Income,
            Category = "Salary",
            Description = "Corporate monthly salary",
            TransactionDate = now
        });

        // Income 2: Freelance: EGP 2,000
        await client.PostAsJsonAsync("/api/transactions", new CreateTransactionRequest
        {
            Amount = 2000m,
            Type = TransactionType.Income,
            Category = "Freelance",
            Description = "Consulting gig",
            TransactionDate = now
        });

        // Expense 1: Food: EGP 1,500
        await client.PostAsJsonAsync("/api/transactions", new CreateTransactionRequest
        {
            Amount = 1500m,
            Type = TransactionType.Expense,
            Category = "Food & Dining",
            Description = "Groceries and dining",
            TransactionDate = now
        });

        // Expense 2: Transportation: EGP 500
        await client.PostAsJsonAsync("/api/transactions", new CreateTransactionRequest
        {
            Amount = 500m,
            Type = TransactionType.Expense,
            Category = "Transportation",
            Description = "Fuel and transit",
            TransactionDate = now
        });

        // Check Summary API
        var summaryRes = await client.GetAsync("/api/reports/summary?period=all");
        Assert.Equal(HttpStatusCode.OK, summaryRes.StatusCode);
        var summary = await summaryRes.Content.ReadFromJsonAsync<FinancialSummaryDto>();
        Assert.NotNull(summary);

        // Verification of Required Expected Results:
        // Total Income: EGP 12,000
        // Total Expenses: EGP 2,000
        // Net Cash Flow: EGP 10,000
        // Net Savings: EGP 10,000
        Assert.Equal(12000m, summary.TotalIncome);
        Assert.Equal(2000m, summary.TotalExpenses);
        Assert.Equal(10000m, summary.NetCashFlow);
        Assert.Equal(10000m, summary.NetSavings);
        Assert.Equal(4, summary.TransactionCount);

        // Check Expense Breakdown
        var breakdownRes = await client.GetAsync("/api/reports/expense-breakdown?period=all");
        Assert.Equal(HttpStatusCode.OK, breakdownRes.StatusCode);
        var breakdown = await breakdownRes.Content.ReadFromJsonAsync<List<CategoryBreakdownDto>>();
        Assert.NotNull(breakdown);

        var food = breakdown.FirstOrDefault(b => b.Category == "Food & Dining");
        Assert.NotNull(food);
        Assert.Equal(1500m, food.TotalAmount);
        Assert.Equal(75m, food.Percentage); // 1500 / 2000 = 75%

        var transport = breakdown.FirstOrDefault(b => b.Category == "Transportation");
        Assert.NotNull(transport);
        Assert.Equal(500m, transport.TotalAmount);
        Assert.Equal(25m, transport.Percentage); // 500 / 2000 = 25%
    }

    [Fact]
    public async Task EmptyFinancialRecords_ReturnsZeroWithoutDivisionErrors()
    {
        var client = await CreateAuthenticatedClientAsync("Empty User");

        var summaryRes = await client.GetAsync("/api/reports/summary?period=all");
        Assert.Equal(HttpStatusCode.OK, summaryRes.StatusCode);
        var summary = await summaryRes.Content.ReadFromJsonAsync<FinancialSummaryDto>();
        Assert.NotNull(summary);

        Assert.Equal(0m, summary.TotalIncome);
        Assert.Equal(0m, summary.TotalExpenses);
        Assert.Equal(0m, summary.NetCashFlow);
        Assert.Equal(0m, summary.NetSavings);
        Assert.Equal(0, summary.TransactionCount);

        var breakdownRes = await client.GetAsync("/api/reports/expense-breakdown?period=all");
        Assert.Equal(HttpStatusCode.OK, breakdownRes.StatusCode);
        var breakdown = await breakdownRes.Content.ReadFromJsonAsync<List<CategoryBreakdownDto>>();
        Assert.NotNull(breakdown);
        Assert.Empty(breakdown);
    }

    [Fact]
    public async Task ExpensesWithoutIncome_CalculatesNegativeNetCashFlowSafely()
    {
        var client = await CreateAuthenticatedClientAsync("Deficit User");

        await client.PostAsJsonAsync("/api/transactions", new CreateTransactionRequest
        {
            Amount = 1200m,
            Type = TransactionType.Expense,
            Category = "Utilities",
            TransactionDate = DateTime.UtcNow
        });

        var summaryRes = await client.GetAsync("/api/reports/summary?period=all");
        var summary = await summaryRes.Content.ReadFromJsonAsync<FinancialSummaryDto>();
        Assert.NotNull(summary);

        Assert.Equal(0m, summary.TotalIncome);
        Assert.Equal(1200m, summary.TotalExpenses);
        Assert.Equal(-1200m, summary.NetCashFlow);
        Assert.Equal(0m, summary.NetSavings); // Net savings cannot be negative
    }

    [Fact]
    public async Task UpdatesAndDeletions_AffectSummariesAccurately()
    {
        var client = await CreateAuthenticatedClientAsync("Dynamic User");

        // 1. Add 5000 Income
        var txRes = await client.PostAsJsonAsync("/api/transactions", new CreateTransactionRequest
        {
            Amount = 5000m,
            Type = TransactionType.Income,
            Category = "Salary",
            TransactionDate = DateTime.UtcNow
        });
        var tx = await txRes.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(tx);

        // Check initial summary: Income = 5000
        var s1 = await (await client.GetAsync("/api/reports/summary?period=all")).Content.ReadFromJsonAsync<FinancialSummaryDto>();
        Assert.Equal(5000m, s1!.TotalIncome);

        // 2. Update to 7000
        await client.PutAsJsonAsync($"/api/transactions/{tx.Id}", new UpdateTransactionRequest
        {
            Amount = 7000m,
            Type = TransactionType.Income,
            Category = "Salary",
            TransactionDate = DateTime.UtcNow
        });
        var s2 = await (await client.GetAsync("/api/reports/summary?period=all")).Content.ReadFromJsonAsync<FinancialSummaryDto>();
        Assert.Equal(7000m, s2!.TotalIncome);

        // 3. Delete transaction
        await client.DeleteAsync($"/api/transactions/{tx.Id}");
        var s3 = await (await client.GetAsync("/api/reports/summary?period=all")).Content.ReadFromJsonAsync<FinancialSummaryDto>();
        Assert.Equal(0m, s3!.TotalIncome);
    }
}
