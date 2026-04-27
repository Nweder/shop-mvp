using Backedn.Api.Domain.Entities;

namespace Backedn.Api.Infrastructure.Services;

public interface IEmailService
{
    Task SendOrderConfirmationToCustomerAsync(Order order, CancellationToken cancellationToken = default);
    Task SendNewOrderNotificationToAdminAsync(Order order, CancellationToken cancellationToken = default);
}