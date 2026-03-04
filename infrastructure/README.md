# Open-Lance Infrastructure

Infrastructure as Code (IaC) for Open-Lance platform using Terraform.

## Overview

This infrastructure includes:
- Multi-account DynamoDB tables (primary + secondary)
- AWS Cognito for user authentication
- IAM roles and policies
- Cross-account access setup
- CloudWatch alarms for monitoring

## Prerequisites

1. **Terraform**: Install Terraform >= 1.0
   ```bash
   # Download from https://www.terraform.io/downloads
   terraform --version
   ```

2. **AWS CLI**: Configure AWS credentials
   ```bash
   aws configure
   ```

3. **Two AWS Accounts**: 
   - Primary account (where Lambda functions run)
   - Secondary account (for load distribution)

## Setup

### 1. Configure Variables

Copy the example variables file:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:
```hcl
aws_region           = "us-east-1"
environment          = "dev"
secondary_account_id = "YOUR_SECONDARY_ACCOUNT_ID"
allowed_origins      = ["https://your-username.github.io"]
jwt_secret           = "your-secret-key"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review Plan

```bash
terraform plan
```

### 4. Apply Infrastructure

```bash
terraform apply
```

Review the changes and type `yes` to confirm.

## Multi-Account Setup

### Primary Account (Current)
Terraform will create:
- DynamoDB tables (users, tasks, routing)
- Lambda execution role
- Cognito user pool
- IAM policies

### Secondary Account
You need to:

1. **Create a Terraform Deploy Role** in the secondary account:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::PRIMARY_ACCOUNT_ID:root"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }
   ```

2. **Configure AWS CLI profile** for secondary account:
   ```bash
   aws configure --profile secondary
   ```

3. Terraform will automatically:
   - Create DynamoDB tables in secondary account
   - Set up cross-account IAM role
   - Configure proper permissions

## Outputs

After applying, Terraform will output:
- Cognito User Pool ID and Client ID
- DynamoDB table names
- IAM role ARNs
- Deployment instructions

View outputs:
```bash
terraform output
```

## Resource Structure

```
Primary Account:
├── DynamoDB Tables
│   ├── open-lance-users-{env}
│   ├── open-lance-tasks-{env}
│   └── open-lance-routing-{env}
├── Cognito User Pool
├── Lambda Execution Role
└── API Gateway (via Serverless Framework)

Secondary Account:
├── DynamoDB Tables
│   ├── open-lance-users-{env}
│   └── open-lance-tasks-{env}
└── Cross-Account IAM Role
```

## State Management

For production, configure remote state in S3:

1. Create S3 bucket for state:
   ```bash
   aws s3 mb s3://your-terraform-state-bucket
   ```

2. Enable versioning:
   ```bash
   aws s3api put-bucket-versioning \
     --bucket your-terraform-state-bucket \
     --versioning-configuration Status=Enabled
   ```

3. Update `main.tf` backend configuration:
   ```hcl
   backend "s3" {
     bucket = "your-terraform-state-bucket"
     key    = "open-lance/terraform.tfstate"
     region = "us-east-1"
   }
   ```

## Security Considerations

1. **Never commit sensitive values** to version control
2. Use AWS Secrets Manager for production secrets
3. Enable WAF for API Gateway in production (`enable_waf = true`)
4. Review IAM policies for least privilege
5. Enable CloudTrail for audit logging

## Cost Estimation

Estimated monthly costs (us-east-1, low traffic):
- DynamoDB (2 accounts): ~$5-10
- Cognito: Free tier (50,000 MAU)
- Lambda: Free tier (1M requests)
- API Gateway: ~$3.50 per million requests
- CloudWatch: ~$0.50

**Total**: ~$5-20/month for development

## Destroy Infrastructure

To remove all resources:
```bash
terraform destroy
```

⚠️ **Warning**: This will delete all data in DynamoDB tables!

## Troubleshooting

### Error: Access Denied for Secondary Account
- Ensure the cross-account role exists in secondary account
- Verify the assume role policy trusts the primary account

### Error: Table Already Exists
- Check if tables from previous deployment exist
- Either destroy them or import into Terraform state

### Error: Cognito Domain Already Exists
- Cognito domains must be globally unique
- Change the domain in `cognito.tf`

## Next Steps

After infrastructure is deployed:

1. Deploy backend Lambda functions (see `backend/README.md`)
2. Configure frontend with Cognito credentials
3. Deploy frontend to GitHub Pages
4. Test the complete flow

## Support

For issues or questions, refer to:
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
