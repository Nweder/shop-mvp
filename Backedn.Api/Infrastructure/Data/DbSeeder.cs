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
                    FullName = "Silveria Admin"
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

                var token = await userManager.GeneratePasswordResetTokenAsync(adminUser);
                var resetResult = await userManager.ResetPasswordAsync(adminUser, token, password);

                if (!resetResult.Succeeded)
                {
                    var removeResult = await userManager.RemovePasswordAsync(adminUser);
                    if (removeResult.Succeeded)
                    {
                        await userManager.AddPasswordAsync(adminUser, password);
                    }
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
                Name = "Silveria No. 1",
                Description = "En signaturdoft med mjuka noter av citrus, amber och vit mysk.",
                Category = ProductCategories.Parfym,
                Price = 899m,
                Stock = 24,
                Sku = "SIL-PAR-001",
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
                Name = "Silveria Guldarmband",
                Description = "Elegant armband i varm guldfinish som passar både vardag och fest.",
                Category = ProductCategories.Guld,
                Price = 1499m,
                Stock = 12,
                Sku = "SIL-GULD-001",
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