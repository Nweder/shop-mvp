using Backedn.Api.Domain.Entities;
using Backedn.Api.Dtos.Auth;
using Backedn.Api.Infrastructure.Configuration;
using Backedn.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Backedn.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtTokenService _jwtTokenService;
    private readonly SecurityOptions _securityOptions;
    private readonly IWebHostEnvironment _environment;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        JwtTokenService jwtTokenService,
        IOptions<SecurityOptions> securityOptions,
        IWebHostEnvironment environment)
    {
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
        _securityOptions = securityOptions.Value;
        _environment = environment;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Ogiltiga inloggningsuppgifter." });
        }

        var token = await _jwtTokenService.CreateTokenAsync(user);
        AppendAuthCookie(token);

        return await BuildAuthResponseAsync(user);
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(_securityOptions.AdminCookieName, BuildCookieOptions());
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        return await BuildAuthResponseAsync(user);
    }

    private void AppendAuthCookie(string token)
    {
        Response.Cookies.Append(_securityOptions.AdminCookieName, token, BuildCookieOptions());
    }

    private CookieOptions BuildCookieOptions()
    {
        var isDevelopment = _environment.IsDevelopment();

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddHours(12),
            IsEssential = true,
            Path = "/"
        };
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);

        return new AuthResponse
        {
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles.ToArray()
        };
    }
}