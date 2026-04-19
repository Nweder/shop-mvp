using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Backedn.Api.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace Backedn.Api.Infrastructure.Services;

public class AzureBlobFileStorageService : IFileStorageService
{
    private readonly BlobContainerClient _containerClient;
    private readonly BlobStorageOptions _options;

    public AzureBlobFileStorageService(IOptions<BlobStorageOptions> options)
    {
        _options = options.Value;
        _containerClient = new BlobContainerClient(_options.ConnectionString, _options.ContainerName);
    }

    public async Task<FileStorageResult> SaveProductImageAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        await _containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

        var blobClient = _containerClient.GetBlobClient(fileName);
        await blobClient.UploadAsync(
            stream,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType
                }
            },
            cancellationToken);

        return new FileStorageResult(fileName, blobClient.Uri.ToString());
    }
}
