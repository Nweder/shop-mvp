using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Backedn.Api.Domain.Entities;

namespace Backedn.Api.Infrastructure.Services;

public class StripeCheckoutService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public StripeCheckoutService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_configuration["Stripe:SecretKey"]);

    public async Task<StripeCheckoutResult?> CreateCheckoutSessionAsync(Order order, string successUrl, string cancelUrl, CancellationToken cancellationToken = default)
    {
        var secretKey = _configuration["Stripe:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            return null;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.stripe.com/v1/checkout/sessions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

        var body = new List<KeyValuePair<string, string>>
        {
            new("mode", "payment"),
            new("success_url", successUrl),
            new("cancel_url", cancelUrl),
            new("currency", "sek"),
            new("metadata[orderId]", order.Id.ToString(CultureInfo.InvariantCulture))
        };

        var itemIndex = 0;
        foreach (var item in order.Items)
        {
            body.Add(new($"line_items[{itemIndex}][price_data][currency]", "sek"));
            body.Add(new($"line_items[{itemIndex}][price_data][unit_amount]", ToStripeAmount(item.UnitPrice).ToString(CultureInfo.InvariantCulture)));
            body.Add(new($"line_items[{itemIndex}][price_data][product_data][name]", item.ProductName));
            body.Add(new($"line_items[{itemIndex}][quantity]", item.Quantity.ToString(CultureInfo.InvariantCulture)));
            itemIndex++;
        }

        if (order.ShippingAmount > 0)
        {
            body.Add(new($"line_items[{itemIndex}][price_data][currency]", "sek"));
            body.Add(new($"line_items[{itemIndex}][price_data][unit_amount]", ToStripeAmount(order.ShippingAmount).ToString(CultureInfo.InvariantCulture)));
            body.Add(new($"line_items[{itemIndex}][price_data][product_data][name]", "Fast frakt"));
            body.Add(new($"line_items[{itemIndex}][quantity]", "1"));
        }

        request.Content = new FormUrlEncodedContent(body);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var payload = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Stripe checkout session failed: {payload}");
        }

        using var json = JsonDocument.Parse(payload);
        var root = json.RootElement;

        return new StripeCheckoutResult(
            root.GetProperty("id").GetString() ?? string.Empty,
            root.GetProperty("url").GetString() ?? string.Empty);
    }

    private static int ToStripeAmount(decimal amount)
    {
        return (int)Math.Round(amount * 100m, MidpointRounding.AwayFromZero);
    }
}

public record StripeCheckoutResult(string SessionId, string CheckoutUrl);
