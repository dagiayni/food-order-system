using MassTransit;
using Microsoft.EntityFrameworkCore;
using PaymentService.Consumers;
using PaymentService.Data;

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
        Title = "Payment Service API",
        Version = "v1",
        Description = "Payment microservice with code verification ('123') and RabbitMQ messaging."
    });
});

// Configure EF Core with PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("PaymentDb");
builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure MassTransit with RabbitMQ
var rmqHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
var rmqUser = builder.Configuration["RabbitMq:Username"] ?? "guest";
var rmqPass = builder.Configuration["RabbitMq:Password"] ?? "guest";

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<RequestPaymentConsumer>();
    x.AddConsumer<VerifyPaymentConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rmqHost, "/", h =>
        {
            h.Username(rmqUser);
            h.Password(rmqPass);
        });

        cfg.ReceiveEndpoint("payment-service", e =>
        {
            e.ConfigureConsumer<RequestPaymentConsumer>(context);
            e.ConfigureConsumer<VerifyPaymentConsumer>(context);
        });
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Payment Service v1");
    c.RoutePrefix = "swagger";
});

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
