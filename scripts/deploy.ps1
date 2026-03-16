# Open-Lance Deployment Script v3.0 (Windows PowerShell)
# Cloudflare Workers + MongoDB Atlas deployment automation

param(
    [switch]$SkipBackend,
    [switch]$Help
)

# Set console encoding to UTF-8
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues["*:Encoding"] = "utf8"

# Error handling
$ErrorActionPreference = "Stop"

# Script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

###############################################################################
# Helper Functions
###############################################################################

function Write-Header {
    param([string]$Message)
    Write-Host "`n================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "================================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

###############################################################################
# Show Help
###############################################################################

if ($Help) {
    Write-Host "Open-Lance Deployment Script v3.0"
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "    .\deploy.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "    -Environment <env>      Deployment environment (dev/prod/local) [default: dev]"
    Write-Host "    -SkipBackend           Skip backend deployment"
    Write-Host "    -Help                  Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "    .\deploy.ps1                           # Full deployment to dev"
    Write-Host "    .\deploy.ps1 -Environment prod         # Full deployment to prod"
    Write-Host "    .\deploy.ps1 -Environment local        # Configure for local testing"
    Write-Host "    .\deploy.ps1 -SkipBackend              # Configure only"
    Write-Host ""
    Write-Host "    - No AWS required"
    Write-Host ""
    exit 0
}

###############################################################################
# Check Prerequisites
###############################################################################

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"

    $missingTools = @()

    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js found: $nodeVersion"
        } else {
            $missingTools += "Node.js"
            Write-ErrorMsg "Node.js not found"
        }
    }
    catch {
        $missingTools += "Node.js"
        Write-ErrorMsg "Node.js not found"
    }

    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        Write-Success "npm found: v$npmVersion"
    }
    catch {
        $missingTools += "npm"
        Write-ErrorMsg "npm not found"
    }

    # Check Wrangler
    try {
        $wranglerVersion = wrangler --version 2>$null
        if ($wranglerVersion) {
            Write-Success "Wrangler CLI found: $wranglerVersion"
        } else {
            Write-WarningMsg "Wrangler CLI not found, installing..."
            npm install -g wrangler
        }
    }
    catch {
        Write-WarningMsg "Wrangler CLI not found, installing..."
        npm install -g wrangler
    }

    if ($missingTools.Count -gt 0) {
        Write-ErrorMsg "Missing required tools: $($missingTools -join ', ')"
        Write-Host ""
        Write-Host "Please install:" -ForegroundColor Yellow
        Write-Host "  Node.js: https://nodejs.org/" -ForegroundColor Gray
        Write-Host "  Wrangler: npm install -g wrangler" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After installation, restart PowerShell and run again." -ForegroundColor Yellow
        exit 1
    }
}

###############################################################################
# Check Cloudflare Authentication
###############################################################################

function Test-CloudflareAuth {
    Write-Header "Checking Cloudflare Authentication"

    $whoamiOutput = wrangler whoami 2>&1 | Out-String

    if ($whoamiOutput -match "You are not authenticated" -or $whoamiOutput -match "not logged in") {
        Write-WarningMsg "Cloudflare authentication not configured"
        Write-Host ""
        Write-Host "Please authenticate with Cloudflare:" -ForegroundColor Yellow
        Write-Host "  wrangler login" -ForegroundColor Green
        Write-Host ""
        $runLogin = Read-Host "Run 'wrangler login' now? (y/n)"
        if ($runLogin -eq "y") {
            wrangler login
            $whoamiCheck = wrangler whoami 2>&1 | Out-String
            if ($whoamiCheck -match "You are not authenticated") {
                Write-ErrorMsg "Authentication failed. Please run 'wrangler login' manually."
                exit 1
            }
        } else {
            Write-ErrorMsg "Cloudflare authentication required"
            exit 1
        }
    } else {
        Write-Success "Cloudflare authentication configured"
        Write-Host $whoamiOutput
    }
}

###############################################################################
# Get Configuration
###############################################################################

