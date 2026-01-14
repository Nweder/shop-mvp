using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backedn.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrlToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Migration intentionally left empty because the ImageUrl column
            // already exists in the database. This no-op migration ensures the
            // EF Core Migrations history can be updated without altering schema.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op
        }
    }
}
