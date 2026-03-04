# 🚀 START HERE - Open-Lance Quick Deployment

**Welcome!** You're 15 minutes away from a running freelance marketplace platform.

## ⚡ One-Command Deployment

### Linux/Mac
```bash
./scripts/deploy.sh
```

### Windows
```powershell
.\scripts\deploy.ps1
```

That's it! The script does everything automatically.

---

## 📋 Before You Start (2 minutes)

### 1. Install Required Tools

Check if you have these:

```bash
node --version     # Need: >= 18.x
aws --version      # Need: >= 2.x
terraform --version # Need: >= 1.0
```

**Missing something?**
- Node.js: https://nodejs.org/
- AWS CLI: https://aws.amazon.com/cli/
- Terraform: https://www.terraform.io/downloads

### 2. Configure AWS

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Region: us-east-1
# Output: json
```

### 3. Prepare Information

You'll need:
- ✅ Secondary AWS Account ID (can use same account initially)
- ✅ GitHub username (for GitHub Pages URL)

---

## 🎯 Deployment Steps (15 minutes)

### Step 1: Run Script

```bash
cd open-lance
./scripts/deploy.sh    # Linux/Mac
# or
.\scripts\deploy.ps1    # Windows
```

### Step 2: Answer Questions

The script asks:
1. **Environment**: Type `dev`
2. **AWS Region**: Press Enter (uses `us-east-1`)
3. **Secondary Account ID**: Paste your account ID
4. **GitHub URL**: Enter `https://YOUR-USERNAME.github.io`

### Step 3: Confirm

When shown resources to create:
- Review list
- Type `y` to proceed

### Step 4: Wait (~12 minutes)

The script will:
- ✅ Deploy infrastructure (7 min)
- ✅ Deploy backend (4 min)
- ✅ Configure frontend (1 min)

### Step 5: Save Outputs

Note these from the summary:
- API Gateway URL
- Cognito User Pool ID
- Cognito Client ID

---

## 🌐 Deploy Frontend to GitHub

### Option A: Command Line

```bash
git add .
git commit -m "Deploy Open-Lance"
git push origin main
```

Then enable GitHub Pages:
1. Go to repo Settings → Pages
2. Source: `main` branch, `/frontend` folder
3. Click Save

### Option B: GitHub Web Interface

1. Upload all files to GitHub
2. Settings → Pages
3. Enable Pages for `/frontend` folder

**Wait 2-3 minutes** for deployment.

---

## ✅ Test Your Platform

Visit: `https://YOUR-USERNAME.github.io`

Try this flow:
1. Click **"Войти"** → **"Зарегистрироваться"**
2. Register with any email/password
3. Login with same credentials
4. Click **"Создать задачу"**
5. Fill form and submit
6. See your task in the list!

**🎉 If all works - you're done!**

---

## 🐛 Something Wrong?

### Issue: "AWS credentials not configured"
```bash
aws configure
```

### Issue: "CORS error in browser"
1. Check backend `.env` file
2. Redeploy: `cd backend && serverless deploy --stage dev`

### Issue: Frontend shows errors
1. Check browser console (F12)
2. Verify API URL in `frontend/js/config.js`
3. Clear cache and reload

### More Help
- [TROUBLESHOOTING.md](./DEPLOYMENT.md#troubleshooting)
- [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md#troubleshooting)

---

## 📚 Next Steps

### Customize
- **Colors**: Edit `frontend/css/style.css`
- **Branding**: Update text in `frontend/index.html`
- **Features**: Add new components in `frontend/js/components/`

### Go to Production
- Change environment to `prod`
- Enable WAF in Terraform
- Set up monitoring
- Configure custom domain

### Learn More
- [ARCHITECTURE.md](./ARCHITECTURE.md) - How it works
- [SECURITY.md](./SECURITY.md) - Security practices  
- [API Docs](./docs/openapi.yaml) - API reference

---

## 🆘 Need Help?

### Quick Links
- **Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Scripts Guide**: [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md)
- **Getting Started**: [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Support
- GitHub Issues for bugs
- GitHub Discussions for questions

---

## 📊 What You Just Deployed

✅ **Frontend**: Static SPA on GitHub Pages  
✅ **Backend**: 5+ Lambda functions  
✅ **Database**: Multi-account DynamoDB  
✅ **Auth**: AWS Cognito User Pool  
✅ **API**: REST API via API Gateway  
✅ **Monitoring**: CloudWatch alarms  

**Monthly Cost**: $5-10 (development)

---

## 🎓 What's Special

1. **Multi-Account Architecture** - Production-grade load distribution
2. **Automated Deployment** - One command does everything
3. **Serverless** - Scales automatically, pay only for usage
4. **Production-Ready** - Error handling, monitoring, security
5. **Well Documented** - 15 comprehensive guides

---

## ⏱️ Timeline

- **Setup**: 2 minutes (install tools)
- **Deploy**: 15 minutes (automated)
- **GitHub Pages**: 3 minutes (manual)
- **Test**: 2 minutes
- **Total**: **~22 minutes** start to finish

---

## 🎉 Success!

If you see tasks and can create new ones, **you're done!**

**What now?**
- Customize the platform
- Add features
- Deploy to production
- Share with users!

---

**Questions?** Check [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed guide.

**Ready to deploy?** Run `./scripts/deploy.sh` and follow prompts!

---

*Last Updated: March 4, 2026 | Version 1.0.0*

**🚀 Let's build something amazing! 🚀**
