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
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

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
    Write-Host "Changes in v3.0:"
    Write-Host "    - Cloudflare Workers (Edge computing)"
    Write-Host "    - MongoDB Atlas (cloud database)"
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
            # Verify authentication worked
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
    
    # Target Environment Selection
    Write-Host ""
    Write-Host "Select Target Environment:" -ForegroundColor Cyan
    Write-Host "1) Local Testing (generates .dev.vars for use with start_dev scripts)" -ForegroundColor White
    Write-Host "2) Cloudflare Workers (deploys to cloud)" -ForegroundColor White
    
    do {
        $envChoice = Read-Host "Choose an option (1 or 2)"
    } until ($envChoice -match "^[12]$")
    
    if ($envChoice -eq "1") {
        $script:Environment = "local"
    } else {
        $script:Environment = "dev" # Default for cloud
        # If cloud deployment is selected, we MUST check auth
        Test-CloudflareAuth
    }

    if (Test-Path $configFile) {
        Write-Info "Found existing configuration in .env"
        # Grab raw content for replacement later
        $envContent = Get-Content $configFile -Raw
        
        # Parse .env file
        $envData = Get-Content $configFile | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
            $parts = $_ -split '=', 2
            @{ ($parts[0].Trim()) = ($parts[1].Trim()) }
        }
        
        $envVars = @{}
        foreach ($item in $envData) {
            foreach ($key in $item.Keys) {
                # Remove quotes if present
                $val = $item[$key]
                if ($val -match "^`"(.*)`"$") { $val = $Matches[1] }
                elseif ($val -match "^'(.*)'$") { $val = $Matches[1] }
                $envVars[$key] = $val
            }
        }
        
        # Restore user's choice (don't let the saved config override what they just selected)
        if ($envChoice -eq "1") {
            $script:Environment = "local"
        } else {
            $script:Environment = "dev"
        }
        
        $script:MONGODB_URI = if ($envVars.ContainsKey('MONGODB_URI')) { $envVars['MONGODB_URI'] } else { $null }
        $script:MONGODB_DATABASE = if ($envVars.ContainsKey('MONGODB_DATABASE')) { $envVars['MONGODB_DATABASE'] } else { $null }
        $script:FRONTEND_URL = if ($envVars.ContainsKey('FRONTEND_URL')) { $envVars['FRONTEND_URL'] } else { $null }
        $script:JWT_SECRET = if ($envVars.ContainsKey('JWT_SECRET')) { $envVars['JWT_SECRET'] } else { $null }
        $script:API_URL = if ($envVars.ContainsKey('API_URL')) { $envVars['API_URL'] } else { $null }
        $script:MONGODB_API_KEY = if ($envVars.ContainsKey('MONGODB_API_KEY')) { $envVars['MONGODB_API_KEY'] } else { $null }
        $script:EMAILJS_PUBLIC_KEY = if ($envVars.ContainsKey('EMAILJS_PUBLIC_KEY')) { $envVars['EMAILJS_PUBLIC_KEY'] } else { $null }
        $script:EMAILJS_SERVICE_ID = if ($envVars.ContainsKey('EMAILJS_SERVICE_ID')) { $envVars['EMAILJS_SERVICE_ID'] } else { $null }
        $script:EMAILJS_TEMPLATE_ID = if ($envVars.ContainsKey('EMAILJS_TEMPLATE_ID')) { $envVars['EMAILJS_TEMPLATE_ID'] } else { $null }
        $script:EMAILJS_PRIVATE_KEY = if ($envVars.ContainsKey('EMAILJS_PRIVATE_KEY')) { $envVars['EMAILJS_PRIVATE_KEY'] } else { $null }
        
        if ($envChoice -eq "1") {
            # For local testing, silently use existing config (to generate .dev.vars)
            Write-Info "Using existing configuration for local testing secrets."
            
            # Keep existing config but update the Environment variable in .env
            $updatedEnvContent = $envContent -replace 'Environment=["\u0027]?dev["\u0027]?', 'Environment="local"'
            $updatedEnvContent | Out-File -FilePath $configFile -Encoding UTF8
            return
        } else {
            $useExisting = Read-Host "Use existing configuration? (y/n)"
            if ($useExisting -ne "y") {
                # Clear all loaded variables so the script actually prompts for them
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
                Set-DeploymentConfig
            } else {
                # Keep existing config but update the Environment variable in .env
                $updatedEnvContent = $envContent -replace 'Environment=["\u0027]?local["\u0027]?', 'Environment="dev"'
                $updatedEnvContent | Out-File -FilePath $configFile -Encoding UTF8
                
                # Check and report EmailJS configuration status
                Write-Host ""
                if (-not [string]::IsNullOrWhiteSpace($script:EMAILJS_PUBLIC_KEY) -and 
                    -not [string]::IsNullOrWhiteSpace($script:EMAILJS_SERVICE_ID) -and 
                    -not [string]::IsNullOrWhiteSpace($script:EMAILJS_TEMPLATE_ID) -and 
                    -not [string]::IsNullOrWhiteSpace($script:EMAILJS_PRIVATE_KEY)) {
                    Write-Success "EmailJS configuration found in .env - will be installed to Cloudflare Workers"
                } else {
                    Write-WarningMsg "EmailJS not fully configured in .env - emails will use fallback mode (links in logs)"
                }
                return
            }
        }
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
    Write-Host "If you haven't set up MongoDB Atlas yet, see: DEPLOYMENT.md" -ForegroundColor Gray
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
    
    # Frontend URL
    $script:FRONTEND_URL = Read-Host "Frontend URL (e.g., https://open-lance.pages.dev) [*]"
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
    Write-Host "     Service ID is the identifier of the email account you connected to EmailJS" -ForegroundColor Gray
    Write-Host "     (e.g., your Gmail or Yandex). It tells the service which account to use for sending." -ForegroundColor Gray
    Write-Host "     To find Service ID:" -ForegroundColor Gray
    Write-Host "     - Go to your EmailJS account" -ForegroundColor Gray
    Write-Host "     - In the left sidebar, select the first item - 'Email Services'" -ForegroundColor Gray
    Write-Host "     - You'll see a card of your connected email service (e.g., with Gmail logo)" -ForegroundColor Gray
    Write-Host "     - In this card, right under the name (e.g., 'Gmail'), you'll see 'Service ID'" -ForegroundColor Gray
    Write-Host "     - It usually looks like 'service_xxxxxxx'" -ForegroundColor Gray
    Write-Host "     - Click the copy icon next to this ID" -ForegroundColor Gray
    Write-Host "  3. Create Email Template (use emailjs_template.html as reference)" -ForegroundColor Gray
    Write-Host "     Template ID is the unique identifier of the specific email template you created." -ForegroundColor Gray
    Write-Host "     It tells the service which design and variables (like {{verification_link}}) to use." -ForegroundColor Gray
    Write-Host "     To find Template ID:" -ForegroundColor Gray
    Write-Host "     - Go to your EmailJS account" -ForegroundColor Gray
    Write-Host "     - In the left sidebar, select 'Email Templates' (icon with paper sheet)" -ForegroundColor Gray
    Write-Host "     - You'll see a list of your templates. Find the one created for email verification" -ForegroundColor Gray
    Write-Host "     - Right under the template name (e.g., 'My Default Template'), you'll see 'ID'" -ForegroundColor Gray
    Write-Host "     - It usually looks like 'template_xxxxxxx'" -ForegroundColor Gray
    Write-Host "     - Click the copy icon next to this ID" -ForegroundColor Gray
    Write-Host "  4. Get Public Key:" -ForegroundColor Gray
    Write-Host "     - Go to your EmailJS dashboard" -ForegroundColor Gray
    Write-Host "     - Click on 'Account' in the left sidebar (bottom icon/tab)" -ForegroundColor Gray
    Write-Host "     - On the opened page, you'll see 'API Keys' section" -ForegroundColor Gray
    Write-Host "     - In 'Public Key' field you'll see a random string (usually starts with 'user_' or just letters)" -ForegroundColor Gray
    Write-Host "     - Click the 'Copy' icon next to the key" -ForegroundColor Gray
    Write-Host "  5. Get Private Key:" -ForegroundColor Gray
    Write-Host "     - In the same 'API Keys' section next to 'Public Key', you'll see 'Private Key'" -ForegroundColor Gray
    Write-Host "     - If it's empty, click 'Regenerate' and copy the resulting string" -ForegroundColor Gray
    Write-Host "     - Note: This is mandatory if API access from non-browser environments is strictly enabled" -ForegroundColor Gray
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
    
    # Generate JWT Secret
    Write-Info "Generating JWT secret..."
    $script:JWT_SECRET = & node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))'
    
    # Save configuration
    $configContent = @"
# Open-Lance Deployment Configuration v3.0 (Cloudflare Workers)
Environment="$Environment"
MONGODB_URI="$MONGODB_URI"
MONGODB_API_KEY="$MONGODB_API_KEY"
MONGODB_DATABASE="$MONGODB_DATABASE"
FRONTEND_URL="$FRONTEND_URL"
JWT_SECRET="$JWT_SECRET"
EMAILJS_PUBLIC_KEY="$EMAILJS_PUBLIC_KEY"
EMAILJS_SERVICE_ID="$EMAILJS_SERVICE_ID"
EMAILJS_TEMPLATE_ID="$EMAILJS_TEMPLATE_ID"
EMAILJS_PRIVATE_KEY="$EMAILJS_PRIVATE_KEY"
"@
    
    $configContent | Out-File -FilePath $configFile -Encoding UTF8
    Write-Success "Configuration saved to .env"
    
    # Check if .gitignore exists, .env is usually already in there
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
    
    # Install dependencies
    Write-Info "Installing backend dependencies..."
    npm install
    
    if ($Environment -eq "local") {
        Write-Info "Setting local secrets in .dev.vars for local testing..."
        
        $devVarsContent = @"
MONGODB_URI="$MONGODB_URI"
JWT_SECRET="$JWT_SECRET"
"@
        $devVarsContent | Out-File -FilePath ".dev.vars" -Encoding UTF8
        Write-Host "[OK] Local secrets configured in .dev.vars" -ForegroundColor Green
        
        # Determine local URL
        $script:API_URL = "http://127.0.0.1:8787"
        Write-Success "Local backend configured successfully"
        Write-Info "Local Worker URL: $API_URL"
        
        # Save to .env and exit (no need to deploy to Cloudflare)
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
    
    # Set Cloudflare Workers secrets
    Write-Info "Setting Cloudflare Workers secrets..."
    
    # Check EmailJS configuration before setting secrets
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
    
    # Check if secret was actually set (ignore warnings)
    if ($secretResult1 -match "error|failed" -and $secretResult1 -notmatch "Created|Updated") {
        Write-ErrorMsg "Failed to set MONGODB_URI secret"
        Write-Host $secretResult1
        exit 1
    }
    Write-Host "[OK] MONGODB_URI secret set" -ForegroundColor Green
    
    # MongoDB Data API Key (if using Data API)
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
    
    # Check if secret was actually set (ignore warnings)
    if ($secretResult2 -match "error|failed" -and $secretResult2 -notmatch "Created|Updated") {
        Write-ErrorMsg "Failed to set JWT_SECRET secret"
        Write-Host $secretResult2
        exit 1
    }
    Write-Host "[OK] JWT_SECRET secret set" -ForegroundColor Green
    
    # EmailJS Public Key
    if (-not [string]::IsNullOrWhiteSpace($EMAILJS_PUBLIC_KEY)) {
        Write-Info "Setting EMAILJS_PUBLIC_KEY secret..."
        $tempEmailJSPublicKey = Join-Path $env:TEMP "emailjs_public_key.txt"
        [IO.File]::WriteAllText($tempEmailJSPublicKey, $EMAILJS_PUBLIC_KEY)
        $secretResult3 = cmd.exe /c "wrangler secret put EMAILJS_PUBLIC_KEY < ""$tempEmailJSPublicKey""" 2>&1
        Remove-Item $tempEmailJSPublicKey -ErrorAction SilentlyContinue
        if ($secretResult3 -match "error|failed" -and $secretResult3 -notmatch "Created|Updated") {
            Write-ErrorMsg "Failed to set EMAILJS_PUBLIC_KEY secret"
            Write-Host $secretResult3 -ForegroundColor Gray
        } else {
            Write-Host "[OK] EMAILJS_PUBLIC_KEY secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] EMAILJS_PUBLIC_KEY not configured (skipping)" -ForegroundColor Gray
    }
    
    # EmailJS Service ID
    if (-not [string]::IsNullOrWhiteSpace($EMAILJS_SERVICE_ID)) {
        Write-Info "Setting EMAILJS_SERVICE_ID secret..."
        $tempEmailJSServiceId = Join-Path $env:TEMP "emailjs_service_id.txt"
        [IO.File]::WriteAllText($tempEmailJSServiceId, $EMAILJS_SERVICE_ID)
        $secretResult4 = cmd.exe /c "wrangler secret put EMAILJS_SERVICE_ID < ""$tempEmailJSServiceId""" 2>&1
        Remove-Item $tempEmailJSServiceId -ErrorAction SilentlyContinue
        if ($secretResult4 -match "error|failed" -and $secretResult4 -notmatch "Created|Updated") {
            Write-ErrorMsg "Failed to set EMAILJS_SERVICE_ID secret"
            Write-Host $secretResult4 -ForegroundColor Gray
        } else {
            Write-Host "[OK] EMAILJS_SERVICE_ID secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] EMAILJS_SERVICE_ID not configured (skipping)" -ForegroundColor Gray
    }
    
    # EmailJS Template ID
    if (-not [string]::IsNullOrWhiteSpace($EMAILJS_TEMPLATE_ID)) {
        Write-Info "Setting EMAILJS_TEMPLATE_ID secret..."
        $tempEmailJSTemplateId = Join-Path $env:TEMP "emailjs_template_id.txt"
        [IO.File]::WriteAllText($tempEmailJSTemplateId, $EMAILJS_TEMPLATE_ID)
        $secretResult5 = cmd.exe /c "wrangler secret put EMAILJS_TEMPLATE_ID < ""$tempEmailJSTemplateId""" 2>&1
        Remove-Item $tempEmailJSTemplateId -ErrorAction SilentlyContinue
        if ($secretResult5 -match "error|failed" -and $secretResult5 -notmatch "Created|Updated") {
            Write-ErrorMsg "Failed to set EMAILJS_TEMPLATE_ID secret"
            Write-Host $secretResult5 -ForegroundColor Gray
        } else {
            Write-Host "[OK] EMAILJS_TEMPLATE_ID secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] EMAILJS_TEMPLATE_ID not configured (skipping)" -ForegroundColor Gray
    }
    
    # EmailJS Private Key
    if (-not [string]::IsNullOrWhiteSpace($EMAILJS_PRIVATE_KEY)) {
        Write-Info "Setting EMAILJS_PRIVATE_KEY secret..."
        $tempEmailJSPrivateKey = Join-Path $env:TEMP "emailjs_private_key.txt"
        [IO.File]::WriteAllText($tempEmailJSPrivateKey, $EMAILJS_PRIVATE_KEY)
        $secretResult6 = cmd.exe /c "wrangler secret put EMAILJS_PRIVATE_KEY < ""$tempEmailJSPrivateKey""" 2>&1
        Remove-Item $tempEmailJSPrivateKey -ErrorAction SilentlyContinue
        if ($secretResult6 -match "error|failed" -and $secretResult6 -notmatch "Created|Updated") {
            Write-ErrorMsg "Failed to set EMAILJS_PRIVATE_KEY secret"
            Write-Host $secretResult6 -ForegroundColor Gray
        } else {
            Write-Host "[OK] EMAILJS_PRIVATE_KEY secret set" -ForegroundColor Green
        }
    } else {
        Write-Host "[SKIP] EMAILJS_PRIVATE_KEY not configured (skipping)" -ForegroundColor Gray
    }
    
    # Summary for EmailJS
    if ($hasEmailJS) {
        Write-Host ""
        Write-Success "All EmailJS secrets have been installed to Cloudflare Workers"
        Write-Info "Email verification emails will be sent via EmailJS"
    } else {
        Write-Host ""
        Write-WarningMsg "EmailJS not configured - verification links will be logged to Cloudflare Workers logs"
        Write-Info "To enable EmailJS, run deployment script again and configure EmailJS"
    }
    
    # Deploy with Wrangler (ignore warnings, only check for real errors)
    Write-Info "Deploying Cloudflare Worker..."
    $prevErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $deployOutput = wrangler deploy 2>&1 | Out-String
    $ErrorActionPreference = $prevErrorActionPreference
    Write-Host $deployOutput
    
    # Check for workers.dev subdomain registration error
    if ($deployOutput -match "register a workers\.dev subdomain") {
        Write-Host ""
        Write-Host "================================================================================" -ForegroundColor Red
        Write-Host "ERROR: Workers.dev Subdomain Not Registered!" -ForegroundColor Red
        Write-Host "================================================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "You need to register a workers.dev subdomain ONCE before deploying." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Steps:" -ForegroundColor Cyan
        Write-Host "1. Open this link in your browser:" -ForegroundColor White
        Write-Host "   https://dash.cloudflare.com/70d3983867be1dd89a1d96751805e765/workers/onboarding" -ForegroundColor Green
        Write-Host ""
        Write-Host "2. Choose a subdomain name (e.g., myapp.workers.dev)" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Click 'Register'" -ForegroundColor White
        Write-Host ""
        Write-Host "4. Run this script again" -ForegroundColor White
        Write-Host ""
        Write-Host "This is a ONE-TIME step for your Cloudflare account." -ForegroundColor Yellow
        Write-Host "================================================================================" -ForegroundColor Red
        exit 1
    }
    
    # Check for deployment errors (ignore warnings)
    if ($deployOutput -match "error|failed|Error:" -and $deployOutput -notmatch "Deployed|Uploaded") {
        Write-ErrorMsg "Deployment failed!"
        Write-Host $deployOutput
        exit 1
    }
    
    # Extract Worker URL from deploy output
    if ($deployOutput -match "https://[a-zA-Z0-9.-]+\.workers\.dev") {
        $script:API_URL = $Matches[0]
        Write-Success "Backend deployed successfully"
        Write-Info "Worker URL: $API_URL"
    } else {
        $script:API_URL = "https://open-lance-backend.<your-subdomain>.workers.dev"
        Write-Success "Backend deployment completed"
        Write-WarningMsg "Could not automatically detect Worker URL"
        Write-WarningMsg "Please check Cloudflare dashboard: https://dash.cloudflare.com/"
        Write-Info "Expected URL format: $API_URL"
    }
    
    # Save to config
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

###############################################################################
# Configure Frontend
###############################################################################

function Set-FrontendConfig {
    Write-Header "Configuring Frontend"
    
    Write-Info "Updating frontend configuration..."
    
    $configContent = @"
// Configuration for Open-Lance v3.0 (Cloudflare Workers + MongoDB Atlas)
const CONFIG = {
    // Environment
    ENV: '$Environment',
    
    // API Endpoints
    API: {
        development: {
            baseURL: '$API_URL'
        },
        production: {
            baseURL: '$API_URL'
        }
    },
    
    // App Settings
    SETTINGS: {
        maxContactLinks: 10,
        defaultPageSize: 20,
        retryAttempts: 3,
        retryDelay: 1000 // ms
    }
};

// Get current environment config
function getConfig() {
    const env = CONFIG.ENV || 'development';
    
    // Choose fallback based on environment
    let fallbackURL = '$API_URL';
    if (env === 'local' || env === 'development') {
        fallbackURL = 'http://127.0.0.1:8787';
    }
    
    const apiConfig = CONFIG.API[env] || { baseURL: fallbackURL };
    return {
        apiBaseURL: apiConfig.baseURL,
        ...CONFIG.SETTINGS
    };
}

// Export for use in other modules
window.APP_CONFIG = getConfig();
"@
    
    $configPath = Join-Path $ProjectRoot "docs\js\config.js"
    $configContent | Out-File -FilePath $configPath -Encoding UTF8
    
    Write-Success "Frontend configured successfully"
}

###############################################################################
# Test Deployment
###############################################################################

function Test-Deployment {
    Write-Header "Testing Deployment"
    
    Write-Info "Testing backend health..."
    
    # Make sure we're testing the correct URL base
    $TestingUrl = if ($Environment -eq "local") { "http://127.0.0.1:8787" } else { $API_URL }
    
    try {
        $testData = @{
            email = "test@example.com"
            password = "TestPass123!"
        } | ConvertTo-Json
        
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
    Write-Host "   git commit -m 'Deploy Open-Lance v3.0'" -ForegroundColor Gray
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
    
    # Run deployment steps
    Test-Prerequisites
    Get-DeploymentConfig
    
    # Deploy backend
    if (-not $SkipBackend) {
        $backendSuccess = Deploy-Backend
        if (-not $backendSuccess) {
            Write-ErrorMsg "Backend deployment failed"
            exit 1
        }
    }
    
    # Configure frontend
    Set-FrontendConfig
    
    # Test deployment
    Test-Deployment
    
    # Print summary
    Write-Summary
}

# Run main function
Main

