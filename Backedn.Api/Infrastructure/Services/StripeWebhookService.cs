using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Backedn.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backedn.Api.Infrastructure.Services;

public class StripeWebhookService
{
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _dbContext;

    public StripeWebhookService(IConfiguration configuration, ApplicationDbContext dbContext)
    {
        _configuration = configuration;
        _dbContext = dbContext;
    }

    public bool TryValidateSignature(string payload, string? stripeSignatureHeader)
    {
        var endpointSecret = _configuration["Stripe:WebhookSecret"];
        if (string.IsNullOrWhiteSpace(endpointSecret))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(stripeSignatureHeader))
        {
            return false;
        }

        var parts = stripeSignatureHeader.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var timestamp = parts.FirstOrDefault(x => x.StartsWith("t="))?.Split('=').LastOrDefault();
        var signature = parts.FirstOrDefault(x => x.StartsWith("v1="))?.Split('=').LastOrDefault();
        if (string.IsNullOrWhiteSpace(timestamp) || string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        var signedPayload = $"{timestamp}.{payload}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(endpointSecret));
        var computed = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload))).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(signature));
    }

    public async Task<bool> HandleCheckoutCompletedAsync(string payload, CancellationToken cancellationToken = default)
    {
        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;
        var type = root.GetProperty("type").GetString();
        if (!string.Equals(type, "checkout.session.completed", StringComparison.Ordinal))
        {
            return false;
        }

        var dataObject = root.GetProperty("data").GetProperty("object");
        var orderIdRaw = dataObject.GetProperty("metadata").GetProperty("orderId").GetString();
        if (!int.TryParse(orderIdRaw, out var orderId))
        {
            return false;
        }

        var order = await _dbContext.Orders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);
        if (order == null)
        {
            return false;
        }

        if (order.PaymentStatus == "Paid")
        {
            return true;
        }

        order.PaymentStatus = "Paid";
        order.Status = "Confirmed";
        order.PaidAt = DateTime.UtcNow;
        order.StripeCheckoutSessionId = dataObject.GetProperty("id").GetString();
        order.StripePaymentIntentId = dataObject.TryGetProperty("payment_intent", out var paymentIntent) ? paymentIntent.GetString() : order.StripePaymentIntentId;

        var productIds = order.Items.Select(x => x.ProductId).Distinct().ToList();
        var products = await _dbContext.Products.Where(x => productIds.Contains(x.Id)).ToListAsync(cancellationToken);
        foreach (var item in order.Items)
        {
            var product = products.FirstOrDefault(x => x.Id == item.ProductId);
            if (product != null)
            {
                product.Stock = Math.Max(0, product.Stock - item.Quantity);
                product.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
