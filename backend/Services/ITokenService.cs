using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FinTrack.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace FinTrack.Api.Services;

public interface ITokenService
{
    (string token, DateTime expiration) CreateToken(ApplicationUser user);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string token, DateTime expiration) CreateToken(ApplicationUser user)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "FinTrack_SuperSecretKey_FreshBotanicalFinance_2026_SecureKey!";
        var issuer = _configuration["Jwt:Issuer"] ?? "FinTrack.Api";
        var audience = _configuration["Jwt:Audience"] ?? "FinTrack.Client";
        var expiryInDays = int.TryParse(_configuration["Jwt:ExpiryInDays"], out var days) ? days : 7;

        var expiration = DateTime.UtcNow.AddDays(expiryInDays);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(securityToken);

        return (tokenString, expiration);
    }
}
