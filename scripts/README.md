# Deployment Scripts v3.0

Automated deployment scripts for Open-Lance platform with Cloudflare Workers + MongoDB Atlas.

## 🚀 Fast Start

```bash
# 1. Clone repo
git clone https://github.com/your-username/open-lance.git
cd open-lance

# 2. Set up MongoDB Atlas manually (register + create cluster)
#    See: MONGODB_ATLAS_SETUP.md (русская инструкция внутри!)

# 3. Run MongoDB setup script (OPTIONAL, but recommended)
cd backend
node ../scripts/setup-mongodb.js

# 4. Run deployment script
cd ..
./scripts/deploy.sh  # Linux/Mac
# или
.\scripts\deploy.ps1  # Windows

# 5. Follow instructions

# 6. After 5-10 minutes all works!
```

## ⚡ What's New in v3.0

- ✅ **Cloudflare Workers** instead of AWS Lambda (Edge computing!)
- ✅ MongoDB Atlas integration (cloud database)
- ✅ **MongoDB setup automation script** (NEW!)
- ✅ Simpler deployment (no AWS account needed)
- ✅ Faster deployment (~5 minutes)
- ✅ Global edge network (200+ locations)

## 📋 Available Scripts

### 🆕 1. `setup-mongodb.js` 

**NEW!** Automates MongoDB Atlas database setup after cluster creation.

**What it does:**
- ✅ Tests connection to MongoDB Atlas
- ✅ Creates collections (`users`, `tasks`, `applications`)
- ✅ Creates all necessary indexes
- ✅ (Optional) Adds test data
- ✅ Shows database summary

**Usage:**
```bash
cd backend
node ../scripts/setup-mongodb.js
```

**📚 Detailed guide:** [SETUP_MONGODB_GUIDE.md](./SETUP_MONGODB_GUIDE.md)

**⚠️ Important:** 
- You must manually create MongoDB Atlas cluster first
- See [MONGODB_ATLAS_SETUP.md](../MONGODB_ATLAS_SETUP.md) for step-by-step guide (есть на русском!)
- This script only sets up the database structure

---

### 2. `deploy.sh` / `deploy.ps1`

Main deployment script for Cloudflare Workers + MongoDB Atlas.

**Usage (Linux/Mac):**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Usage (Windows):**
```powershell
.\scripts\deploy.ps1
```

**What it does:**
- ✅ Checks prerequisites (Node.js, npm, Wrangler CLI)
- ✅ Authenticates with Cloudflare (`wrangler login`)
- ✅ Collects configuration (MongoDB URI, etc.)
- ✅ Deploys Cloudflare Worker
- ✅ Configures frontend
- ✅ Tests deployment
- ✅ Shows summary with next steps

**Deployment steps:**
1. Check Node.js, npm, wrangler
2. Cloudflare authentication
3. MongoDB Atlas configuration
4. Deploy backend to Cloudflare Workers
5. Set secrets (MONGODB_URI, JWT_SECRET)
6. Configure frontend config.js
7. Test API endpoint
8. Show deployment summary

**Time:** ~5-10 minutes

---

### 3. `test-deploy.ps1` (Windows)

Quick prerequisites test script.

**Usage:**
```powershell
.\scripts\test-deploy.ps1
```

**What it checks:**
- ✅ Node.js installed
- ✅ npm installed
- ✅ Wrangler CLI installed
- ✅ Cloudflare authentication

**When to use:**
- Before running deployment
- After installing new tools
- Troubleshooting deployment issues

---

### 4. `cleanup.sh` / `cleanup.ps1`

Cleanup script for removing deployed resources and local configuration.

**Usage (Linux/Mac):**
```bash
./scripts/cleanup.sh
```

**Usage (Windows):**
```powershell
.\scripts\cleanup.ps1
```

**What it does:**
- ✅ Removes Cloudflare Worker
- ✅ Deletes local configuration files (.deploy-config, .env)
- ✅ Cleans up frontend config
- ⚠️ Does NOT delete MongoDB Atlas data (manage separately in Atlas dashboard)
- ✅ Tests the deployment
- ✅ Provides next steps

**Changes in v2.0:**
- 🔄 Prompts for MongoDB Atlas connection string
- 🔄 No longer requires secondary AWS account
- 🔄 Terraform deployment is optional (not required)

### 5. `deploy.ps1` (Windows) - v2.0

Automated deployment script for Windows PowerShell with MongoDB Atlas.

**Usage:**
```powershell
.\scripts\deploy.ps1
```

**Options:**
```powershell
# Deploy to production
.\scripts\deploy.ps1 -Environment prod

# Skip infrastructure (backend only)
.\scripts\deploy.ps1 -SkipInfrastructure

# Skip backend (infrastructure only)
.\scripts\deploy.ps1 -SkipBackend

# Show help
.\scripts\deploy.ps1 -Help
```

