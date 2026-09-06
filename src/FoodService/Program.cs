using FoodService.Data;
using MassTransit;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Food Service API",
        Version = "v1",
        Description = "Food catalog microservice with PostgreSQL persistence and MassTransit RabbitMQ event publishing."
    });
});

// Configure EF Core with PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("FoodDb");
builder.Services.AddDbContext<FoodDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure MassTransit with RabbitMQ
var rmqHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
var rmqUser = builder.Configuration["RabbitMq:Username"] ?? "guest";
var rmqPass = builder.Configuration["RabbitMq:Password"] ?? "guest";

builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rmqHost, "/", h =>
        {
            h.Username(rmqUser);
            h.Password(rmqPass);
        });
    });
});

var app = builder.Build();

// Automatically apply EF migrations & seed demo product on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<FoodDbContext>();
    var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await FoodDbSeeder.SeedAsync(context, publishEndpoint, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error while initializing FoodDb or publishing seed event.");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Food Service v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
