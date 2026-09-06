namespace FoodOrder.Contracts.Events;

public record OrderCreated(
    Guid OrderId,
    Guid FoodId,
    string FoodName,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice,
    string Status
);
