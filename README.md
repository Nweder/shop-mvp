# Silveria

Silveria is a production-oriented e-commerce platform with:
- ASP.NET Core Web API backend
- React storefront frontend
- Stripe checkout support
- Admin-only management panel
- Guest checkout for customers

## Current Deployment Direction

The repo is being prepared for:
- Frontend on Azure Static Web Apps
- Backend on Azure App Service
- Azure SQL for production/staging data
- Azure Blob Storage for product images
- Azure Key Vault / App Settings for secrets

## Environments

### Development
- Backend: SQLite
- Frontend: Vite dev server
- Local image storage in `wwwroot/images/products`

### Staging / Production
- Backend: SQL Server connection string from Azure
- Frontend: API base URL from `VITE_API_BASE_URL`
- Product images: Azure Blob Storage
- Secrets: Azure App Settings and optionally Key Vault

## Local Run

### Backend
```powershell
dotnet run --project Backedn.Api\Backedn.Api.csproj --launch-profile http
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

## Azure Staging Setup

### Backend App Service
Create an Azure App Service for the API and configure these app settings:

- `ASPNETCORE_ENVIRONMENT=Staging`
- `ConnectionStrings__DefaultConnection=<azure sql connection string>`
- `Database__Provider=SqlServer`
- `Jwt__Key=<long random secret>`
- `Jwt__Issuer=Silveria.Staging`
- `Jwt__Audience=Silveria.Frontend.Staging`
- `Stripe__SecretKey=<stripe test secret>`
- `Stripe__PublishableKey=<stripe test publishable>`
- `Stripe__WebhookSecret=<stripe webhook secret>`
- `BlobStorage__ConnectionString=<azure blob connection string>`
- `BlobStorage__ContainerName=product-images-staging`
- `Security__AdminCookieName=silveria_admin_staging`
- `AdminSeed__Email=admin@silveria.se`
- `AdminSeed__Password=<strong admin password>`

Optional:
- `KeyVault__VaultUri=https://<your-vault>.vault.azure.net/`

### Frontend Static Web App
Add environment variable:

- `VITE_API_BASE_URL=https://api-staging.silveria.se`

## GitHub Secrets For Staging

### Backend workflow
- `AZURE_BACKEND_APP_NAME_STAGING`
- `AZURE_BACKEND_PUBLISH_PROFILE_STAGING`

### Frontend workflow
- `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING`
- `VITE_API_BASE_URL_STAGING`

## Workflows

Staging deploy workflows are included:
- `.github/workflows/backend-appservice-staging.yml`
- `.github/workflows/frontend-staticwebapp-staging.yml`

## Security Hardening Already Added

- HTTPS redirection
- HSTS outside development
- security headers middleware
- admin auth cookie support
- rate limiting for auth/admin/upload
- SQL Server-ready config
- Blob Storage abstraction for uploads

## Recommended Next Operational Steps

1. Create Azure SQL, App Service, Static Web App and Blob Storage
2. Add staging secrets in GitHub
3. Deploy staging
4. Bind staging domains
5. Add Stripe test keys
6. Verify upload, checkout and webhook flow
7. Run security checks against staging
