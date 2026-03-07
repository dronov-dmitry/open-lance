Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Starting Open-Lance Development Servers..." -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$EnvFile = Join-Path $PSScriptRoot "..\.env"

# Read .env file to check if we are in local or cloud mode
$isLocalBackend = $true # Default to local just in case
$backendUrl = "http://127.0.0.1:8787"

if (Test-Path $EnvFile) {
    $envContent = Get-Content $EnvFile -Raw
    
    # Extract Environment and API_URL
    # Use (?m) multiline + ^ anchor so we only match the ACTIVE "Environment=" line,
    # not DEV_Environment or PROD_Environment lines
    if ($envContent -match '(?m)^Environment="?dev"?') {
        $isLocalBackend = $false
    }
    if ($envContent -match 'API_URL="?(https://[^"''\s]+)"?') {
        $backendUrl = $Matches[1]
    }
}

Write-Host ""
Write-Host "[1/2] Starting Frontend Server (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ""$PSScriptRoot\..\docs""; python -m http.server 8080" -WindowStyle Normal

if ($isLocalBackend) {
    Write-Host "[2/2] Starting Backend Server (Wrangler / Port 8787)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ""$PSScriptRoot\..\backend""; npm run dev" -WindowStyle Normal
    Write-Host "`nDevelopment servers started!" -ForegroundColor Green
    Write-Host "`nFrontend URL: http://localhost:8080" -ForegroundColor White
    Write-Host "Backend URL:  http://127.0.0.1:8787" -ForegroundColor White
    Write-Host "`nNote: To stop the servers, just close their respective powershell windows." -ForegroundColor Gray
} else {
    Write-Host "[2/2] Skipping Local Backend (Deploy configured for Cloudflare Workers)..." -ForegroundColor Cyan
    Write-Host "`nDevelopment server started!" -ForegroundColor Green
    Write-Host "`nFrontend URL: http://localhost:8080" -ForegroundColor White
    Write-Host "Backend URL:  $backendUrl (Cloud)" -ForegroundColor Cyan
    Write-Host "`nNote: To stop the frontend server, just close its powershell window." -ForegroundColor Gray
}
