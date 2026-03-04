# Automated Deployment Scripts Guide

Complete guide for using automated deployment scripts.

## 📋 Overview

Open-Lance includes automated deployment scripts that handle the entire deployment process:

| Script | Platform | Purpose |
|--------|----------|---------|
| `deploy.sh` | Linux/Mac | Full automated deployment |
| `deploy.ps1` | Windows | Full automated deployment |
| `cleanup.sh` | Linux/Mac | Remove all AWS resources |

## 🚀 Quick Deploy

### One-Command Deployment

**Linux/Mac:**
```bash
./scripts/deploy.sh
```

**Windows:**
```powershell
.\scripts\deploy.ps1
```

That's it! The script handles everything.

## 📝 What the Scripts Do

### 1. Prerequisites Check ✅

Verifies you have installed:
- Node.js >= 18.x
- npm >= 9.x
- AWS CLI >= 2.x
- Terraform >= 1.0
- Serverless Framework

If anything is missing, the script tells you what to install.

### 2. AWS Credentials Validation ✅

- Checks AWS CLI is configured
- Gets your AWS account ID
- Verifies you have access

### 3. Interactive Configuration ✅

Asks you for:
- **Environment**: dev or prod
- **AWS Region**: Default us-east-1
- **Secondary Account ID**: Your second AWS account
- **GitHub Pages URL**: Where frontend will be hosted
- **JWT Secret**: Auto-generated securely

Configuration is saved for future deployments.

### 4. Infrastructure Deployment ✅

- Creates `terraform.tfvars` automatically
- Runs `terraform init`
- Shows you what will be created
- Asks for confirmation
- Deploys:
  - DynamoDB tables (both accounts)
  - Cognito User Pool
  - IAM roles
  - CloudWatch alarms

### 5. Backend Deployment ✅

- Installs Node.js dependencies
- Creates `.env` file with secrets
- Deploys all Lambda functions
- Creates API Gateway
- Gets and saves API URL

### 6. Frontend Configuration ✅

- Updates `frontend/js/config.js`
- Sets API Gateway URL
- Configures Cognito credentials
- Everything ready for GitHub Pages

### 7. Testing & Verification ✅

- Tests backend API health
- Verifies endpoints respond
- Reports any issues

### 8. Summary & Next Steps ✅

Displays:
- All deployed resource IDs
- API Gateway URL
- What to do next
- How to test

## 💡 Usage Examples

### Basic Deployment

**Linux/Mac:**
```bash
cd /path/to/open-lance
chmod +x scripts/*.sh
./scripts/deploy.sh
```

**Windows:**
```powershell
cd C:\path\to\open-lance
.\scripts\deploy.ps1
```

### Deploy to Production

**Windows:**
```powershell
.\scripts\deploy.ps1 -Environment prod
```

Then manually update `.deploy-config` and rerun.

### Deploy Only Backend

**Windows:**
```powershell
.\scripts\deploy.ps1 -SkipInfrastructure
```

Useful if infrastructure already exists.

### Show Help

**Windows:**
```powershell
.\scripts\deploy.ps1 -Help
```

## 📂 Generated Files

Scripts create these files (auto-added to `.gitignore`):

### `.deploy-config` (Linux/Mac) / `.deploy-config.ps1` (Windows)

Contains your deployment configuration:
```bash
ENVIRONMENT=dev
AWS_REGION=us-east-1
PRIMARY_ACCOUNT=123456789012
SECONDARY_ACCOUNT=210987654321
GITHUB_URL=https://username.github.io
JWT_SECRET=generated-secret
COGNITO_USER_POOL_ID=us-east-1_XXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxx
API_URL=https://api-id.execute-api.us-east-1.amazonaws.com/dev
```

**⚠️ Keep this file secure! Contains secrets.**

### `backend/.env`

Backend environment variables:
```bash
PRIMARY_ACCOUNT_ID=123456789012
SECONDARY_ACCOUNT_ID=210987654321
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxx
JWT_SECRET=generated-secret
ALLOWED_ORIGIN=https://username.github.io
```

### `infrastructure/terraform/terraform.tfvars`

Terraform variables (auto-generated):
```hcl
aws_region           = "us-east-1"
environment          = "dev"
secondary_account_id = "210987654321"
allowed_origins      = ["https://username.github.io"]
jwt_secret           = "generated-secret"
# ... more settings
```

## 🔄 Re-running Scripts

Scripts are **idempotent** - safe to run multiple times:

### Use Saved Configuration

If `.deploy-config` exists:
```bash
./scripts/deploy.sh
# Choose 'y' to use existing config
```

### Force Reconfiguration

```bash
rm .deploy-config
./scripts/deploy.sh
# Will ask all questions again
```

### Update Specific Values

Edit `.deploy-config` manually:
```bash
nano .deploy-config
# Change ENVIRONMENT=prod
./scripts/deploy.sh
```

## 🧹 Cleanup

