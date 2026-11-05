using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FinTrack.Api.DTOs;
using FinTrack.Api.Models;
using Xunit;

namespace FinTrack.Tests;

public class TransactionAndIsolationTests : IClassFixture<FinTrackApiFactory>
{
    private readonly FinTrackApiFactory _factory;

    public TransactionAndIsolationTests(FinTrackApiFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient client, string userId)> CreateAuthenticatedUserAsync(string name)
    {
        var client = _factory.CreateClient();
        var email = $"{name.ToLower().Replace(" ", "_")}_{Guid.NewGuid()}@example.com";
        var password = "Password123!";

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = name,
            Email = email,
            Password = password,
            ConfirmPassword = password
        });

        response.EnsureSuccessStatusCode();
        var authResult = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authResult.Token);
        return (client, authResult.User.Id);
    }

    [Fact]
    public async Task AddTransaction_IncomeAndExpense_PersistsCorrectly()
    {
        var (client, _) = await CreateAuthenticatedUserAsync("Investor One");

        // 1. Add Income
        var incomeReq = new CreateTransactionRequest
        {
            Amount = 5000.50m,
            Type = TransactionType.Income,
            Category = "Salary",
            Description = "Monthly engineering compensation",
            TransactionDate = DateTime.UtcNow
        };
        var incRes = await client.PostAsJsonAsync("/api/transactions", incomeReq);
        Assert.Equal(HttpStatusCode.Created, incRes.StatusCode);
        var createdIncome = await incRes.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(createdIncome);
        Assert.Equal(5000.50m, createdIncome.Amount);
        Assert.Equal(TransactionType.Income, createdIncome.Type);

        // 2. Add Expense
        var expenseReq = new CreateTransactionRequest
        {
            Amount = 150.25m,
            Type = TransactionType.Expense,
            Category = "Food & Dining",
            Description = "Botanical organic dinner",
            TransactionDate = DateTime.UtcNow
        };
        var expRes = await client.PostAsJsonAsync("/api/transactions", expenseReq);
        Assert.Equal(HttpStatusCode.Created, expRes.StatusCode);
        var createdExpense = await expRes.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(createdExpense);
        Assert.Equal(150.25m, createdExpense.Amount);
        Assert.Equal(TransactionType.Expense, createdExpense.Type);

        // 3. View Paged List
        var listRes = await client.GetAsync("/api/transactions");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var paged = await listRes.Content.ReadFromJsonAsync<PagedResult<TransactionDto>>();
        Assert.NotNull(paged);
        Assert.True(paged.TotalCount >= 2);
    }

    [Fact]
    public async Task UpdateAndDeleteTransaction_WorksAsExpected()
    {
        var (client, _) = await CreateAuthenticatedUserAsync("Updater User");

        // Create
        var createRes = await client.PostAsJsonAsync("/api/transactions", new CreateTransactionRequest
        {
            Amount = 250m,
            Type = TransactionType.Expense,
            Category = "Transportation",
            Description = "Initial Ride",
            TransactionDate = DateTime.UtcNow
        });
        var created = await createRes.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(created);

        // Update
        var updateRes = await client.PutAsJsonAsync($"/api/transactions/{created.Id}", new UpdateTransactionRequest
        {
            Amount = 300m,
            Type = TransactionType.Expense,
            Category = "Transportation",
            Description = "Updated Train Ticket",
            TransactionDate = DateTime.UtcNow
        });
        Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);
        var updated = await updateRes.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(updated);
        Assert.Equal(300m, updated.Amount);
        Assert.Equal("Updated Train Ticket", updated.Description);

        // Delete
        var deleteRes = await client.DeleteAsync($"/api/transactions/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);

        // Verify Not Found
        var getRes = await client.GetAsync($"/api/transactions/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);
    }

    [Fact]
    public async Task AddTransaction_ZeroOrNegativeAmount_ReturnsBadRequest()
    {
        var (client, _) = await CreateAuthenticatedUserAsync("Validation Tester");

        var zeroReq = new CreateTransactionRequest
        {
            Amount = 0m,
            Type = TransactionType.Expense,
            Category = "Food & Dining",
            TransactionDate = DateTime.UtcNow
        };
        var zeroRes = await client.PostAsJsonAsync("/api/transactions", zeroReq);
        Assert.Equal(HttpStatusCode.BadRequest, zeroRes.StatusCode);

        var negReq = new CreateTransactionRequest
        {
            Amount = -100m,
            Type = TransactionType.Expense,
            Category = "Food & Dining",
            TransactionDate = DateTime.UtcNow
        };
        var negRes = await client.PostAsJsonAsync("/api/transactions", negReq);
        Assert.Equal(HttpStatusCode.BadRequest, negRes.StatusCode);
    }

    [Fact]
    public async Task AddTransaction_InvalidCategory_ReturnsBadRequest()
    {
        var (client, _) = await CreateAuthenticatedUserAsync("Category Tester");

        // Salary is Income, not Expense
        var invalidReq = new CreateTransactionRequest
        {
            Amount = 100m,
            Type = TransactionType.Expense,
            Category = "Salary", // Invalid for Expense
            TransactionDate = DateTime.UtcNow
        };
        var res = await client.PostAsJsonAsync("/api/transactions", invalidReq);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task UserDataIsolation_UserCannotReadOrMutateOtherUserTransaction()
    {
        var (clientAlice, _) = await CreateAuthenticatedUserAsync("Alice Wonder");
        var (clientBob, _) = await CreateAuthenticatedUserAsync("Bob Builder");

        // Alice creates a private transaction
        var aliceRes = await clientAlice.PostAsJsonAsync("/api/transactions", new CreateTransactionRequest
        {
            Amount = 9999m,
            Type = TransactionType.Income,
            Category = "Salary",
            Description = "Alice Private Salary",
            TransactionDate = DateTime.UtcNow
        });
        var aliceTx = await aliceRes.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(aliceTx);

        // 1. Bob attempts to GET Alice's transaction by ID
        var bobGetRes = await clientBob.GetAsync($"/api/transactions/{aliceTx.Id}");
        Assert.Equal(HttpStatusCode.NotFound, bobGetRes.StatusCode);

        // 2. Bob attempts to UPDATE Alice's transaction by ID
        var bobPutRes = await clientBob.PutAsJsonAsync($"/api/transactions/{aliceTx.Id}", new UpdateTransactionRequest
        {
            Amount = 1m,
            Type = TransactionType.Expense,
            Category = "Other Expense",
            Description = "Bob Malicious Update Attempt",
            TransactionDate = DateTime.UtcNow
        });
        Assert.Equal(HttpStatusCode.NotFound, bobPutRes.StatusCode);

        // 3. Bob attempts to DELETE Alice's transaction by ID
        var bobDeleteRes = await clientBob.DeleteAsync($"/api/transactions/{aliceTx.Id}");
        Assert.Equal(HttpStatusCode.NotFound, bobDeleteRes.StatusCode);

        // 4. Verify Alice's transaction remains completely untouched
        var aliceVerifyRes = await clientAlice.GetAsync($"/api/transactions/{aliceTx.Id}");
        Assert.Equal(HttpStatusCode.OK, aliceVerifyRes.StatusCode);
        var verified = await aliceVerifyRes.Content.ReadFromJsonAsync<TransactionDto>();
        Assert.NotNull(verified);
        Assert.Equal(9999m, verified.Amount);
        Assert.Equal("Alice Private Salary", verified.Description);
    }
}
