using System.Net;
using System.Net.Mail;
using System.Text;
using Backedn.Api.Domain.Entities;
using Backedn.Api.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace Backedn.Api.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<EmailOptions> options, ILogger<SmtpEmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendOrderConfirmationToCustomerAsync(Order order, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(order.ShippingEmail))
        {
            return;
        }

        var subject = $"Tack för din beställning hos 18K – Order #{order.Id}";
        var body = BuildCustomerOrderEmail(order);

        await SendAsync(order.ShippingEmail, subject, body, cancellationToken);
    }

    public async Task SendNewOrderNotificationToAdminAsync(Order order, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.AdminNotificationEmail))
        {
            _logger.LogWarning("Email:AdminNotificationEmail saknas. Adminmejl skickades inte.");
            return;
        }

        var subject = $"Ny beställning hos 18K – Order #{order.Id}";
        var body = BuildAdminOrderEmail(order);

        await SendAsync(_options.AdminNotificationEmail, subject, body, cancellationToken);
    }

    private async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.Host) ||
            string.IsNullOrWhiteSpace(_options.UserName) ||
            string.IsNullOrWhiteSpace(_options.Password) ||
            string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            _logger.LogWarning("SMTP-konfiguration saknas. Mejl till {To} skickades inte.", to);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromEmail, _options.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(to);

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            Credentials = new NetworkCredential(_options.UserName, _options.Password),
            EnableSsl = _options.UseSsl
        };

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message);
    }

    private static string BuildCustomerOrderEmail(Order order)
    {
        var itemsHtml = string.Join("", order.Items.Select(item =>
            $"""
            <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">{item.ProductName}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">{item.Quantity}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">{FormatMoney(item.UnitPrice)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">{FormatMoney(item.LineTotal)}</td>
            </tr>
            """));

        return $"""
        <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#222;">
            <h2>Tack för din beställning hos 18K</h2>
            <p>Hej {order.ShippingName},</p>
            <p>Vi har tagit emot din beställning.</p>

            <p><strong>Ordernummer:</strong> #{order.Id}<br/>
            <strong>Betalstatus:</strong> {order.PaymentStatus}<br/>
            <strong>Datum:</strong> {order.CreatedAt:yyyy-MM-dd HH:mm}</p>

            <h3>Produkter</h3>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Produkt</th>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Antal</th>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Pris</th>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Summa</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsHtml}
                </tbody>
            </table>

            <p style="margin-top:16px;">
                <strong>Delsumma:</strong> {FormatMoney(order.SubtotalAmount)}<br/>
                <strong>Frakt:</strong> {FormatMoney(order.ShippingAmount)}<br/>
                <strong>Total:</strong> {FormatMoney(order.TotalAmount)}
            </p>

            <h3>Leveransuppgifter</h3>
            <p>
                {order.ShippingName}<br/>
                {order.ShippingAddressLine1}<br/>
                {order.PostalCode} {order.City}<br/>
                {order.Country}<br/>
                {order.ShippingPhone}
            </p>

            <p>Tack för att du handlar hos 18K.</p>
        </div>
        """;
    }

    private static string BuildAdminOrderEmail(Order order)
    {
        var itemsHtml = string.Join("", order.Items.Select(item =>
            $"""
            <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">{item.ProductName}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">{item.ProductSku}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">{item.Quantity}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">{FormatMoney(item.LineTotal)}</td>
            </tr>
            """));

        return $"""
        <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#222;">
            <h2>Ny beställning hos 18K</h2>

            <p><strong>Ordernummer:</strong> #{order.Id}<br/>
            <strong>Status:</strong> {order.Status}<br/>
            <strong>Betalstatus:</strong> {order.PaymentStatus}<br/>
            <strong>Skapad:</strong> {order.CreatedAt:yyyy-MM-dd HH:mm}<br/>
            <strong>Betald:</strong> {(order.PaidAt.HasValue ? order.PaidAt.Value.ToString("yyyy-MM-dd HH:mm") : "-")}</p>

            <h3>Kund</h3>
            <p>
                <strong>Namn:</strong> {order.ShippingName}<br/>
                <strong>E-post:</strong> {order.ShippingEmail}<br/>
                <strong>Telefon:</strong> {order.ShippingPhone}
            </p>

            <h3>Adress</h3>
            <p>
                {order.ShippingAddressLine1}<br/>
                {order.PostalCode} {order.City}<br/>
                {order.Country}
            </p>

            <h3>Orderrader</h3>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Produkt</th>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">SKU</th>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Antal</th>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Summa</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsHtml}
                </tbody>
            </table>

            <p style="margin-top:16px;">
                <strong>Delsumma:</strong> {FormatMoney(order.SubtotalAmount)}<br/>
                <strong>Frakt:</strong> {FormatMoney(order.ShippingAmount)}<br/>
                <strong>Total:</strong> {FormatMoney(order.TotalAmount)}
            </p>
        </div>
        """;
    }

    private static string FormatMoney(decimal amount)
    {
        return $"{amount:0.##} kr";
    }
}