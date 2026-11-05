using FinTrack.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();

        var demoEmail = "demo@fintrack.app";
        var demoUser = await userManager.FindByEmailAsync(demoEmail);

        if (demoUser == null)
        {
            demoUser = new ApplicationUser
            {
                UserName = demoEmail,
                Email = demoEmail,
                FullName = "Nour Botanical",
                EmailConfirmed = true,
                CreatedAtUtc = DateTime.UtcNow.AddMonths(-6)
            };

            var createResult = await userManager.CreateAsync(demoUser, "Password123!");
            if (createResult.Succeeded)
            {
                var now = DateTime.UtcNow;
                var currentYear = now.Year;

                // 1. Prompt Specification Mandatory Test Data (Current Month)
                var transactions = new List<Transaction>
                {
                    new()
                    {
                        UserId = demoUser.Id,
                        Amount = 10000.00m,
                        Type = TransactionType.Income,
                        Category = "Salary",
                        Description = "Primary monthly tech salary",
                        TransactionDate = new DateTime(currentYear, now.Month, 1),
                        CreatedAtUtc = DateTime.UtcNow
                    },
                    new()
                    {
                        UserId = demoUser.Id,
                        Amount = 2000.00m,
                        Type = TransactionType.Income,
                        Category = "Freelance",
                        Description = "FinTrack UI/UX consultation gig",
                        TransactionDate = new DateTime(currentYear, now.Month, 3),
                        CreatedAtUtc = DateTime.UtcNow
                    },
                    new()
                    {
                        UserId = demoUser.Id,
                        Amount = 1500.00m,
                        Type = TransactionType.Expense,
                        Category = "Food & Dining",
                        Description = "Fresh market organic groceries",
                        TransactionDate = new DateTime(currentYear, now.Month, 4),
                        CreatedAtUtc = DateTime.UtcNow
                    },
                    new()
                    {
                        UserId = demoUser.Id,
                        Amount = 500.00m,
                        Type = TransactionType.Expense,
                        Category = "Transportation",
                        Description = "Monthly commute and transit pass",
                        TransactionDate = new DateTime(currentYear, now.Month, 5),
                        CreatedAtUtc = DateTime.UtcNow
                    }
                };

                // 2. Historical records for past months to populate realistic annual charts
                for (int m = 1; m < now.Month; m++)
                {
                    // Income
                    transactions.Add(new Transaction
                    {
                        UserId = demoUser.Id,
                        Amount = 10000.00m,
                        Type = TransactionType.Income,
                        Category = "Salary",
                        Description = "Monthly salary compensation",
                        TransactionDate = new DateTime(currentYear, m, 1),
                        CreatedAtUtc = DateTime.UtcNow
                    });

                    if (m % 2 == 0)
                    {
                        transactions.Add(new Transaction
                        {
                            UserId = demoUser.Id,
                            Amount = 1800.00m,
                            Type = TransactionType.Income,
                            Category = "Freelance",
                            Description = "Design contract milestone",
                            TransactionDate = new DateTime(currentYear, m, 15),
                            CreatedAtUtc = DateTime.UtcNow
                        });
                    }

                    // Expenses
                    transactions.Add(new Transaction
                    {
                        UserId = demoUser.Id,
                        Amount = 1450.00m,
                        Type = TransactionType.Expense,
                        Category = "Food & Dining",
                        Description = "Groceries & daily meals",
                        TransactionDate = new DateTime(currentYear, m, 8),
                        CreatedAtUtc = DateTime.UtcNow
                    });

                    transactions.Add(new Transaction
                    {
                        UserId = demoUser.Id,
                        Amount = 480.00m,
                        Type = TransactionType.Expense,
                        Category = "Transportation",
                        Description = "Transit and taxi fare",
                        TransactionDate = new DateTime(currentYear, m, 12),
                        CreatedAtUtc = DateTime.UtcNow
                    });

                    transactions.Add(new Transaction
                    {
                        UserId = demoUser.Id,
                        Amount = 750.00m,
                        Type = TransactionType.Expense,
                        Category = "Utilities",
                        Description = "Electricity and high-speed fiber",
                        TransactionDate = new DateTime(currentYear, m, 20),
                        CreatedAtUtc = DateTime.UtcNow
                    });

                    if (m % 3 == 0)
                    {
                        transactions.Add(new Transaction
                        {
                            UserId = demoUser.Id,
                            Amount = 620.00m,
                            Type = TransactionType.Expense,
                            Category = "Entertainment",
                            Description = "Books and cultural events",
                            TransactionDate = new DateTime(currentYear, m, 24),
                            CreatedAtUtc = DateTime.UtcNow
                        });
                    }
                }

                await context.Transactions.AddRangeAsync(transactions);
                await context.SaveChangesAsync();
            }
        }
    }
}
