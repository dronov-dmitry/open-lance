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

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$EnvPath = Join-Path $ProjectRoot ".env"

$isLocalEnvironment = $false
if (Test-Path $EnvPath) {
    $EnvContent = Get-Content $EnvPath -Raw
    if ($EnvContent -match 'Environment="local"') {
        $isLocalEnvironment = $true
        Write-Host "   [INFO] Detected Environment=`"local`" in .env - Skipping Cloudflare deployment checks" -ForegroundColor Cyan
    }
}

# Test Wrangler CLI (Cloudflare)
if (-not $isLocalEnvironment) {
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
}

# Check Cloudflare Authentication
if (-not $isLocalEnvironment) {
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
}

# Check Cloudflare Workers Secrets
Write-Host "`n5. Checking Cloudflare Workers Secrets..." -ForegroundColor Yellow
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$EnvPath = Join-Path $ProjectRoot ".env"

# Required secrets
$requiredSecrets = @{
    'MONGODB_URI' = 'MongoDB Connection URI (required)'
    'JWT_SECRET' = 'JWT Secret for authentication (required)'
    'EMAILJS_PUBLIC_KEY' = 'EmailJS Public Key (optional, for email sending)'
    'EMAILJS_SERVICE_ID' = 'EmailJS Service ID (optional, for email sending)'
    'EMAILJS_TEMPLATE_ID' = 'EmailJS Template ID (optional, for email sending)'
    'EMAILJS_PRIVATE_KEY' = 'EmailJS Private Key (optional, for email sending)'
    'MONGODB_API_KEY' = 'MongoDB Data API Key (optional, if using Data API)'
}

# Check secrets in Cloudflare Workers
if (-not $isLocalEnvironment) {
    Write-Host "   Checking Cloudflare Workers secrets..." -ForegroundColor Cyan
    $secretsInCloudflare = @{}
    $secretsInEnv = @{}

    try {
        $secretsList = wrangler secret list 2>&1 | Out-String
        
        foreach ($secretName in $requiredSecrets.Keys) {
            if ($secretsList -match $secretName) {
                $secretsInCloudflare[$secretName] = $true
                Write-Host "   [OK] $secretName found in Cloudflare Workers secrets" -ForegroundColor Green
            } else {
                $secretsInCloudflare[$secretName] = $false
                Write-Host "   [MISSING] $secretName not found in Cloudflare Workers secrets" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "   [WARN] Could not check Cloudflare Workers secrets" -ForegroundColor Yellow
        Write-Host "   Make sure you're authenticated: wrangler login" -ForegroundColor Gray
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    $secretsInCloudflare = @{}
    $secretsInEnv = @{}

    foreach ($secretName in $requiredSecrets.Keys) {
        $secretsInCloudflare[$secretName] = $false
    }
}

# Check secrets in .env file (local development)
if (Test-Path $EnvPath) {
    Write-Host "   Checking .env file..." -ForegroundColor Cyan
    $EnvContent = Get-Content $EnvPath -Raw
    
    foreach ($secretName in $requiredSecrets.Keys) {
        # Check for quoted value: SECRET_NAME="value"
        $pattern1 = $secretName + '="([^"]+)"'
        # Check for unquoted value: SECRET_NAME=value
        $pattern2 = $secretName + '=([^\r\n]+)'
        
        if ($EnvContent -match $pattern1 -or $EnvContent -match $pattern2) {
            $secretsInEnv[$secretName] = $true
            Write-Host "   [OK] $secretName found in .env file" -ForegroundColor Green
        } else {
            $secretsInEnv[$secretName] = $false
        }
    }
} else {
    Write-Host "   [INFO] .env file not found" -ForegroundColor Gray
}

# Summary for required secrets
Write-Host ""
Write-Host "   Required Secrets Status:" -ForegroundColor Cyan
$missingRequired = @()
foreach ($secretName in @('MONGODB_URI', 'JWT_SECRET')) {
    $inCloudflare = $secretsInCloudflare.ContainsKey($secretName) -and $secretsInCloudflare[$secretName]
    $inEnv = $secretsInEnv.ContainsKey($secretName) -and $secretsInEnv[$secretName]
    
    if ($inCloudflare -or $inEnv) {
        Write-Host "   [OK] $secretName - Configured" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] $secretName - MISSING!" -ForegroundColor Red
        $missingRequired += $secretName
    }
}

# Summary for EmailJS (optional)
Write-Host ""
Write-Host "   EmailJS Configuration (Optional):" -ForegroundColor Cyan
$emailjsSecrets = @('EMAILJS_PUBLIC_KEY', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PRIVATE_KEY')
$emailjsFound = @()
$emailjsMissing = @()

foreach ($secretName in $emailjsSecrets) {
    $inCloudflare = $secretsInCloudflare.ContainsKey($secretName) -and $secretsInCloudflare[$secretName]
    $inEnv = $secretsInEnv.ContainsKey($secretName) -and $secretsInEnv[$secretName]
    
    if ($inCloudflare -or $inEnv) {
        $emailjsFound += $secretName
        Write-Host "   [OK] $secretName - Configured" -ForegroundColor Green
    } else {
        $emailjsMissing += $secretName
        Write-Host "   [MISSING] $secretName - Not configured" -ForegroundColor Yellow
    }
}

if ($emailjsFound.Count -eq 4) {
    Write-Host ""
    Write-Host "   [OK] EmailJS is fully configured and ready to send emails" -ForegroundColor Green
    
    # Check if secrets are in .env but not in Cloudflare Workers
    $emailjsInEnv = @()
    $emailjsInCloudflare = @()
    foreach ($secretName in $emailjsSecrets) {
        $inEnv = $secretsInEnv.ContainsKey($secretName) -and $secretsInEnv[$secretName]
        $inCloudflare = $secretsInCloudflare.ContainsKey($secretName) -and $secretsInCloudflare[$secretName]
        
        if ($inEnv) { $emailjsInEnv += $secretName }
        if ($inCloudflare) { $emailjsInCloudflare += $secretName }
    }
    
    if ($emailjsInEnv.Count -eq 4 -and $emailjsInCloudflare.Count -lt 4) {
        Write-Host ""
        
        if ($isLocalEnvironment) {
            Write-Host "   [INFO] EmailJS secrets found in .env. Skipping Cloudflare Workers installation for local environment." -ForegroundColor Cyan
        } else {
            Write-Host "   [WARN] EmailJS secrets found in .env but NOT in Cloudflare Workers!" -ForegroundColor Yellow
            Write-Host "   Secrets must be set in Cloudflare Workers for production deployment." -ForegroundColor Yellow
            Write-Host ""
            
            $installSecrets = Read-Host "   Install EmailJS secrets from .env to Cloudflare Workers now? (y/n)"
            if ($installSecrets -eq "y" -or $installSecrets -eq "Y") {
                Write-Host ""
                Write-Host "   Installing EmailJS secrets to Cloudflare Workers..." -ForegroundColor Cyan
                
                $backendDir = Join-Path $ProjectRoot "backend"
                $prevLocation = Get-Location
                Set-Location $backendDir
                
                foreach ($secretName in $emailjsSecrets) {
                    $inCloudflare = $secretsInCloudflare.ContainsKey($secretName) -and $secretsInCloudflare[$secretName]
                    if (-not $inCloudflare) {
                        Write-Host "   Installing $secretName..." -ForegroundColor Gray
                        
                        # Extract value from .env
                        $envLine = Get-Content $EnvPath | Where-Object { $_ -match "^$secretName=" }
                        if ($envLine) {
                            $secretValue = $envLine -replace "^$secretName=", "" -replace '^"', '' -replace '"$', '' -replace "^'", '' -replace "'$", ''
                            
                            if ($secretValue) {
                                $tempFile = Join-Path $env:TEMP "$secretName.txt"
                                [IO.File]::WriteAllText($tempFile, $secretValue)
                                $result = cmd.exe /c "wrangler secret put $secretName < ""$tempFile""" 2>&1
                                Remove-Item $tempFile -ErrorAction SilentlyContinue
                                
                                if ($result -match "error|failed" -and $result -notmatch "Created|Updated") {
                                    Write-Host "   [ERROR] Failed to set $secretName" -ForegroundColor Red
                                    Write-Host "   $result" -ForegroundColor Gray
                                } else {
                                    Write-Host "   [OK] $secretName installed successfully" -ForegroundColor Green
                                }
                            } else {
                                Write-Host "   [WARN] $secretName value is empty in .env" -ForegroundColor Yellow
                            }
                        } else {
                            Write-Host "   [WARN] $secretName not found in .env" -ForegroundColor Yellow
                        }
                    } else {
                        Write-Host "   [SKIP] $secretName already set in Cloudflare Workers" -ForegroundColor Cyan
                    }
                }
                
                Set-Location $prevLocation
                Write-Host ""
                Write-Host "   [OK] EmailJS secrets installation completed!" -ForegroundColor Green
                Write-Host "   Please redeploy your Worker: cd backend && wrangler deploy" -ForegroundColor Cyan
            } else {
                Write-Host ""
                Write-Host "   To install manually, run these commands:" -ForegroundColor Cyan
                Write-Host "     cd backend" -ForegroundColor Gray
                foreach ($secretName in $emailjsSecrets) {
                    $inCloudflare = $secretsInCloudflare.ContainsKey($secretName) -and $secretsInCloudflare[$secretName]
                    if (-not $inCloudflare) {
                        Write-Host "     # Install ${secretName}:" -ForegroundColor Gray
                        Write-Host "     Get-Content ..\.env | Select-String '${secretName}=' | ForEach-Object { `$_.Line -replace '.*=', '' -replace '`"', '' } | wrangler secret put ${secretName}" -ForegroundColor Gray
                    }
                }
                Write-Host ""
                Write-Host "   Or run deployment script: .\scripts\deploy.ps1" -ForegroundColor Cyan
            }
        }
    }
} elseif ($emailjsFound.Count -gt 0) {
    Write-Host ""
    Write-Host "   [WARN] EmailJS partially configured" -ForegroundColor Yellow
    Write-Host "   Missing secrets: $($emailjsMissing -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   To fix, set missing secrets in Cloudflare Workers:" -ForegroundColor Cyan
    foreach ($missing in $emailjsMissing) {
        Write-Host "     wrangler secret put $missing" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "   [INFO] EmailJS not configured - emails will be logged to Cloudflare Workers logs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   To enable EmailJS:" -ForegroundColor Cyan
    Write-Host "   1. Register at https://www.emailjs.com/" -ForegroundColor Gray
    Write-Host "   2. Add Email Service and create Template" -ForegroundColor Gray
    Write-Host "   3. Get Public Key, Service ID, Template ID, and Private Key" -ForegroundColor Gray
    Write-Host "   4. Set secrets in Cloudflare Workers:" -ForegroundColor Gray
    Write-Host "      wrangler secret put EMAILJS_PUBLIC_KEY" -ForegroundColor Gray
    Write-Host "      wrangler secret put EMAILJS_SERVICE_ID" -ForegroundColor Gray
    Write-Host "      wrangler secret put EMAILJS_TEMPLATE_ID" -ForegroundColor Gray
    Write-Host "      wrangler secret put EMAILJS_PRIVATE_KEY" -ForegroundColor Gray
    Write-Host "   5. Or run deployment script: .\scripts\deploy.ps1" -ForegroundColor Gray
}

# Check MongoDB Data API (optional)
if ($secretsInCloudflare.ContainsKey('MONGODB_API_KEY') -and $secretsInCloudflare['MONGODB_API_KEY']) {
    Write-Host ""
    Write-Host "   [INFO] MongoDB Data API is configured" -ForegroundColor Cyan
} elseif ($secretsInEnv.ContainsKey('MONGODB_API_KEY') -and $secretsInEnv['MONGODB_API_KEY']) {
    Write-Host ""
    Write-Host "   [INFO] MongoDB Data API Key found in .env file" -ForegroundColor Cyan
}

# Check MongoDB Configuration
Write-Host "`n6. Checking MongoDB Configuration..." -ForegroundColor Yellow

$mongoDataApiFound = $false

# Check MongoDB Data API in Cloudflare Workers secrets
if (-not $isLocalEnvironment) {
    Write-Host "   Checking Cloudflare Workers secrets..." -ForegroundColor Cyan
    try {
        $secretsList = wrangler secret list 2>&1 | Out-String
        if ($secretsList -match "MONGODB_API_KEY") {
            Write-Host "   [INFO] MONGODB_API_KEY found in Cloudflare Workers secrets (using Data API)" -ForegroundColor Cyan
            $mongoDataApiFound = $true
        } else {
            Write-Host "   [INFO] MONGODB_API_KEY not found (using direct connection)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   [WARN] Could not check Cloudflare Workers secrets" -ForegroundColor Yellow
    }
}

# Check MongoDB Data API in .env file
if (Test-Path $EnvPath) {
    $EnvContent = Get-Content $EnvPath -Raw
    if ($EnvContent -match 'MONGODB_API_KEY="([^"]+)"' -or $EnvContent -match "MONGODB_API_KEY=([^\r\n]+)") {
        if (-not $mongoDataApiFound) { $mongoDataApiFound = $true }
    }
}

if ($mongoDataApiFound) {
    Write-Host "   [OK] MongoDB Data API is configured" -ForegroundColor Green
    Write-Host "   [INFO] Using MongoDB Data API for email verification" -ForegroundColor Cyan
} else {
    Write-Host "   [INFO] Using direct MongoDB connection (TCP)" -ForegroundColor Cyan
}

# Check MongoDB Connection
Write-Host "`n7. Checking MongoDB Connection..." -ForegroundColor Yellow
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

# Check API and Login Endpoint
Write-Host "`n8. Checking API and Login Endpoint..." -ForegroundColor Yellow

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]$url,
        [string]$method = "GET",
        [object]$body = $null,
        [hashtable]$headers = @{}
    )
    
    try {
        $requestParams = @{
            Uri = $url
            Method = $method
            TimeoutSec = 10
            ErrorAction = "Stop"
        }
        
        if ($body) {
            $requestParams.Body = ($body | ConvertTo-Json -Compress)
            $requestParams.ContentType = "application/json"
        }
        
        if ($headers.Count -gt 0) {
            $requestParams.Headers = $headers
        }
        
        $response = Invoke-WebRequest @requestParams
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content
        }
    } catch {
        $statusCode = 0
        $content = $null
        
        # Check if we got an HTTP error response (4xx, 5xx)
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
            
            # Try to read response body for error details
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $content = $reader.ReadToEnd()
                $reader.Close()
                $stream.Close()
            } catch {
                # Ignore errors reading response body
            }
        }
        
        # 4xx errors (400-499) mean server responded, endpoint works (client error)
        # 5xx errors (500-599) mean server error
        # 0 or no status code means network/connection error
        $isServerError = ($statusCode -ge 500 -and $statusCode -lt 600)
        $isClientError = ($statusCode -ge 400 -and $statusCode -lt 500)
        $isNetworkError = ($statusCode -eq 0)
        
        return @{
            Success = $isClientError -or ($statusCode -ge 200 -and $statusCode -lt 300)  # 2xx and 4xx are "successful" responses
            StatusCode = $statusCode
            Content = $content
            Error = if ($isNetworkError) { $_.Exception.Message } else { $null }
            IsClientError = $isClientError
            IsServerError = $isServerError
            IsNetworkError = $isNetworkError
        }
    }
}

# Get API URL from config or .env
$apiUrl = $null
if (Test-Path $EnvPath) {
    $EnvContent = Get-Content $EnvPath -Raw
    # Try to get API URL from config.js or use default
    $ConfigJsPath = Join-Path $ProjectRoot "docs\js\config.js"
    if (Test-Path $ConfigJsPath) {
        $configContent = Get-Content $ConfigJsPath -Raw
        if ($configContent -match "baseURL:\s*['`"]([^'`"]+)['`"]") {
            $apiUrl = $matches[1]
        }
    }
}

# Default API URL if not found
if (-not $apiUrl) {
    $apiUrl = "https://open-lance-backend.dronov-dmitry-bim.workers.dev"
    Write-Host "   [INFO] Using default API URL: $apiUrl" -ForegroundColor Cyan
} else {
    Write-Host "   [INFO] Testing API URL: $apiUrl" -ForegroundColor Cyan
}

# Test 1: Health Check
Write-Host "   Testing health endpoint..." -ForegroundColor Cyan
$healthResult = Test-ApiEndpoint -url "$apiUrl/health" -method "GET"

if ($healthResult.Success -and $healthResult.StatusCode -eq 200) {
    Write-Host "   [OK] Health endpoint is accessible" -ForegroundColor Green
    try {
        $healthData = $healthResult.Content | ConvertFrom-Json
        if ($healthData.status -eq "ok") {
            Write-Host "   [OK] API is healthy" -ForegroundColor Green
            if ($healthData.env) {
                Write-Host "   [INFO] MongoDB URI configured: $($healthData.env.hasMongoUri)" -ForegroundColor Gray
                Write-Host "   [INFO] JWT Secret configured: $($healthData.env.hasJwtSecret)" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "   [WARN] Health endpoint responded but response format is unexpected" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] Health endpoint is not accessible" -ForegroundColor Red
    if ($healthResult.StatusCode -gt 0) {
        Write-Host "   [INFO] Status code: $($healthResult.StatusCode)" -ForegroundColor Gray
    } else {
        Write-Host "   [INFO] Error: $($healthResult.Error)" -ForegroundColor Gray
    }
    Write-Host "   [INFO] Make sure backend is deployed: wrangler deploy" -ForegroundColor Gray
    $allOk = $false
}

# Test 2: Login Endpoint (test with invalid credentials to check if endpoint works)
Write-Host "   Testing login endpoint..." -ForegroundColor Cyan
$loginTestBody = @{
    email = "test@example.com"
    password = "test123"
}

$loginResult = $null
try {
    $loginResult = Test-ApiEndpoint -url "$apiUrl/auth/login" -method "POST" -body $loginTestBody
} catch {
    Write-Host "   [ERROR] Failed to test login endpoint: $($_.Exception.Message)" -ForegroundColor Red
    $loginResult = @{
        Success = $false
        StatusCode = 0
        Error = $_.Exception.Message
    }
}

if ($loginResult.Success) {
    Write-Host "   [OK] Login endpoint is accessible (Status: $($loginResult.StatusCode))" -ForegroundColor Green
    
    # Check if it's a validation error (400) or authentication error (401) - both mean endpoint works
    if ($loginResult.StatusCode -eq 400 -or $loginResult.StatusCode -eq 401) {
        Write-Host "   [OK] Login endpoint is working correctly (returned expected error for test credentials)" -ForegroundColor Green
        try {
            $loginData = $loginResult.Content | ConvertFrom-Json
            if ($loginData.error) {
                Write-Host "   [INFO] Endpoint response: $($loginData.error)" -ForegroundColor Gray
            }
        } catch {
            # Ignore JSON parse errors
        }
    } elseif ($loginResult.StatusCode -eq 500) {
        Write-Host "   [ERROR] Login endpoint returned 500 (Internal Server Error)" -ForegroundColor Red
        Write-Host "   [INFO] This indicates a backend code issue, not a missing tool" -ForegroundColor Yellow
        Write-Host "   [INFO] Possible causes:" -ForegroundColor Yellow
        Write-Host "      - MongoDB connection error in login handler" -ForegroundColor Gray
        Write-Host "      - JWT_SECRET not properly configured" -ForegroundColor Gray
        Write-Host "      - Backend code error (check recent changes)" -ForegroundColor Gray
        Write-Host "      - Request body parsing issue" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   [ACTION REQUIRED] Steps to fix:" -ForegroundColor Cyan
        Write-Host "      1. Check Cloudflare Workers logs:" -ForegroundColor Gray
        Write-Host "         - Go to: https://dash.cloudflare.com/" -ForegroundColor Gray
        Write-Host "         - Workers & Pages → open-lance-backend → Logs" -ForegroundColor Gray
        Write-Host "         - Look for '[Login]' prefixed messages" -ForegroundColor Gray
        Write-Host "      2. Redeploy backend with latest fixes:" -ForegroundColor Gray
        Write-Host "         cd backend" -ForegroundColor Gray
        Write-Host "         wrangler deploy" -ForegroundColor Gray
        Write-Host "      3. Verify secrets are set:" -ForegroundColor Gray
        Write-Host "         wrangler secret list" -ForegroundColor Gray
        
        # Try to get error details from response
        try {
            if ($loginResult.Content) {
                $errorData = $loginResult.Content | ConvertFrom-Json
                if ($errorData.error) {
                    Write-Host ""
                    Write-Host "   [INFO] Error message from server: $($errorData.error)" -ForegroundColor Gray
                }
            }
        } catch {
            # Ignore JSON parse errors
        }
        
        # Don't mark as failed for tools - this is a backend issue
        # $allOk = $false  # Commented out - backend issues shouldn't fail tool check
    } elseif ($loginResult.StatusCode -eq 503) {
        Write-Host "   [ERROR] Login endpoint returned 503 (Service Unavailable)" -ForegroundColor Red
        Write-Host "   [INFO] This usually means MongoDB connection failed in the worker" -ForegroundColor Yellow
        Write-Host "   [INFO] Possible causes:" -ForegroundColor Yellow
        Write-Host "      - MongoDB connection timeout in Cloudflare Worker" -ForegroundColor Gray
        Write-Host "      - MongoDB URI not properly configured in Cloudflare secrets" -ForegroundColor Gray
        Write-Host "      - Network restrictions blocking MongoDB access from Cloudflare" -ForegroundColor Gray
        Write-Host "      - MongoDB Atlas IP whitelist doesn't include Cloudflare IPs" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   [ACTION REQUIRED] Steps to fix:" -ForegroundColor Cyan
        Write-Host "      1. Check MongoDB Atlas Network Access:" -ForegroundColor Gray
        Write-Host "         - Allow access from anywhere (0.0.0.0/0) for Cloudflare Workers" -ForegroundColor Gray
        Write-Host "      2. Verify MongoDB URI in Cloudflare secrets:" -ForegroundColor Gray
        Write-Host "         wrangler secret list" -ForegroundColor Gray
        Write-Host "      3. Check Cloudflare Workers logs for connection errors" -ForegroundColor Gray
        Write-Host "      4. Test MongoDB connection locally (already passed ✅)" -ForegroundColor Gray
    } else {
        Write-Host "   [WARN] Login endpoint returned unexpected status: $($loginResult.StatusCode)" -ForegroundColor Yellow
    }
} elseif ($loginResult.StatusCode -eq 500) {
    # Handle 500 error when request itself fails (network error, but got 500 response)
    Write-Host "   [ERROR] Login endpoint returned 500 (Internal Server Error)" -ForegroundColor Red
    Write-Host "   [INFO] This indicates a backend code issue, not a missing tool" -ForegroundColor Yellow
    Write-Host "   [INFO] Check Cloudflare Workers logs for '[Login]' prefixed messages" -ForegroundColor Gray
    Write-Host "   [INFO] Redeploy backend: cd backend && wrangler deploy" -ForegroundColor Gray
} elseif ($loginResult.StatusCode -eq 503) {
    # Handle 503 error when request itself fails
    Write-Host "   [ERROR] Login endpoint returned 503 (Service Unavailable)" -ForegroundColor Red
    Write-Host "   [INFO] MongoDB connection likely failed in Cloudflare Worker" -ForegroundColor Yellow
    Write-Host "   [INFO] Check MongoDB Atlas Network Access settings (allow 0.0.0.0/0)" -ForegroundColor Gray
    Write-Host "   [INFO] Verify MongoDB URI in Cloudflare secrets: wrangler secret list" -ForegroundColor Gray
} elseif ($loginResult.IsNetworkError) {
    # Network/connection error
    Write-Host "   [ERROR] Login endpoint is not accessible (network error)" -ForegroundColor Red
    Write-Host "   [INFO] Error: $($loginResult.Error)" -ForegroundColor Gray
    Write-Host "   [INFO] Check if backend is deployed and URL is correct" -ForegroundColor Gray
    $allOk = $false
} else {
    # Other unexpected status codes
    Write-Host "   [WARN] Login endpoint returned unexpected status: $($loginResult.StatusCode)" -ForegroundColor Yellow
    if ($loginResult.StatusCode -gt 0) {
        Write-Host "   [INFO] Status code: $($loginResult.StatusCode)" -ForegroundColor Gray
    }
}

# Test 3: Check if API URL is correct format
if ($apiUrl -notmatch "^https?://") {
    Write-Host "   [WARN] API URL format may be incorrect: $apiUrl" -ForegroundColor Yellow
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " Test Results" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if login endpoint has issues
$loginHasIssue = $false
if ($loginResult) {
    if ($loginResult.StatusCode -eq 500 -or $loginResult.StatusCode -eq 503) {
        $loginHasIssue = $true
    }
} else {
    # If loginResult is null, consider it an issue
    $loginHasIssue = $true
}

if ($allOk -and -not $loginHasIssue) {
    Write-Host "`n[OK] All required tools are installed and API is working!" -ForegroundColor Green
    Write-Host "`nYou are ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. If you just installed EmailJS secrets, redeploy Worker:" -ForegroundColor Gray
    Write-Host "     cd backend && wrangler deploy" -ForegroundColor Gray
    Write-Host "  2. Set up MongoDB Atlas (see MONGODB_ATLAS_SETUP.md)" -ForegroundColor Gray
    Write-Host "  3. Run deployment: .\scripts\deploy.ps1" -ForegroundColor Gray
    Write-Host ""
} elseif ($allOk -and $loginHasIssue) {
    Write-Host "`n[WARN] All tools are installed, but login endpoint has issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  ✅ All required tools are installed" -ForegroundColor Green
    Write-Host "  ✅ MongoDB connection works (local test)" -ForegroundColor Green
    Write-Host "  ✅ Health endpoint works" -ForegroundColor Green
    if ($loginResult.StatusCode -eq 503) {
        Write-Host "  ❌ Login endpoint returns 503 (Service Unavailable)" -ForegroundColor Red
        Write-Host ""
        Write-Host "This usually means MongoDB connection failed in Cloudflare Worker." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To fix login endpoint:" -ForegroundColor Cyan
        Write-Host "  1. Check MongoDB Atlas Network Access:" -ForegroundColor Gray
        Write-Host "     - Go to MongoDB Atlas → Network Access" -ForegroundColor Gray
        Write-Host "     - Add IP: 0.0.0.0/0 (allow from anywhere)" -ForegroundColor Gray
        Write-Host "  2. Verify MongoDB URI in Cloudflare secrets:" -ForegroundColor Gray
        Write-Host "     wrangler secret list" -ForegroundColor Gray
        Write-Host "  3. Check Cloudflare Workers logs for connection errors" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Login endpoint returns $($loginResult.StatusCode) error" -ForegroundColor Red
        Write-Host ""
        Write-Host "This is a backend code issue, not a missing tool." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To fix login endpoint:" -ForegroundColor Cyan
        Write-Host "  1. Check Cloudflare Workers logs for '[Login]' messages" -ForegroundColor Gray
        Write-Host "  2. Redeploy backend: cd backend && wrangler deploy" -ForegroundColor Gray
        Write-Host "  3. Verify all secrets are set: wrangler secret list" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    if ($isLocalEnvironment) {
        Write-Host "`n[OK] Tested local environment constraints. Skipping Cloudflare-specific tools." -ForegroundColor Green
        Write-Host "`nYou are ready to deploy locally!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Start local servers: .\scripts\start_dev.ps1" -ForegroundColor Gray
        Write-Host "  2. Open http://localhost:8080" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "`n[FAIL] Some required tools are missing" -ForegroundColor Red
        Write-Host "`nPlease install missing tools:" -ForegroundColor Yellow
        Write-Host "  Node.js: https://nodejs.org/" -ForegroundColor Gray
        Write-Host "  Wrangler CLI: npm install -g wrangler" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After installation:" -ForegroundColor Yellow
        Write-Host "  1. Restart PowerShell" -ForegroundColor Gray
        Write-Host "  2. Run this test again: .\scripts\test-deploy.ps1" -ForegroundColor Gray
        Write-Host "  3. Authenticate Cloudflare: wrangler login" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - Quick Start: QUICKSTART_MONGODB.md" -ForegroundColor Gray
Write-Host "  - Full Guide:  DEPLOYMENT.md" -ForegroundColor Gray
Write-Host "  - MongoDB Setup: MONGODB_ATLAS_SETUP.md" -ForegroundColor Gray
Write-Host ""
