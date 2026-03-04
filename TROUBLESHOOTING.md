# Troubleshooting Guide

Common issues and solutions for deploying Open-Lance.

## Deployment Scripts Issues

### Issue: PowerShell Script Shows Encoding Errors

**Symptoms:**
```
вњ Node.js found: v22.20.0
function Write-ErrorMsg {
    param([string]Node.js found: v22.20.0)
```

**Solution:**
The script has been updated to use ASCII characters. Ensure you have the latest version:

```powershell
git pull origin main
.\scripts\deploy.ps1
```

If issues persist, run the test script first:
```powershell
.\scripts\test-deploy.ps1
```

### Issue: "Write-ErrorMsg is not recognized"

**Cause:** PowerShell execution policy or script encoding issue.

**Solution:**
1. Set execution policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

2. Run the test script to verify:
```powershell
.\scripts\test-deploy.ps1
```

### Issue: AWS CLI Not Found

**Solution:**
Install AWS CLI from: https://aws.amazon.com/cli/

After installation, configure it:
```bash
aws configure
```

### Issue: Terraform Not Found

**Solution:**
Install Terraform from: https://www.terraform.io/downloads

Windows users can use Chocolatey:
```powershell
choco install terraform
```

Or download the binary and add to PATH.

### Issue: Node.js or npm Not Found

**Solution:**
Install Node.js (includes npm) from: https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

## AWS Credential Issues

### Issue: "AWS credentials not configured"

**Solution:**
```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

Verify:
```bash
aws sts get-caller-identity
```

### Issue: "Access Denied" errors

**Solution:**
Ensure your IAM user/role has these permissions:
- DynamoDB full access
- Lambda full access
- API Gateway full access
- Cognito full access
- IAM role creation
- CloudWatch logs

## Terraform Issues

### Issue: "Terraform state locked"

**Solution:**
```bash
cd infrastructure/terraform
terraform force-unlock <LOCK_ID>
```

### Issue: "Resource already exists"

**Solution:**
Import existing resource:
```bash
terraform import aws_dynamodb_table.users open-lance-users-dev
```

Or destroy and recreate:
```bash
terraform destroy
terraform apply
```

### Issue: "No valid credential sources found"

**Solution:**
Set AWS profile:
```bash
export AWS_PROFILE=your-profile  # Linux/Mac
$env:AWS_PROFILE = "your-profile"  # Windows
```

## Serverless Deployment Issues

### Issue: "Serverless command not found"

**Solution:**
```bash
npm install -g serverless
```

### Issue: "Cannot find module 'serverless'"

**Solution:**
```bash
cd backend
npm install
```

### Issue: "Deployment bucket does not exist"

**Solution:**
Serverless will create it automatically. If issues persist:
```bash
serverless deploy --verbose
```

## Frontend Issues

### Issue: CORS errors in browser console

**Solution:**
1. Check `ALLOWED_ORIGIN` in backend `.env`
2. Redeploy backend:
```bash
cd backend
serverless deploy --stage dev
```
3. Clear browser cache

### Issue: "Unauthorized" on all API calls

**Solution:**
1. Verify JWT_SECRET matches in:
   - `backend/.env`
   - `infrastructure/terraform/terraform.tfvars`
2. Clear browser localStorage/sessionStorage
3. Try incognito/private mode

### Issue: API Gateway URL not working

**Solution:**
1. Verify URL from serverless output
2. Check API Gateway in AWS Console
3. Ensure stage is deployed
4. Check CloudWatch logs

## Cross-Account Issues

### Issue: "Cannot assume cross-account role"

**Solution:**
In secondary AWS account:

1. Create role via AWS Console:
   - IAM → Roles → Create Role
   - Trusted entity: Another AWS account
   - Account ID: your primary account ID
   - Permissions: DynamoDB full access

2. Or use AWS CLI:
```bash
aws iam create-role \
  --role-name OpenLanceCrossAccountRole \
  --assume-role-policy-document file://trust-policy.json \
  --profile secondary
```

Trust policy (trust-policy.json):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::PRIMARY_ACCOUNT_ID:root"
    },
    "Action": "sts:AssumeRole"
  }]
}
```

## DynamoDB Issues

### Issue: "ProvisionedThroughputExceededException"

**Solution:**
1. Increase capacity in Terraform:
```hcl
dynamodb_read_capacity  = 10
dynamodb_write_capacity = 10
```

2. Or enable on-demand billing:
```hcl
billing_mode = "PAY_PER_REQUEST"
```

### Issue: "Table does not exist"

**Solution:**
Verify table names match in:
- Terraform outputs
- Backend environment variables
- AWS Console

## General Issues

### Issue: Script stops unexpectedly

**Solution:**
Run with verbose output:

**Linux/Mac:**
```bash
bash -x scripts/deploy.sh 2>&1 | tee deploy.log
```

**Windows:**
```powershell
$VerbosePreference = "Continue"
.\scripts\deploy.ps1 2>&1 | Tee-Object deploy.log
```

### Issue: Out of sync resources

**Solution:**
```bash
# Destroy everything
cd infrastructure/terraform
terraform destroy

# Redeploy
cd ../..
.\scripts\deploy.ps1
```

### Issue: Old configuration causing problems

**Solution:**
```bash
# Remove old config
rm .deploy-config
rm .deploy-config.ps1
rm backend/.env

# Redeploy
.\scripts\deploy.ps1
```

## Testing & Verification

### Verify Backend

```bash
# Test registration endpoint
curl -X POST https://your-api-url/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Verify Frontend

1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API calls
4. Verify no CORS errors

### Verify DynamoDB

```bash
# List tables
aws dynamodb list-tables

# Describe table
aws dynamodb describe-table --table-name open-lance-users-dev
```

### Verify Lambda

```bash
# List functions
aws lambda list-functions

# Invoke function
aws lambda invoke \
  --function-name open-lance-backend-dev-getTasks \
  --payload '{}' \
  response.json
```

## Getting More Help

### Enable Debug Logging

**Backend:**
Add to `backend/serverless.yml`:
```yaml
provider:
  logs:
    restApi: true
```

**Frontend:**
Add to browser console:
```javascript
localStorage.setItem('debug', 'true')
```

### Check CloudWatch Logs

```bash
# Backend function logs
cd backend
serverless logs -f getTasks --stage dev --tail

# Or via AWS Console
# CloudWatch → Log Groups → /aws/lambda/open-lance-backend-dev-*
```

### Common Log Locations

- **Terraform**: `.terraform/` directory
- **Serverless**: `.serverless/` directory  
- **Scripts**: `deploy.log` (if captured)
- **CloudWatch**: AWS Console

## Still Having Issues?

1. Check [GitHub Issues](https://github.com/your-username/open-lance/issues)
2. Search [GitHub Discussions](https://github.com/your-username/open-lance/discussions)
3. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment (OS, versions)
   - Relevant logs

---

**Remember:** Most issues are related to:
- AWS credentials
- Missing prerequisites
- Configuration mismatches
- CORS settings

Check these first!
