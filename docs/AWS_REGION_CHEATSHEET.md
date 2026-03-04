# AWS Region Cheat Sheet

## Quick Region Selection

```bash
# Fastest: Your users' location
🇺🇸 USA       → us-east-1 (N. Virginia)
🇪🇺 Europe    → eu-central-1 (Frankfurt) or eu-west-1 (Ireland)
🇷🇺 Russia    → eu-central-1 (Frankfurt)
🇨🇳 Asia      → ap-southeast-1 (Singapore)
```

---

## Essential Commands

### Check Current Region

```bash
# Show current region
aws configure get region

# Show region for specific profile
aws configure get region --profile primary
```

### Set Region

```bash
# Set region for default profile
aws configure set region us-east-1

# Set region for specific profile
aws configure set region us-east-1 --profile primary
```

### List All Regions

```bash
# List all available regions
aws ec2 describe-regions --output table

# List regions with names only
aws ec2 describe-regions \
  --query "Regions[].RegionName" \
  --output text
```

### Test Latency

```bash
# Ping us-east-1
ping dynamodb.us-east-1.amazonaws.com

# Ping eu-central-1
ping dynamodb.eu-central-1.amazonaws.com

# Ping ap-southeast-1
ping dynamodb.ap-southeast-1.amazonaws.com
```

---

## Region Codes Reference

### Popular Regions

| Code | Location | Latency (from Moscow) |
|------|----------|-----------------------|
| `us-east-1` | N. Virginia | ~120-150ms |
| `eu-central-1` | Frankfurt | ~40-50ms ⭐ |
| `eu-west-1` | Ireland | ~60-80ms |
| `ap-southeast-1` | Singapore | ~200-250ms |

---

## Configuration Files

### AWS CLI Config

**Location:** 
- Linux/Mac: `~/.aws/config`
- Windows: `C:\Users\USERNAME\.aws\config`

**Example:**
```ini
[profile primary]
region = us-east-1
output = json

[profile secondary]
region = us-east-1
output = json
```

### Terraform Variables

**File:** `infrastructure/terraform/terraform.tfvars`

```hcl
aws_region = "us-east-1"
```

### Backend Environment

**File:** `backend/.env`

```bash
AWS_REGION=us-east-1
```

### Frontend Config

**File:** `frontend/js/config.js`

```javascript
region: 'us-east-1'
```

---

## Quick Checks

### Verify Region Setup

```bash
# Check AWS CLI
aws configure get region

# Check Terraform
grep "aws_region" infrastructure/terraform/terraform.tfvars

# Check Backend
grep "AWS_REGION" backend/.env

# Check Frontend
grep "region" frontend/js/config.js
```

### Verify All Configs Match

```bash
# All should show same region
echo "AWS CLI:"
aws configure get region

echo "\nTerraform:"
grep "aws_region =" infrastructure/terraform/terraform.tfvars | awk -F'"' '{print $2}'

echo "\nBackend:"
grep "AWS_REGION=" backend/.env | cut -d'=' -f2

echo "\nFrontend:"
grep -A 1 "region:" frontend/js/config.js | tail -1 | cut -d"'" -f2
```

---

## Pricing Quick Reference

### DynamoDB (per 1M requests)

| Region | Write | Read |
|--------|-------|------|
| us-east-1 | $1.25 | $0.25 |
| eu-central-1 | $1.50 | $0.30 |
| ap-southeast-1 | $1.43 | $0.29 |

### Lambda (per 1M requests)

| Region | Cost |
|--------|------|
| us-east-1 | $0.20 |
| eu-central-1 | $0.22 |
| ap-southeast-1 | $0.20 |

---

## Troubleshooting

### Problem: "Could not connect to the endpoint URL"

**Solution:**
```bash
# Check if region is set
aws configure get region

# If empty, set it
aws configure set region us-east-1
```

### Problem: "Credential should be scoped to a valid region"

**Solution:**
```bash
# Verify region is valid
aws ec2 describe-regions --query "Regions[?RegionName=='us-east-1']"

# If invalid, set correct region
aws configure set region us-east-1
```

### Problem: Mismatched regions in deployment

**Solution:**
```bash
# Update all configs to match
REGION="us-east-1"

# AWS CLI
aws configure set region $REGION --profile primary
aws configure set region $REGION --profile secondary

# Terraform
sed -i "s/aws_region = .*/aws_region = \"$REGION\"/" \
  infrastructure/terraform/terraform.tfvars

# Backend
sed -i "s/AWS_REGION=.*/AWS_REGION=$REGION/" backend/.env

# Frontend (manual edit required)
# Edit frontend/js/config.js and change region: value
```

---

## Common Patterns

### Deploy to Different Region

```bash
# 1. Backup data (if needed)
aws dynamodb create-backup --table-name users \
  --backup-name users-backup-$(date +%Y%m%d)

# 2. Destroy old region resources
cd infrastructure/terraform
terraform destroy

# 3. Update region
NEW_REGION="eu-central-1"
sed -i "s/aws_region = .*/aws_region = \"$NEW_REGION\"/" terraform.tfvars

# 4. Deploy to new region
terraform apply

# 5. Deploy backend
cd ../../backend
serverless deploy --stage prod

# 6. Update frontend region
# Edit frontend/js/config.js manually
```

### Multi-Region Setup (Advanced)

```bash
# Primary region
export PRIMARY_REGION="us-east-1"
export SECONDARY_REGION="eu-central-1"

# Deploy to primary
aws configure set region $PRIMARY_REGION --profile primary
cd infrastructure/terraform
terraform workspace new primary
terraform apply

# Deploy to secondary
aws configure set region $SECONDARY_REGION --profile primary
terraform workspace new secondary
terraform apply
```

---

## Resources

- **Full Guide**: [AWS_REGION_GUIDE.md](../AWS_REGION_GUIDE.md)
- **Deployment**: [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Latency Check**: https://www.cloudping.info/
- **AWS Pricing**: https://aws.amazon.com/pricing/

---

**Quick Tip:** Always verify all configs use the same region before deployment!

```bash
# Run this before every deployment
./scripts/check-region-consistency.sh
```
