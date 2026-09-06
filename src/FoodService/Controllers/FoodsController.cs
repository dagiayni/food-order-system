using FoodOrder.Contracts.Events;
using FoodService.Data;
using FoodService.Models;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoodsController : ControllerBase
{
    private readonly FoodDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<FoodsController> _logger;

    public FoodsController(FoodDbContext context, IPublishEndpoint publishEndpoint, ILogger<FoodsController> logger)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    /// <summary>
    /// Gets all food items from food_db
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Food>>> GetAll()
    {
        return Ok(await _context.Foods.OrderBy(f => f.Name).ToListAsync());
    }

    /// <summary>
    /// Gets a specific food item by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Food>> GetById(Guid id)
    {
        var food = await _context.Foods.FindAsync(id);
        if (food == null)
            return NotFound(new { message = $"Food with ID {id} not found." });
        return Ok(food);
    }

    /// <summary>
    /// Creates a new food item and publishes FoodCreated event to RabbitMQ
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Food>> Create([FromBody] CreateFoodRequest request)
    {
        var food = new Food
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            IsAvailable = request.IsAvailable,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Foods.Add(food);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Food item '{Name}' saved to food_db with ID {Id}.", food.Name, food.Id);

        // Publish FoodCreated event to RabbitMQ via MassTransit
        await _publishEndpoint.Publish(new FoodCreated(
            food.Id,
            food.Name,
            food.Description,
            food.Price,
            food.IsAvailable
        ));

        _logger.LogInformation("Published FoodCreated event to RabbitMQ for Food ID {Id}.", food.Id);

        return CreatedAtAction(nameof(GetById), new { id = food.Id }, food);
    }

    /// <summary>
    /// Updates food availability and publishes FoodAvailabilityChanged event
    /// </summary>
    [HttpPut("{id:guid}/availability")]
    public async Task<IActionResult> UpdateAvailability(Guid id, [FromQuery] bool isAvailable)
    {
        var food = await _context.Foods.FindAsync(id);
        if (food == null)
            return NotFound(new { message = $"Food with ID {id} not found." });

        food.IsAvailable = isAvailable;
        food.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _publishEndpoint.Publish(new FoodAvailabilityChanged(food.Id, food.IsAvailable));
        _logger.LogInformation("Published FoodAvailabilityChanged event for Food ID {Id}: IsAvailable={IsAvailable}", food.Id, isAvailable);

        return Ok(new { id = food.Id, isAvailable = food.IsAvailable, message = "Availability updated and event published." });
    }

    /// <summary>
    /// Deletes a food item and publishes FoodDeleted event
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var food = await _context.Foods.FindAsync(id);
        if (food == null)
            return NotFound(new { message = $"Food with ID {id} not found." });

        _context.Foods.Remove(food);
        await _context.SaveChangesAsync();

        await _publishEndpoint.Publish(new FoodDeleted(id));
        _logger.LogInformation("Published FoodDeleted event for Food ID {Id}", id);

        return NoContent();
    }

    /// <summary>
    /// Health check for FoodService and food_db connection
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> HealthCheck()
    {
        bool canConnect = await _context.Database.CanConnectAsync();
        int count = canConnect ? await _context.Foods.CountAsync() : 0;

        return Ok(new
        {
            service = "FoodService",
            status = canConnect ? "Healthy" : "Database Connection Failed",
            database = "food_db (PostgreSQL port 5433)",
            totalFoodsInDb = count,
            timestamp = DateTime.UtcNow
        });
    }
}

public record CreateFoodRequest(string Name, string? Description, decimal Price, bool IsAvailable = true);
