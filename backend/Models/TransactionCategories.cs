namespace FinTrack.Api.Models;

public static class TransactionCategories
{
    public static readonly string[] IncomeCategories =
    [
        "Salary",
        "Freelance",
        "Investment",
        "Business",
        "Gift",
        "Other Income"
    ];

    public static readonly string[] ExpenseCategories =
    [
        "Food & Dining",
        "Housing & Rent",
        "Transportation",
        "Utilities",
        "Healthcare",
        "Entertainment",
        "Shopping",
        "Education",
        "Personal Care",
        "Debt & Loans",
        "Other Expense"
    ];

    public static bool IsValid(TransactionType type, string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return false;

        var list = type == TransactionType.Income ? IncomeCategories : ExpenseCategories;
        return list.Contains(category.Trim(), StringComparer.OrdinalIgnoreCase);
    }
}
