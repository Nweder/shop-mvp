using Backedn.Api.Domain.Entities;
using Backedn.Api.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Backedn.Api.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(IServiceProvider services, IConfiguration config)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await db.Database.MigrateAsync();

        var email = config["AdminSeed:Email"];
        var password = config["AdminSeed:Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return;

        var exists = await db.Users.AnyAsync(u => u.Email == email);
        if (exists) return;

        db.Users.Add(new User
        {
            Email = email,
            PasswordHash = PasswordHasher.Hash(password),
            Role = "Admin"
        });

        await db.SaveChangesAsync();
    }
}
