param(
    [switch]$Local  # Force local backend even if .env says dev/prod
)

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Starting Open-Lance Development Servers..." -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$EnvFile = Join-Path $PSScriptRoot "..\\.env"

# Read .env file to check if we are in local or cloud mode
$isLocalBackend = $true # Default to local just in case
$backendUrl = "http://127.0.0.1:8787"
$envValue = "local"

if (-not $Local -and (Test-Path $EnvFile)) {
    $envContent = Get-Content $EnvFile -Raw

    # Extract active Environment value (not DEV_ or PROD_ prefixed lines)
    if ($envContent -match '(?m)^Environment="?([^"'' \r\n]+)"?') {
        $envValue = $Matches[1].Trim()
        if ($envValue -eq "local") {
            $isLocalBackend = $true
        } else {
            # "PROD" or anything else = cloud (Cloudflare Workers)
            $isLocalBackend = $false
        }
    }

    if ($envContent -match 'API_URL="?(https://[^"''\s]+)"?') {
        $backendUrl = $Matches[1]
    }
}

if ($Local) {
    $isLocalBackend = $true
    Write-Host "[INFO] -Local flag set: forcing local backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[1/2] Starting Frontend Server (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$PSScriptRoot\..\docs`"; python -m http.server 8080" -WindowStyle Normal

if ($isLocalBackend) {
    Write-Host "[2/2] Starting Backend Server (Wrangler / Port 8787)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$PSScriptRoot\..\backend`"; npx wrangler dev" -WindowStyle Normal
    Write-Host "`nDevelopment servers started!" -ForegroundColor Green
    Write-Host "`nFrontend URL: http://localhost:8080" -ForegroundColor White
    Write-Host "Backend URL:  http://127.0.0.1:8787" -ForegroundColor White
    Write-Host "`nNote: To stop the servers, just close their respective powershell windows." -ForegroundColor Gray
} else {
    Write-Host "[2/2] Skipping Local Backend (Environment=`"$envValue`" -> using cloud)..." -ForegroundColor Cyan
    Write-Host "`nDevelopment server started!" -ForegroundColor Green
    Write-Host "`nFrontend URL: http://localhost:8080" -ForegroundColor White
    Write-Host "Backend URL:  $backendUrl (Cloud)" -ForegroundColor Cyan
    Write-Host "`nTo force local backend: .\start_dev.ps1 -Local" -ForegroundColor Gray
    Write-Host "Note: To stop the frontend server, just close its powershell window." -ForegroundColor Gray
}
