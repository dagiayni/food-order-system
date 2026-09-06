using OrderService.Models;
using System.Collections.Concurrent;

namespace OrderService.Data;

public class OrderRepository
{
    private readonly ConcurrentDictionary<Guid, Order> _orders = new();
    private readonly ConcurrentDictionary<Guid, FoodCatalogProjection> _projections = new();

    public OrderRepository()
    {
        // Seed local projection with demo product
        var demoProduct = new FoodCatalogProjection
        {
            FoodId = Guid.Parse("f1d2e3b4-1234-4567-89ab-cdef01234567"),
            Name = "Cheese Burger",
            Price = 8.50m,
            IsAvailable = true,
            UpdatedAt = DateTime.UtcNow
        };
        _projections[demoProduct.FoodId] = demoProduct;
    }

    public IEnumerable<Order> GetAllOrders() => _orders.Values.OrderByDescending(o => o.CreatedAt);

    public Order? GetOrderById(Guid id) => _orders.TryGetValue(id, out var order) ? order : null;

    public Order AddOrder(Order order)
    {
        if (order.Id == Guid.Empty)
            order.Id = Guid.NewGuid();
        order.CreatedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;
        _orders[order.Id] = order;
        return order;
    }

    public bool UpdateOrderStatus(Guid orderId, string status)
    {
        if (_orders.TryGetValue(orderId, out var order))
        {
            order.Status = status;
            order.UpdatedAt = DateTime.UtcNow;
            return true;
        }
        return false;
    }

    public IEnumerable<FoodCatalogProjection> GetAllProjections() => _projections.Values.OrderBy(p => p.Name);

    public FoodCatalogProjection? GetProjection(Guid foodId) =>
        _projections.TryGetValue(foodId, out var proj) ? proj : null;

    public void UpsertProjection(FoodCatalogProjection projection)
    {
        projection.UpdatedAt = DateTime.UtcNow;
        _projections[projection.FoodId] = projection;
    }
}
