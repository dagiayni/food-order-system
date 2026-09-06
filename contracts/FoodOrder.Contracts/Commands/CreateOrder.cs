namespace FoodOrder.Contracts.Commands;

public record CreateOrder(
    Guid FoodId,
    int Quantity
);
