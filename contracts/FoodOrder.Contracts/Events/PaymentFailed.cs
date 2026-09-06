namespace FoodOrder.Contracts.Events;

public record PaymentFailed(
    Guid PaymentId,
    Guid OrderId,
    string Reason
);