Remove all deployed AWS resources:

```bash
./scripts/cleanup.sh
```

**⚠️ WARNING:**
- Deletes ALL AWS resources
- Deletes ALL data in DynamoDB
- Cannot be undone
- Type 'yes' to confirm

What gets deleted:
- ❌ All Lambda functions
- ❌ API Gateway
- ❌ DynamoDB tables (primary + secondary)
- ❌ Cognito User Pool
- ❌ IAM roles
- ✅ Code remains intact

## 🐛 Troubleshooting

### Script Permission Denied

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
```

**Windows:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### AWS Credentials Not Configured

```bash
aws configure
# Enter:
#   AWS Access Key ID
#   AWS Secret Access Key
#   Default region: us-east-1
#   Default output: json
```

Verify:
```bash
aws sts get-caller-identity
```

### Missing Prerequisites

Install what's missing:

**Node.js:**
- Download: https://nodejs.org/

**AWS CLI:**
- Download: https://aws.amazon.com/cli/

**Terraform:**
- Download: https://www.terraform.io/downloads

**Serverless:**
```bash
npm install -g serverless
```

### Terraform State Locked

```bash
cd infrastructure/terraform
terraform force-unlock <LOCK_ID>
```

### Backend Deployment Fails

Check:
1. AWS credentials have necessary permissions
2. Region is correct in config
3. Primary account ID is correct

View Serverless logs:
```bash
cd backend
serverless logs -f <function-name> --stage dev
```

### Script Stops Unexpectedly

Run with debug output:

**Linux/Mac:**
```bash
bash -x scripts/deploy.sh 2>&1 | tee deploy.log
```

**Windows:**
```powershell
$VerbosePreference = "Continue"
.\scripts\deploy.ps1 2>&1 | Tee-Object deploy.log
```

### Cannot Assume Cross-Account Role

Ensure secondary account has:
1. Cross-account role created
2. Trust relationship with primary account
3. Correct permissions

Manual check:
```bash
aws sts assume-role \
  --role-arn arn:aws:iam::SECONDARY_ACCOUNT:role/CrossAccountRole \
  --role-session-name test
```

## ⚙️ Advanced Usage

### Customize Deployment

Edit script before running:

**Linux/Mac:**
```bash
nano scripts/deploy.sh
# Modify variables or steps
./scripts/deploy.sh
```

### Skip Prompts (CI/CD)

Create `.deploy-config` beforehand:
```bash
cat > .deploy-config <<EOF
ENVIRONMENT=dev
AWS_REGION=us-east-1
# ... all required variables
EOF

./scripts/deploy.sh
```

### Deploy Specific Components

**Deploy only infrastructure:**
```bash
cd infrastructure/terraform
terraform apply
```

**Deploy only backend:**
```bash
cd backend
serverless deploy --stage dev
```

### Use Different AWS Profiles

```bash
export AWS_PROFILE=my-profile
./scripts/deploy.sh
```

**Windows:**
```powershell
$env:AWS_PROFILE = "my-profile"
.\scripts\deploy.ps1
```

## 📊 Script Execution Time

| Phase | Duration | What Happens |
|-------|----------|--------------|
| Prerequisites | 10s | Check tools |
| Configuration | 2min | Interactive input |
| Infrastructure | 5-8min | Terraform apply |
| Backend | 3-5min | Serverless deploy |
| Frontend Config | 10s | Update files |
| Testing | 30s | Health checks |
| **Total** | **~15min** | Complete deployment |

## 🔐 Security Notes

### Files to Never Commit

Scripts automatically add to `.gitignore`:
- `.deploy-config` / `.deploy-config.ps1`
- `backend/.env`
- `infrastructure/terraform/terraform.tfvars`
- `.terraform-outputs.json`

### Secrets Management

For production:
1. Use AWS Secrets Manager
2. Don't store secrets in config files
3. Use IAM roles instead of keys
4. Enable MFA on AWS accounts

### Audit Trail

All deployments create:
- CloudWatch logs
- Terraform state
- CloudTrail events (if enabled)

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Manual deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [SECURITY.md](./SECURITY.md) - Security best practices
- [scripts/README.md](./scripts/README.md) - Script documentation

## 🆘 Getting Help

If scripts fail:

1. **Check troubleshooting section** above
2. **Review logs** in `deploy.log`
3. **Try manual deployment** using [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Open GitHub issue** with:
   - Error message
   - Script output
   - System info (OS, versions)

## ✅ Success Checklist

After script completes:

- [ ] Infrastructure deployed (Terraform success)
- [ ] Backend deployed (Serverless success)
- [ ] Frontend configured (config.js updated)
- [ ] API URL obtained
- [ ] Cognito IDs obtained
- [ ] Test passed
- [ ] Summary displayed

**Next:** Deploy frontend to GitHub Pages!

---

**Scripts make deployment easy - from nothing to running app in 15 minutes! 🚀**
