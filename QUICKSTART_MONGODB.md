# Quick Start: Open-Lance with MongoDB Atlas

**5-minute setup guide** for deploying Open-Lance v2.0 with MongoDB Atlas.

---

## 📋 Prerequisites Checklist

- [ ] Node.js >= 18.x installed
- [ ] AWS CLI installed and configured
- [ ] Serverless Framework installed (`npm install -g serverless`)
- [ ] Git installed

---

## ⚡ Quick Setup (5 Steps)

### Step 1: MongoDB Atlas (2 minutes)

```bash
# 1. Go to https://www.mongodb.com/cloud/atlas/register
# 2. Sign up (use Google/GitHub for faster signup)
# 3. Create M0 (FREE) cluster
# 4. Create database user:
#    - Username: openlance
#    - Password: (auto-generate and save!)
# 5. Network Access: "Allow Access from Anywhere"
# 6. Get connection string (replace <password>)
```

**Connection string format:**
```
mongodb+srv://openlance:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

### Step 2: Clone & Install (1 minute)

```bash
# Clone repository
git clone https://github.com/your-username/open-lance.git
cd open-lance/backend

# Install dependencies
npm install
```

---

### Step 3: Configure Environment (1 minute)

```bash
# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://openlance:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/
MONGODB_DATABASE=open-lance
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ALLOWED_ORIGIN=*
STAGE=dev
EOF
```

**⚠️ Important:** Replace `YOUR_PASSWORD` with your actual MongoDB password!

---

### Step 4: Deploy Backend (1 minute)

```bash
# Deploy to AWS Lambda
serverless deploy --stage dev

# Save the API Gateway URL from output!
# Example: https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

---

### Step 5: Test (30 seconds)

```bash
# Test registration
curl -X POST https://YOUR_API_URL/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Expected response:
# {"success":true,"data":{"message":"Registration successful. Please login.","user_id":"..."}}
```

---

## ✅ Verification

### Check MongoDB Atlas

1. Go to MongoDB Atlas → Clusters
2. Click **Browse Collections**
3. You should see:
   - Database: `open-lance`
   - Collections: `users`, `tasks`, `applications`

### Check AWS Lambda

1. Go to AWS Console → Lambda
2. You should see functions:
   - `open-lance-backend-dev-login`
   - `open-lance-backend-dev-register`
   - `open-lance-backend-dev-getTasks`
   - etc.

### Check CloudWatch Logs

1. Go to AWS Console → CloudWatch → Logs
2. Find log group: `/aws/lambda/open-lance-backend-dev-register`
3. Check latest log stream
4. Look for: `Connected to MongoDB database: open-lance`

---

## 🚀 Next Steps

### 1. Deploy Frontend

```bash
# Update frontend/js/config.js
const CONFIG = {
    ENV: 'production',
    API: {
        production: {
            baseURL: 'https://YOUR_API_URL/dev',
            region: 'us-east-1'
        }
    }
};

# Push to GitHub
git add .
git commit -m "Configure API URL"
git push origin main

# Enable GitHub Pages:
# Settings → Pages → Source: main branch, /frontend folder
```

### 2. Test Complete Flow

- ✅ Register user
- ✅ Login
- ✅ Create task
- ✅ List tasks
- ✅ Apply to task

### 3. Monitor

- **MongoDB Atlas**: Dashboard → Metrics
- **AWS CloudWatch**: Logs and metrics
- **API Gateway**: Usage metrics

---

## 🔧 Troubleshooting

### "Authentication failed"

**Problem:** Wrong MongoDB password

**Solution:**
```bash
# Check your password in connection string
# Go to MongoDB Atlas → Database Access
# Click "Edit" on user → "Edit Password"
# Copy new password to .env file
```

### "IP not whitelisted"

**Problem:** Network access not configured

**Solution:**
```bash
# Go to MongoDB Atlas → Network Access
# Click "Add IP Address"
# Select "Allow Access from Anywhere"
# Wait 1-2 minutes
```

### "Serverless deploy failed"

**Problem:** AWS credentials not configured

**Solution:**
```bash
# Configure AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Output (json)
```

### "Module not found: mongodb"

**Problem:** Dependencies not installed

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Full Documentation

- **Complete Setup**: [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
- **Full Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Migration Guide**: [MIGRATION_DYNAMODB_TO_MONGODB.md](./MIGRATION_DYNAMODB_TO_MONGODB.md)
- **Architecture**: [README.md](./README.md)

---

## 💡 Tips

### Development Mode

```bash
# Run locally
cd backend
npm install -g serverless-offline
serverless offline --stage dev

# API will be at http://localhost:3000
```

### Production Deployment

```bash
# Use separate MongoDB database
MONGODB_DATABASE=open-lance-prod

# Use separate stage
serverless deploy --stage prod

# Update ALLOWED_ORIGIN
ALLOWED_ORIGIN=https://your-domain.com
```

### Cost Optimization

- **Free tier**: M0 cluster (512 MB)
- **Keep cold starts low**: Use Lambda provisioned concurrency
- **Monitor usage**: Check MongoDB Atlas → Metrics regularly

---

## 🎉 Success!

Your Open-Lance platform is now running on:
- ✅ MongoDB Atlas (Free tier)
- ✅ AWS Lambda (Serverless)
- ✅ API Gateway (REST API)
- ✅ GitHub Pages (Static frontend)

**Total setup time:** ~5 minutes  
**Monthly cost (dev):** $0 (free tier)  
**Monthly cost (prod):** ~$9-25 (depending on usage)

---

## 🆘 Need Help?

1. **Read documentation**: See [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
2. **Check errors**: AWS CloudWatch logs
3. **Test connection**: Run `node test-mongo.js`
4. **Ask for help**: GitHub Issues

---

**Happy coding! 🚀**

Start building your freelance marketplace in minutes!
