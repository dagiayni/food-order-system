using FoodService.Models;
using System.Collections.Concurrent;

namespace FoodService.Data;

public class FoodRepository
{
    private readonly ConcurrentDictionary<Guid, Food> _foods = new();

    public FoodRepository()
    {
        // Seed standard demo product from README
        var demoProduct = new Food
        {
            Id = Guid.Parse("f1d2e3b4-1234-4567-89ab-cdef01234567"),
            Name = "Cheese Burger",
            Description = "Double patty beef burger with cheddar",
            Price = 8.50m,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _foods[demoProduct.Id] = demoProduct;
    }

    public IEnumerable<Food> GetAll() => _foods.Values.OrderBy(f => f.Name);

    public Food? GetById(Guid id) => _foods.TryGetValue(id, out var food) ? food : null;

    public Food Add(Food food)
    {
        if (food.Id == Guid.Empty)
            food.Id = Guid.NewGuid();
        food.CreatedAt = DateTime.UtcNow;
        food.UpdatedAt = DateTime.UtcNow;
        _foods[food.Id] = food;
        return food;
    }

    public bool UpdateAvailability(Guid id, bool isAvailable)
    {
        if (_foods.TryGetValue(id, out var food))
        {
            food.IsAvailable = isAvailable;
            food.UpdatedAt = DateTime.UtcNow;
            return true;
        }
        return false;
    }
}
