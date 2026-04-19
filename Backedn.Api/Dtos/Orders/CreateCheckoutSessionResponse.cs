namespace Backedn.Api.Dtos.Orders;

public class CreateCheckoutSessionResponse
{
    public int OrderId { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public string? StripeCheckoutSessionId { get; set; }
    public string? CheckoutUrl { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal VatAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal TotalAmount { get; set; }
}
