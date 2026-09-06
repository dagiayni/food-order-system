namespace FoodOrder.Contracts.Events;

public record PaymentSucceeded(
    Guid PaymentId,
    Guid OrderId,
    decimal Amount
);
