namespace FoodOrder.Contracts.Commands;

public record CancelOrder(
    Guid OrderId,
    string Reason
);
