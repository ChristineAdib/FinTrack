using System.Net;
using System.Net.Http.Json;
using FinTrack.Api.DTOs;
using Xunit;

namespace FinTrack.Tests;

public class AuthenticationTests : IClassFixture<FinTrackApiFactory>
{
    private readonly HttpClient _client;

    public AuthenticationTests(FinTrackApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsSuccessAndToken()
    {
        var email = $"user_{Guid.NewGuid()}@example.com";
        var request = new RegisterRequestDto
        {
            FullName = "Tariq Botanical",
            Email = email,
            Password = "SecurePassword123!",
            ConfirmPassword = "SecurePassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal(email, result.User.Email);
        Assert.Equal("Tariq Botanical", result.User.FullName);
    }

    [Fact]
    public async Task Register_WithMismatchedPasswords_ReturnsBadRequest()
    {
        var request = new RegisterRequestDto
        {
            FullName = "Tariq Botanical",
            Email = $"mismatch_{Guid.NewGuid()}@example.com",
            Password = "Password123",
            ConfirmPassword = "DifferentPassword456"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsBadRequest()
    {
        var email = $"duplicate_{Guid.NewGuid()}@example.com";
        var request = new RegisterRequestDto
        {
            FullName = "User First",
            Email = email,
            Password = "Password123",
            ConfirmPassword = "Password123"
        };

        var firstRes = await _client.PostAsJsonAsync("/api/auth/register", request);
        Assert.Equal(HttpStatusCode.OK, firstRes.StatusCode);

        // Attempt duplicate registration
        var dupRes = await _client.PostAsJsonAsync("/api/auth/register", request);
        Assert.Equal(HttpStatusCode.BadRequest, dupRes.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var email = $"login_{Guid.NewGuid()}@example.com";
        var password = "ValidPassword123!";

        // Register first
        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = "Login Tester",
            Email = email,
            Password = password,
            ConfirmPassword = password
        });

        // Attempt login
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Email = email,
            Password = password
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var result = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal(email, result.User.Email);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var email = $"wrongpw_{Guid.NewGuid()}@example.com";
        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = "Wrong PW Tester",
            Email = email,
            Password = "CorrectPassword123",
            ConfirmPassword = "CorrectPassword123"
        });

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Email = email,
            Password = "IncorrectPassword"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
    }

    [Fact]
    public async Task ProtectedRoutes_WithoutToken_ReturnUnauthorized()
    {
        var unauthedClient = _client;
        var response = await unauthedClient.GetAsync("/api/transactions");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var reportResponse = await unauthedClient.GetAsync("/api/reports/summary");
        Assert.Equal(HttpStatusCode.Unauthorized, reportResponse.StatusCode);
    }
}