**Changes in v2.0:**
- 🔄 Prompts for MongoDB Atlas connection string
- 🔄 Simplified configuration
- 🔄 No longer requires Terraform

---

### 5. Other scripts

**`check-region-consistency.sh/ps1`** - ❌ Deprecated (not needed for Cloudflare Workers)
**`test-deploy.ps1`** - Prerequisites checker (see section 3 above)

## Quick Start

### First-Time Deployment

**Linux/Mac:**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

**Windows:**
```powershell
# Run deployment
.\scripts\deploy.ps1
```

### What You Need

Before running the scripts, ensure you have:

1. **AWS CLI configured**
   ```bash
   aws configure
   ```

2. **Two AWS Accounts**
   - Primary account (already configured)
   - Secondary account ID ready

3. **GitHub Repository**
   - Repository created
   - GitHub Pages URL known

4. **Required Tools Installed**
   - Node.js >= 18.x
   - npm >= 9.x
   - AWS CLI >= 2.x
   - Terraform >= 1.0

## Script Flow

```
┌─────────────────────────────────────┐
│  1. Check Prerequisites             │
│     - Node.js, npm, AWS CLI, etc.   │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  2. Validate AWS Credentials        │
│     - Get primary account ID        │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  3. Collect Configuration           │
│     - Environment (dev/prod)        │
│     - Secondary account ID          │
│     - GitHub Pages URL              │
│     - Generate JWT secret           │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  4. Deploy Infrastructure           │
│     - Create terraform.tfvars       │
│     - Run terraform apply           │
│     - Save outputs                  │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  5. Deploy Backend                  │
│     - Install dependencies          │
│     - Create .env file              │
│     - Run serverless deploy         │
│     - Get API Gateway URL           │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  6. Configure Frontend              │
│     - Update config.js              │
│     - Set API URL and Cognito IDs   │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  7. Test Deployment                 │
│     - Test backend health           │
│     - Verify API responds           │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  8. Show Summary & Next Steps       │
└─────────────────────────────────────┘
```

## Configuration Files

Scripts create these files (automatically added to .gitignore):

| File | Purpose |
|------|---------|
| `.deploy-config` | Deployment configuration (credentials) |
| `.terraform-outputs.json` | Terraform output values |
| `backend/.env` | Backend environment variables |
| `infrastructure/terraform/terraform.tfvars` | Terraform variables |

**⚠️ Never commit these files to Git!**

## Troubleshooting

### "Command not found"

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
```

**Windows:**
```powershell
# Enable script execution
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### "AWS credentials not configured"

```bash
aws configure
# Enter your AWS Access Key ID and Secret Access Key
```

### "Terraform state locked"

```bash
cd infrastructure/terraform
terraform force-unlock <LOCK_ID>
```

### "Serverless deployment failed"

Check:
- AWS credentials are valid
- Region is correct
- IAM permissions are sufficient

### Script stops unexpectedly

Run with verbose output:

**Linux/Mac:**
```bash
bash -x scripts/deploy.sh
```

**Windows:**
```powershell
$VerbosePreference = "Continue"
.\scripts\deploy.ps1
```

## Manual Deployment

If scripts fail, follow manual steps in [DEPLOYMENT.md](../DEPLOYMENT.md).

## Re-running Scripts

Scripts are idempotent - safe to run multiple times:

1. **Configuration is saved** - reused on subsequent runs
2. **Terraform manages state** - only applies changes
3. **Serverless updates** - doesn't duplicate resources

To force reconfiguration:
```bash
rm .deploy-config
./scripts/deploy.sh
```

## Cleanup

To remove all deployed resources:

**Linux/Mac:**
```bash
./scripts/cleanup.sh
```

**⚠️ This will DELETE all data!**

## Advanced Usage

### Deploy Only Infrastructure

**Linux/Mac:**
```bash
# Edit deploy.sh, comment out backend deployment section
./scripts/deploy.sh
```

**Windows:**
```powershell
.\scripts\deploy.ps1 -SkipBackend
```

### Deploy Only Backend

**Windows:**
```powershell
.\scripts\deploy.ps1 -SkipInfrastructure
```

### Use Different Environments

```bash
# Development
./scripts/deploy.sh  # defaults to dev

# Production
# Edit .deploy-config and change ENVIRONMENT=prod
./scripts/deploy.sh
```

## CI/CD Integration

These scripts can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Deploy Open-Lance
  run: |
    ./scripts/deploy.sh
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

See [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) for full example.

## Support

For issues with scripts:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [DEPLOYMENT.md](../DEPLOYMENT.md) for manual steps
3. Open an issue on GitHub

---

**Scripts tested on:**
- Ubuntu 20.04+
- macOS 12+
- Windows 10/11 with PowerShell 5.1+
