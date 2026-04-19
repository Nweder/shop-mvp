using System.ComponentModel.DataAnnotations;

namespace Backedn.Api.Dtos.Products;

public class ProductUpsertRequest
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Range(0, 1_000_000)]
    public decimal Price { get; set; }

    [Required]
    public string Category { get; set; } = string.Empty;

    [Range(0, 100_000)]
    public int Stock { get; set; }

    [Required, MaxLength(64)]
    public string Sku { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    public List<string> ImageUrls { get; set; } = [];
}
