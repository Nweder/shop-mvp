# WebShop — Projektöversikt

Detta repository innehåller en enkel e‑commerce proof-of-concept med en React‑frontend i `frontend/` och en ASP.NET Core backend i `Backedn.Api/`.

Syfte: Ge en modern, lyxig startsida i frontend och ett litet API för användare, autentisering och produkthantering via en adminpanel.

Nedan hittar du instruktioner för att köra, hur backend är uppsatt, endpoints och hur admin-flödet fungerar.

## Snabbstart

Förutsättningar:
- Node.js (för frontend)
- .NET SDK (för backend)
- SQL Server eller LocalDB (backend använder en SQL Server-connection string i utvecklingsinställningar)

Starta frontend (utveckling):

```powershell
cd C:\Users\Dator\Desktop\WebShop\frontend
npm install   # om du inte redan har installerat beroenden
npm run dev
```

Starta backend (utveckling):

```powershell
cd C:\Users\Dator\Desktop\WebShop\Backedn.Api
dotnet run
```

När backend körs i utvecklingsläge (ASPNETCORE_ENVIRONMENT=Development) används `appsettings.Development.json` som innehåller en sample LocalDB-connection string, JWT-konfiguration och AdminSeed (se filen). Program.cs kör migrationer och seedar en adminanvändare automatiskt om `AdminSeed` är satt.

## Backend — vad finns och hur det hänger ihop

Viktiga filer:
- `Backedn.Api/Program.cs` — konfigurerar services, CORS, JWT-auth, kör DB-migrations och seed.
- `Backedn.Api/Controllers/AuthController.cs` — POST `/api/auth/login` (returnerar JWT).
- `Backedn.Api/Controllers/AdminController.cs` — GET `/api/admin/me` (behöver authorization).
- `Backedn.Api/Controllers/ProductsController.cs.cs` — GET `/api/products`, POST `/api/products` (authorize), DELETE `/api/products/{id}` (authorize).
- `Backedn.Api/Infrastructure/Data/ApplicationDbContext.cs` — EF Core DbContext med `Users` och `Products`.
- `Backedn.Api/Infrastructure/Data/DbSeeder.cs` — migrerar DB och skapar en adminanvändare från `appsettings.Development.json` eller miljövariabler.
- `Backedn.Api/Infrastructure/Security/PasswordHasher.cs` — säkert hash/verify (använder PBKDF2).

Notera: filen `ProductsController.cs.cs` har dubbel `.cs` i filnamnet. Det fungerar men jag rekommenderar att byta namn till `ProductsController.cs` för tydlighet.

### Konfiguration
 - `Backedn.Api/appsettings.Development.json` innehåller exempel på:
  - `ConnectionStrings:DefaultConnection` — LocalDB connection string
  - `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` — krävs för att generera och validera JWT
  - `AdminSeed:Email` och `AdminSeed:Password` — om dessa är satta skapas en admin konto vid uppstart

I produktionsmiljö ska du inte lagra `Jwt:Key` eller lösenord i appsettings. Använd hemligheter / Key Vault eller miljövariabler.

### Endpoints (kort)

 - POST /api/auth/login
  - Body: { "email": "admin@webshop.se", "password": "Admin123!" }
  - Svar: { "token": "<jwt>" }

 - GET /api/products
  - Publik
  - Returnerar lista av produkter (model: Id, Name, Description, Price, Stock, Category, CreatedAt)

 - POST /api/products
  - Kräver Authorization: Bearer <token>
  - Body: Product JSON, exempel:
    {
      "name": "Ring med diamant",
      "description": "Vacker ring",
      "price": 7999.0,
      "stock": 5,
      "category": "Silver"
    }

 - DELETE /api/products/{id}
  - Kräver Authorization

 - GET /api/admin/me
  - Kräver Authorization
  - Returnerar info om inloggad användare (claims)

### Exempel: Logga in och skapa produkt (PowerShell)

1) Logga in och spara token:

```powershell
$login = @{ email = 'admin@webshop.se'; password = 'Admin123!' } | ConvertTo-Json
$resp = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/login' -Body $login -ContentType 'application/json'
$token = $resp.token
```

2) Skapa produkt med token:

```powershell
$product = @{
  name = 'Ring med diamant'
  description = 'Exklusiv ring'
  price = 7999.0
  stock = 3
  category = 'Silver'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/products' -Body $product -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" }
```

Byt `http://localhost:5000` mot den port som din backend kör på (Vite brukar köra frontend på 5173 och backend på 5000/5001 beroende på konfiguration).

## Frontend — kort

Frontend ligger i `frontend/` och använder Vite + React. Jag lade in en ny, modern `Home.jsx` och CSS samt några SVG-platshållare under `frontend/src/assets/`.

Vanliga script:

```powershell
cd frontend
npm run dev    # utveckling
npm run build  # producera build
```