function Get-DeploymentConfig {
    Write-Header "Configuration"

    $configFile = Join-Path $ProjectRoot ".env"

    Write-Host ""
    Write-Host "Select Target Environment:" -ForegroundColor Cyan
    Write-Host "1) DEVELOPMENT (Local Testing, creates .dev.vars, uses DEV_ variables)" -ForegroundColor White
    Write-Host "2) PRODUCTION (Cloudflare Workers, deploys to cloud, uses PROD_ variables)" -ForegroundColor White

    do {
        $envChoice = Read-Host "Choose an option (1 or 2)"
    } until ($envChoice -match "^[12]$")

    if ($envChoice -eq "1") {
        $script:Environment = "local"
        $script:EnvPrefix = "DEV_"
    } else {
        $script:Environment = "PROD"
        $script:EnvPrefix = "PROD_"
        Test-CloudflareAuth
    }

    if (Test-Path $configFile) {
        Write-Info "Found existing configuration in .env"
        $envContent = Get-Content $configFile -Raw

        $envData = Get-Content $configFile | Where-Object { $_ -match "=" -and $_ -notmatch "^\s*#" } | ForEach-Object {
            $parts = $_ -split "=", 2
            @{ ($parts[0].Trim()) = ($parts[1].Trim()) }
        }

        $envVars = @{}
        foreach ($item in $envData) {
            foreach ($key in $item.Keys) {
                $val = $item[$key]
                if ($val -match "^`"(.*)`"$") { $val = $Matches[1] }
                elseif ($val -match "^'(.*)'$") { $val = $Matches[1] }
                $envVars[$key] = $val
            }
        }

        if ($envChoice -eq "1") {
            $script:Environment = "local"
            $script:EnvPrefix = "DEV_"
        } else {
            $script:Environment = "PROD"
            $script:EnvPrefix = "PROD_"
        }

        function Get-EnvVar {
            param([string]$Key)
            if ($envVars.ContainsKey("$($script:EnvPrefix)$Key")) { return $envVars["$($script:EnvPrefix)$Key"] }
            if ($envVars.ContainsKey($Key)) { return $envVars[$Key] }
            return $null
        }

        $script:MONGODB_URI = Get-EnvVar 'MONGODB_URI'
        $script:MONGODB_DATABASE = Get-EnvVar 'MONGODB_DATABASE'
        $script:FRONTEND_URL = Get-EnvVar 'FRONTEND_URL'
        $script:JWT_SECRET = Get-EnvVar 'JWT_SECRET'
        $rawApi = Get-EnvVar 'API_URL'; $script:API_URL = if ($rawApi) { ($rawApi -replace "[\r\n]+", "").Trim() } else { $null }
        $script:MONGODB_API_KEY = Get-EnvVar 'MONGODB_API_KEY'
        $script:EMAILJS_PUBLIC_KEY = Get-EnvVar 'EMAILJS_PUBLIC_KEY'
        $script:EMAILJS_SERVICE_ID = Get-EnvVar 'EMAILJS_SERVICE_ID'
        $script:EMAILJS_TEMPLATE_ID = Get-EnvVar 'EMAILJS_TEMPLATE_ID'
        $script:EMAILJS_PRIVATE_KEY = Get-EnvVar 'EMAILJS_PRIVATE_KEY'
        $rawSecret = Get-EnvVar 'TURNSTILE_SECRET_KEY'; $script:TURNSTILE_SECRET_KEY = if ($rawSecret) { ($rawSecret -replace "[\r\n]+", "").Trim() } else { $null }
        $rawSite = Get-EnvVar 'TURNSTILE_SITE_KEY'; $script:TURNSTILE_SITE_KEY = if ($rawSite) { ($rawSite -replace "[\r\n]+", "").Trim() } else { $null }

        $hasConfig = -not [string]::IsNullOrWhiteSpace($script:MONGODB_URI)

        if ($hasConfig) {
            $useExisting = Read-Host "Found existing $($script:EnvPrefix) configuration. Use it? (y/n)"

            if ($useExisting -eq "y") {
                Write-Info "Activating $($script:EnvPrefix) profile..."

                $newConfig = @{}
                foreach ($item in $envData) { foreach ($key in $item.Keys) { $newConfig[$key] = $item[$key] } }

                if ($script:EnvPrefix -eq "PROD_") {
                    $newConfig["Environment"] = "`"$($script:Environment)`""
                    if ($script:MONGODB_URI) { $newConfig["MONGODB_URI"] = "`"$script:MONGODB_URI`"" }
                    if ($script:MONGODB_DATABASE) { $newConfig["MONGODB_DATABASE"] = "`"$script:MONGODB_DATABASE`"" }
                    if ($script:FRONTEND_URL) { $newConfig["FRONTEND_URL"] = "`"$script:FRONTEND_URL`"" }
                    if ($script:JWT_SECRET) { $newConfig["JWT_SECRET"] = "`"$script:JWT_SECRET`"" }
                    if ($script:MONGODB_API_KEY) { $newConfig["MONGODB_API_KEY"] = "`"$script:MONGODB_API_KEY`"" }
                    if ($script:EMAILJS_PUBLIC_KEY) { $newConfig["EMAILJS_PUBLIC_KEY"] = "`"$script:EMAILJS_PUBLIC_KEY`"" }
                    if ($script:EMAILJS_SERVICE_ID) { $newConfig["EMAILJS_SERVICE_ID"] = "`"$script:EMAILJS_SERVICE_ID`"" }
                    if ($script:EMAILJS_TEMPLATE_ID) { $newConfig["EMAILJS_TEMPLATE_ID"] = "`"$script:EMAILJS_TEMPLATE_ID`"" }
                    if ($script:EMAILJS_PRIVATE_KEY) { $newConfig["EMAILJS_PRIVATE_KEY"] = "`"$script:EMAILJS_PRIVATE_KEY`"" }
                    if ($null -ne $script:TURNSTILE_SECRET_KEY) { $newConfig["TURNSTILE_SECRET_KEY"] = "`"$script:TURNSTILE_SECRET_KEY`"" }
                    if ($null -ne $script:TURNSTILE_SITE_KEY) { $newConfig["TURNSTILE_SITE_KEY"] = "`"$script:TURNSTILE_SITE_KEY`"" }
                }
                elseif ($script:EnvPrefix -eq "DEV_") {
                    $newConfig["Environment"] = "`"$($script:Environment)`""
                    if ($script:MONGODB_URI) { $newConfig["MONGODB_URI"] = "`"$script:MONGODB_URI`"" }
                    if ($script:MONGODB_DATABASE) { $newConfig["MONGODB_DATABASE"] = "`"$script:MONGODB_DATABASE`"" }
                    if ($script:FRONTEND_URL) { $newConfig["FRONTEND_URL"] = "`"$script:FRONTEND_URL`"" }
                    if ($script:JWT_SECRET) { $newConfig["JWT_SECRET"] = "`"$script:JWT_SECRET`"" }
                    if ($script:MONGODB_API_KEY) { $newConfig["MONGODB_API_KEY"] = "`"$script:MONGODB_API_KEY`"" }
                    if ($script:EMAILJS_PUBLIC_KEY) { $newConfig["EMAILJS_PUBLIC_KEY"] = "`"$script:EMAILJS_PUBLIC_KEY`"" }
                    if ($script:EMAILJS_SERVICE_ID) { $newConfig["EMAILJS_SERVICE_ID"] = "`"$script:EMAILJS_SERVICE_ID`"" }
                    if ($script:EMAILJS_TEMPLATE_ID) { $newConfig["EMAILJS_TEMPLATE_ID"] = "`"$script:EMAILJS_TEMPLATE_ID`"" }
                    if ($script:EMAILJS_PRIVATE_KEY) { $newConfig["EMAILJS_PRIVATE_KEY"] = "`"$script:EMAILJS_PRIVATE_KEY`"" }
                    if ($null -ne $script:TURNSTILE_SECRET_KEY) { $newConfig["TURNSTILE_SECRET_KEY"] = "`"$script:TURNSTILE_SECRET_KEY`"" }
                    if ($null -ne $script:TURNSTILE_SITE_KEY) { $newConfig["TURNSTILE_SITE_KEY"] = "`"$script:TURNSTILE_SITE_KEY`"" }
                }

                $configContent = "# Open-Lance Deployment Configuration v3.0`n`n"
                $configContent += "### Active Configuration (Used by Backend) ###`n"
                foreach ($key in $newConfig.Keys | Where-Object { $_ -notmatch "^(DEV_|PROD_)" } | Sort-Object) {
                    $configContent += "$key=$($newConfig[$key])`n"
                }
                $configContent += "`n### DEVELOPMENT Profile ###`n"
                foreach ($key in $newConfig.Keys | Where-Object { $_ -match "^DEV_" } | Sort-Object) {
                    $configContent += "$key=$($newConfig[$key])`n"
                }
                $configContent += "`n### PRODUCTION Profile ###`n"
                foreach ($key in $newConfig.Keys | Where-Object { $_ -match "^PROD_" } | Sort-Object) {
                    $configContent += "$key=$($newConfig[$key])`n"
                }
                $configContent | Out-File -FilePath $configFile -Encoding UTF8

                Write-Host ""
                if (-not [string]::IsNullOrWhiteSpace($script:EMAILJS_PUBLIC_KEY) -and
                    -not [string]::IsNullOrWhiteSpace($script:EMAILJS_SERVICE_ID) -and
                    -not [string]::IsNullOrWhiteSpace($script:EMAILJS_TEMPLATE_ID) -and
                    -not [string]::IsNullOrWhiteSpace($script:EMAILJS_PRIVATE_KEY)) {
                    Write-Success "EmailJS configuration is active"
                } else {
                    Write-WarningMsg "EmailJS not fully configured - emails will use fallback mode"
                }
                return
            }
        }

        $script:MONGODB_URI = $null
        $script:MONGODB_DATABASE = $null
        $script:FRONTEND_URL = $null
        $script:JWT_SECRET = $null
        $script:API_URL = $null
        $script:MONGODB_API_KEY = $null
        $script:EMAILJS_PUBLIC_KEY = $null
        $script:EMAILJS_SERVICE_ID = $null
        $script:EMAILJS_TEMPLATE_ID = $null
        $script:EMAILJS_PRIVATE_KEY = $null
        $script:TURNSTILE_SECRET_KEY = $null
        $script:TURNSTILE_SITE_KEY = $null
        Set-DeploymentConfig
    }
    else {
        Set-DeploymentConfig
    }
}

function Set-DeploymentConfig {
    Write-Host "`nPlease provide deployment configuration:`n" -ForegroundColor Cyan

    # MongoDB Atlas
    Write-Host ""
    Write-Host "MongoDB Atlas Configuration Required!" -ForegroundColor Yellow
    Write-Host "If you have not set up MongoDB Atlas yet, see: DEPLOYMENT.md" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Example Connection URI format:" -ForegroundColor Cyan
    Write-Host "  mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Real example:" -ForegroundColor Cyan
    Write-Host "  mongodb+srv://admin:MyPass123@cluster0.abc123.mongodb.net/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Important: Replace <username> and <password> with your actual credentials!" -ForegroundColor Yellow
    Write-Host "          Remove < > brackets!" -ForegroundColor Yellow
    Write-Host ""

    do {
        $script:MONGODB_URI = Read-Host "MongoDB Connection URI"
        if ([string]::IsNullOrWhiteSpace($MONGODB_URI)) {
            Write-Host ""
            Write-Host "MongoDB URI is required!" -ForegroundColor Red
            Write-Host "Get it from: https://cloud.mongodb.com/ -> Database -> Connect" -ForegroundColor Gray
        }
    } while ([string]::IsNullOrWhiteSpace($MONGODB_URI))

    $script:MONGODB_API_KEY = ""
    Write-Host "[OK] Using Direct MongoDB Connection" -ForegroundColor Green

    $dbInput = Read-Host "MongoDB Database Name [open-lance]"
    if ([string]::IsNullOrWhiteSpace($dbInput)) {
        $script:MONGODB_DATABASE = "open-lance"
    } else {
        $script:MONGODB_DATABASE = $dbInput
    }

    # Frontend URL (used for email verification links; for GitHub Pages include repo path, e.g. https://username.github.io/repo-name)
    Write-Host "Frontend URL: used in verification emails. For GitHub Pages use full URL with path, e.g. https://dronov-dmitry.github.io/open-lance" -ForegroundColor Gray
    $script:FRONTEND_URL = Read-Host "Frontend URL (e.g., https://dronov-dmitry.github.io/open-lance or https://open-lance.pages.dev) [*]"
    if ([string]::IsNullOrWhiteSpace($FRONTEND_URL)) {
        $script:FRONTEND_URL = "*"
    }

    # EmailJS Configuration
    Write-Host ""
    Write-Host "Email Verification Setup (EmailJS)" -ForegroundColor Yellow
    Write-Host "EmailJS is a free service for sending emails without SMTP setup." -ForegroundColor Gray
    Write-Host "Free tier: 200 emails/month. No domain required." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Setup steps:" -ForegroundColor Cyan
    Write-Host "  1. Register at https://www.emailjs.com/" -ForegroundColor Gray
    Write-Host "  2. Add Email Service (Gmail, Outlook, etc.)" -ForegroundColor Gray
    Write-Host "  3. Create Email Template (use emailjs_template.html as reference)" -ForegroundColor Gray
    Write-Host "  4. Get Public Key from Account -> API Keys" -ForegroundColor Gray
    Write-Host "  5. Get Private Key from Account -> API Keys" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can skip EmailJS setup (leave empty) to use fallback mode (links in logs)" -ForegroundColor Yellow
    Write-Host ""

    $script:EMAILJS_PUBLIC_KEY = Read-Host "EmailJS Public Key (leave empty to skip)"
    if (-not [string]::IsNullOrWhiteSpace($script:EMAILJS_PUBLIC_KEY)) {
        $script:EMAILJS_SERVICE_ID = Read-Host "EmailJS Service ID"
        if ([string]::IsNullOrWhiteSpace($script:EMAILJS_SERVICE_ID)) {
            Write-Host "[WARN] Service ID is empty, EmailJS will not work" -ForegroundColor Yellow
            $script:EMAILJS_PUBLIC_KEY = ""
            $script:EMAILJS_SERVICE_ID = ""
            $script:EMAILJS_TEMPLATE_ID = ""
            $script:EMAILJS_PRIVATE_KEY = ""
        } else {
            $script:EMAILJS_TEMPLATE_ID = Read-Host "EmailJS Template ID"
            if ([string]::IsNullOrWhiteSpace($script:EMAILJS_TEMPLATE_ID)) {
                Write-Host "[WARN] Template ID is empty, EmailJS will not work" -ForegroundColor Yellow
                $script:EMAILJS_PUBLIC_KEY = ""
                $script:EMAILJS_SERVICE_ID = ""
                $script:EMAILJS_TEMPLATE_ID = ""
                $script:EMAILJS_PRIVATE_KEY = ""
            } else {
                $script:EMAILJS_PRIVATE_KEY = Read-Host "EmailJS Private Key"
                Write-Host "[OK] EmailJS configured" -ForegroundColor Green
            }
        }
    } else {
        $script:EMAILJS_PUBLIC_KEY = ""
        $script:EMAILJS_SERVICE_ID = ""
        $script:EMAILJS_TEMPLATE_ID = ""
        $script:EMAILJS_PRIVATE_KEY = ""
        Write-Host "[INFO] EmailJS skipped - using fallback mode (links in logs)" -ForegroundColor Cyan
    }

    # Cloudflare Turnstile (captcha при логине)
    Write-Host ""
    Write-Host "Cloudflare Turnstile (captcha on login)" -ForegroundColor Yellow
    Write-Host "  Secret Key from Cloudflare Dashboard -> Turnstile -> your widget." -ForegroundColor Gray
    Write-Host "  Empty = captcha disabled." -ForegroundColor Gray
    $script:TURNSTILE_SECRET_KEY = Read-Host "TURNSTILE_SECRET_KEY (leave empty to disable captcha)"
    if ([string]::IsNullOrWhiteSpace($script:TURNSTILE_SECRET_KEY)) {
        $script:TURNSTILE_SECRET_KEY = ""
        Write-Host "[INFO] Turnstile skipped - login without captcha" -ForegroundColor Cyan
    } else {
        Write-Host "[OK] Turnstile secret will be set" -ForegroundColor Green
    }
    Write-Host "  Site Key (public, for frontend) from same Turnstile widget." -ForegroundColor Gray
    $rawSiteKey = Read-Host "TURNSTILE_SITE_KEY (leave empty if captcha disabled)"
    $script:TURNSTILE_SITE_KEY = if ([string]::IsNullOrWhiteSpace($rawSiteKey)) { "" } else { ($rawSiteKey -replace "[\r\n]+", "").Trim() }

    # Backend API URL (PRODUCTION only - known after first deploy)
    Set-Variable -Name API_URL -Value "" -Scope Script
    if ($script:EnvPrefix -eq "PROD_") {
        Write-Host ""
        Write-Host "Backend API URL" -ForegroundColor Yellow
        Write-Host "  Format: https://open-lance-backend.your-subdomain.workers.dev" -ForegroundColor Gray
        Write-Host "  Leave empty on FIRST deploy - URL will be detected automatically." -ForegroundColor Gray
        Write-Host "  On subsequent deploys, paste the URL from Cloudflare dashboard." -ForegroundColor Gray
        $apiUrlInput = Read-Host "Backend API URL (leave empty to auto-detect after deploy)"
        if (-not [string]::IsNullOrWhiteSpace($apiUrlInput)) {
            Set-Variable -Name API_URL -Value ($apiUrlInput.Trim()) -Scope Script
            Write-Host "[OK] Backend API URL configured." -ForegroundColor Green
        }
    }

    # Generate JWT Secret
    Write-Info "Generating JWT secret..."
    $jwtScript = Join-Path $env:TEMP "deploy-jwt-$(Get-Random).js"
    $jsCode = "console.log(require(" + [char]39 + "crypto" + [char]39 + ").randomBytes(32).toString(" + [char]39 + "hex" + [char]39 + "));"
    Set-Content -Path $jwtScript -Value $jsCode -Encoding UTF8 -NoNewline
    $script:JWT_SECRET = ( & node $jwtScript ).ToString().Trim()
    Remove-Item $jwtScript -Force -ErrorAction SilentlyContinue

    # Save configuration
    $newConfig = @{}
    $envDataPath = Join-Path $ProjectRoot ".env"
    if (Test-Path $envDataPath) {
        Get-Content $envDataPath | Where-Object { $_ -match "=" -and $_ -notmatch "^\s*#" } | ForEach-Object {
            $parts = $_ -split "=", 2
            $newConfig[($parts[0].Trim())] = ($parts[1].Trim())
        }
    }

    # Update unprefixed (active) config
    $newConfig["Environment"] = "`"$Environment`""
    if ($MONGODB_URI) { $newConfig["MONGODB_URI"] = "`"$MONGODB_URI`"" }
    if ($MONGODB_DATABASE) { $newConfig["MONGODB_DATABASE"] = "`"$MONGODB_DATABASE`"" }
    if ($FRONTEND_URL) { $newConfig["FRONTEND_URL"] = "`"$FRONTEND_URL`"" }
    if ($JWT_SECRET) { $newConfig["JWT_SECRET"] = "`"$JWT_SECRET`"" }
    if ($MONGODB_API_KEY) { $newConfig["MONGODB_API_KEY"] = "`"$MONGODB_API_KEY`"" }
    if ($EMAILJS_PUBLIC_KEY) { $newConfig["EMAILJS_PUBLIC_KEY"] = "`"$EMAILJS_PUBLIC_KEY`"" }
    if ($EMAILJS_SERVICE_ID) { $newConfig["EMAILJS_SERVICE_ID"] = "`"$EMAILJS_SERVICE_ID`"" }
    if ($EMAILJS_TEMPLATE_ID) { $newConfig["EMAILJS_TEMPLATE_ID"] = "`"$EMAILJS_TEMPLATE_ID`"" }
    if ($EMAILJS_PRIVATE_KEY) { $newConfig["EMAILJS_PRIVATE_KEY"] = "`"$EMAILJS_PRIVATE_KEY`"" }
    if ($script:TURNSTILE_SECRET_KEY) { $newConfig["TURNSTILE_SECRET_KEY"] = "`"$script:TURNSTILE_SECRET_KEY`"" }
    if ($script:TURNSTILE_SITE_KEY) { $newConfig["TURNSTILE_SITE_KEY"] = "`"$script:TURNSTILE_SITE_KEY`"" }

    # Save prefixed config for persistence
    $newConfig["$($script:EnvPrefix)Environment"] = "`"$Environment`""
    if ($MONGODB_URI) { $newConfig["$($script:EnvPrefix)MONGODB_URI"] = "`"$MONGODB_URI`"" }
    if ($MONGODB_DATABASE) { $newConfig["$($script:EnvPrefix)MONGODB_DATABASE"] = "`"$MONGODB_DATABASE`"" }
    if ($FRONTEND_URL) { $newConfig["$($script:EnvPrefix)FRONTEND_URL"] = "`"$FRONTEND_URL`"" }
    if ($JWT_SECRET) { $newConfig["$($script:EnvPrefix)JWT_SECRET"] = "`"$JWT_SECRET`"" }
    if ($MONGODB_API_KEY) { $newConfig["$($script:EnvPrefix)MONGODB_API_KEY"] = "`"$MONGODB_API_KEY`"" }
    if ($EMAILJS_PUBLIC_KEY) { $newConfig["$($script:EnvPrefix)EMAILJS_PUBLIC_KEY"] = "`"$EMAILJS_PUBLIC_KEY`"" }
    if ($EMAILJS_SERVICE_ID) { $newConfig["$($script:EnvPrefix)EMAILJS_SERVICE_ID"] = "`"$EMAILJS_SERVICE_ID`"" }
    if ($EMAILJS_TEMPLATE_ID) { $newConfig["$($script:EnvPrefix)EMAILJS_TEMPLATE_ID"] = "`"$EMAILJS_TEMPLATE_ID`"" }
    if ($EMAILJS_PRIVATE_KEY) { $newConfig["$($script:EnvPrefix)EMAILJS_PRIVATE_KEY"] = "`"$EMAILJS_PRIVATE_KEY`"" }
    if ($null -ne $script:TURNSTILE_SECRET_KEY) { $newConfig["TURNSTILE_SECRET_KEY"] = "`"$script:TURNSTILE_SECRET_KEY`"" }
    if ($null -ne $script:TURNSTILE_SITE_KEY) { $newConfig["TURNSTILE_SITE_KEY"] = "`"$script:TURNSTILE_SITE_KEY`"" }
    # DEV and PROD Turnstile keys stored separately; active one loaded by profile choice
    $existingDevTurnstile = $newConfig["DEV_TURNSTILE_SECRET_KEY"]
    $existingProdTurnstile = $newConfig["PROD_TURNSTILE_SECRET_KEY"]
    $existingDevTurnstileSite = $newConfig["DEV_TURNSTILE_SITE_KEY"]
    $existingProdTurnstileSite = $newConfig["PROD_TURNSTILE_SITE_KEY"]
    if ($script:EnvPrefix -eq "PROD_") {
        $newConfig["PROD_TURNSTILE_SECRET_KEY"] = "`"$script:TURNSTILE_SECRET_KEY`""
        if ($existingDevTurnstile) { $newConfig["DEV_TURNSTILE_SECRET_KEY"] = $existingDevTurnstile } else { $newConfig["DEV_TURNSTILE_SECRET_KEY"] = "`"`"" }
        $newConfig["PROD_TURNSTILE_SITE_KEY"] = "`"$script:TURNSTILE_SITE_KEY`""
        if ($existingDevTurnstileSite) { $newConfig["DEV_TURNSTILE_SITE_KEY"] = $existingDevTurnstileSite } else { $newConfig["DEV_TURNSTILE_SITE_KEY"] = "`"`"" }
    } else {
        $newConfig["DEV_TURNSTILE_SECRET_KEY"] = "`"$script:TURNSTILE_SECRET_KEY`""
        if ($existingProdTurnstile) { $newConfig["PROD_TURNSTILE_SECRET_KEY"] = $existingProdTurnstile } else { $newConfig["PROD_TURNSTILE_SECRET_KEY"] = "`"`"" }
        $newConfig["DEV_TURNSTILE_SITE_KEY"] = "`"$script:TURNSTILE_SITE_KEY`""
        if ($existingProdTurnstileSite) { $newConfig["PROD_TURNSTILE_SITE_KEY"] = $existingProdTurnstileSite } else { $newConfig["PROD_TURNSTILE_SITE_KEY"] = "`"`"" }
    }
    if ($script:API_URL) { $newConfig["$($script:EnvPrefix)API_URL"] = "`"$script:API_URL`"" }

    $configContent = "# Open-Lance Deployment Configuration v3.0`n`n"
    $configContent += "### Active Configuration (Used by Backend) ###`n"
    foreach ($key in $newConfig.Keys | Where-Object { $_ -notmatch "^(DEV_|PROD_)" } | Sort-Object) {
        $configContent += "$key=$($newConfig[$key])`n"
    }
    $configContent += "`n### DEVELOPMENT Profile ###`n"
    foreach ($key in $newConfig.Keys | Where-Object { $_ -match "^DEV_" } | Sort-Object) {
        $configContent += "$key=$($newConfig[$key])`n"
    }
    $configContent += "`n### PRODUCTION Profile ###`n"
    foreach ($key in $newConfig.Keys | Where-Object { $_ -match "^PROD_" } | Sort-Object) {
        $configContent += "$key=$($newConfig[$key])`n"
    }

    $configContent | Out-File -FilePath $configFile -Encoding UTF8
    Write-Success "Configuration saved to .env (Active and $script:EnvPrefix profile)"

    $gitignorePath = Join-Path $ProjectRoot ".gitignore"
    if (Test-Path $gitignorePath) {
        $gitignoreContent = Get-Content $gitignorePath -Raw
        if ($gitignoreContent -notmatch "^\.env$") {
            Add-Content -Path $gitignorePath -Value "`n.env"
        }
    }
}

###############################################################################
# Deploy Backend
###############################################################################

function Deploy-Backend {
    Write-Header "Deploying Backend (Cloudflare Workers)"

    $backendDir = Join-Path $ProjectRoot "backend"
    Set-Location $backendDir

    Write-Info "Installing backend dependencies..."
    npm install

    if ($Environment -eq "local") {
        Write-Info "Setting local secrets in .dev.vars for local testing..."

        $devVarsContent = @"
MONGODB_URI="$MONGODB_URI"
JWT_SECRET="$JWT_SECRET"
"@
        if (-not [string]::IsNullOrWhiteSpace($script:FRONTEND_URL) -and $script:FRONTEND_URL -ne "*") {
            $devVarsContent += "`nFRONTEND_URL=`"$($script:FRONTEND_URL)`""
        }
        if (-not [string]::IsNullOrWhiteSpace($script:TURNSTILE_SECRET_KEY)) {
            $devVarsContent += "`nTURNSTILE_SECRET_KEY=`"$($script:TURNSTILE_SECRET_KEY)`""
        }
        $devVarsContent | Out-File -FilePath ".dev.vars" -Encoding UTF8
        Write-Host "[OK] Local secrets configured in .dev.vars" -ForegroundColor Green

        $script:API_URL = "http://127.0.0.1:8787"
        Write-Success "Local backend configured successfully"
        Write-Info "Local Worker URL: $API_URL"

        $configFile = Join-Path $ProjectRoot ".env"
        $envContent = Get-Content -Path $configFile -Raw
        if ($envContent -match "(?m)^API_URL=.*$") {
            $envContent = $envContent -replace "(?m)^API_URL=.*$", "API_URL=`"$API_URL`""
            $envContent | Out-File -FilePath $configFile -Encoding UTF8
        } else {
            Add-Content -Path $configFile -Value "`nAPI_URL=`"$API_URL`""
        }

        Set-Location $ProjectRoot
        return $true
    }

    Write-Info "Setting Cloudflare Workers secrets..."

    $hasEmailJS = (-not [string]::IsNullOrWhiteSpace($EMAILJS_PUBLIC_KEY) -and
                    -not [string]::IsNullOrWhiteSpace($EMAILJS_SERVICE_ID) -and
                    -not [string]::IsNullOrWhiteSpace($EMAILJS_TEMPLATE_ID) -and
                    -not [string]::IsNullOrWhiteSpace($EMAILJS_PRIVATE_KEY))

    if ($hasEmailJS) {
        Write-Info "EmailJS configuration detected - will install EmailJS secrets to Cloudflare Workers"
    } else {
        Write-WarningMsg "EmailJS not configured - skipping EmailJS secrets (emails will use fallback mode)"
    }

    # MongoDB URI
    Write-Info "Setting MONGODB_URI secret..."
    $tempMongoParams = Join-Path $env:TEMP "mongodb_uri.txt"
    [IO.File]::WriteAllText($tempMongoParams, $MONGODB_URI)
    $secretResult1 = cmd.exe /c "wrangler secret put MONGODB_URI < ""$tempMongoParams""" 2>&1
    Remove-Item $tempMongoParams -ErrorAction SilentlyContinue
    if ($secretResult1 -match "error|failed" -and $secretResult1 -notmatch "Created|Updated") {
        Write-ErrorMsg "Failed to set MONGODB_URI secret"
        Write-Host $secretResult1
        exit 1
    }
    Write-Host "[OK] MONGODB_URI secret set" -ForegroundColor Green

    if (-not [string]::IsNullOrWhiteSpace($MONGODB_API_KEY)) {
        Write-Info "Setting MONGODB_API_KEY secret..."
        $tempMongoApiKey = Join-Path $env:TEMP "mongodb_api_key.txt"
        [IO.File]::WriteAllText($tempMongoApiKey, $MONGODB_API_KEY)
        $secretResultMongoApi = cmd.exe /c "wrangler secret put MONGODB_API_KEY < ""$tempMongoApiKey""" 2>&1
        Remove-Item $tempMongoApiKey -ErrorAction SilentlyContinue
        if ($secretResultMongoApi -match "error|failed" -and $secretResultMongoApi -notmatch "Created|Updated") {
            Write-Host "[WARN] Failed to set MONGODB_API_KEY secret" -ForegroundColor Yellow
        } else {
            Write-Host "[OK] MONGODB_API_KEY secret set" -ForegroundColor Green
        }
    }

    # JWT Secret
    Write-Info "Setting JWT_SECRET secret..."
    $tempJwtParams = Join-Path $env:TEMP "jwt_secret.txt"
    [IO.File]::WriteAllText($tempJwtParams, $JWT_SECRET)
    $secretResult2 = cmd.exe /c "wrangler secret put JWT_SECRET < ""$tempJwtParams""" 2>&1
    Remove-Item $tempJwtParams -ErrorAction SilentlyContinue
    if ($secretResult2 -match "error|failed" -and $secretResult2 -notmatch "Created|Updated") {
        Write-ErrorMsg "Failed to set JWT_SECRET secret"
        Write-Host $secretResult2
        exit 1
    }
    Write-Host "[OK] JWT_SECRET secret set" -ForegroundColor Green

    # FRONTEND_URL (for verification links in emails; GitHub Pages needs full URL with path)
    if (-not [string]::IsNullOrWhiteSpace($script:FRONTEND_URL) -and $script:FRONTEND_URL -ne "*") {
        Write-Info "Setting FRONTEND_URL secret..."
        $tempFrontendUrl = Join-Path $env:TEMP "frontend_url.txt"
        [IO.File]::WriteAllText($tempFrontendUrl, $script:FRONTEND_URL.Trim())
        $secretResultFrontend = cmd.exe /c "wrangler secret put FRONTEND_URL < ""$tempFrontendUrl""" 2>&1
        Remove-Item $tempFrontendUrl -ErrorAction SilentlyContinue
        if ($secretResultFrontend -match "error|failed" -and $secretResultFrontend -notmatch "Created|Updated") {
            Write-WarningMsg "Failed to set FRONTEND_URL secret"
        } else {
            Write-Host "[OK] FRONTEND_URL secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] FRONTEND_URL not set or is * (verification links will use request Origin)" -ForegroundColor Gray
    }

    if (-not [string]::IsNullOrWhiteSpace($EMAILJS_PUBLIC_KEY)) {
        Write-Info "Setting EMAILJS_PUBLIC_KEY secret..."
        $tempEmailJSPublicKey = Join-Path $env:TEMP "emailjs_public_key.txt"
        [IO.File]::WriteAllText($tempEmailJSPublicKey, $EMAILJS_PUBLIC_KEY)
        $secretResult3 = cmd.exe /c "wrangler secret put EMAILJS_PUBLIC_KEY < ""$tempEmailJSPublicKey""" 2>&1
        Remove-Item $tempEmailJSPublicKey -ErrorAction SilentlyContinue
        if ($secretResult3 -match "error|failed" -and $secretResult3 -notmatch "Created|Updated") {
            Write-ErrorMsg "Failed to set EMAILJS_PUBLIC_KEY secret"
        } else {
            Write-Host "[OK] EMAILJS_PUBLIC_KEY secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] EMAILJS_PUBLIC_KEY not configured (skipping)" -ForegroundColor Gray
    }

    if (-not [string]::IsNullOrWhiteSpace($EMAILJS_SERVICE_ID)) {
        Write-Info "Setting EMAILJS_SERVICE_ID secret..."
        $tempEmailJSServiceId = Join-Path $env:TEMP "emailjs_service_id.txt"
        [IO.File]::WriteAllText($tempEmailJSServiceId, $EMAILJS_SERVICE_ID)
        $secretResult4 = cmd.exe /c "wrangler secret put EMAILJS_SERVICE_ID < ""$tempEmailJSServiceId""" 2>&1
        Remove-Item $tempEmailJSServiceId -ErrorAction SilentlyContinue
        if ($secretResult4 -match "error|failed" -and $secretResult4 -notmatch "Created|Updated") {
            Write-ErrorMsg "Failed to set EMAILJS_SERVICE_ID secret"
        } else {
            Write-Host "[OK] EMAILJS_SERVICE_ID secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] EMAILJS_SERVICE_ID not configured (skipping)" -ForegroundColor Gray
    }

    if (-not [string]::IsNullOrWhiteSpace($EMAILJS_TEMPLATE_ID)) {
        Write-Info "Setting EMAILJS_TEMPLATE_ID secret..."
        $tempEmailJSTemplateId = Join-Path $env:TEMP "emailjs_template_id.txt"
        [IO.File]::WriteAllText($tempEmailJSTemplateId, $EMAILJS_TEMPLATE_ID)
        $secretResult5 = cmd.exe /c "wrangler secret put EMAILJS_TEMPLATE_ID < ""$tempEmailJSTemplateId""" 2>&1
        Remove-Item $tempEmailJSTemplateId -ErrorAction SilentlyContinue
        if ($secretResult5 -match "error|failed" -and $secretResult5 -notmatch "Created|Updated") {
            Write-ErrorMsg "Failed to set EMAILJS_TEMPLATE_ID secret"
        } else {
            Write-Host "[OK] EMAILJS_TEMPLATE_ID secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] EMAILJS_TEMPLATE_ID not configured (skipping)" -ForegroundColor Gray
    }

    if (-not [string]::IsNullOrWhiteSpace($EMAILJS_PRIVATE_KEY)) {
        Write-Info "Setting EMAILJS_PRIVATE_KEY secret..."
        $tempEmailJSPrivateKey = Join-Path $env:TEMP "emailjs_private_key.txt"
        [IO.File]::WriteAllText($tempEmailJSPrivateKey, $EMAILJS_PRIVATE_KEY)
        $secretResult6 = cmd.exe /c "wrangler secret put EMAILJS_PRIVATE_KEY < ""$tempEmailJSPrivateKey""" 2>&1
        Remove-Item $tempEmailJSPrivateKey -ErrorAction SilentlyContinue
        if ($secretResult6 -match "error|failed" -and $secretResult6 -notmatch "Created|Updated") {
            Write-ErrorMsg "Failed to set EMAILJS_PRIVATE_KEY secret"
        } else {
            Write-Host "[OK] EMAILJS_PRIVATE_KEY secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] EMAILJS_PRIVATE_KEY not configured (skipping)" -ForegroundColor Gray
    }

    # Turnstile (captcha)
    if (-not [string]::IsNullOrWhiteSpace($script:TURNSTILE_SECRET_KEY)) {
        Write-Info "Setting TURNSTILE_SECRET_KEY secret..."
        $tempTurnstileSecret = Join-Path $env:TEMP "turnstile_secret.txt"
        [IO.File]::WriteAllText($tempTurnstileSecret, $script:TURNSTILE_SECRET_KEY)
        $secretResultTurnstile = cmd.exe /c "wrangler secret put TURNSTILE_SECRET_KEY < ""$tempTurnstileSecret""" 2>&1
        Remove-Item $tempTurnstileSecret -ErrorAction SilentlyContinue
        if ($secretResultTurnstile -match "error|failed" -and $secretResultTurnstile -notmatch "Created|Updated") {
            Write-WarningMsg "Failed to set TURNSTILE_SECRET_KEY secret"
        } else {
            Write-Host "[OK] TURNSTILE_SECRET_KEY secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] TURNSTILE_SECRET_KEY not configured (login captcha disabled)" -ForegroundColor Gray
    }

    if ($hasEmailJS) {
        Write-Host ""
        Write-Success "All EmailJS secrets have been installed to Cloudflare Workers"
        Write-Info "Email verification emails will be sent via EmailJS"
    } else {
        Write-Host ""
        Write-WarningMsg "EmailJS not configured - verification links will be logged to Cloudflare Workers logs"
        Write-Info "To enable EmailJS, run deployment script again and configure EmailJS"
    }

    Write-Info "Deploying Cloudflare Worker..."
    $prevErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $deployOutput = wrangler deploy 2>&1 | Out-String
    $ErrorActionPreference = $prevErrorActionPreference
    Write-Host $deployOutput

    if ($deployOutput -match "register a workers\.dev subdomain") {
        Write-Host ""
        Write-Host "ERROR: Workers.dev Subdomain Not Registered!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Steps:" -ForegroundColor Cyan
        Write-Host "1. Open: https://dash.cloudflare.com" -ForegroundColor White
        Write-Host "2. Go to Workers -> Onboarding and register a subdomain" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        exit 1
    }

    if ($deployOutput -match "error|failed|Error:" -and $deployOutput -notmatch "Deployed|Uploaded") {
        Write-ErrorMsg "Deployment failed!"
        exit 1
    }

    if ($deployOutput -match "https://[a-zA-Z0-9.-]+\.workers\.dev") {
        $script:API_URL = $Matches[0]
        Write-Success "Backend deployed successfully"
        Write-Info "Worker URL: $API_URL"
    } else {
        $script:API_URL = "https://open-lance-backend.your-subdomain.workers.dev"
        Write-Success "Backend deployment completed"
        Write-WarningMsg "Could not automatically detect Worker URL"
        Write-Info "Expected URL format: $API_URL"
    }

    # Save API_URL to .env
    $configFile = Join-Path $ProjectRoot ".env"
    $rebuildConfig = @{}
    if (Test-Path $configFile) {
        Get-Content $configFile | Where-Object { $_ -match "=" -and $_ -notmatch "^\s*#" } | ForEach-Object {
            $parts = $_ -split "=", 2
            $rebuildConfig[($parts[0].Trim())] = ($parts[1].Trim())
        }
    }
    $rebuildConfig["API_URL"] = "`"$API_URL`""
    $rebuildConfig["PROD_API_URL"] = "`"$API_URL`""

    $configContent = "# Open-Lance Deployment Configuration v3.0`n`n"
    $configContent += "### Active Configuration (Used by Backend) ###`n"
    foreach ($key in $rebuildConfig.Keys | Where-Object { $_ -notmatch "^(DEV_|PROD_)" } | Sort-Object) {
        $configContent += "$key=$($rebuildConfig[$key])`n"
    }
    $configContent += "`n### DEVELOPMENT Profile ###`n"
    foreach ($key in $rebuildConfig.Keys | Where-Object { $_ -match "^DEV_" } | Sort-Object) {
        $configContent += "$key=$($rebuildConfig[$key])`n"
    }
    $configContent += "`n### PRODUCTION Profile ###`n"
    foreach ($key in $rebuildConfig.Keys | Where-Object { $_ -match "^PROD_" } | Sort-Object) {
        $configContent += "$key=$($rebuildConfig[$key])`n"
    }
    $configContent | Out-File -FilePath $configFile -Encoding UTF8
    Write-Success "PROD_API_URL saved to .env: $API_URL"

    Set-Location $ProjectRoot
    return $true
}

###############################################################################
# Configure Frontend
###############################################################################

function Set-FrontendConfig {
    Write-Header "Configuring Frontend"

    Write-Info "Updating frontend configuration..."

    # Sanitize for use inside JS single-quoted string: one line, no newlines, escape \ and '
    function Get-SafeJsString {
        param([string]$Raw)
        if ([string]::IsNullOrEmpty($Raw)) { return "" }
        $s = $Raw -replace "[\r\n]+", "" -replace "\\", "\\\\" -replace "'", "\'" -replace "`"", "\`""
        $s.Trim()
    }

    $rawEnv = if ($script:Environment) { $script:Environment } else { $Environment }
    $rawApi = if ($script:API_URL) { $script:API_URL } else { $API_URL }
    $rawTurnstile = if ($script:TURNSTILE_SITE_KEY) { $script:TURNSTILE_SITE_KEY } else { "" }

    $envVal = Get-SafeJsString -Raw $rawEnv
    if ([string]::IsNullOrWhiteSpace($envVal)) { $envVal = "development" }

    $apiUrlVal = Get-SafeJsString -Raw $rawApi
    if ([string]::IsNullOrWhiteSpace($apiUrlVal)) { $apiUrlVal = "http://127.0.0.1:8787" }

    $turnstileSiteKeyVal = Get-SafeJsString -Raw $rawTurnstile

    # Build config.js with explicit newlines only where intended (avoid any stray CR/LF in literals)
    $q = [char]39
    $nl = "`n"
    $configContent = "// Configuration for Open-Lance v3.0 (Cloudflare Workers + MongoDB Atlas)" + $nl +
        "const CONFIG = {" + $nl +
        "    ENV: " + $q + $envVal + $q + "," + $nl +
        "    API: {" + $nl +
        "        development: { baseURL: " + $q + $apiUrlVal + $q + " }," + $nl +
        "        production: { baseURL: " + $q + $apiUrlVal + $q + " }" + $nl +
        "    }," + $nl +
        "    SETTINGS: { maxContactLinks: 10, defaultPageSize: 20, retryAttempts: 3, retryDelay: 1000 }," + $nl +
        "    turnstileSiteKey: " + $q + $turnstileSiteKeyVal + $q + $nl +
        "};" + $nl +
        "function getConfig() {" + $nl +
        "    const env = CONFIG.ENV || " + $q + "development" + $q + ";" + $nl +
        "    let fallbackURL = " + $q + $apiUrlVal + $q + ";" + $nl +
        "    if (env === " + $q + "local" + $q + " || env === " + $q + "development" + $q + ") fallbackURL = " + $q + "http://127.0.0.1:8787" + $q + ";" + $nl +
        "    const apiConfig = CONFIG.API[env] || { baseURL: fallbackURL };" + $nl +
        "    return { apiBaseURL: apiConfig.baseURL, ...CONFIG.SETTINGS, turnstileSiteKey: CONFIG.turnstileSiteKey || " + $q + $q + " };" + $nl +
        "}" + $nl +
        "window.APP_CONFIG = getConfig();"

    $configPath = Join-Path $ProjectRoot "docs\js\config.js"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($configPath, $configContent, $utf8NoBom)

    Write-Success "Frontend configured successfully"
}

###############################################################################
# Test Deployment
###############################################################################

function Test-Deployment {
    Write-Header "Testing Deployment"

    Write-Info "Testing backend health..."

    $TestingUrl = if ($Environment -eq "local") { "http://127.0.0.1:8787" } else { $API_URL }

    try {
        $testData = @{ email = "test@example.com"; password = "TestPass123!" } | ConvertTo-Json

        if ($Environment -eq "local") {
            Write-WarningMsg "Skipping automated API request test for local environment because server might not be running yet."
        } else {
            $response = Invoke-WebRequest -Uri "$TestingUrl/auth/register" `
                -Method POST `
                -Headers @{"Content-Type"="application/json"} `
                -Body $testData `
                -UseBasicParsing `
                -ErrorAction SilentlyContinue

            if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 400) {
                Write-Success "Backend is responding correctly"
                Write-Info "Test registration: HTTP $($response.StatusCode)"
            }
        }
    }
    catch {
        Write-WarningMsg "Backend may not be fully ready"
    }
}

###############################################################################
# Print Summary
###############################################################################

function Write-Summary {
    Write-Header "Deployment Summary"

    Write-Host ""
    Write-Host "Environment:          $Environment"
    if ($Environment -eq "local") {
        Write-Host "Platform:             Local Development (.dev.vars)"
    } else {
        Write-Host "Platform:             Cloudflare Workers (Edge)"
    }
    Write-Host "Database:             MongoDB Atlas"
    Write-Host "MongoDB Database:     $MONGODB_DATABASE"
    Write-Host ""
    Write-Host "Worker URL:           $API_URL"
    Write-Host "Frontend URL:         $FRONTEND_URL"
    Write-Host ""

    Write-Header "Next Steps"

    Write-Host ""
    Write-Host "1. Test backend:" -ForegroundColor Cyan
    Write-Host "   Test the API endpoint at: $API_URL/auth/register" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test frontend locally:" -ForegroundColor Cyan
    Write-Host "   Use scripts\start_dev.bat or start_dev.ps1 to start both servers" -ForegroundColor Gray
    Write-Host "   Open http://localhost:8080" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Check MongoDB Atlas:" -ForegroundColor Cyan
    Write-Host "   https://cloud.mongodb.com/" -ForegroundColor Gray
    Write-Host "   Database -> Browse Collections -> open-lance" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Deploy to Cloudflare Pages (or GitHub Pages):" -ForegroundColor Cyan
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m `"Deploy Open-Lance v3.0`"" -ForegroundColor Gray
    Write-Host "   git push origin main" -ForegroundColor Gray
    Write-Host "   Or use: wrangler pages deploy docs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Monitor:" -ForegroundColor Cyan
    Write-Host "   Cloudflare Dashboard: https://dash.cloudflare.com/" -ForegroundColor Gray
    Write-Host "   Workers Logs: wrangler tail" -ForegroundColor Gray
    Write-Host "   MongoDB Atlas: Cluster -> Metrics" -ForegroundColor Gray
    Write-Host ""

    Write-Success "Deployment completed successfully!"
    Write-Info "For more information, see:"
    Write-Host "  - MONGODB_ATLAS_SETUP.md" -ForegroundColor Gray
    Write-Host "  - DEPLOYMENT.md" -ForegroundColor Gray
}

###############################################################################
# Main Deployment Flow
###############################################################################

function Main {
    Write-Header "Open-Lance Deployment Script v3.0"

    Write-Host "`nThis script will deploy Open-Lance with Cloudflare Workers + MongoDB Atlas`n"
    Write-Host "Changes in v3.0:" -ForegroundColor Cyan
    Write-Host "  + Cloudflare Workers (Edge computing, global)" -ForegroundColor Green
    Write-Host "  + MongoDB Atlas (cloud database)" -ForegroundColor Green
    Write-Host "  + No AWS required" -ForegroundColor Green
    Write-Host "  + Simpler deployment" -ForegroundColor Green
    Write-Host ""
    $continue = Read-Host "Continue? (y/n)"

    if ($continue -ne "y") {
        Write-Info "Deployment cancelled"
        exit 0
    }

    Test-Prerequisites
    Get-DeploymentConfig

    if (-not $SkipBackend) {
        $backendSuccess = Deploy-Backend
        if (-not $backendSuccess) {
            Write-ErrorMsg "Backend deployment failed"
            exit 1
        }
    }

    Set-FrontendConfig
    Test-Deployment
    Write-Summary
}

# Run main function
Main
