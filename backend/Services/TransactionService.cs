using FinTrack.Api.Data;
using FinTrack.Api.DTOs;
using FinTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

public class TransactionService : ITransactionService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public TransactionService(ApplicationDbContext context, ICurrentUserService currentUserService)
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

    public async Task<PagedResult<TransactionDto>> GetTransactionsAsync(TransactionFilterRequest filter)
    {
        var userId = GetRequiredUserId();
        var query = _context.Transactions.AsNoTracking().Where(t => t.UserId == userId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(t =>
                (t.Description != null && t.Description.ToLower().Contains(search)) ||
                t.Category.ToLower().Contains(search));
        }

        if (filter.Type.HasValue)
        {
            query = query.Where(t => t.Type == filter.Type.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Category) && !filter.Category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.Category == filter.Category.Trim());
        }

        if (filter.StartDate.HasValue)
        {
            var start = filter.StartDate.Value.Date;
            query = query.Where(t => t.TransactionDate >= start);
        }

        if (filter.EndDate.HasValue)
        {
            var end = filter.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(t => t.TransactionDate <= end);
        }

        var totalCount = await query.CountAsync();

        // Sorting
        query = (filter.SortBy?.ToLower()) switch
        {
            "amount" => filter.SortDescending ? query.OrderByDescending(t => t.Amount) : query.OrderBy(t => t.Amount),
            "category" => filter.SortDescending ? query.OrderByDescending(t => t.Category) : query.OrderBy(t => t.Category),
            _ => filter.SortDescending ? query.OrderByDescending(t => t.TransactionDate).ThenByDescending(t => t.Id)
                                       : query.OrderBy(t => t.TransactionDate).ThenBy(t => t.Id)
        };

        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = t.Type,
                Category = t.Category,
                Description = t.Description,
                TransactionDate = t.TransactionDate,
                CreatedAtUtc = t.CreatedAtUtc
            })
            .ToListAsync();

        return new PagedResult<TransactionDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TransactionDto?> GetByIdAsync(int id)
    {
        var userId = GetRequiredUserId();
        var t = await _context.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (t == null) return null;

        return new TransactionDto
        {
            Id = t.Id,
            Amount = t.Amount,
            Type = t.Type,
            Category = t.Category,
            Description = t.Description,
            TransactionDate = t.TransactionDate,
            CreatedAtUtc = t.CreatedAtUtc
        };
    }

    public async Task<TransactionDto> CreateAsync(CreateTransactionRequest request)
    {
        var userId = GetRequiredUserId();

        if (request.Amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero.");
        }

        if (!TransactionCategories.IsValid(request.Type, request.Category))
        {
            throw new ArgumentException($"Invalid category '{request.Category}' for transaction type '{request.Type}'.");
        }

        var transaction = new Transaction
        {
            UserId = userId,
            Amount = Math.Round(request.Amount, 2),
            Type = request.Type,
            Category = request.Category.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            TransactionDate = request.TransactionDate.Kind == DateTimeKind.Utc ? request.TransactionDate : request.TransactionDate.ToUniversalTime(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return new TransactionDto
        {
            Id = transaction.Id,
            Amount = transaction.Amount,
            Type = transaction.Type,
            Category = transaction.Category,
            Description = transaction.Description,
            TransactionDate = transaction.TransactionDate,
            CreatedAtUtc = transaction.CreatedAtUtc
        };
    }

    public async Task<TransactionDto?> UpdateAsync(int id, UpdateTransactionRequest request)
    {
        var userId = GetRequiredUserId();
        var transaction = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null)
        {
            return null; // Not found or doesn't belong to current user
        }

        if (request.Amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero.");
        }

        if (!TransactionCategories.IsValid(request.Type, request.Category))
        {
            throw new ArgumentException($"Invalid category '{request.Category}' for transaction type '{request.Type}'.");
        }

        transaction.Amount = Math.Round(request.Amount, 2);
        transaction.Type = request.Type;
        transaction.Category = request.Category.Trim();
        transaction.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        transaction.TransactionDate = request.TransactionDate.Kind == DateTimeKind.Utc ? request.TransactionDate : request.TransactionDate.ToUniversalTime();

        await _context.SaveChangesAsync();

        return new TransactionDto
        {
            Id = transaction.Id,
            Amount = transaction.Amount,
            Type = transaction.Type,
            Category = transaction.Category,
            Description = transaction.Description,
            TransactionDate = transaction.TransactionDate,
            CreatedAtUtc = transaction.CreatedAtUtc
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var userId = GetRequiredUserId();
        var transaction = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null)
        {
            return false;
        }

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<TransactionDto>> GetRecentTransactionsAsync(int count = 5)
    {
        var userId = GetRequiredUserId();
        return await _context.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .Take(count)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = t.Type,
                Category = t.Category,
                Description = t.Description,
                TransactionDate = t.TransactionDate,
                CreatedAtUtc = t.CreatedAtUtc
            })
            .ToListAsync();
    }
}
