using FoodOrder.Contracts.Events;
using FoodService.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace FoodService.Data;

public static class FoodDbSeeder
{
    public static async Task SeedAsync(FoodDbContext context, IPublishEndpoint publishEndpoint, ILogger logger)
    {
        await context.Database.MigrateAsync();

        var demoId = Guid.Parse("f1d2e3b4-1234-4567-89ab-cdef01234567");
        var existing = await context.Foods.FindAsync(demoId);

        if (existing == null)
        {
            var demoFood = new Food
            {
                Id = demoId,
                Name = "Cheese Burger",
                Description = "Double patty beef burger with cheddar",
                Price = 8.50m,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Foods.Add(demoFood);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded demo product '{Name}' into food_db.", demoFood.Name);

            try
            {
                await publishEndpoint.Publish(new FoodCreated(
                    demoFood.Id,
                    demoFood.Name,
                    demoFood.Description,
                    demoFood.Price,
                    demoFood.IsAvailable
                ));
                logger.LogInformation("Published FoodCreated event to RabbitMQ for demo product '{Name}'.", demoFood.Name);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not publish initial FoodCreated event to RabbitMQ.");
            }
        }
    }
}
