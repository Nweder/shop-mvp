using Backedn.Api.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Backedn.Api.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Product>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(150);
            entity.Property(x => x.Description).HasMaxLength(4000);
            entity.Property(x => x.Category).HasMaxLength(50);
            entity.Property(x => x.Sku).HasMaxLength(64);
            entity.Property(x => x.Price).HasColumnType("decimal(18,2)");
            entity.HasIndex(x => x.Sku).IsUnique();
        });

        builder.Entity<ProductImage>(entity =>
        {
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.HasOne(x => x.Product)
                .WithMany(x => x.Images)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Order>(entity =>
        {
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.Property(x => x.PaymentStatus).HasMaxLength(50);
            entity.Property(x => x.Currency).HasMaxLength(10);
            entity.Property(x => x.SubtotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.VatAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.ShippingAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.ShippingName).HasMaxLength(150);
            entity.Property(x => x.ShippingEmail).HasMaxLength(256);
            entity.Property(x => x.ShippingPhone).HasMaxLength(50);
            entity.Property(x => x.ShippingAddressLine1).HasMaxLength(200);
            entity.Property(x => x.PostalCode).HasMaxLength(30);
            entity.Property(x => x.City).HasMaxLength(100);
            entity.Property(x => x.Country).HasMaxLength(100);
            entity.Property(x => x.StripeCheckoutSessionId).HasMaxLength(200);
            entity.Property(x => x.StripePaymentIntentId).HasMaxLength(200);

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<OrderItem>(entity =>
        {
            entity.Property(x => x.ProductName).HasMaxLength(150);
            entity.Property(x => x.ProductSku).HasMaxLength(64);
            entity.Property(x => x.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(x => x.LineTotal).HasColumnType("decimal(18,2)");

            entity.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
