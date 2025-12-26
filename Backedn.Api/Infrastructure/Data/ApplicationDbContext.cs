using Microsoft.EntityFrameworkCore;
using Backedn.Api.Domain.Entities;

namespace Backedn.Api.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();

    public DbSet<Product> Products => Set<Product>();

}
