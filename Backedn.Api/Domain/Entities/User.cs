namespace Backedn.Api.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string Role { get; set; } = "User"; // Admin/User
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
