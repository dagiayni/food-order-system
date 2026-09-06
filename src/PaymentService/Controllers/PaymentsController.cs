using FoodOrder.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Models;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly PaymentDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(PaymentDbContext dbContext, IPublishEndpoint publishEndpoint, ILogger<PaymentsController> logger)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    /// <summary>
    /// Gets all payments stored in payment_db
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Payment>>> GetAll()
    {
        return Ok(await _dbContext.Payments.OrderByDescending(p => p.CreatedAt).ToListAsync());
    }

    /// <summary>
    /// Gets a payment by Payment ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Payment>> GetById(Guid id)
    {
        var payment = await _dbContext.Payments.FindAsync(id);
        if (payment == null)
            return NotFound(new { message = $"Payment with ID {id} not found." });
        return Ok(payment);
    }

    /// <summary>
    /// Gets a payment by Order ID
    /// </summary>
    [HttpGet("order/{orderId:guid}")]
    public async Task<ActionResult<Payment>> GetByOrderId(Guid orderId)
    {
        var payment = await _dbContext.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
        if (payment == null)
            return NotFound(new { message = $"No payment record found for Order ID {orderId}." });
        return Ok(payment);
    }

    /// <summary>
    /// Verifies payment for an order. Only makes payment Successful (Paid) if verificationCode is "123"!
    /// </summary>
    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request)
    {
        var payment = await _dbContext.Payments
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(p => p.OrderId == request.OrderId);

        if (payment == null)
            return NotFound(new { message = $"No payment record found for Order ID {request.OrderId}." });

        if (payment.Status == "Successful")
            return Ok(new { message = "Payment has already been verified and marked as Successful (Paid).", payment });

        payment.VerificationCode = request.VerificationCode;

        if (request.VerificationCode == "123")
        {
            payment.Status = "Successful";
            payment.FailureReason = null;
            payment.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Payment verified with code 123 for Order {OrderId}! Publishing PaymentSucceeded.", request.OrderId);
            await _publishEndpoint.Publish(new PaymentSucceeded(payment.Id, payment.OrderId, payment.Amount));

            return Ok(new
            {
                message = "Payment verified successfully! Status transitioned to Paid.",
                status = "Successful",
                orderStatus = "Paid",
                payment
            });
        }
        else
        {
            payment.Status = "Failed";
            payment.FailureReason = $"Invalid verification code '{request.VerificationCode}'. Expected '123'.";
            payment.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogWarning("Payment verification failed for Order {OrderId}. Code was '{Code}'. Publishing PaymentFailed.",
                request.OrderId, request.VerificationCode);
            await _publishEndpoint.Publish(new PaymentFailed(payment.Id, payment.OrderId, payment.FailureReason));

            return BadRequest(new
            {
                message = $"Verification failed. Expected code '123', but received '{request.VerificationCode}'.",
                status = "Failed",
                orderStatus = "PaymentFailed",
                payment
            });
        }
    }

    /// <summary>
    /// Health check for PaymentService and payment_db
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> HealthCheck()
    {
        bool canConnect = await _dbContext.Database.CanConnectAsync();
        int count = canConnect ? await _dbContext.Payments.CountAsync() : 0;

        return Ok(new
        {
            service = "PaymentService",
            status = canConnect ? "Healthy" : "Database Connection Failed",
            database = "payment_db (PostgreSQL port 5433)",
            totalPaymentsInDb = count,
            timestamp = DateTime.UtcNow
        });
    }
}

public record VerifyPaymentRequest(Guid OrderId, string VerificationCode);
