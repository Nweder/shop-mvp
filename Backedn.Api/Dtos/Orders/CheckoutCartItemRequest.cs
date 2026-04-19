using System.ComponentModel.DataAnnotations;

namespace Backedn.Api.Dtos.Orders;

public class CheckoutCartItemRequest
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; }
}
