namespace FoodOrder.Contracts.Events;

public record OrderCancelled(
    Guid OrderId,
    string Reason
);
