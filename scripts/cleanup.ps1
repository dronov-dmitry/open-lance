# Open-Lance Cleanup Script v2.0 (Windows PowerShell)
# This script removes all deployed AWS resources
# Note: MongoDB Atlas data is NOT deleted automatically

param(
    [string]$Environment = "",
    [switch]$Force,
    [switch]$Help
)

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

###############################################################################
# Show Help
###############################################################################

if ($Help) {
    Write-Host @"
Open-Lance Cleanup Script v2.0

Usage:
    .\cleanup.ps1 [options]

Options:
    -Environment <env>   Specify environment to clean up (dev/prod)
    -Force              Skip confirmation prompt
    -Help               Show this help message

Examples:
    .\cleanup.ps1 -Environment dev
    .\cleanup.ps1 -Environment prod -Force

"@
    exit 0
}

###############################################################################
# Main Cleanup
###############################################################################

Write-Header "Open-Lance Cleanup Script v2.0"

Write-Host ""
Write-Host "WARNING: This will DELETE AWS Lambda functions and API Gateway!" -ForegroundColor Red
Write-Host "This action CANNOT be undone!" -ForegroundColor Red
Write-Host ""
Write-Host "This will remove:" -ForegroundColor Yellow
Write-Host "  - All Lambda functions"
Write-Host "  - API Gateway"
Write-Host "  - CloudWatch Log Groups"
Write-Host ""
Write-Host "MongoDB Atlas data will NOT be deleted." -ForegroundColor Yellow
Write-Host "You can manually delete MongoDB data from MongoDB Atlas dashboard."
Write-Host ""

if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to continue? (type 'yes' to confirm)"
    
    if ($confirmation -ne "yes") {
        Write-Host "Cleanup cancelled"
        exit 0
    }
}

# Load configuration
$configFile = Join-Path $ProjectRoot ".deploy-config.ps1"

if (Test-Path $configFile) {
    . $configFile
}
else {
    if ([string]::IsNullOrWhiteSpace($Environment)) {
        $Environment = Read-Host "Enter environment to clean up (dev/prod)"
    }
}

Write-Host ""
Write-WarningMsg "Cleaning up environment: $Environment"
Write-Host ""

# Remove backend
Write-Header "Removing Backend (Lambda + API Gateway)"

$backendDir = Join-Path $ProjectRoot "backend"
Set-Location $backendDir

try {
    $slsVersion = serverless --version 2>$null
    if ($slsVersion) {
        Write-Host "Removing Lambda functions and API Gateway..."
        serverless remove --stage $Environment
        Write-Success "Backend removed"
    }
}
catch {
    Write-WarningMsg "Serverless not found or failed, skipping backend cleanup"
}

Set-Location $ProjectRoot

# Remove Terraform infrastructure (if exists)
Write-Header "Removing Infrastructure (if Terraform was used)"

$terraformDir = Join-Path $ProjectRoot "infrastructure\terraform\.terraform"

if (Test-Path $terraformDir) {
    $tfDir = Join-Path $ProjectRoot "infrastructure\terraform"
    Set-Location $tfDir
    
    try {
        terraform --version | Out-Null
        Write-Host "Destroying Terraform resources..."
        terraform destroy -auto-approve
        Write-Success "Terraform resources removed"
    }
    catch {
        Write-WarningMsg "Terraform not found"
    }
    
    Set-Location $ProjectRoot
}
else {
    Write-WarningMsg "No Terraform state found (skip infrastructure cleanup)"
}

# Clean up local files
Write-Header "Cleaning Local Files"

Write-Host "Removing generated files..."

$filesToRemove = @(
    ".deploy-config",
    ".deploy-config.ps1",
    ".terraform-outputs.json",
    "backend\.env",
    "infrastructure\terraform\terraform.tfvars",
    "infrastructure\terraform\tfplan",
    "infrastructure\terraform\.terraform",
    "infrastructure\terraform\.terraform.lock.hcl"
)

foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Success "Local files cleaned"

Write-Host ""
Write-Header "Cleanup Complete"
Write-Host ""
Write-Success "AWS resources have been removed"
Write-Host ""
Write-Host "Note: MongoDB Atlas data was NOT deleted" -ForegroundColor Yellow
Write-Host ""
Write-Host "To delete MongoDB Atlas data:" -ForegroundColor Cyan
Write-Host "  1. Go to https://cloud.mongodb.com/"
Write-Host "  2. Select your cluster"
Write-Host "  3. Click 'Browse Collections'"
Write-Host "  4. Delete collections or the entire database"
Write-Host "  5. (Optional) Delete the cluster"
Write-Host ""
Write-Host "Your code is still intact in: $ProjectRoot"
Write-Host ""