Frontend kallar backend på `http://localhost:5000` i exemplen (CORS i backend är satt för `http://localhost:5173`). Om du kör frontend på en annan port, uppdatera `Program.cs` CORS-policy eller starta frontend på 5173.

## Admin-panel & produktflöde

 - Adminanvändare skapas automatiskt vid uppstart om `AdminSeed` finns (se `appsettings.Development.json`).
 - Admin loggar in via `/api/auth/login` för att få en JWT.
 - Frontend/adminpanelen måste skicka `Authorization: Bearer <token>` vid POST/DELETE mot `/api/products`.

Admin-UI:
- Frontend innehåller en enkel admin-UI under `frontend/src/pages/AdminProducts.jsx` (ruta `/admin/products` i dev-mode om Vite-router är konfigurerad). Den låter dig:
  - Logga in via `frontend/src/pages/Login.jsx` (spara token i localStorage)
  - Skapa produkter (inklusive valfri `imageUrl`)
  - Ta bort produkter

ImageUrl & migration
- Jag lade till en ny egenskap `ImageUrl` i `Backedn.Api.Domain.Entities.Product` för att lagra bild-URL:er.
- Jag skapade och applicerade en EF Core-migration `AddImageUrlToProduct` så databasen nu innehåller kolumnen `ImageUrl`.

Frontend-visning
- `frontend/src/pages/Home.jsx` uppdaterades för att hämta produkter från backend och visa `imageUrl` om den finns; annars visas en placeholder.


Produktens shape (C# modell) förväntar sig följande fält:
 - `Name` (string)
 - `Description` (string)
 - `Price` (decimal)
 - `Stock` (int)
 - `Category` (string)

Det finns för närvarande ingen server-side validering på dessa fält (utom datatyper). Jag rekommenderar att lägga till:
 - Min/max-vals (t.ex. Price >= 0, Stock >= 0)
 - Max-längder på strängar

## Säkerhets- och förbättringsförslag

 - Byt JWT-nyckel (`Jwt:Key`) till en stark hemlighet och förvara den säkert (miljövariabler/KeyVault).
 - Byt bort in-checkade lösenord i config för produktion.
 - Lägg till server-side validering på produktmodel.
 - Överväg att lagra produktbilder i `wwwroot` eller i en CDN och spara sökväg i `Product`.
 - Namnge om `ProductsController.cs.cs` till `ProductsController.cs` för tydlighet.

## Ändringar jag gjorde (snabb översikt)

 - Frontend:
   - `frontend/src/pages/Home.jsx` — ny startsidas React-komponent (lyxig layout)
   - `frontend/src/pages/Home.css` — styles
   - `frontend/src/assets/*` — SVG-platshållare (logo, hero, produkter)

 - Backend:
   - Uppdaterade `Backedn.Api/Infrastructure/Security/PasswordHasher.cs` för att använda `Rfc2898DeriveBytes.Pbkdf2` (tar bort obsolete-varningar)

## Hur jag verifierade

 - Jag körde `npm run build` i `frontend/` för att verifiera att frontend kompilerar.
 - Jag körde `dotnet build` i `Backedn.Api/` — projektet kompilerar.

Om du vill kan jag:
 - Byta namn på `ProductsController.cs.cs` åt dig.
 - Implementera server-side validering (DataAnnotations) och lägga till enkla integrationstester.
 - Koppla frontend adminpanelen så den använder riktiga backend-endpoints för inloggning och produktskapande.

Säg vad du vill att jag ska göra härnäst så fixar jag det.

## Mobile testing

- Snabbtest i utveckling (Chrome/Edge/Firefox): öppna DevTools (F12) och aktivera Device Toolbar (Ctrl+Shift+M) för att simulera olika mobilstorlekar och nätverk. Kontrollera layout, knappstorlekar och att formulär inte klipps.
- Testa pekvänlighet: se till att knappar har tillräcklig padding och att input-fält är läsbara.
- Testa på riktig enhet:
  1) Kör frontend med host så andra enheter i nätverket kan nå din dev-server:

```powershell
cd C:\Users\Dator\Desktop\WebShop\frontend
npm run dev -- --host
```

  2) Kör backend (`dotnet run`) så API:et är tillgängligt.
  3) Hitta din PC:s lokala IP (t.ex. `192.168.1.10`) och öppna `http://<DIN_IP>:5173` i mobilen (samma Wi‑Fi).
  4) OBS: CORS i `Backedn.Api/Program.cs` är konfigurerad för `http://localhost:5173`. Om du använder en IP måste du lägga till den i `WithOrigins(...)` eller under utveckling temporärt använda `AllowAnyOrigin()`.

Vad jag ändrade för mobil:
- `frontend/src/pages/Home.css` — mobila brytpunkter (<=900px och <=600px), mindre rubriker, fullbredds-knappar på små skärmar och mindre produktkort.
- `frontend/src/pages/Admin.css` — admin-form konverterar till en kolumn på små skärmar; listor och bilder staplas vertikalt.
