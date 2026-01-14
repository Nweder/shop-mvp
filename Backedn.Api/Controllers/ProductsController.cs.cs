using Backedn.Api.Domain.Entities;
using Backedn.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.IO;
using System;

namespace Backedn.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ProductsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _db.Products.OrderByDescending(p => p.Id).ToListAsync());

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(Product p)
    {
        _db.Products.Add(p);
        await _db.SaveChangesAsync();
        return Ok(p);
    }

    // Upload product image (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var uploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "products");
        if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploads, fileName);

        using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var imageUrl = $"/images/products/{fileName}";
        var fullUrl = $"{Request.Scheme}://{Request.Host}{imageUrl}";
        return Ok(new { imageUrl, fullUrl });
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p is null) return NotFound();
        _db.Products.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
