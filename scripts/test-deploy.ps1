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

# Test Wrangler CLI (Cloudflare)
Write-Host "`n3. Checking Wrangler CLI..." -ForegroundColor Yellow
try {
    $wranglerVersion = wrangler --version 2>$null
    if ($wranglerVersion) {
        Write-Host "   [OK] Wrangler found: v$wranglerVersion" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Wrangler not found" -ForegroundColor Red
        Write-Host "   Run: npm install -g wrangler" -ForegroundColor Gray
        $allOk = $false
    }
}
catch {
    Write-Host "   [ERROR] Wrangler not found" -ForegroundColor Red
    Write-Host "   Run: npm install -g wrangler" -ForegroundColor Gray
    $allOk = $false
}

# Check Cloudflare Authentication
Write-Host "`n4. Checking Cloudflare Auth..." -ForegroundColor Yellow
try {
    $whoami = wrangler whoami 2>&1 | Out-String
    if ($whoami -match "You are logged in") {
        Write-Host "   [OK] Cloudflare authenticated" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Cloudflare not authenticated" -ForegroundColor Yellow
        Write-Host "   Run: wrangler login" -ForegroundColor Gray
    }
}
catch {
    Write-Host "   [WARN] Cloudflare not authenticated" -ForegroundColor Yellow
    Write-Host "   Run: wrangler login" -ForegroundColor Gray
}

# Check Resend Configuration (optional)
Write-Host "`n5. Checking Email Setup (Resend)..." -ForegroundColor Yellow
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$EnvPath = Join-Path $ProjectRoot ".env"
$BackendDir = Join-Path $ProjectRoot "backend"

# Function to test Resend API key
function Test-ResendApiKey {
    param([string]$apiKey, [string]$source)
    
    if (-not $apiKey -or -not ($apiKey -match '^re_')) {
        Write-Host "   [INFO] Resend API Key from $source has invalid format (should start with 're_')" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "   [INFO] Testing Resend API Key from $source..." -ForegroundColor Cyan
    
    $TempScript = Join-Path $BackendDir "test-resend-connection.js"
    
    $testCode = @'
const https = require('https');
const apiKey = process.env.TEST_RESEND_API_KEY;

// Test API key by checking domains endpoint (doesn't send email)
const options = {
    hostname: 'api.resend.com',
    path: '/domains',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    },
    timeout: 10000
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('SUCCESS');
        } else if (res.statusCode === 401) {
            try {
                const errorData = JSON.parse(data);
                console.error('ERROR: Invalid API key - ' + (errorData.message || 'Unauthorized'));
            } catch {
                console.error('ERROR: Invalid API key - Unauthorized');
            }
            process.exit(1);
        } else if (res.statusCode === 403) {
            console.error('ERROR: API key lacks required permissions');
            process.exit(1);
        } else {
            console.error('ERROR: API request failed - Status ' + res.statusCode);
            process.exit(1);
        }
    });
});

req.on('error', (err) => {
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
        console.error('ERROR: Connection timeout or network error');
    } else {
        console.error('ERROR: ' + err.message);
    }
    process.exit(1);
});

req.on('timeout', () => {
    req.destroy();
    console.error('ERROR: Request timeout');
    process.exit(1);
});

req.end();
'@
    [IO.File]::WriteAllText($TempScript, $testCode)
    
    $env:TEST_RESEND_API_KEY = $apiKey
    $prevLocation = Get-Location
    Set-Location $BackendDir
    
    try {
        $result = node test-resend-connection.js 2>&1 | Out-String
        if ($result -match "SUCCESS") {
            Write-Host "   [OK] Resend API Key from $source is valid and working" -ForegroundColor Green
            return $true
        } else {
            Write-Host "   [ERROR] Resend API Key from $source validation failed" -ForegroundColor Red
            
            # Extract error lines safely
            $errorMsg = ($result -split "`r`n|`n" | Where-Object { $_ -match "ERROR:" } | Select-Object -First 1)
            if ($errorMsg) {
                Write-Host "   $errorMsg" -ForegroundColor Gray
            } else {
                Write-Host "   Check your API key" -ForegroundColor Gray
            }
            return $false
        }
    } catch {
        Write-Host "   [WARN] Could not test Resend API (Node.js execution failed)" -ForegroundColor Yellow
        Write-Host "   API key found, but validation skipped" -ForegroundColor Gray
        return $false
    } finally {
        Remove-Item $TempScript -ErrorAction SilentlyContinue
        Set-Location $prevLocation
        $env:TEST_RESEND_API_KEY = ""
    }
}

$resendFound = $false
$resendValid = $false

