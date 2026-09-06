using FoodOrder.Contracts.Commands;
using FoodOrder.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using OrderService.Models;

namespace OrderService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly OrderDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ISendEndpointProvider _sendEndpointProvider;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        OrderDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ISendEndpointProvider sendEndpointProvider,
        ILogger<OrdersController> logger)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _sendEndpointProvider = sendEndpointProvider;
        _logger = logger;
    }

    /// <summary>
    /// Places an order. Status starts as PaymentPending unless verificationCode "123" is supplied!
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        if (request.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be greater than 0." });

        // 1. Validate strictly against the local Food Catalog Projection in order_db
        var food = await _dbContext.FoodCatalogProjections.FindAsync(request.FoodId);
        if (food == null)
        {
            return NotFound(new
            {
                message = $"Food ID '{request.FoodId}' not found in local projection.",
                hint = "Ensure FoodService has published FoodCreated event or check /api/orders/projection"
            });
        }

        if (!food.IsAvailable)
        {
            return BadRequest(new { message = $"Food '{food.Name}' is marked unavailable in local projection." });
        }

        // 2. Save Order in PaymentPending status
        var order = new Order
        {
            Id = Guid.NewGuid(),
            FoodId = food.FoodId,
            FoodName = food.Name,
            UnitPrice = food.Price,
            Quantity = request.Quantity,
            TotalPrice = food.Price * request.Quantity,
            Status = "PaymentPending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Order {OrderId} saved to order_db with status PaymentPending.", order.Id);

        // 3. Publish OrderCreated event to RabbitMQ
        await _publishEndpoint.Publish(new OrderCreated(
            order.Id,
            order.FoodId,
            order.FoodName,
            order.UnitPrice,
            order.Quantity,
            order.TotalPrice,
            order.Status
        ));

        // 4. Send RequestPayment command to PaymentService queue in RabbitMQ (with verification code if provided)
        try
        {
            var sendEndpoint = await _sendEndpointProvider.GetSendEndpoint(new Uri("queue:payment-service"));
            await sendEndpoint.Send(new RequestPayment(order.Id, order.TotalPrice, "USD", request.VerificationCode));
            _logger.LogInformation("Sent RequestPayment command to queue:payment-service for Order {OrderId} with Code: '{Code}'",
                order.Id, request.VerificationCode ?? "");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send RequestPayment command to queue:payment-service.");
        }

        return AcceptedAtAction(nameof(GetById), new { id = order.Id }, new
        {
            order.Id,
            order.FoodId,
            order.FoodName,
            order.UnitPrice,
            order.Quantity,
            order.TotalPrice,
            order.Status,
            verificationInstruction = string.IsNullOrEmpty(request.VerificationCode)
                ? $"To pay for this order, call POST /api/orders/{order.Id}/verify-payment with verificationCode: '123'"
                : (request.VerificationCode == "123" ? "Verification code '123' provided. Status will transition to 'Paid'." : "Invalid code provided. Order remains PaymentPending.")
        });
    }

    /// <summary>
    /// Verification method for the payment: Enter "123" in the verificationCode field to make the order Paid!
    /// </summary>
    [HttpPost("{id:guid}/verify-payment")]
    public async Task<IActionResult> VerifyPayment(Guid id, [FromBody] VerifyOrderPaymentRequest request)
    {
        var order = await _dbContext.Orders.FindAsync(id);
        if (order == null)
            return NotFound(new { message = $"Order with ID {id} not found." });

        if (order.Status == "Paid")
            return Ok(new { message = "Order is already Paid!", order });

        try
        {
            var sendEndpoint = await _sendEndpointProvider.GetSendEndpoint(new Uri("queue:payment-service"));
            await sendEndpoint.Send(new VerifyPayment(order.Id, request.VerificationCode));
            _logger.LogInformation("Sent VerifyPayment command to queue:payment-service for Order {OrderId} with code '{Code}'.",
                order.Id, request.VerificationCode);

            return Ok(new
            {
                orderId = order.Id,
                submittedCode = request.VerificationCode,
                message = request.VerificationCode == "123"
                    ? "Valid verification code '123' submitted! Order status is transitioning to 'Paid' via RabbitMQ."
                    : $"Verification code '{request.VerificationCode}' submitted. If invalid, order transitions to 'PaymentFailed'."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send VerifyPayment command.");
            return StatusCode(500, new { message = "Failed to communicate with RabbitMQ Payment queue." });
        }
    }

    /// <summary>
    /// Gets all orders from order_db
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetAll()
    {
        return Ok(await _dbContext.Orders.OrderByDescending(o => o.CreatedAt).ToListAsync());
    }

    /// <summary>
    /// Gets order by ID to inspect current status (PaymentPending or Paid)
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Order>> GetById(Guid id)
    {
        var order = await _dbContext.Orders.FindAsync(id);
        if (order == null)
            return NotFound(new { message = $"Order with ID {id} not found." });
        return Ok(order);
    }

    /// <summary>
    /// View local food catalog projection populated from RabbitMQ events
    /// </summary>
    [HttpGet("projection")]
    public async Task<ActionResult<IEnumerable<FoodCatalogProjection>>> GetProjection()
    {
        return Ok(await _dbContext.FoodCatalogProjections.OrderBy(p => p.Name).ToListAsync());
    }

    /// <summary>
    /// Health check for OrderService and order_db
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> HealthCheck()
    {
        bool canConnect = await _dbContext.Database.CanConnectAsync();
        int ordersCount = canConnect ? await _dbContext.Orders.CountAsync() : 0;
        int projectionsCount = canConnect ? await _dbContext.FoodCatalogProjections.CountAsync() : 0;

        return Ok(new
        {
            service = "OrderService",
            status = canConnect ? "Healthy" : "Database Connection Failed",
            database = "order_db (PostgreSQL port 5433)",
            totalOrdersInDb = ordersCount,
            totalProjectedFoods = projectionsCount,
            timestamp = DateTime.UtcNow
        });
    }
}

public record CreateOrderRequest(Guid FoodId, int Quantity, string? VerificationCode = null);
public record VerifyOrderPaymentRequest(string VerificationCode);
