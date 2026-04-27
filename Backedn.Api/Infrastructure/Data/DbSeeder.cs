using Backedn.Api.Domain.Entities;
using Backedn.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backedn.Api.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration config)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

        await db.Database.EnsureCreatedAsync();

        foreach (var role in new[] { AppRoles.Admin, AppRoles.Customer })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<int>(role));
            }
        }

        var email = config["AdminSeed:Email"];
        var password = config["AdminSeed:Password"];

        if (!string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(password))
        {
            var adminUser = await userManager.Users.FirstOrDefaultAsync(x => x.Email == email);

            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    FullName = "18K Admin"
                };

                var result = await userManager.CreateAsync(adminUser, password);

                if (result.Succeeded)
                {
                    await userManager.AddToRolesAsync(adminUser, new[] { AppRoles.Admin, AppRoles.Customer });
                }
            }
            else
            {
                if (!await userManager.IsInRoleAsync(adminUser, AppRoles.Admin))
                {
                    await userManager.AddToRoleAsync(adminUser, AppRoles.Admin);
                }

                if (!await userManager.IsInRoleAsync(adminUser, AppRoles.Customer))
                {
                    await userManager.AddToRoleAsync(adminUser, AppRoles.Customer);
                }
            }
        }

        if (await db.Products.AnyAsync())
        {
            return;
        }

        db.Products.AddRange(
            new Product
            {
                Name = "18K No. 1",
                Description = "En signaturdoft med mjuka noter av citrus, amber och vit mysk.",
                Category = ProductCategories.Parfym,
                Price = 899m,
                Stock = 24,
                Sku = "18K-PAR-001",
                IsActive = true,
                Images =
                {
                    new ProductImage
                    {
                        ImageUrl = "/images/products/sample-parfym-1.jpg",
                        IsPrimary = true,
                        SortOrder = 0
                    }
                }
            },
            new Product
            {
                Name = "18K Guldarmband",
                Description = "Elegant armband i varm guldfinish som passar både vardag och fest.",
                Category = ProductCategories.Guld,
                Price = 1499m,
                Stock = 12,
                Sku = "18K-GULD-001",
                IsActive = true,
                Images =
                {
                    new ProductImage
                    {
                        ImageUrl = "/images/products/sample-guld-1.jpg",
                        IsPrimary = true,
                        SortOrder = 0
                    }
                }
            });

        await db.SaveChangesAsync();
    }
}