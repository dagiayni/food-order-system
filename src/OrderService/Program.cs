using MassTransit;
using Microsoft.EntityFrameworkCore;
using OrderService.Consumers;
using OrderService.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Order Service API",
        Version = "v1",
        Description = "Order microservice managing order workflow, local food projection, and RabbitMQ message consumers."
    });
});

// Configure EF Core with PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("OrderDb");
builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure MassTransit with RabbitMQ
var rmqHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
var rmqUser = builder.Configuration["RabbitMq:Username"] ?? "guest";
var rmqPass = builder.Configuration["RabbitMq:Password"] ?? "guest";

builder.Services.AddMassTransit(x =>
{
    // Register consumers
    x.AddConsumer<FoodCreatedConsumer>();
    x.AddConsumer<FoodUpdatedConsumer>();
    x.AddConsumer<FoodAvailabilityChangedConsumer>();
    x.AddConsumer<FoodDeletedConsumer>();
    x.AddConsumer<PaymentResultConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rmqHost, "/", h =>
        {
            h.Username(rmqUser);
            h.Password(rmqPass);
        });

        // Dedicated queue for OrderService to receive food projection and payment result events
        cfg.ReceiveEndpoint("order-service", e =>
        {
            e.ConfigureConsumer<FoodCreatedConsumer>(context);
            e.ConfigureConsumer<FoodUpdatedConsumer>(context);
            e.ConfigureConsumer<FoodAvailabilityChangedConsumer>(context);
            e.ConfigureConsumer<FoodDeletedConsumer>(context);
            e.ConfigureConsumer<PaymentResultConsumer>(context);
        });
    });
});

var app = builder.Build();

// Automatically apply EF migrations at startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await db.Database.MigrateAsync();
        logger.LogInformation("Applied migrations to order_db successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error while applying migrations to order_db.");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Order Service v1");
    c.RoutePrefix = "swagger";
});

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
