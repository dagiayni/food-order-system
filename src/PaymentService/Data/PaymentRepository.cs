using PaymentService.Models;
using System.Collections.Concurrent;

namespace PaymentService.Data;

public class PaymentRepository
{
    private readonly ConcurrentDictionary<Guid, Payment> _payments = new();

    public IEnumerable<Payment> GetAll() => _payments.Values.OrderByDescending(p => p.CreatedAt);

    public Payment? GetById(Guid id) => _payments.TryGetValue(id, out var payment) ? payment : null;

    public Payment? GetByOrderId(Guid orderId) => _payments.Values.FirstOrDefault(p => p.OrderId == orderId);

    public Payment ProcessPayment(Guid orderId, decimal amount, string currency = "USD", bool simulateFailure = false)
    {
        var isSuccess = !simulateFailure && amount > 0;
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Amount = amount,
            Currency = currency,
            Status = isSuccess ? "Successful" : "Failed",
            FailureReason = isSuccess ? null : "Simulated payment failure / Insufficient funds",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _payments[payment.Id] = payment;
        return payment;
    }
}
