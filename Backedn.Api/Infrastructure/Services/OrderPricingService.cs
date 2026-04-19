using Backedn.Api.Domain.Entities;

namespace Backedn.Api.Infrastructure.Services;

public class OrderPricingService
{
    public const decimal VatRate = 0.25m;
    public const decimal FlatShippingAmount = 99m;

    public (decimal subtotal, decimal vatAmount, decimal shippingAmount, decimal totalAmount) CalculateTotals(IEnumerable<OrderItem> items)
    {
        var subtotal = items.Sum(item => item.LineTotal);
        var vatAmount = subtotal - (subtotal / (1 + VatRate));
        var shippingAmount = subtotal > 0 ? FlatShippingAmount : 0m;
        var totalAmount = subtotal + shippingAmount;

        return (decimal.Round(subtotal, 2), decimal.Round(vatAmount, 2), decimal.Round(shippingAmount, 2), decimal.Round(totalAmount, 2));
    }
}
