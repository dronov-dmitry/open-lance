# AWS Region Consistency Checker (PowerShell)
# Verifies that all configuration files use the same AWS region

Write-Host "🔍 Checking AWS Region Consistency..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Get project root directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Configuration file paths
$TerraformFile = Join-Path $ProjectRoot "infrastructure\terraform\terraform.tfvars"
$BackendEnv = Join-Path $ProjectRoot "backend\.env"
$FrontendConfig = Join-Path $ProjectRoot "frontend\js\config.js"

# Function to get AWS CLI region
function Get-AwsCliRegion {
    try {
        $region = aws configure get region 2>$null
        if ($region) { return $region }
        return "NOT_SET"
    }
    catch {
        return "NOT_SET"
    }
}

# Function to get Terraform region
function Get-TerraformRegion {
    if (Test-Path $TerraformFile) {
        $content = Get-Content $TerraformFile -Raw
        if ($content -match 'aws_region\s*=\s*"([^"]+)"') {
            return $matches[1]
        }
        return "NOT_SET"
    }
    return "FILE_NOT_FOUND"
}

# Function to get Backend region
function Get-BackendRegion {
    if (Test-Path $BackendEnv) {
        $content = Get-Content $BackendEnv
        $line = $content | Where-Object { $_ -match '^AWS_REGION=' }
        if ($line) {
            return ($line -split '=')[1].Trim()
        }
        return "NOT_SET"
    }
    return "FILE_NOT_FOUND"
}

# Function to get Frontend region
function Get-FrontendRegion {
    if (Test-Path $FrontendConfig) {
        $content = Get-Content $FrontendConfig -Raw
        if ($content -match "region:\s*'([^']+)'") {
            return $matches[1]
        }
        return "NOT_SET"
    }
    return "FILE_NOT_FOUND"
}

# Get regions from all configs
Write-Host "📍 Detected Regions:" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

$CliRegion = Get-AwsCliRegion
$TerraformRegion = Get-TerraformRegion
$BackendRegion = Get-BackendRegion
$FrontendRegion = Get-FrontendRegion

Write-Host "AWS CLI:      $CliRegion"
Write-Host "Terraform:    $TerraformRegion"
Write-Host "Backend:      $BackendRegion"
Write-Host "Frontend:     $FrontendRegion"
Write-Host ""

# Check for warnings
$Errors = 0

if ($CliRegion -eq "NOT_SET") {
    Write-Host "⚠️  WARNING: AWS CLI region not configured" -ForegroundColor Yellow
    Write-Host "   Run: aws configure set region <your-region>" -ForegroundColor Gray
    $Errors++
}

if ($TerraformRegion -eq "FILE_NOT_FOUND") {
    Write-Host "⚠️  WARNING: Terraform config not found" -ForegroundColor Yellow
    Write-Host "   Create: infrastructure\terraform\terraform.tfvars" -ForegroundColor Gray
    $Errors++
}
elseif ($TerraformRegion -eq "NOT_SET") {
    Write-Host "⚠️  WARNING: Terraform region not set" -ForegroundColor Yellow
    Write-Host "   Set aws_region in terraform.tfvars" -ForegroundColor Gray
    $Errors++
}

if ($BackendRegion -eq "FILE_NOT_FOUND") {
    Write-Host "⚠️  WARNING: Backend .env not found" -ForegroundColor Yellow
    Write-Host "   Create: backend\.env" -ForegroundColor Gray
    $Errors++
}
elseif ($BackendRegion -eq "NOT_SET") {
    Write-Host "⚠️  WARNING: Backend region not set" -ForegroundColor Yellow
    Write-Host "   Set AWS_REGION in backend\.env" -ForegroundColor Gray
    $Errors++
}

if ($FrontendRegion -eq "FILE_NOT_FOUND") {
    Write-Host "⚠️  WARNING: Frontend config not found" -ForegroundColor Yellow
    Write-Host "   Check: frontend\js\config.js" -ForegroundColor Gray
    $Errors++
}
elseif ($FrontendRegion -eq "NOT_SET") {
    Write-Host "⚠️  WARNING: Frontend region not set" -ForegroundColor Yellow
    Write-Host "   Set region in frontend\js\config.js" -ForegroundColor Gray
    $Errors++
}

# Collect valid regions
$Regions = @()
if ($CliRegion -ne "NOT_SET" -and $CliRegion -ne "FILE_NOT_FOUND") {
    $Regions += $CliRegion
}
if ($TerraformRegion -ne "NOT_SET" -and $TerraformRegion -ne "FILE_NOT_FOUND") {
    $Regions += $TerraformRegion
}
if ($BackendRegion -ne "NOT_SET" -and $BackendRegion -ne "FILE_NOT_FOUND") {
    $Regions += $BackendRegion
}
if ($FrontendRegion -ne "NOT_SET" -and $FrontendRegion -ne "FILE_NOT_FOUND") {
    $Regions += $FrontendRegion
}

# Check uniqueness
$UniqueRegions = $Regions | Select-Object -Unique

if ($UniqueRegions.Count -eq 0) {
    Write-Host ""
    Write-Host "❌ FAILED: No regions configured" -ForegroundColor Red
    Write-Host ""
    Write-Host "📖 Please configure AWS region first:" -ForegroundColor Yellow
    Write-Host "   See: AWS_REGION_GUIDE.md" -ForegroundColor Gray
    exit 1
}
elseif ($UniqueRegions.Count -gt 1) {
    Write-Host ""
    Write-Host "❌ FAILED: Region mismatch detected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Different regions found: $($UniqueRegions -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Fix by setting all configs to the same region:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   # Choose your region (example: us-east-1)" -ForegroundColor Gray
    Write-Host '   $TARGET_REGION = "us-east-1"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # AWS CLI" -ForegroundColor Gray
    Write-Host '   aws configure set region $TARGET_REGION' -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Terraform" -ForegroundColor Gray
    Write-Host "   # Edit: infrastructure\terraform\terraform.tfvars" -ForegroundColor Gray
    Write-Host '   # Set: aws_region = "$TARGET_REGION"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Backend" -ForegroundColor Gray
    Write-Host "   # Edit: backend\.env" -ForegroundColor Gray
    Write-Host '   # Set: AWS_REGION=$TARGET_REGION' -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Frontend" -ForegroundColor Gray
    Write-Host "   # Edit: frontend\js\config.js" -ForegroundColor Gray
    Write-Host "   # Set: region: '\$TARGET_REGION'" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
else {
    Write-Host ""
    Write-Host "✅ SUCCESS: All regions consistent!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Target Region: " -NoNewline
    Write-Host $UniqueRegions[0] -ForegroundColor Green
    Write-Host ""
    
    if ($Errors -gt 0) {
        Write-Host "⚠️  Note: $Errors warnings found (see above)" -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "📚 Region Information:" -ForegroundColor Cyan
    Write-Host "   AWS_REGION_GUIDE.md - Complete region guide" -ForegroundColor Gray
    Write-Host "   docs\AWS_REGION_CHEATSHEET.md - Quick reference" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚀 You're ready to deploy!" -ForegroundColor Green
    exit 0
}
