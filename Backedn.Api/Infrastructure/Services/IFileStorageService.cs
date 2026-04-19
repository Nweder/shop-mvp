namespace Backedn.Api.Infrastructure.Services;

public interface IFileStorageService
{
    Task<FileStorageResult> SaveProductImageAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
}

public record FileStorageResult(string RelativePath, string PublicUrl);
