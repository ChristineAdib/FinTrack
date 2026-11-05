using System.ComponentModel.DataAnnotations;
using FinTrack.Api.Models;

namespace FinTrack.Api.DTOs;

public class TransactionDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime TransactionDate { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateTransactionRequest
{
    [Range(0.01, 1_000_000_000, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Transaction type is required.")]
    public TransactionType Type { get; set; }

    [Required(ErrorMessage = "Category is required.")]
    [MaxLength(100, ErrorMessage = "Category cannot exceed 100 characters.")]
    public string Category { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Transaction date is required.")]
    public DateTime TransactionDate { get; set; }
}

public class UpdateTransactionRequest
{
    [Range(0.01, 1_000_000_000, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Transaction type is required.")]
    public TransactionType Type { get; set; }

    [Required(ErrorMessage = "Category is required.")]
    [MaxLength(100, ErrorMessage = "Category cannot exceed 100 characters.")]
    public string Category { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Transaction date is required.")]
    public DateTime TransactionDate { get; set; }
}

public class TransactionFilterRequest
{
    public string? Search { get; set; }
    public TransactionType? Type { get; set; }
    public string? Category { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; } = "date"; // "date", "amount", "category"
    public bool SortDescending { get; set; } = true;
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}
