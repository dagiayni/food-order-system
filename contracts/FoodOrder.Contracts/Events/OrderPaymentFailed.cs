namespace FoodOrder.Contracts.Events;

public record OrderPaymentFailed(
    Guid OrderId,
    string Reason
);
