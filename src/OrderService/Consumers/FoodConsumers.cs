using FoodOrder.Contracts.Events;
using MassTransit;
using OrderService.Data;
using OrderService.Models;

namespace OrderService.Consumers;

public class FoodCreatedConsumer : IConsumer<FoodCreated>
{
    private readonly OrderDbContext _dbContext;
    private readonly ILogger<FoodCreatedConsumer> _logger;

    public FoodCreatedConsumer(OrderDbContext dbContext, ILogger<FoodCreatedConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FoodCreated> context)
    {
        var msg = context.Message;
        _logger.LogInformation("OrderService received FoodCreated event: {Name} (${Price})", msg.Name, msg.Price);

        var existing = await _dbContext.FoodCatalogProjections.FindAsync(msg.FoodId);
        if (existing == null)
        {
            var projection = new FoodCatalogProjection
            {
                FoodId = msg.FoodId,
                Name = msg.Name,
                Price = msg.Price,
                IsAvailable = msg.IsAvailable,
                LastEventId = context.MessageId ?? Guid.NewGuid(),
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.FoodCatalogProjections.Add(projection);
        }
        else
        {
            existing.Name = msg.Name;
            existing.Price = msg.Price;
            existing.IsAvailable = msg.IsAvailable;
            existing.LastEventId = context.MessageId ?? Guid.NewGuid();
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Updated local food_catalog_projection for {FoodId}.", msg.FoodId);
    }
}

public class FoodUpdatedConsumer : IConsumer<FoodUpdated>
{
    private readonly OrderDbContext _dbContext;
    private readonly ILogger<FoodUpdatedConsumer> _logger;

    public FoodUpdatedConsumer(OrderDbContext dbContext, ILogger<FoodUpdatedConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FoodUpdated> context)
    {
        var msg = context.Message;
        _logger.LogInformation("OrderService received FoodUpdated event for {FoodId}", msg.FoodId);

        var item = await _dbContext.FoodCatalogProjections.FindAsync(msg.FoodId);
        if (item != null)
        {
            item.Name = msg.Name;
            item.Price = msg.Price;
            item.LastEventId = context.MessageId ?? Guid.NewGuid();
            item.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }
    }
}

public class FoodAvailabilityChangedConsumer : IConsumer<FoodAvailabilityChanged>
{
    private readonly OrderDbContext _dbContext;
    private readonly ILogger<FoodAvailabilityChangedConsumer> _logger;

    public FoodAvailabilityChangedConsumer(OrderDbContext dbContext, ILogger<FoodAvailabilityChangedConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FoodAvailabilityChanged> context)
    {
        var msg = context.Message;
        _logger.LogInformation("OrderService received FoodAvailabilityChanged for {FoodId}: Available={Available}",
            msg.FoodId, msg.IsAvailable);

        var item = await _dbContext.FoodCatalogProjections.FindAsync(msg.FoodId);
        if (item != null)
        {
            item.IsAvailable = msg.IsAvailable;
            item.LastEventId = context.MessageId ?? Guid.NewGuid();
            item.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }
    }
}

public class FoodDeletedConsumer : IConsumer<FoodDeleted>
{
    private readonly OrderDbContext _dbContext;
    private readonly ILogger<FoodDeletedConsumer> _logger;

    public FoodDeletedConsumer(OrderDbContext dbContext, ILogger<FoodDeletedConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FoodDeleted> context)
    {
        var msg = context.Message;
        _logger.LogInformation("OrderService received FoodDeleted for {FoodId}", msg.FoodId);

        var item = await _dbContext.FoodCatalogProjections.FindAsync(msg.FoodId);
        if (item != null)
        {
            _dbContext.FoodCatalogProjections.Remove(item);
            await _dbContext.SaveChangesAsync();
        }
    }
}
