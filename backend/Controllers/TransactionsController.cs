using FinTrack.Api.DTOs;
using FinTrack.Api.Models;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions([FromQuery] TransactionFilterRequest filter)
    {
        var result = await _transactionService.GetTransactionsAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTransactionById(int id)
    {
        var transaction = await _transactionService.GetByIdAsync(id);
        if (transaction == null)
        {
            return NotFound(new { message = $"Transaction with ID {id} not found." });
        }
        return Ok(transaction);
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecentTransactions([FromQuery] int count = 5)
    {
        var countClamped = Math.Clamp(count, 1, 20);
        var recent = await _transactionService.GetRecentTransactionsAsync(countClamped);
        return Ok(recent);
    }

    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        return Ok(new
        {
            income = TransactionCategories.IncomeCategories,
            expense = TransactionCategories.ExpenseCategories
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var created = await _transactionService.CreateAsync(request);
            return CreatedAtAction(nameof(GetTransactionById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTransactionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updated = await _transactionService.UpdateAsync(id, request);
            if (updated == null)
            {
                return NotFound(new { message = $"Transaction with ID {id} not found." });
            }
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _transactionService.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = $"Transaction with ID {id} not found." });
        }
        return NoContent();
    }
}
