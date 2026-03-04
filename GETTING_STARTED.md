# Getting Started with Open-Lance

Welcome! This guide will get you from zero to a running Open-Lance platform in **15 minutes**.

## 🎯 What You'll Have

By the end of this guide:
- ✅ Complete backend running on AWS
- ✅ Frontend configured and ready
- ✅ User authentication working
- ✅ Task management functional
- ✅ Multi-account architecture operational

## 📋 Prerequisites Checklist

Before starting, ensure you have:

### 1. Required Accounts
- [ ] AWS account (primary)
- [ ] AWS account (secondary) - can be the same initially
- [ ] GitHub account

### 2. Required Software
- [ ] Node.js >= 18.x ([Download](https://nodejs.org/))
- [ ] AWS CLI >= 2.x ([Download](https://aws.amazon.com/cli/))
- [ ] Terraform >= 1.0 ([Download](https://www.terraform.io/downloads))
- [ ] Git

### 3. AWS Configuration
- [ ] AWS CLI configured with credentials
  ```bash
  aws configure
  ```
- [ ] Verified access:
  ```bash
  aws sts get-caller-identity
  ```

### 4. Ready Information
- [ ] Secondary AWS Account ID
- [ ] Desired GitHub Pages URL (e.g., `https://username.github.io`)

## 🚀 Option 1: Automated Deployment (Recommended)

**⏱️ Time: 15 minutes** | **Difficulty: Easy**

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/open-lance.git
cd open-lance
```

### Step 2: Run Deployment Script

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows:**
```powershell
.\scripts\deploy.ps1
```

### Step 3: Answer Questions

The script will ask:
1. **Environment**: Type `dev` (or `prod` for production)
2. **AWS Region**: Press Enter for `us-east-1`
3. **Secondary Account ID**: Paste your secondary AWS account ID
4. **GitHub URL**: Enter your GitHub Pages URL

### Step 4: Confirm Deployment

When shown the Terraform plan:
- Review changes
- Type `y` to apply

### Step 5: Wait for Completion

The script will:
- ✅ Deploy infrastructure (~7 minutes)
- ✅ Deploy backend (~4 minutes)
- ✅ Configure frontend (~1 minute)
- ✅ Test deployment (~1 minute)

### Step 6: Note Your URLs

Save these from the output:
- **API Gateway URL**: `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`
- **Cognito User Pool ID**: `us-east-1_XXXXXX`
- **Cognito Client ID**: `xxxxxxxxxxxxxxxxxxxx`

**Done!** Your backend is deployed.

### Step 7: Deploy Frontend to GitHub Pages

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

Then:
1. Go to repository **Settings** → **Pages**
2. Source: `main` branch, `/frontend` folder
3. Click **Save**
4. Wait 2-3 minutes for deployment

### Step 8: Test Your Application

Visit: `https://your-username.github.io`

Try:
1. Click "Войти" → "Зарегистрироваться"
2. Register with email and password
3. Login with same credentials
4. Click "Создать задачу"
5. Fill form and submit
6. See your task in the list!

**🎉 Congratulations! Open-Lance is running!**

## 📖 Option 2: Manual Deployment

**⏱️ Time: 30-40 minutes** | **Difficulty: Intermediate**

Prefer step-by-step manual process? See [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🔍 What Was Deployed?

### AWS Resources Created

**Primary Account:**
- 3 DynamoDB tables (users, tasks, routing)
- 1 Cognito User Pool
- 5+ Lambda functions
- 1 API Gateway
- IAM roles and policies
- CloudWatch alarms

**Secondary Account:**
- 2 DynamoDB tables (users, tasks replicas)
- Cross-account IAM role

**Total AWS Resources:** ~15-20

**Estimated Monthly Cost:**
- Development: **$5-10**
- Production (low traffic): **$20-50**

## 🧪 Testing Your Deployment

### Test 1: Backend Health

```bash
curl https://your-api-url/dev/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

Expected: `{"success":true}` or `{"success":false,"error":"User exists"}`

### Test 2: Frontend

1. Open: `https://your-username.github.io`
2. Check browser console (F12) for errors
3. Should see no CORS errors

### Test 3: Full User Flow

1. **Register**: Create account
2. **Login**: Sign in
3. **Create Task**: Add a new task
4. **Browse Tasks**: View task list
5. **Profile**: Update profile, add contact links

All should work without errors.

## 🐛 Common Issues

### Issue: "AWS credentials not configured"

**Fix:**
```bash
aws configure
# Enter your AWS Access Key ID and Secret
```

### Issue: "CORS error in browser"

**Fix:**
1. Check `ALLOWED_ORIGIN` in backend `.env`
2. Redeploy backend: `cd backend && serverless deploy --stage dev`
3. Clear browser cache

### Issue: "Cannot assume cross-account role"

**Fix:**
Verify secondary account has cross-account role:
```bash
aws iam get-role --role-name OpenLanceCrossAccountRole --profile secondary
```

If missing, create it via Terraform.

### Issue: "Frontend shows 'Unauthorized'"

**Fix:**
1. Check `JWT_SECRET` matches in backend and Terraform
2. Clear browser storage
3. Try incognito mode

### Issue: "Terraform state locked"

**Fix:**
```bash
cd infrastructure/terraform
terraform force-unlock <LOCK_ID>
```

## 📚 Next Steps

### 1. Customize Your Platform

- **Branding**: Update colors in `frontend/css/style.css`
- **Categories**: Add more task categories
- **Fields**: Customize task/user fields

### 2. Set Up Monitoring

```bash
# View Lambda logs
cd backend
serverless logs -f getTasks --stage dev

# View CloudWatch dashboard
aws cloudwatch get-dashboard --dashboard-name open-lance
```

### 3. Enable Production Features

- [ ] Change environment to `prod`
- [ ] Enable WAF: `enable_waf = true` in Terraform
- [ ] Set up CloudWatch alarms
- [ ] Configure custom domain
- [ ] Enable DynamoDB backups
- [ ] Set up SNS alerts

### 4. Add Features

Ideas to extend:
- Email verification
- Password reset flow
- File attachments (S3)
- Real-time notifications (WebSocket)
- Advanced search (ElasticSearch)
- Mobile app

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Project overview |
| [QUICKSTART.md](./QUICKSTART.md) | 15-min quick start |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Detailed deployment |
| [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md) | Script usage guide |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical details |
| [SECURITY.md](./SECURITY.md) | Security practices |
| [API Docs](./docs/openapi.yaml) | API reference |

## 🆘 Getting Help

### Quick Checks

1. **Check Prerequisites**: All tools installed?
2. **Check AWS Access**: `aws sts get-caller-identity`
3. **Check Logs**: See `deploy.log` or CloudWatch
4. **Check Configuration**: Verify `.deploy-config`

### Resources

- **Troubleshooting**: [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md#troubleshooting)
- **Manual Steps**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **GitHub Issues**: Report problems
- **GitHub Discussions**: Ask questions

## ✅ Success Checklist

Mark when complete:

### Deployment
- [ ] Scripts ran without errors
- [ ] Infrastructure deployed
- [ ] Backend deployed
- [ ] Frontend configured
- [ ] GitHub Pages enabled

### Functionality
- [ ] Can register new user
- [ ] Can login
- [ ] Can create task
- [ ] Can view tasks
- [ ] Can update profile
- [ ] No console errors

### Production Ready
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backups enabled
- [ ] Security hardened
- [ ] Documentation reviewed

## 🎓 Learning Resources

### Understand the Stack

- **Serverless**: [serverless.com](https://www.serverless.com)
- **DynamoDB**: [AWS DynamoDB Guide](https://docs.aws.amazon.com/dynamodb/)
- **Lambda**: [AWS Lambda Guide](https://docs.aws.amazon.com/lambda/)
- **Terraform**: [Terraform Docs](https://www.terraform.io/docs)

### Explore the Code

Start with:
1. `frontend/js/app.js` - Main application
2. `backend/src/handlers/tasks.js` - Task logic
3. `backend/src/utils/connectionManager.js` - Multi-account magic
4. `infrastructure/terraform/main.tf` - Infrastructure

## 🎉 You're All Set!

You now have:
- ✅ Production-ready serverless application
- ✅ Multi-account AWS architecture
- ✅ Scalable infrastructure
- ✅ Secure authentication
- ✅ Beautiful UI

**What's next?**
- Customize it for your needs
- Deploy to production
- Add new features
- Share with users!

---

**Welcome to Open-Lance! 🚀**

Questions? Check [FAQ](./FAQ.md) or open a GitHub Issue.
