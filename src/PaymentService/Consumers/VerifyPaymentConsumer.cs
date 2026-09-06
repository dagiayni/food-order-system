using FoodOrder.Contracts.Commands;
using FoodOrder.Contracts.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using PaymentService.Data;

namespace PaymentService.Consumers;

public class VerifyPaymentConsumer : IConsumer<VerifyPayment>
{
    private readonly PaymentDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<VerifyPaymentConsumer> _logger;

    public VerifyPaymentConsumer(
        PaymentDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ILogger<VerifyPaymentConsumer> logger)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<VerifyPayment> context)
    {
        var msg = context.Message;
        _logger.LogInformation("PaymentService received VerifyPayment for Order {OrderId} with Code: '{Code}'",
            msg.OrderId, msg.VerificationCode);

        var payment = await _dbContext.Payments
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(p => p.OrderId == msg.OrderId);

        if (payment == null)
        {
            _logger.LogWarning("No payment found for Order {OrderId} to verify.", msg.OrderId);
            return;
        }

        if (payment.Status == "Successful")
        {
            _logger.LogInformation("Order {OrderId} is already paid.", msg.OrderId);
            return;
        }

        payment.VerificationCode = msg.VerificationCode;

        if (msg.VerificationCode == "123")
        {
            payment.Status = "Successful";
            payment.FailureReason = null;
            payment.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Order {OrderId} verification code '123' matched! Publishing PaymentSucceeded.", msg.OrderId);
            await _publishEndpoint.Publish(new PaymentSucceeded(payment.Id, payment.OrderId, payment.Amount));
        }
        else
        {
            payment.Status = "Failed";
            payment.FailureReason = $"Invalid verification code '{msg.VerificationCode}'. Expected '123'.";
            payment.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogWarning("Order {OrderId} verification failed with code '{Code}'. Publishing PaymentFailed.",
                msg.OrderId, msg.VerificationCode);
            await _publishEndpoint.Publish(new PaymentFailed(payment.Id, payment.OrderId, payment.FailureReason));
        }
    }
}
