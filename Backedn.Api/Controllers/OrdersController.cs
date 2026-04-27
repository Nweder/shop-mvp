using System.Security.Claims;
using Backedn.Api.Domain.Entities;
using Backedn.Api.Dtos.Orders;
using Backedn.Api.Infrastructure.Data;
using Backedn.Api.Infrastructure.Security;
using Backedn.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backedn.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly OrderPricingService _pricingService;
    private readonly StripeCheckoutService _stripeCheckoutService;
    private readonly StripeWebhookService _stripeWebhookService;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        ApplicationDbContext dbContext,
        OrderPricingService pricingService,
        StripeCheckoutService stripeCheckoutService,
        StripeWebhookService stripeWebhookService,
        IEmailService emailService,
        ILogger<OrdersController> logger)
    {
        _dbContext = dbContext;
        _pricingService = pricingService;
        _stripeCheckoutService = stripeCheckoutService;
        _stripeWebhookService = stripeWebhookService;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("checkout-session")]
    [AllowAnonymous]
    public async Task<ActionResult<CreateCheckoutSessionResponse>> CreateCheckoutSession([FromBody] CreateCheckoutSessionRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = GetCurrentUserId();
        var requestedIds = request.Items.Select(x => x.ProductId).Distinct().ToList();
        var products = await _dbContext.Products
            .Where(x => requestedIds.Contains(x.Id) && x.IsActive)
            .ToListAsync(cancellationToken);

        if (products.Count != requestedIds.Count)
        {
            return BadRequest(new { message = "En eller flera produkter kunde inte hittas." });
        }

        var orderItems = new List<OrderItem>();
        foreach (var cartItem in request.Items)
        {
            var product = products.First(x => x.Id == cartItem.ProductId);
            if (product.Stock < cartItem.Quantity)
            {
                return BadRequest(new { message = $"Otillräckligt lager för {product.Name}." });
            }

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                ProductSku = product.Sku,
                UnitPrice = product.Price,
                Quantity = cartItem.Quantity,
                LineTotal = product.Price * cartItem.Quantity
            });
        }

        var (subtotal, vatAmount, shippingAmount, totalAmount) = _pricingService.CalculateTotals(orderItems);

        var order = new Order
        {
            UserId = userId,
            ShippingName = request.ShippingName,
            ShippingEmail = request.ShippingEmail,
            ShippingPhone = request.ShippingPhone,
            ShippingAddressLine1 = request.ShippingAddressLine1,
            PostalCode = request.PostalCode,
            City = request.City,
            Country = request.Country,
            SubtotalAmount = subtotal,
            VatAmount = vatAmount,
            ShippingAmount = shippingAmount,
            TotalAmount = totalAmount,
            Items = orderItems
        };

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var stripeResult = await _stripeCheckoutService.CreateCheckoutSessionAsync(
            order,
            request.SuccessUrl,
            request.CancelUrl,
            cancellationToken);

        if (stripeResult != null)
        {
            order.StripeCheckoutSessionId = stripeResult.SessionId;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // Fallback när Stripe inte är aktivt: markera ordern som bekräftad lokalt
            order.Status = "Confirmed";
            order.PaymentStatus = "Pending";
            await _dbContext.SaveChangesAsync(cancellationToken);

            try
            {
                await _emailService.SendOrderConfirmationToCustomerAsync(order, cancellationToken);
                await _emailService.SendNewOrderNotificationToAdminAsync(order, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kunde inte skicka ordermail för lokal order {OrderId}.", order.Id);
            }
        }

        return Ok(new CreateCheckoutSessionResponse
        {
            OrderId = order.Id,
            PaymentStatus = order.PaymentStatus,
            StripeCheckoutSessionId = stripeResult?.SessionId,
            CheckoutUrl = stripeResult?.CheckoutUrl,
            SubtotalAmount = subtotal,
            VatAmount = vatAmount,
            ShippingAmount = shippingAmount,
            TotalAmount = totalAmount
        });
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetMyOrders(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var items = await _dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Where(x => x.UserId == userId.Value)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(items.Select(MapOrder));
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<OrderDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var isAdmin = User.IsInRole(AppRoles.Admin);
        var order = await _dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (order == null)
        {
            return NotFound();
        }

        if (!isAdmin && order.UserId != userId.Value)
        {
            return Forbid();
        }

        return Ok(MapOrder(order));
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(cancellationToken);

        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();
        if (!_stripeWebhookService.TryValidateSignature(payload, signature))
        {
            return Unauthorized();
        }

        await _stripeWebhookService.HandleCheckoutCompletedAsync(payload, cancellationToken);
        return Ok();
    }

    public static OrderDto MapOrder(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            Status = order.Status,
            PaymentStatus = order.PaymentStatus,
            Currency = order.Currency,
            SubtotalAmount = order.SubtotalAmount,
            VatAmount = order.VatAmount,
            ShippingAmount = order.ShippingAmount,
            TotalAmount = order.TotalAmount,
            ShippingName = order.ShippingName,
            ShippingEmail = order.ShippingEmail,
            ShippingPhone = order.ShippingPhone,
            ShippingAddressLine1 = order.ShippingAddressLine1,
            PostalCode = order.PostalCode,
            City = order.City,
            Country = order.Country,
            StripeCheckoutSessionId = order.StripeCheckoutSessionId,
            CreatedAt = order.CreatedAt,
            PaidAt = order.PaidAt,
            Items = order.Items.Select(item => new OrderItemDto
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                ProductSku = item.ProductSku,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                LineTotal = item.LineTotal
            }).ToList()
        };
    }

    private int? GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var parsed) ? parsed : null;
    }
}