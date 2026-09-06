namespace FoodOrder.Contracts.Events;

public record FoodCreated(
    Guid FoodId,
    string Name,
    string? Description,
    decimal Price,
    bool IsAvailable
);
