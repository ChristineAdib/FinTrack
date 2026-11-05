using FinTrack.Api.DTOs;
using FinTrack.Api.Models;

namespace FinTrack.Api.Services;

public interface ITransactionService
{
    Task<PagedResult<TransactionDto>> GetTransactionsAsync(TransactionFilterRequest filter);
    Task<TransactionDto?> GetByIdAsync(int id);
    Task<TransactionDto> CreateAsync(CreateTransactionRequest request);
    Task<TransactionDto?> UpdateAsync(int id, UpdateTransactionRequest request);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<TransactionDto>> GetRecentTransactionsAsync(int count = 5);
}
