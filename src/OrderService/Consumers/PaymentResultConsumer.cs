using FoodOrder.Contracts.Events;
using MassTransit;
using OrderService.Data;

namespace OrderService.Consumers;

public class PaymentResultConsumer : IConsumer<PaymentSucceeded>, IConsumer<PaymentFailed>
{
    private readonly OrderDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<PaymentResultConsumer> _logger;

    public PaymentResultConsumer(
        OrderDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ILogger<PaymentResultConsumer> logger)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentSucceeded> context)
    {
        var msg = context.Message;
        _logger.LogInformation("OrderService received PaymentSucceeded event for Order {OrderId} (Amount: ${Amount})",
            msg.OrderId, msg.Amount);

        var order = await _dbContext.Orders.FindAsync(msg.OrderId);
        if (order != null)
        {
            order.Status = "Paid";
            order.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Order {OrderId} transitioned to Paid! Publishing OrderPaid event.", order.Id);
            await _publishEndpoint.Publish(new OrderPaid(order.Id, order.TotalPrice));
        }
        else
        {
            _logger.LogWarning("Order {OrderId} not found in order_db.", msg.OrderId);
        }
    }

    public async Task Consume(ConsumeContext<PaymentFailed> context)
    {
        var msg = context.Message;
        _logger.LogWarning("OrderService received PaymentFailed event for Order {OrderId}: Reason={Reason}",
            msg.OrderId, msg.Reason);

        var order = await _dbContext.Orders.FindAsync(msg.OrderId);
        if (order != null)
        {
            order.Status = "PaymentFailed";
            order.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Order {OrderId} transitioned to PaymentFailed! Publishing OrderPaymentFailed event.", order.Id);
            await _publishEndpoint.Publish(new OrderPaymentFailed(order.Id, msg.Reason));
        }
    }
}
