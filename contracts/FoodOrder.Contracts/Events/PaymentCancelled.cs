namespace FoodOrder.Contracts.Events;

public record PaymentCancelled(
    Guid PaymentId,
    Guid OrderId
);
