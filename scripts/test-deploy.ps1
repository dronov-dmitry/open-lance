# Quick test script to verify prerequisites for Open-Lance v2.0

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " Open-Lance v2.0 Prerequisites Check" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host "`nTesting required tools..." -ForegroundColor Yellow

$allOk = $true

# Test Node.js
Write-Host "`n1. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "   [OK] Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Node.js not found" -ForegroundColor Red
        $allOk = $false
    }
}
catch {
    Write-Host "   [ERROR] Node.js not found" -ForegroundColor Red
    $allOk = $false
}

# Test npm
Write-Host "`n2. Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "   [OK] npm found: v$npmVersion" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] npm not found" -ForegroundColor Red
        $allOk = $false
    }
}
catch {
    Write-Host "   [ERROR] npm not found" -ForegroundColor Red
    $allOk = $false
}

# Test AWS CLI
Write-Host "`n3. Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = (aws --version 2>&1) | Out-String
    if ($awsVersion -and $awsVersion -notmatch "is not recognized") {
        Write-Host "   [OK] AWS CLI found" -ForegroundColor Green
        Write-Host "   $($awsVersion.Trim())" -ForegroundColor Gray
    } else {
        Write-Host "   [ERROR] AWS CLI not found" -ForegroundColor Red
        $allOk = $false
    }
}
catch {
    Write-Host "   [ERROR] AWS CLI not found" -ForegroundColor Red
    $allOk = $false
}

# Test AWS Credentials
Write-Host "`n4. Checking AWS Credentials..." -ForegroundColor Yellow
try {
    $accountId = aws sts get-caller-identity --query Account --output text 2>$null
    if ($accountId) {
        Write-Host "   [OK] AWS credentials configured" -ForegroundColor Green
        Write-Host "   Account ID: $accountId" -ForegroundColor Gray
    } else {
        Write-Host "   [WARN] AWS credentials not configured" -ForegroundColor Yellow
        Write-Host "   Run: aws configure" -ForegroundColor Gray
    }
}
catch {
    Write-Host "   [WARN] AWS credentials not configured" -ForegroundColor Yellow
    Write-Host "   Run: aws configure" -ForegroundColor Gray
}

# Test Serverless
Write-Host "`n5. Checking Serverless Framework..." -ForegroundColor Yellow
try {
    $slsOutput = serverless --version 2>&1 | Out-String
    if ($slsOutput -and $slsOutput -notmatch "is not recognized") {
        $slsVersion = ($slsOutput | Select-String "Framework Core").ToString()
        if ($slsVersion) {
            Write-Host "   [OK] Serverless found" -ForegroundColor Green
            Write-Host "   $($slsVersion.Trim())" -ForegroundColor Gray
        } else {
            Write-Host "   [WARN] Serverless found but version unclear" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [WARN] Serverless Framework not found" -ForegroundColor Yellow
        Write-Host "   Will be installed during deployment" -ForegroundColor Gray
    }
}
catch {
    Write-Host "   [WARN] Serverless Framework not found" -ForegroundColor Yellow
    Write-Host "   Will be installed during deployment" -ForegroundColor Gray
}

# Test Terraform (optional in v2.0)
Write-Host "`n6. Checking Terraform (optional)..." -ForegroundColor Yellow
try {
    $tfVersion = terraform --version 2>&1 | Select-Object -First 1
    if ($tfVersion -and $tfVersion -notmatch "is not recognized") {
        Write-Host "   [OK] Terraform found: $($tfVersion.Trim())" -ForegroundColor Green
    } else {
        Write-Host "   [INFO] Terraform not found (optional for v2.0)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "   [INFO] Terraform not found (optional for v2.0)" -ForegroundColor Cyan
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " Test Results" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "`n✓ All required tools are installed!" -ForegroundColor Green
    Write-Host "`nYou're ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Set up MongoDB Atlas (see MONGODB_ATLAS_SETUP.md)" -ForegroundColor Gray
    Write-Host "  2. Run deployment: .\scripts\deploy.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "`n✗ Some required tools are missing" -ForegroundColor Red
    Write-Host "`nPlease install missing tools:" -ForegroundColor Yellow
    Write-Host "  Node.js: https://nodejs.org/" -ForegroundColor Gray
    Write-Host "  AWS CLI: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Gray
    Write-Host ""
    Write-Host "After installation:" -ForegroundColor Yellow
    Write-Host "  1. Restart PowerShell" -ForegroundColor Gray
    Write-Host "  2. Run this test again: .\scripts\test-deploy.ps1" -ForegroundColor Gray
    Write-Host "  3. Configure AWS: aws configure" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - Quick Start: QUICKSTART_MONGODB.md" -ForegroundColor Gray
Write-Host "  - Full Guide:  DEPLOYMENT.md" -ForegroundColor Gray
Write-Host "  - MongoDB Setup: MONGODB_ATLAS_SETUP.md" -ForegroundColor Gray
Write-Host ""
