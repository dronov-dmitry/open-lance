# Quick Start Guide

Get Open-Lance running in 15 minutes!

## Prerequisites Check

```bash
# Check versions
node --version    # Should be >= 18.x
npm --version     # Should be >= 9.x
terraform --version  # Should be >= 1.0
aws --version     # Should be >= 2.x

# Check AWS access
aws sts get-caller-identity --profile primary
aws sts get-caller-identity --profile secondary
```

## Step 1: Clone & Install (2 min)

```bash
git clone https://github.com/your-username/open-lance.git
cd open-lance
npm install -g serverless
cd backend && npm install
```

## Step 2: Configure (3 min)

### Infrastructure Config

```bash
cd ../infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
secondary_account_id = "YOUR_SECONDARY_AWS_ACCOUNT_ID"
allowed_origins = ["https://your-username.github.io"]
jwt_secret = "GENERATE_RANDOM_STRING_HERE"
```

**Generate JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Deploy Infrastructure (5 min)

```bash
terraform init
terraform apply
# Type 'yes' when prompted
```

**Save these outputs:**
- `cognito_user_pool_id`
- `cognito_client_id`

## Step 4: Deploy Backend (3 min)

```bash
cd ../../backend

# Create .env file
cat > .env << EOF
PRIMARY_ACCOUNT_ID=your-primary-account-id
SECONDARY_ACCOUNT_ID=your-secondary-account-id
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=from-terraform-output
COGNITO_CLIENT_ID=from-terraform-output
JWT_SECRET=same-as-terraform
ALLOWED_ORIGIN=https://your-username.github.io
EOF

# Deploy
serverless deploy --stage dev
```

**Save the API Gateway URL!**

## Step 5: Deploy Frontend (2 min)

```bash
cd ../frontend

# Edit js/config.js
# Update:
# - ENV to 'production'
# - API baseURL to your API Gateway URL
# - Cognito User Pool ID and Client ID

# Commit and push to GitHub
cd ..
git add .
git commit -m "Initial deployment"
git push origin main

# Enable GitHub Pages:
# Go to repo Settings → Pages
# Source: main branch, /frontend folder
```

## Test It!

Visit: `https://your-username.github.io`

1. Click "Войти" → "Зарегистрироваться"
2. Enter email and password
3. Login with same credentials
4. Click "Создать задачу"
5. Fill form and submit
6. See your task in the list!

## Troubleshooting

### "CORS error"
```bash
cd backend
# Update ALLOWED_ORIGIN in .env
serverless deploy --stage dev
```

### "Unauthorized" on all requests
- Check JWT_SECRET matches in backend and Terraform
- Clear browser cache
- Try incognito mode

### "Cannot assume role"
- Verify cross-account role exists in secondary account
- Check trust relationship includes primary account

### DynamoDB not accessible
- Check IAM role permissions in Terraform output
- Verify table names in environment variables

## Next Steps

- [ ] Read [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- [ ] Review [SECURITY.md](./SECURITY.md) for production hardening
- [ ] Set up CloudWatch alarms
- [ ] Enable WAF in production
- [ ] Configure custom domain (optional)

## Support

- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/open-lance/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/open-lance/discussions)

---

**Congratulations! You're now running Open-Lance! 🎉**
