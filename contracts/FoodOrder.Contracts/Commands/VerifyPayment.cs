namespace FoodOrder.Contracts.Commands;

public record VerifyPayment(
    Guid OrderId,
    string VerificationCode
);
