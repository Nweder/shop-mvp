using Backedn.Api.Domain.Entities;
using Backedn.Api.Dtos.Products;
using Backedn.Api.Infrastructure.Data;
using Backedn.Api.Infrastructure.Security;
using Backedn.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Backedn.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];

    private readonly ApplicationDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public ProductsController(ApplicationDbContext dbContext, IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll([FromQuery] string? category, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice)
    {
        var query = _dbContext.Products
            .AsNoTracking()
            .Include(x => x.Images)
            .Where(x => x.IsActive);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(x => x.Category == category);
        }

        if (minPrice.HasValue)
        {
            query = query.Where(x => x.Price >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(x => x.Price <= maxPrice.Value);
        }

        var items = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
        return Ok(items.Select(MapProduct));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var item = await _dbContext.Products
            .AsNoTracking()
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id && x.IsActive);

        if (item == null)
        {
            return NotFound();
        }

        return Ok(MapProduct(item));
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    [EnableRateLimiting("admin")]
    public async Task<ActionResult<ProductDto>> Create([FromBody] ProductUpsertRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (!ProductCategories.All.Contains(request.Category))
        {
            return BadRequest(new { message = "Ogiltig kategori. Tillåtna värden är Guld eller Parfym." });
        }

        var skuExists = await _dbContext.Products.AnyAsync(x => x.Sku == request.Sku);
        if (skuExists)
        {
            return Conflict(new { message = "SKU måste vara unikt." });
        }

        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Category = request.Category,
            Stock = request.Stock,
            Sku = request.Sku,
            IsActive = request.IsActive,
            Images = request.ImageUrls.Select((url, index) => new ProductImage
            {
                ImageUrl = url,
                SortOrder = index,
                IsPrimary = index == 0
            }).ToList()
        };

        _dbContext.Products.Add(product);
        await _dbContext.SaveChangesAsync();

        var savedProduct = await _dbContext.Products.Include(x => x.Images).FirstAsync(x => x.Id == product.Id);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, MapProduct(savedProduct));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    [EnableRateLimiting("admin")]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] ProductUpsertRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (!ProductCategories.All.Contains(request.Category))
        {
            return BadRequest(new { message = "Ogiltig kategori. Tillåtna värden är Silver, Guld eller Parfym." });
        }

        var product = await _dbContext.Products.Include(x => x.Images).FirstOrDefaultAsync(x => x.Id == id);
        if (product == null)
        {
            return NotFound();
        }

        var skuExists = await _dbContext.Products.AnyAsync(x => x.Id != id && x.Sku == request.Sku);
        if (skuExists)
        {
            return Conflict(new { message = "SKU måste vara unikt." });
        }

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.Category = request.Category;
        product.Stock = request.Stock;
        product.Sku = request.Sku;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        _dbContext.ProductImages.RemoveRange(product.Images);
        product.Images = request.ImageUrls.Select((url, index) => new ProductImage
        {
            ProductId = product.Id,
            ImageUrl = url,
            SortOrder = index,
            IsPrimary = index == 0
        }).ToList();
        _dbContext.ProductImages.AddRange(product.Images);

        await _dbContext.SaveChangesAsync();

        return Ok(MapProduct(product));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    [EnableRateLimiting("admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _dbContext.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("upload")]
    [Authorize(Roles = AppRoles.Admin)]
    [EnableRateLimiting("upload")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Ingen fil skickades med." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Endast JPG, PNG och WEBP är tillåtna." });
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(new { message = "Ogiltig filtyp." });
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "Filen får vara max 5 MB." });
        }

        var fileName = $"{Guid.NewGuid():N}{extension}";
        await using var stream = file.OpenReadStream();
        var saved = await _fileStorageService.SaveProductImageAsync(stream, fileName, file.ContentType, cancellationToken);

        return Ok(new
        {
            imageUrl = saved.RelativePath,
            fullUrl = saved.PublicUrl
        });
    }

    public static ProductDto MapProduct(Product product)
    {
        var images = product.Images
            .OrderBy(x => x.SortOrder)
            .Select(x => new ProductImageDto
            {
                Id = x.Id,
                ImageUrl = x.ImageUrl,
                IsPrimary = x.IsPrimary,
                SortOrder = x.SortOrder
            })
            .ToList();

        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            Category = product.Category,
            Stock = product.Stock,
            Sku = product.Sku,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            Images = images,
            PrimaryImageUrl = images.FirstOrDefault(x => x.IsPrimary)?.ImageUrl ?? images.FirstOrDefault()?.ImageUrl
        };
    }
}
