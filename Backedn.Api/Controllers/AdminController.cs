using System.Security.Claims;
using Backedn.Api.Dtos.Orders;
using Backedn.Api.Dtos.Products;
using Backedn.Api.Infrastructure.Data;
using Backedn.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Backedn.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = AppRoles.Admin)]
[EnableRateLimiting("admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            email = User.FindFirstValue(ClaimTypes.Email),
            fullName = User.Identity?.Name,
            roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToArray()
        });
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var activeProducts = await _dbContext.Products.CountAsync(x => x.IsActive);
        var orders = await _dbContext.Orders.CountAsync();
        var revenue = await _dbContext.Orders
            .Where(x => x.PaymentStatus == "Paid")
            .SumAsync(x => (decimal?)x.TotalAmount) ?? 0m;

        return Ok(new
        {
            activeProducts,
            orders,
            revenue
        });
    }

    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
    {
        var items = await _dbContext.Products
            .Include(x => x.Images)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(items.Select(ProductsController.MapProduct));
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
    {
        var items = await _dbContext.Orders
            .Include(x => x.Items)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(items.Select(OrdersController.MapOrder));
    }
}
