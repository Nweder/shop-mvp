using System;
using System.ComponentModel.DataAnnotations;

namespace Backedn.Api.Domain.Entities;

public class Product
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = "";

    [StringLength(2000)]
    public string Description { get; set; } = "";

    [Range(0, 10000000)]
    public decimal Price { get; set; }

    [Range(0, 1000000)]
    public int Stock { get; set; }

    [StringLength(100)]
    public string Category { get; set; } = "Perfume"; // Perfume/Silver

    [Url]
    [StringLength(1000)]
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
