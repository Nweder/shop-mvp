namespace Backedn.Api.Dtos.Orders;

public class OrderDto
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string Currency { get; set; } = "sek";
    public decimal SubtotalAmount { get; set; }
    public decimal VatAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string ShippingName { get; set; } = string.Empty;
    public string ShippingEmail { get; set; } = string.Empty;
    public string ShippingPhone { get; set; } = string.Empty;
    public string ShippingAddressLine1 { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? StripeCheckoutSessionId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public IReadOnlyCollection<OrderItemDto> Items { get; set; } = Array.Empty<OrderItemDto>();
}
