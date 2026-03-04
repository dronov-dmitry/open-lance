# Open-Lance Deployment Script v3.0 (Windows PowerShell)
# Cloudflare Workers + MongoDB Atlas deployment automation

param(
    [string]$Environment = "dev",
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
    Write-Host "    -Environment <env>      Deployment environment (dev/prod) [default: dev]"
    Write-Host "    -SkipBackend           Skip backend deployment"
    Write-Host "    -Help                  Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "    .\deploy.ps1                           # Full deployment to dev"
    Write-Host "    .\deploy.ps1 -Environment prod         # Full deployment to prod"
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
    
    try {
        $whoami = wrangler whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Cloudflare authentication configured"
            Write-Host $whoami
        } else {
            throw "Not authenticated"
        }
    }
    catch {
        Write-WarningMsg "Cloudflare authentication not configured"
        Write-Host ""
        Write-Host "Please authenticate with Cloudflare:" -ForegroundColor Yellow
        Write-Host "  wrangler login" -ForegroundColor Green
        Write-Host ""
        $runLogin = Read-Host "Run 'wrangler login' now? (y/n)"
        if ($runLogin -eq "y") {
            wrangler login
        } else {
            Write-ErrorMsg "Cloudflare authentication required"
            exit 1
        }
    }
}

###############################################################################
# Get Configuration
###############################################################################

function Get-DeploymentConfig {
    Write-Header "Configuration"
    
    $configFile = Join-Path $ProjectRoot ".deploy-config.ps1"
    
    if (Test-Path $configFile) {
        Write-Info "Found existing configuration"
        . $configFile
        
        $useExisting = Read-Host "Use existing configuration? (y/n)"
        if ($useExisting -ne "y") {
            Set-DeploymentConfig
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
    Write-Host "If you haven't set up MongoDB Atlas yet, see: MONGODB_ATLAS_SETUP.md" -ForegroundColor Gray
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
    
    $script:MONGODB_DATABASE = Read-Host "MongoDB Database Name [open-lance]"
    if ([string]::IsNullOrWhiteSpace($MONGODB_DATABASE)) {
        $script:MONGODB_DATABASE = "open-lance"
    }
    
    # Frontend URL
    $script:FRONTEND_URL = Read-Host "Frontend URL (e.g., https://open-lance.pages.dev) [*]"
    if ([string]::IsNullOrWhiteSpace($FRONTEND_URL)) {
        $script:FRONTEND_URL = "*"
    }
    
    # Generate JWT Secret
    Write-Info "Generating JWT secret..."
    $script:JWT_SECRET = & node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))'
    
    # Save configuration
    $configContent = @"
# Open-Lance Deployment Configuration v3.0 (Cloudflare Workers)
`$Environment = '$Environment'
`$MONGODB_URI = '$MONGODB_URI'
`$MONGODB_DATABASE = '$MONGODB_DATABASE'
`$FRONTEND_URL = '$FRONTEND_URL'
`$JWT_SECRET = '$JWT_SECRET'
"@
    
    $configContent | Out-File -FilePath $configFile -Encoding UTF8
    Write-Success "Configuration saved"
    
    # Add to .gitignore
    $gitignorePath = Join-Path $ProjectRoot ".gitignore"
    if (Test-Path $gitignorePath) {
        $gitignoreContent = Get-Content $gitignorePath -Raw
        if ($gitignoreContent -notmatch ".deploy-config.ps1") {
            Add-Content -Path $gitignorePath -Value "`n.deploy-config.ps1"
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
    
    # Set Cloudflare Workers secrets
    Write-Info "Setting Cloudflare Workers secrets..."
    
    # MongoDB URI
    Write-Host $MONGODB_URI | wrangler secret put MONGODB_URI --env $Environment
    
    # JWT Secret
    Write-Host $JWT_SECRET | wrangler secret put JWT_SECRET --env $Environment
    
    # Deploy with Wrangler
    Write-Info "Deploying Cloudflare Worker..."
    wrangler deploy --env $Environment
    
    # Worker URL
    $script:API_URL = "https://open-lance-backend-$Environment.<your-subdomain>.workers.dev"
    
    Write-Success "Backend deployed successfully"
    Write-Info "Worker URL: $API_URL"
    Write-WarningMsg "Update your worker URL in Cloudflare dashboard if needed"
    
    # Save to config
    $configFile = Join-Path $ProjectRoot ".deploy-config.ps1"
    Add-Content -Path $configFile -Value "`n`$API_URL = '$API_URL'"
    
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
    const env = CONFIG.ENV;
    return {
        apiBaseURL: CONFIG.API[env].baseURL,
        ...CONFIG.SETTINGS
    };
}

// Export for use in other modules
window.APP_CONFIG = getConfig();
"@
    
    $configPath = Join-Path $ProjectRoot "frontend\js\config.js"
    $configContent | Out-File -FilePath $configPath -Encoding UTF8
    
    Write-Success "Frontend configured successfully"
}

###############################################################################
# Test Deployment
###############################################################################

function Test-Deployment {
    Write-Header "Testing Deployment"
    
    Write-Info "Testing backend health..."
    
    try {
        $testData = @{
            email = "test@example.com"
            password = "TestPass123!"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$API_URL/auth/register" `
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
    Write-Host "Platform:             Cloudflare Workers (Edge)"
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
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host "   python -m http.server 8080" -ForegroundColor Gray
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
    Write-Host "   Or use: wrangler pages deploy frontend" -ForegroundColor Gray
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
    Test-CloudflareAuth
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
