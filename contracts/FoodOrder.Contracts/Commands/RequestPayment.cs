namespace FoodOrder.Contracts.Commands;

public record RequestPayment(
    Guid OrderId,
    decimal Amount,
    string Currency = "USD"
);
