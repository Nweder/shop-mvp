namespace Backedn.Api.Infrastructure.Configuration;

public class BlobStorageOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public string ContainerName { get; set; } = "product-images";
    public string BaseUrl { get; set; } = string.Empty;
}
