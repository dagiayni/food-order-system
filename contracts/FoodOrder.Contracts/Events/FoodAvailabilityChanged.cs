namespace FoodOrder.Contracts.Events;

public record FoodAvailabilityChanged(
    Guid FoodId,
    bool IsAvailable
);
