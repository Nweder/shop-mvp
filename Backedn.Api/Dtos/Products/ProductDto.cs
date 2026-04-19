namespace Backedn.Api.Dtos.Products;

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Stock { get; set; }
    public string Sku { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public IReadOnlyCollection<ProductImageDto> Images { get; set; } = Array.Empty<ProductImageDto>();
    public string? PrimaryImageUrl { get; set; }
}
