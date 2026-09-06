using FoodOrder.Contracts.Commands;
using FoodOrder.Contracts.Events;
using MassTransit;
using PaymentService.Data;
using PaymentService.Models;

namespace PaymentService.Consumers;

public class RequestPaymentConsumer : IConsumer<RequestPayment>
{
    private readonly PaymentDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<RequestPaymentConsumer> _logger;

    public RequestPaymentConsumer(
        PaymentDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ILogger<RequestPaymentConsumer> logger)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<RequestPayment> context)
    {
        var message = context.Message;
        _logger.LogInformation("PaymentService received RequestPayment for Order {OrderId}, Amount: ${Amount} {Currency}, VerificationCode: '{Code}'",
            message.OrderId, message.Amount, message.Currency, message.VerificationCode ?? "");

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = message.OrderId,
            Amount = message.Amount,
            Currency = message.Currency,
            VerificationCode = message.VerificationCode,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Only mark Paid if verification code is explicitly "123"!
        if (message.VerificationCode == "123")
        {
            payment.Status = "Successful";
            payment.UpdatedAt = DateTime.UtcNow;
            _dbContext.Payments.Add(payment);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Payment for Order {OrderId} auto-verified with code '123'! Publishing PaymentSucceeded event.",
                payment.OrderId);

            await _publishEndpoint.Publish(new PaymentSucceeded(payment.Id, payment.OrderId, payment.Amount));
        }
        else
        {
            // Payment stays Pending, waiting for the user to enter verification code "123"
            payment.Status = "Pending";
            _dbContext.Payments.Add(payment);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Payment for Order {OrderId} recorded in Pending status. Waiting for verification code '123'.",
                payment.OrderId);
        }
    }
}