# Check Resend in Cloudflare Workers secrets (production)
Write-Host "   Checking Cloudflare Workers secrets..." -ForegroundColor Cyan
try {
    $secretsList = wrangler secret list 2>&1 | Out-String
    if ($secretsList -match "RESEND_API_KEY") {
        Write-Host "   [INFO] RESEND_API_KEY found in Cloudflare Workers secrets" -ForegroundColor Cyan
        # Note: We can't read secret values directly, only check if they exist
        Write-Host "   [INFO] Secret exists. To verify, check Cloudflare Dashboard or test after deployment." -ForegroundColor Gray
        $resendFound = $true
    } else {
        Write-Host "   [INFO] RESEND_API_KEY not found in Cloudflare Workers secrets" -ForegroundColor Yellow
    }
    
    if ($secretsList -match "SENDER_EMAIL") {
        Write-Host "   [INFO] SENDER_EMAIL found in Cloudflare Workers secrets" -ForegroundColor Cyan
    } else {
        Write-Host "   [INFO] SENDER_EMAIL not found in Cloudflare Workers secrets (will use default)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [WARN] Could not check Cloudflare Workers secrets" -ForegroundColor Yellow
    Write-Host "   Make sure you're authenticated: wrangler login" -ForegroundColor Gray
}

# Check Resend in .env file (local development)
if (Test-Path $EnvPath) {
    $EnvContent = Get-Content $EnvPath -Raw
    if ($EnvContent -match 'RESEND_API_KEY="([^"]+)"') {
        $resendApiKey = $matches[1]
        $resendFound = $true
        $resendValid = Test-ResendApiKey -apiKey $resendApiKey -source ".env file"
    } elseif ($EnvContent -match "RESEND_API_KEY=([^\r\n]+)") {
        $resendApiKey = $matches[1].Trim()
        $resendFound = $true
        $resendValid = Test-ResendApiKey -apiKey $resendApiKey -source ".env file"
    }
    
    # Check SENDER_EMAIL in .env
    if ($EnvContent -match 'SENDER_EMAIL="([^"]+)"') {
        $senderEmail = $matches[1]
        Write-Host "   [INFO] SENDER_EMAIL found in .env: $senderEmail" -ForegroundColor Cyan
    } elseif ($EnvContent -match "SENDER_EMAIL=([^\r\n]+)") {
        $senderEmail = $matches[1].Trim()
        Write-Host "   [INFO] SENDER_EMAIL found in .env: $senderEmail" -ForegroundColor Cyan
    }
}

# Summary
if (-not $resendFound) {
    Write-Host "   [INFO] Resend API Key not found in .env or Cloudflare Workers secrets" -ForegroundColor Cyan
    Write-Host "   Emails will be simulated. To enable real emails:" -ForegroundColor Gray
    Write-Host "   1. Get API key from https://resend.com/api-keys" -ForegroundColor Gray
    Write-Host "   2. Add to .env: RESEND_API_KEY=`"re_...`"" -ForegroundColor Gray
    Write-Host "   3. Or set in Cloudflare: wrangler secret put RESEND_API_KEY" -ForegroundColor Gray
} elseif (-not $resendValid) {
    Write-Host "   [WARN] Resend API Key found but validation failed" -ForegroundColor Yellow
    Write-Host "   Emails will be simulated until valid key is configured" -ForegroundColor Gray
}

# Check MongoDB Connection
Write-Host "`n6. Checking MongoDB Connection..." -ForegroundColor Yellow
if (Test-Path $EnvPath) {
    $EnvContent = Get-Content $EnvPath -Raw
    if ($EnvContent -match 'MONGODB_URI="([^"]+)"') {
        $mongoUri = $matches[1]
        Write-Host "   [INFO] Testing connection to MongoDB Atlas..." -ForegroundColor Cyan
        
        $BackendDir = Join-Path $ProjectRoot "backend"
        $TempScript = Join-Path $BackendDir "test-mongo-connection.js"
        
        $testCode = @'
try {
    const { MongoClient } = require('mongodb');
    const uri = process.env.TEST_MONGO_URI;
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    
    async function run() {
        try {
            await client.connect();
            await client.db('admin').command({ ping: 1 });
            console.log('SUCCESS');
        } catch (err) {
            console.error('ERROR: ' + err.message);
            process.exit(1);
        } finally {
            await client.close();
        }
    }
    run();
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        console.log('MODULE_MISSING');
    } else {
        console.error('ERROR: ' + e.message);
        process.exit(1);
    }
}
'@
        [IO.File]::WriteAllText($TempScript, $testCode)
        
        $env:TEST_MONGO_URI = $mongoUri
        $prevLocation = Get-Location
        Set-Location $BackendDir
        
        try {
            $result = node test-mongo-connection.js 2>&1 | Out-String
            if ($result -match "SUCCESS") {
                Write-Host "   [OK] Successfully connected to MongoDB Atlas" -ForegroundColor Green
            } elseif ($result -match "MODULE_MISSING") {
                Write-Host "   [WARN] Cannot test MongoDB connection. 'mongodb' module not installed in backend." -ForegroundColor Yellow
            } else {
                Write-Host "   [ERROR] Failed to connect to MongoDB Atlas" -ForegroundColor Red
                
                # Extract error lines safely
                $errorMsg = ($result -split "`r`n|`n" | Where-Object { $_ -match "ERROR:" } | Select-Object -First 1)
                if ($errorMsg) {
                    Write-Host "   $errorMsg" -ForegroundColor Gray
                } else {
                    Write-Host "   Check database IP whitelisting and credentials in .env" -ForegroundColor Gray
                }
                $allOk = $false
            }
        } catch {
            Write-Host "   [ERROR] Node execution failed" -ForegroundColor Red
            $allOk = $false
        } finally {
            Remove-Item $TempScript -ErrorAction SilentlyContinue
            Set-Location $prevLocation
            $env:TEST_MONGO_URI = ""
        }
    } else {
        Write-Host "   [WARN] MONGODB_URI not found in .env." -ForegroundColor Yellow
        Write-Host "   Run deployment to configure it." -ForegroundColor Gray
        $allOk = $false
    }
} else {
    Write-Host "   [WARN] No .env found. Cannot test MongoDB." -ForegroundColor Yellow
    Write-Host "   Run deployment to configure it." -ForegroundColor Gray
    $allOk = $false
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " Test Results" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "`n[OK] All required tools are installed!" -ForegroundColor Green
    Write-Host "`nYou are ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Set up MongoDB Atlas (see MONGODB_ATLAS_SETUP.md)" -ForegroundColor Gray
    Write-Host "  2. Run deployment: .\scripts\deploy.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "`n[FAIL] Some required tools are missing" -ForegroundColor Red
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
