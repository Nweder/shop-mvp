namespace Backedn.Api.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LocalFileStorageService(IWebHostEnvironment environment, IHttpContextAccessor httpContextAccessor)
    {
        _environment = environment;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<FileStorageResult> SaveProductImageAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var root = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadsPath = Path.Combine(root, "images", "products");
        Directory.CreateDirectory(uploadsPath);

        var filePath = Path.Combine(uploadsPath, fileName);
        await using var fileStream = File.Create(filePath);
        await stream.CopyToAsync(fileStream, cancellationToken);

        var relativePath = $"/images/products/{fileName}";
        var request = _httpContextAccessor.HttpContext?.Request;
        var publicUrl = request == null ? relativePath : $"{request.Scheme}://{request.Host}{relativePath}";

        return new FileStorageResult(relativePath, publicUrl);
    }
}
