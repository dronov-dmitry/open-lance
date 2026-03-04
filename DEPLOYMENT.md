# Open-Lance Deployment Guide

Complete step-by-step guide for deploying the Open-Lance platform with MongoDB Atlas, AWS Lambda, and GitHub Pages.

## Table of Contents

1. [Prerequisites](#prerequisites)
   - [Required Tools](#required-tools)
   - [AWS Account Setup](#aws-account-setup)
   - [AWS Requirements](#aws-requirements)
   - [GitHub Requirements](#github-requirements)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: Prepare AWS Accounts](#step-1-prepare-aws-accounts)
4. [Step 2: Deploy Infrastructure](#step-2-deploy-infrastructure)
5. [Step 3: Deploy Backend](#step-3-deploy-backend)
6. [Step 4: Deploy Frontend](#step-4-deploy-frontend)
7. [Step 5: Testing](#step-5-testing)
8. [Troubleshooting](#troubleshooting)
9. [Production Checklist](#production-checklist)
10. [Cost Optimization](#cost-optimization)
11. [Support & Resources](#support--resources)
12. [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)

---

## Prerequisites

### Required Tools

- **Node.js** >= 18.x
  ```bash
  node --version
  ```

- **npm** >= 9.x
  ```bash
  npm --version
  ```

- **Terraform** >= 1.0
  ```bash
  terraform --version
  ```

- **AWS CLI** >= 2.x
  ```bash
  aws --version
  ```

- **Serverless Framework**
  ```bash
  npm install -g serverless
  serverless --version
  ```

- **Git**
  ```bash
  git --version
  ```

### AWS Account Setup

#### Creating AWS Account

If you don't have an AWS account yet, follow these steps:

1. **Go to AWS Website**
   - Navigate to [https://aws.amazon.com/](https://aws.amazon.com/)
   - Click **"Create an AWS Account"** button (top right)

2. **Enter Account Information**
   - Email address: Enter your email (will be the root account email)
   - AWS account name: Choose a name for your account (e.g., "OpenLance-Primary")
   - Click **"Verify email address"**
   - Enter the verification code sent to your email

3. **Set Root User Password**
   - Create a strong password (minimum 8 characters)
   - Confirm the password
   - Click **"Continue"**

4. **Choose AWS Support Plan**
   - For testing: Select **"Basic support - Free"**
   - For production: Consider **"Developer"** ($29/month) or **"Business"** ($100/month)
   - Click **"Complete sign up"**

5. **Add Contact Information**
   - Account type: Choose **"Personal"** or **"Business"**
   - Full name, phone number, country, address
   - Read and accept AWS Customer Agreement
   - Click **"Continue"**

6. **Add Payment Information**
   - Enter credit/debit card details
   - AWS will charge $1 for verification (refunded)
   - Click **"Verify and Add"**

7. **Confirm Identity**
   - Choose verification method: **Text message (SMS)** or **Voice call**
   - Enter security code received
   - Click **"Continue"**

8. **Wait for Account Activation**
   - Usually takes 1-5 minutes
   - You'll receive email: "Welcome to Amazon Web Services"
   - Click **"Sign In to the Console"**

#### Choosing AWS Region

AWS Region determines where your resources will be physically located. This affects:
- **Latency**: Choose region closest to your users
- **Pricing**: Prices vary by region
- **Compliance**: Some regions have special compliance features

**Available Regions:**

| Region Code | Region Name | Location | Notes |
|------------|-------------|----------|-------|
| `us-east-1` | US East (N. Virginia) | USA | **Most popular**, lowest prices, most services |
| `us-east-2` | US East (Ohio) | USA | Good alternative to us-east-1 |
| `us-west-1` | US West (N. California) | USA | West coast USA |
| `us-west-2` | US West (Oregon) | USA | West coast USA |
| `eu-west-1` | EU (Ireland) | Europe | Most popular EU region |
| `eu-central-1` | EU (Frankfurt) | Europe | Good for Germany/Central EU |
| `ap-southeast-1` | Asia Pacific (Singapore) | Asia | Good for Southeast Asia |
| `ap-northeast-1` | Asia Pacific (Tokyo) | Asia | Good for Japan |

**Recommendation:**
- **For USA users**: `us-east-1` (cheapest, most reliable)
- **For Europe users**: `eu-west-1` or `eu-central-1`
- **For Asia users**: `ap-southeast-1` or `ap-northeast-1`

#### Creating IAM User and Access Keys

**⚠️ IMPORTANT:** Never use root account for deployment! Create IAM user instead.

1. **Sign in to AWS Console**
   - Go to [https://console.aws.amazon.com/](https://console.aws.amazon.com/)
   - Sign in with your root account email and password

2. **Navigate to IAM**
   - In the search bar, type "IAM"
   - Click **"IAM"** service

3. **Create User**
   - Click **"Users"** in left sidebar
   - Click **"Create user"** button
   - User name: `open-lance-deployer`
   - Click **"Next"**

4. **Set Permissions**
   - Select **"Attach policies directly"**
   - Search and select:
    - ✅ `AdministratorAccess` (for full deployment access)
    - Or for more security, select specific policies:
      - `AWSLambda_FullAccess`
      - `AmazonAPIGatewayAdministrator`
      - `IAMFullAccess` (for Cognito user pool)
       - `AmazonCognitoPowerUser`
       - `IAMFullAccess`
       - `CloudWatchFullAccess`
   - Click **"Next"**
   - Click **"Create user"**

5. **Create Access Keys**
   - Click on the created user (`open-lance-deployer`)
   - Go to **"Security credentials"** tab
   - Scroll to **"Access keys"**
   - Click **"Create access key"**
   - Choose use case: **"Command Line Interface (CLI)"**
   - Check confirmation checkbox
   - Click **"Next"**
   - Description: "Open-Lance Deployment" (optional)
   - Click **"Create access key"**

6. **Save Access Keys**
   - **⚠️ CRITICAL:** Save these immediately! You can't see them again.
   - **Access Key ID**: `AKIAIOSFODNN7EXAMPLE` (save this)
   - **Secret Access Key**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` (save this)
   - Click **"Download .csv file"** (recommended)
   - Store in a secure location (password manager)
   - Click **"Done"**

#### Setting AWS Region in Configuration

The region you choose will be used in multiple places:

1. **During AWS CLI Configuration** (Step 1.1):
   ```bash
   aws configure --profile primary
   # Default region: us-east-1  ← Your chosen region
   ```

2. **In Terraform Variables** (Step 2.2):
   ```hcl
   aws_region = "us-east-1"  ← Your chosen region
   ```

3. **In Backend Environment Variables** (Step 3.3):
   ```bash
   AWS_REGION=us-east-1  ← Your chosen region
   ```

4. **In Frontend Configuration** (Step 4.2):
   ```javascript
   region: 'us-east-1'  ← Your chosen region
   ```

**Pro Tip:** All AWS resources (Lambda, API Gateway, Cognito) must be in the same region!

---

**📖 For more detailed information about AWS regions, pricing, and selection tips:**  
**→ See [AWS_REGION_GUIDE.md](./AWS_REGION_GUIDE.md)** - Complete reference guide with latency tests and pricing comparisons

---

### AWS Requirements

- **1 AWS Account** (for Lambda and API Gateway)
  
- **IAM Permissions**:
  - Administrator access or equivalent permissions for:
    - Lambda
    - API Gateway
    - IAM
    - CloudWatch
    - S3 (optional, for Terraform state)

### MongoDB Atlas Requirements

- **MongoDB Atlas Account** (Free tier available)
- **M0 Cluster** (512 MB free storage)
- Network access configured
- Database user created

**Setup Guide**: See [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) for complete instructions

### GitHub Requirements

- GitHub account
- Repository with GitHub Pages enabled

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (GitHub Pages)                            │
│                  Static HTML/CSS/JS                          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                              │
│                   JWT Authorizer                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Lambda                                │
│                (Serverless Backend)                          │
│                  Node.js Handlers                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Atlas                              │
│              (Cloud Database - Free Tier)                    │
│  Collections:                                                │
│  - users (profiles, authentication)                          │
│  - tasks (freelance tasks)                                   │
│  - applications (worker applications)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 0: Setup MongoDB Atlas

**⚠️ DO THIS FIRST!**

Before deploying AWS infrastructure, set up MongoDB Atlas:

1. Go to [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
2. Follow the complete guide to:
   - Create MongoDB Atlas account
   - Create M0 (Free) cluster
   - Configure database user
   - Configure network access
   - Get connection string

**You'll need the MongoDB connection string for the next steps.**

---

## Step 1: Prepare AWS Account

### 1.1 Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1
# Default output format: json
```

### 1.2 Verify Access

```bash
aws sts get-caller-identity
```

Note the Account ID - you may need it later.

---

## Step 2: Deploy Infrastructure

### 2.1 Navigate to Infrastructure Directory

```bash
cd infrastructure/terraform
```

### 2.2 Create Terraform Variables File

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
aws_region   = "us-east-1"
environment  = "dev"
project_name = "open-lance"

# MongoDB Atlas Connection (from Step 0)
mongodb_uri      = "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
mongodb_database = "open-lance"

# Frontend CORS
allowed_origins = [
  "https://your-username.github.io"
]

# JWT Secret
jwt_secret = "generate-secure-random-string-here"

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout     = 30

# Security
enable_waf = false  # Set to true for production
```

**Generate secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Initialize Terraform

```bash
terraform init
```

### 2.4 Review Plan

```bash
terraform plan
```

Review all resources that will be created.

### 2.5 Apply Infrastructure

```bash
terraform apply
```

Type `yes` when prompted.

**This will take 2-3 minutes.** Terraform will create:
- IAM roles for Lambda
- CloudWatch log groups
- (Optional: Cognito User Pool if cognito.tf exists)

**Note:** No DynamoDB tables are created - we're using MongoDB Atlas!

### 2.6 Save Outputs

```bash
terraform output > ../terraform-outputs.txt
```

Note these values - you may need them for configuration:
- AWS Account ID
- AWS Region
- Lambda execution role ARN

---

## Step 3: Deploy Backend

### 3.1 Navigate to Backend Directory

```bash
cd ../../backend
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Create Environment File

Create `.env` file:

```bash
# MongoDB Atlas (from Step 0)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=open-lance

# JWT Secret (same as Terraform)
JWT_SECRET=your-super-secret-jwt-key

# CORS
ALLOWED_ORIGIN=https://your-username.github.io

# Stage
STAGE=dev
```

### 3.4 Update serverless.yml

Edit `serverless.yml` and update environment variables if needed:

```yaml
provider:
  environment:
    MONGODB_URI: ${env:MONGODB_URI}
    MONGODB_DATABASE: ${env:MONGODB_DATABASE}
    JWT_SECRET: ${env:JWT_SECRET}
    ALLOWED_ORIGIN: ${env:ALLOWED_ORIGIN}
```

### 3.5 Deploy Backend to AWS

**Deploy to dev:**
```bash
serverless deploy --stage dev
```

**Deploy to production:**
```bash
serverless deploy --stage prod
```

**This will take 3-5 minutes.** Serverless Framework will:
- Package Lambda functions
- Create API Gateway
- Deploy all Lambda functions
- Configure API Gateway endpoints

### 3.6 Save API Gateway URL

The deployment will output an API Gateway URL like:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

**Save this URL** - you'll need it for frontend configuration.

### 3.7 Test Backend

Test authentication endpoint:
```bash
curl -X POST https://your-api-url/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "user_id": "uuid-here"
  }
}
```

---

## Step 4: Deploy Frontend

### 4.1 Navigate to Frontend Directory

```bash
cd ../frontend
```

### 4.2 Update Configuration

Edit `js/config.js`:

```javascript
const CONFIG = {
    ENV: 'production',  // Change to 'production'
    
    API: {
        production: {
            baseURL: 'https://your-api-gateway-url/prod',  // From Step 3.6
            region: 'us-east-1'
        }
    },
    
    COGNITO: {
        production: {
            UserPoolId: 'us-east-1_XXXXXXXXX',  // From Terraform output
            ClientId: 'your-client-id'           // From Terraform output
        }
    }
};
```

### 4.3 Test Locally

```bash
# Python 3
python -m http.server 8080

# Or Python 2
python -m SimpleHTTPServer 8080
```

Open browser: `http://localhost:8080`

Test:
- ✅ Registration
- ✅ Login
- ✅ Create task
- ✅ View tasks
- ✅ Profile page

### 4.4 Create GitHub Repository

```bash
cd ..  # Back to project root
git init
git add .
git commit -m "Initial commit - Open-Lance platform"
```

Create repository on GitHub, then:

```bash
git remote add origin https://github.com/your-username/open-lance.git
git branch -M main
git push -u origin main
```

### 4.5 Configure GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** → **/frontend** folder
5. Click **Save**

Wait 2-3 minutes for deployment.

### 4.6 Update CORS Configuration

Update your API Gateway CORS settings to allow your GitHub Pages URL:

Edit `backend/serverless.yml`:
```yaml
environment:
  ALLOWED_ORIGIN: https://your-username.github.io
```

Redeploy backend:
```bash
cd backend
serverless deploy --stage prod
```

### 4.7 Test Production Site

Visit: `https://your-username.github.io`

Test complete user flow:
1. Register new account
2. Login
3. Create task
4. View task list
5. Update profile
6. Add contact links

---

## Step 5: Testing

### 5.1 API Testing with Postman

1. Import `docs/postman-collection.json` into Postman
2. Set environment variables:
   - `base_url`: Your API Gateway URL
3. Run collection:
   - Register → Login → Create Task → Apply to Task

### 5.2 Load Testing (Optional)

Install Artillery:
```bash
npm install -g artillery
```

Create `load-test.yml`:
```yaml
config:
  target: "https://your-api-url/prod"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Get tasks"
    flow:
      - get:
          url: "/tasks"
```

Run:
```bash
artillery run load-test.yml
```

### 5.3 MongoDB Connection Verification

Check that MongoDB Atlas connection is working:

1. Go to AWS Console → CloudWatch → Logs
2. Check Lambda logs
3. Verify entries like:
   ```
   Connecting to MongoDB Atlas...
   Connected to MongoDB database: open-lance
   MongoDB indexes created successfully
   ```

**Or check MongoDB Atlas:**
1. Go to MongoDB Atlas Dashboard
2. Click on your cluster → **Metrics**
3. Verify "Operations" shows recent activity

---

## Troubleshooting

### Issue: Lambda can't connect to MongoDB Atlas

**Solution:**
- Check `MONGODB_URI` is correctly set in environment variables
- Verify network access is configured in MongoDB Atlas (whitelist Lambda IP or use 0.0.0.0/0)
- Check MongoDB Atlas cluster is running
- Check Lambda logs in CloudWatch for connection errors

### Issue: CORS errors in browser

**Solution:**
- Update `ALLOWED_ORIGIN` in backend
- Redeploy API Gateway
- Clear browser cache

### Issue: "Unauthorized" on all API calls

**Solution:**
- Check JWT token is being sent in Authorization header
- Verify JWT_SECRET matches in backend and Cognito
- Check token expiration

### Issue: MongoDB Atlas connection timeout

**Solution:**
- Check MongoDB Atlas network access settings
- Verify database user credentials
- Ensure connection string is correct (including database name)
- Check MongoDB Atlas cluster status

---

## Production Checklist

Before going to production:

### Security
- [ ] Change all default passwords and secrets
- [ ] Use AWS Secrets Manager for sensitive data
- [ ] Enable WAF on API Gateway (`enable_waf = true`)
- [ ] Enable CloudTrail for audit logging
- [ ] Review IAM policies for least privilege
- [ ] Enable MFA on AWS accounts

### Performance
- [ ] Configure MongoDB Atlas cluster tier appropriately
- [ ] Configure Lambda reserved concurrency
- [ ] Enable API Gateway caching
- [ ] Set up CloudFront for frontend (optional)

### Monitoring
- [ ] Set up CloudWatch dashboards
- [ ] Configure SNS alerts for errors
- [ ] Set up X-Ray tracing
- [ ] Enable Lambda insights

### Backup & Disaster Recovery
- [ ] Enable MongoDB Atlas continuous backups
- [ ] Configure backup retention policy
- [ ] Document recovery procedures
- [ ] Test restore from backup

### Documentation
- [ ] Document all environment variables
- [ ] Update API documentation
- [ ] Create runbooks for common issues
- [ ] Document deployment process

### Testing
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] End-to-end testing passed
- [ ] Database backup/restore tested

---

## Cost Optimization

### For Development

- Use MongoDB Atlas M0 (Free Tier) or M10 cluster
- Set Lambda timeout to minimum required
- Delete unused resources
- Use AWS Cost Explorer

### For Production

- Upgrade MongoDB Atlas cluster as needed (M10, M20, etc.)
- Enable Lambda provisioned concurrency for critical functions
- Set up CloudWatch alarms for cost anomalies
- Configure MongoDB Atlas alerts for storage and performance

---

## Support & Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Terraform Registry**: https://registry.terraform.io/
- **Serverless Framework**: https://www.serverless.com/framework/docs

---

## Frequently Asked Questions (FAQ)

### AWS Account & Region Questions

**Q: Do I really need 2 AWS accounts?**
A: Yes, for the full multi-account architecture. However, for testing/development, you can use one account and modify the Terraform configuration to skip cross-account setup.

**Q: Can I change AWS region after deployment?**
A: Yes, but it requires redeploying everything:
1. Update region in all configuration files
2. Run `terraform destroy` in old region
3. Run `terraform apply` in new region
4. Redeploy backend and update frontend config

**Q: Which region is cheapest?**
A: Generally `us-east-1` (N. Virginia) has the lowest prices for most services.

**Q: What if I choose the wrong region?**
A: You can redeploy to a different region, but data won't be automatically migrated. Start with testing before production deployment.

**Q: Can I use multiple regions for high availability?**
A: Yes, but this requires a more complex setup with:
- MongoDB Atlas Global Clusters (multi-region)
- Route53 for DNS failover
- Lambda@Edge or CloudFront
This is beyond the scope of this basic deployment.

**Q: How do I check my current AWS region?**
A: Run:
```bash
aws configure get region --profile primary
```

**Q: What are AWS region naming conventions?**
A: Format: `<geographic-area>-<sub-region>-<number>`
- Example: `us-east-1` = United States, East coast, Availability zone 1
- Example: `eu-west-2` = Europe, West (UK), Availability zone 2

**Q: Do all AWS services work in all regions?**
A: No, but all AWS services used in this project (Lambda, API Gateway, Cognito) are available in all major regions. MongoDB Atlas is a separate cloud service and is available globally.

**Q: What's the difference between Region and Availability Zone?**
A: 
- **Region**: Geographic location (e.g., `us-east-1`)
- **Availability Zone**: Isolated data center within a region (e.g., `us-east-1a`, `us-east-1b`)
- This deployment uses one region but AWS automatically distributes across AZs

**Q: How much will this project cost?**
A: For development/testing with low traffic:
- MongoDB Atlas: **Free** (M0 tier with 512MB storage)
- Lambda: Free tier covers ~1M requests/month
- API Gateway: ~$3.50 per 1M requests
- Cognito: First 50,000 users are free
- **Estimated monthly cost: $0-10** for small usage (mostly free!)

**Q: How do I monitor AWS costs?**
A:
1. Go to AWS Console → Billing Dashboard
2. Enable **Cost Explorer**
3. Set up **Budget Alerts** (recommended: alert at $10, $25, $50)
4. Check **Free Tier Usage** regularly

**Q: What happens if I exceed AWS Free Tier?**
A: You'll be charged based on usage. Set up billing alerts to avoid surprises.

**Q: Can I delete everything and stop charges?**
A: Yes:
```bash
cd infrastructure/terraform
terraform destroy
cd ../../backend
serverless remove --stage dev
```
This removes all resources and stops billing.

---

## License

MIT License - See LICENSE file for details

---

**Congratulations! Your Open-Lance platform is now deployed! 🎉**

For issues or questions, check the troubleshooting section or create an issue in the repository.
