# Scripts Changelog - v2.0

## Summary of Changes

All deployment scripts have been updated for MongoDB Atlas integration.

---

## Updated Scripts

### ✅ deploy.sh (Linux/Mac)

**Changes:**
- Removed secondary AWS account requirements
- Added MongoDB Atlas URI input
- Removed Terraform infrastructure deployment
- Simplified configuration process
- Updated environment variables

**New Configuration:**
- MongoDB URI (required)
- MongoDB Database name (default: open-lance)
- Frontend URL (default: *)
- JWT Secret (auto-generated)

---

### ✅ deploy.ps1 (Windows)

**Changes:**
- Same as deploy.sh but for Windows PowerShell
- Updated help text
- Removed `-SkipInfrastructure` option (Terraform optional)
- Added MongoDB prompts
- Simplified deployment flow

**New Configuration:**
- MongoDB URI (required)
- MongoDB Database name
- Frontend URL
- JWT Secret (auto-generated)

---

### ✅ cleanup.sh (Linux/Mac)

**Changes:**
- Removed DynamoDB cleanup
- Added MongoDB Atlas data retention notice
- Simplified cleanup process
- Updated warnings and instructions

**Now removes:**
- Lambda functions
- API Gateway
- Local config files

**Does NOT remove:**
- MongoDB Atlas data (manual deletion required)

---

### ✅ cleanup.ps1 (Windows)

**Changes:**
- Same as cleanup.sh but for Windows PowerShell
- Added `-Force` option to skip confirmation
- Improved error handling
- MongoDB cleanup instructions

---

### ✅ test-deploy.ps1 (Windows)

**Changes:**
- Updated prerequisites check
- Added version 2.0 information
- Noted Terraform as optional
- Added MongoDB setup reminder

---

### ✅ check-region-consistency.sh/ps1

**No changes required** - these scripts check AWS region configuration which is still relevant.

---

## Configuration File Changes

### Old (.deploy-config)
```bash
ENVIRONMENT=dev
AWS_REGION=us-east-1
PRIMARY_ACCOUNT=123456789012
SECONDARY_ACCOUNT=210987654321
GITHUB_URL=https://username.github.io
JWT_SECRET=abc...xyz
COGNITO_USER_POOL_ID=us-east-1_XXXXX
COGNITO_CLIENT_ID=xxxxx
```

### New (.deploy-config)
```bash
# Open-Lance Deployment Configuration v2.0
ENVIRONMENT=dev
AWS_REGION=us-east-1
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=open-lance
FRONTEND_URL=https://username.github.io
JWT_SECRET=abc...xyz
API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/dev
```

---

## Environment Variables Changes

### Backend .env File

**Old:**
```bash
PRIMARY_ACCOUNT_ID=123456789012
SECONDARY_ACCOUNT_ID=210987654321
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXX
COGNITO_CLIENT_ID=xxxxx
JWT_SECRET=abc...xyz
ALLOWED_ORIGIN=https://...
```

**New:**
```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=open-lance

# JWT Secret
JWT_SECRET=abc...xyz

# CORS
ALLOWED_ORIGIN=https://...

# Stage
STAGE=dev
```

---

## Breaking Changes

### Removed Features

1. ❌ **Secondary AWS Account**: No longer required or supported
2. ❌ **Terraform Infrastructure**: Now optional (not required for basic deployment)
3. ❌ **Cognito Configuration**: No longer used in v2.0
4. ❌ **DynamoDB Cleanup**: No longer needed

### New Requirements

1. ✅ **MongoDB Atlas Account**: Required (free tier available)
2. ✅ **MongoDB Connection URI**: Must be provided during deployment
3. ✅ **Simplified AWS Setup**: Only one AWS account needed

---

## Migration Path

For users migrating from v1.x scripts:

1. **Remove old config:**
   ```bash
   rm .deploy-config .deploy-config.ps1
   ```

2. **Run new deployment:**
   ```bash
   ./scripts/deploy.sh  # or deploy.ps1 on Windows
   ```

3. **Provide MongoDB URI when prompted**

4. **Test deployment**

---

## Usage Examples

### Linux/Mac

```bash
# Full deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Cleanup
./scripts/cleanup.sh
```

### Windows

```powershell
# Full deployment
.\scripts\deploy.ps1

# Deploy to production
.\scripts\deploy.ps1 -Environment prod

# Skip backend (configure frontend only)
.\scripts\deploy.ps1 -SkipBackend

# Cleanup
.\scripts\cleanup.ps1 -Environment dev

# Force cleanup (no confirmation)
.\scripts\cleanup.ps1 -Environment prod -Force
```

---

## Testing

### Prerequisites Test

```powershell
# Windows
.\scripts\test-deploy.ps1

# Linux/Mac
# (Use the checks in deploy.sh automatically)
```

### Region Consistency

```bash
# Linux/Mac
./scripts/check-region-consistency.sh

# Windows
.\scripts\check-region-consistency.ps1
```

---

## Troubleshooting

### "MongoDB URI required"

**Solution:** Set up MongoDB Atlas first:
```bash
# See MONGODB_ATLAS_SETUP.md
```

### "Serverless not found"

**Solution:** Scripts will auto-install Serverless Framework:
```bash
npm install -g serverless
```

### "AWS credentials not configured"

**Solution:**
```bash
aws configure
```

---

## Documentation

For more information, see:
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Full deployment guide
- [MONGODB_ATLAS_SETUP.md](../MONGODB_ATLAS_SETUP.md) - MongoDB setup
- [QUICKSTART_MONGODB.md](../QUICKSTART_MONGODB.md) - Quick start guide
- [MIGRATION_DYNAMODB_TO_MONGODB.md](../MIGRATION_DYNAMODB_TO_MONGODB.md) - Migration guide

---

**Scripts updated:** March 2026  
**Version:** 2.0.0  
**Status:** Production Ready
