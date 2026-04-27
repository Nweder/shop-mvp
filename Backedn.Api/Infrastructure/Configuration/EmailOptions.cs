namespace Backedn.Api.Infrastructure.Configuration;

public class EmailOptions
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "18K";
    public string AdminNotificationEmail { get; set; } = string.Empty;
    public bool UseSsl { get; set; } = true;
}