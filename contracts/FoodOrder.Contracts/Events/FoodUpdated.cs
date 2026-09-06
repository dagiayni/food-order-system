namespace FoodOrder.Contracts.Events;

public record FoodUpdated(
    Guid FoodId,
    string Name,
    string? Description,
    decimal Price
);
