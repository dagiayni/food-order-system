namespace FoodOrder.Contracts.Events;

public record OrderPaid(
    Guid OrderId,
    decimal TotalPrice
);
