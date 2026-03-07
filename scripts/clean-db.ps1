# Open-Lance Database Cleanup Script (PowerShell)

Write-Host "--- Starting Open-Lance Database Cleanup ---" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"

$Uri = $env:MONGODB_URI

# Check .env first
$EnvPath = Join-Path $ProjectRoot ".env"
if (-not $Uri -and (Test-Path $EnvPath)) {
    $EnvContent = Get-Content $EnvPath -Raw
    if ($EnvContent -match 'MONGODB_URI="([^"]+)"') {
        $Uri = $matches[1]
        Write-Host "MONGODB_URI loaded from .env" -ForegroundColor Green
    }
}

# Check .dev.vars if not found in .env
$DevVarsPath = Join-Path $BackendDir ".dev.vars"
if (-not $Uri -and (Test-Path $DevVarsPath)) {
    $DevVarsContent = Get-Content $DevVarsPath -Raw
    if ($DevVarsContent -match 'MONGODB_URI="([^"]+)"') {
        $Uri = $matches[1]
        Write-Host "MONGODB_URI loaded from .dev.vars" -ForegroundColor Green
    }
}

if (-not $Uri) {
    Write-Host "ERROR: MONGODB_URI not found in environment variables, .env, or .dev.vars" -ForegroundColor Red
    exit 1
}

$env:MONGODB_URI = $Uri
$NodeScriptPath = Join-Path $BackendDir "scripts\clean-db.js"

if (-not (Test-Path $NodeScriptPath)) {
    Write-Host "ERROR: File $NodeScriptPath not found!" -ForegroundColor Red
    exit 1
}

$PreviousLocation = Get-Location
Set-Location $BackendDir

try {
    node $NodeScriptPath
} catch {
    Write-Host "An error occurred while executing the script." -ForegroundColor Red
} finally {
    Set-Location $PreviousLocation
}
