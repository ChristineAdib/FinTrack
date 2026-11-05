using System.Text.Json.Serialization;

namespace FinTrack.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TransactionType
{
    Income = 1,
    Expense = 2
}
