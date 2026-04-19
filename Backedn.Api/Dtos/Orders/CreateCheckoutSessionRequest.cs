using System.ComponentModel.DataAnnotations;

namespace Backedn.Api.Dtos.Orders;

public class CreateCheckoutSessionRequest
{
    [Required, MaxLength(150)]
    public string ShippingName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string ShippingEmail { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string ShippingPhone { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string ShippingAddressLine1 { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string PostalCode { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Country { get; set; } = "Sverige";

    [Required]
    public string SuccessUrl { get; set; } = string.Empty;

    [Required]
    public string CancelUrl { get; set; } = string.Empty;

    [MinLength(1)]
    public List<CheckoutCartItemRequest> Items { get; set; } = [];
}
