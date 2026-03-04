# MongoDB Atlas Setup Guide

Complete guide for setting up MongoDB Atlas for Open-Lance platform.

## 🇷🇺 Быстрая инструкция на русском

<details>
<summary><b>Как получить MongoDB Connection URI (строку подключения)</b></summary>

### Шаг 1: Зарегистрируйтесь в MongoDB Atlas

1. Откройте [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Нажмите **"Try Free"** (Попробовать бесплатно)
3. Зарегистрируйтесь через Google/GitHub или email

### Шаг 2: Создайте бесплатный кластер

1. После входа нажмите **"Create"** (Создать)
2. Выберите **"Shared"** (Бесплатный план M0)
3. Выберите провайдера: **AWS** (рекомендуется)
4. Выберите регион ближайший к вам (например, Frankfurt для Европы)
5. Нажмите **"Create Cluster"** (Создать кластер)
6. Подождите 3-5 минут пока кластер создается

### Шаг 3: Создайте пользователя базы данных

1. Слева в меню выберите **"Database Access"** (Доступ к БД)
2. Нажмите **"Add New Database User"** (Добавить пользователя)
3. Выберите **"Password"** (Пароль)
4. Введите:
   - **Username** (Имя пользователя): `open-lance-admin` (или любое другое)
   - **Password** (Пароль): Придумайте надежный пароль (запишите его!)
5. **Database User Privileges**: выберите **"Read and write to any database"**
6. Нажмите **"Add User"** (Добавить пользователя)

⚠️ **ОЧЕНЬ ВАЖНО:** 
- **Запишите пароль немедленно!** MongoDB Atlas НЕ покажет его снова
- Это пароль для `<db_password>` в Connection URI
- Используйте безопасный пароль: минимум 8 символов, буквы + цифры + символы
- Пример хорошего пароля: `MySecure123!@#`

📝 **Забыли пароль?** Не проблема! Можно сбросить:
1. Database Access → найдите пользователя
2. Нажмите **"Edit"** → **"Edit Password"**
3. Введите новый пароль и сохраните

### Шаг 4: Настройте доступ из интернета

1. Слева в меню выберите **"Network Access"** (Сетевой доступ)
2. Нажмите **"Add IP Address"** (Добавить IP адрес)
3. Нажмите **"Allow Access from Anywhere"** (Разрешить доступ отовсюду)
   - IP Address: `0.0.0.0/0` (автоматически подставится)
4. Нажмите **"Confirm"** (Подтвердить)

⚠️ Это нужно для Cloudflare Workers, так как они работают с разных IP адресов

### Шаг 5: Получите строку подключения (Connection URI)

1. Слева в меню выберите **"Database"** (База данных)
2. Найдите свой кластер (обычно называется Cluster0)
3. Нажмите кнопку **"Connect"** (Подключиться)
4. Выберите **"Connect your application"** (Подключить приложение)
5. Убедитесь что выбрано:
   - **Driver:** Node.js
   - **Version:** 6.0 or later
6. **Скопируйте строку подключения** - она выглядит так:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Шаг 6: Замените данные в строке подключения

**ЗАМЕНИТЕ** в скопированной строке:
- `<username>` → ваше имя пользователя (например: `open-lance-admin`)
- `<password>` → ваш пароль (тот что придумали в Шаге 3)
- **УДАЛИТЕ** скобки `<` и `>`

**Пример:**

❌ **НЕПРАВИЛЬНО:**
```
mongodb+srv://<username>:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

✅ **ПРАВИЛЬНО:**
```
mongodb+srv://open-lance-admin:MySecurePass123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

❓ **Забыли что такое `<db_password>`?** → См. [MONGODB_PASSWORD_HELP.md](./MONGODB_PASSWORD_HELP.md)

### Шаг 7: Используйте строку подключения

Эту строку нужно вставить в скрипт деплоя когда он спросит:
```
MongoDB Connection URI: mongodb+srv://open-lance-admin:MySecurePass123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

**Готово!** 🎉 Теперь у вас есть MongoDB Connection URI

💡 **Сохраните эту строку в надежном месте** (менеджер паролей, зашифрованный файл)

---

### 🔍 Где найти созданный кластер позже?

1. Войдите в [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
2. Слева выберите **"Database"**
3. Нажмите **"Connect"** рядом с вашим кластером
4. Повторите Шаги 5-6 выше

### 🔗 Как выглядит правильная ссылка на кластер?

Ссылка на ваш кластер в MongoDB Atlas выглядит так:

```
https://cloud.mongodb.com/v2/{project-id}#/clusters/detail/{cluster-name}
```

**Пример реальной ссылки:**
```
https://cloud.mongodb.com/v2/69a86ffbc1953660e2614267#/clusters/detail/open-lance
```

Где:
- `69a86ffbc1953660e2614267` - ID вашего проекта (уникальный для каждого)
- `open-lance` - название вашего кластера

**Как получить эту ссылку:**
1. Откройте [MongoDB Atlas](https://cloud.mongodb.com/)
2. Перейдите в **Database**
3. Кликните на название кластера
4. Скопируйте URL из адресной строки браузера

💡 **Эту ссылку удобно сохранить в закладки для быстрого доступа к кластеру!**

</details>

---

## Table of Contents

1. [Create MongoDB Atlas Account](#create-mongodb-atlas-account)
2. [Create Cluster](#create-cluster)
3. [Configure Database Access](#configure-database-access)
4. [Configure Network Access](#configure-network-access)
5. [Get Connection String](#get-connection-string)
6. [Test Connection](#test-connection)
7. [Troubleshooting](#troubleshooting)

---

## Create MongoDB Atlas Account

### 1. Go to MongoDB Atlas Website

- Navigate to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
- Click **"Try Free"** or **"Start Free"**

### 2. Sign Up

You can register using:
- **Email** and password
- **Google** account
- **GitHub** account

**Recommended:** Use Google or GitHub for faster setup.

### 3. Complete Registration

- Enter your details:
  - First Name, Last Name
  - Company (optional, can skip)
  - Accept terms and conditions
- Click **"Create Account"**

### 4. Survey Questions (Optional)

MongoDB will ask you a few questions:
- **Goal:** Select "Learn MongoDB"
- **Experience:** Select your level (Beginner/Intermediate)
- **Use Case:** Select "Building a new app"

You can skip this if you want.

---

## Create Cluster

### 1. Choose Deployment Option

After logging in, you'll see the **"Create"** page:
- Click **"Create"** under **Shared** (Free Tier)
- This gives you 512 MB free storage

### 2. Choose Cloud Provider & Region

**Cloud Provider:**
- ✅ **AWS** (recommended for reliability)
- Azure
- Google Cloud

**Region:** Choose closest to your users

| Region | MongoDB Atlas Region |
|--------|----------------------|
| US East (N. Virginia) | AWS / N. Virginia (us-east-1) |
| Europe (Frankfurt) | AWS / Frankfurt (eu-central-1) |
| Europe (Ireland) | AWS / Ireland (eu-west-1) |
| Asia (Singapore) | AWS / Singapore (ap-southeast-1) |

💡 **Tip:** Since Cloudflare Workers run globally on edge, region matters less. Choose what's closest to most of your users.

### 3. Cluster Tier

- Select **M0 Sandbox** (FREE)
- 512 MB storage
- Shared RAM
- Perfect for development and testing

### 4. Cluster Name

- Name: `open-lance-cluster` (or any name you prefer)
- Click **"Create Cluster"**

**Note:** Cluster creation takes 3-5 minutes.

---

## Configure Database Access

### 1. Create Database User

While cluster is being created:
1. Click **"Database Access"** in left sidebar (under SECURITY)
2. Click **"Add New Database User"**

### 2. Authentication Method

- Select **"Password"** (default)

### 3. User Credentials

- **Username:** `open-lance-admin` (or your choice)
- **Password:** Click **"Autogenerate Secure Password"** OR enter your own
  - **⚠️ IMPORTANT:** Save this password! You'll need it for connection string.
  - Use a password manager!

### 4. Database User Privileges

- Select **"Built-in Role"**
- Choose **"Read and write to any database"**

### 5. Restrict Access (Optional)

- For production, restrict to specific databases
- For development, leave as is

### 6. Add User

- Click **"Add User"**
- User will be created in 10-30 seconds

---

## Configure Network Access

MongoDB Atlas requires you to whitelist IP addresses.

### 1. Network Access Page

1. Click **"Network Access"** in left sidebar (under SECURITY)
2. Click **"Add IP Address"**

### 2. Allow Access

You have 3 options:

#### Option A: Allow Access from Anywhere (Required for Cloudflare Workers)

- Click **"Allow Access from Anywhere"**
- This adds `0.0.0.0/0` to whitelist
- **Required for Cloudflare Workers** (Workers run on edge, dynamic IPs)
- Click **"Confirm"**

**Note:** Your database is still protected by username/password!

#### Option B: Add Current IP Address

- Click **"Add Current IP Address"**
- Good for development from your computer
- Click **"Confirm"**

#### Option C: Add Specific IP/CIDR

- Enter specific IP address or CIDR block
- Good for production with static IPs
- Click **"Confirm"**

**For Cloudflare Workers, use Option A** (Allow from Anywhere).

---

## Get Connection String

### 1. Go to Database

- Click **"Database"** in left sidebar (under DEPLOYMENT)
- Wait until cluster status shows **"Active"**

### 2. Click Connect

- Click **"Connect"** button on your cluster
- A popup will appear

### 3. Choose Connection Method

- Select **"Connect your application"**

### 4. Driver and Version

- **Driver:** Node.js
- **Version:** 6.0 or later

### 5. Copy Connection String

You'll see a connection string like:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**⚠️ IMPORTANT Changes:**

1. Replace `<username>` with your database username (e.g., `open-lance-admin`)
2. Replace `<password>` with your database password
3. **Remove `<>` brackets!**

**Example:**

Before:
```
mongodb+srv://<username>:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

After:
```
mongodb+srv://open-lance-admin:MySecurePass123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

### 6. Save Connection String

Copy this to your `.env` file:

```bash
MONGODB_URI=mongodb+srv://open-lance-admin:MySecurePass123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=open-lance
```

---

## Test Connection

### 1. Install MongoDB Compass (Optional)

MongoDB Compass is a GUI tool for MongoDB.

- Download: [https://www.mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
- Install and open
- Paste your connection string
- Click **"Connect"**

### 2. Test from Backend

Create a test script `backend/test-mongo.js`:

```javascript
const { MongoClient } = require('mongodb');

const uri = 'YOUR_CONNECTION_STRING';
const client = new MongoClient(uri);

async function testConnection() {
    try {
        await client.connect();
        console.log('✅ Connected successfully to MongoDB Atlas!');
        
        const db = client.db('open-lance');
        const collections = await db.listCollections().toArray();
        console.log('📚 Collections:', collections.map(c => c.name));
        
        await client.close();
    } catch (error) {
        console.error('❌ Connection failed:', error);
    }
}

testConnection();
```

Run test:
```bash
cd backend
npm install
node test-mongo.js
```

If successful, you'll see:
```
✅ Connected successfully to MongoDB Atlas!
📚 Collections: []
```

---

## Configure Backend Environment

### 1. Create .env File

In `backend/` directory, create `.env`:

```bash
# Copy from .env.example
cp .env.example .env
```

### 2. Edit .env File

```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=open-lance

# JWT Secret (generate secure random string)
JWT_SECRET=abc123xyz789changeThisToSomethingSecure

# CORS (your frontend URL)
ALLOWED_ORIGIN=https://your-username.github.io

# Stage
STAGE=dev
```

### 3. Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `JWT_SECRET`.

### 4. Verify Configuration

```bash
# Check environment variables are set
cat .env
```

---

## Database Structure

The MongoDB manager will automatically create these collections:

### Collections

1. **users** - User profiles and authentication
   - `user_id` (UUID, unique)
   - `email` (string, unique, indexed)
   - `password_hash` (string)
   - `rating_as_client`, `rating_as_worker` (number)
   - `completed_tasks_client`, `completed_tasks_worker` (number)
   - `contact_links` (array)
   - `created_at`, `updated_at` (ISO date)

2. **tasks** - Freelance tasks
   - `task_id` (UUID, unique)
   - `owner_id` (UUID, indexed)
   - `title` (string, text indexed)
   - `description` (string, text indexed)
   - `category` (string, indexed)
   - `tags` (array, text indexed)
   - `budget_estimate` (number)
   - `deadline` (ISO date, indexed)
   - `status` (string: OPEN/MATCHED/COMPLETED, indexed)
   - `matched_user_id` (UUID)
   - `applications` (array)
   - `created_at`, `updated_at` (ISO date, indexed)

3. **applications** - Worker applications to tasks
   - `application_id` (UUID, unique)
   - `task_id` (UUID, indexed)
   - `worker_id` (UUID, indexed)
   - `message` (string)
   - `status` (string: PENDING/ACCEPTED/REJECTED, indexed)
   - `created_at` (ISO date)

### Indexes

Indexes are automatically created on first connection:
- Users: `email`, `user_id`, `created_at`
- Tasks: `task_id`, `owner_id`, `status`, `category`, `created_at`, `deadline`, full-text search on `title`, `description`, `tags`
- Applications: `application_id`, `task_id`, `worker_id`, `status`

---

## Troubleshooting

### Error: "Authentication failed"

**Problem:** Incorrect username or password in connection string.

**❓ Где взять пароль для `<db_password>`?**

`<db_password>` - это **НЕ** ваш пароль от MongoDB Atlas аккаунта!

Это пароль, который **ВЫ сами придумали** при создании Database User (шаг 3 в инструкции).

MongoDB Atlas **никогда не покажет** этот пароль снова после создания пользователя!

**✅ Решение если забыли пароль:**

1. Откройте [MongoDB Atlas](https://cloud.mongodb.com/)
2. Слева выберите **"Database Access"**
3. Найдите вашего пользователя (например: `dronovdmitrybim_db_user`)
4. Нажмите кнопку **"Edit"** (значок карандаша)
5. Нажмите **"Edit Password"**
6. Введите **НОВЫЙ пароль** (например: `MyNewPass123!`)
7. **ЗАПИШИТЕ** этот пароль!
8. Нажмите **"Update User"**
9. Подождите 1-2 минуты

**Теперь используйте новый пароль в Connection URI:**

❌ **НЕПРАВИЛЬНО:**
```
mongodb+srv://user:<db_password>@cluster.net/
```

✅ **ПРАВИЛЬНО** (если новый пароль `MyNewPass123!`):
```
mongodb+srv://user:MyNewPass123!@cluster.net/
```

⚠️ **ВАЖНО:** Удалите скобки `<>` и замените `<db_password>` на реальный пароль!

### Error: "IP not whitelisted"

**Problem:** Your IP is not in Network Access list.

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (for Cloudflare Workers)
4. Click **"Confirm"**
5. Wait 1-2 minutes for changes to apply

### Error: "Connection timeout"

**Possible Causes:**
1. Firewall blocking outbound connections
2. Incorrect connection string
3. Cluster not active yet

**Solution:**
1. Wait for cluster to be fully active (3-5 minutes after creation)
2. Check connection string is correct (no `<>` brackets)
3. Test with MongoDB Compass
4. Check firewall allows outbound connections on port 27017

### Error: "Server selection timeout"

**Problem:** Cannot reach MongoDB servers.

**Solution:**
1. Verify connection string is correct
2. Check network connectivity
3. Try different network (sometimes VPN interferes)
4. Ensure cluster is in "Active" state

### Performance Issues

**Problem:** Slow queries or timeouts.

**Solution:**
1. Check if indexes are created: Use MongoDB Compass → Indexes tab
2. Enable profiling in MongoDB Atlas
3. Consider upgrading from M0 (free tier) to M2/M5 for production
4. Check query patterns and optimize

### "Database access denied"

**Problem:** User doesn't have correct permissions.

**Solution:**
1. Go to Database Access
2. Edit user
3. Ensure role is **"Read and write to any database"**
4. Save changes

---

## Production Best Practices

### 1. Use Connection Pooling

The MongoDB manager uses connection pooling by default:
```javascript
maxPoolSize: 10,
minPoolSize: 2,
```

### 2. Enable Retries

Already configured:
```javascript
retryWrites: true,
retryReads: true,
```

### 3. Set Timeouts

Configured for Cloudflare Workers:
```javascript
serverSelectionTimeoutMS: 5000,
socketTimeoutMS: 45000,
```

### 4. Monitor Performance

In MongoDB Atlas:
1. Go to **"Metrics"** tab
2. Monitor:
   - Operations per second
   - Query execution time
   - Connection count
   - Storage usage

### 5. Set Up Alerts

1. Go to **"Alerts"** tab
2. Configure alerts for:
   - High CPU usage
   - Connection spikes
   - Storage approaching limit

### 6. Backup Strategy

**Free Tier (M0):**
- No automatic backups
- Manually export data with `mongodump`

**Paid Tiers (M2+):**
- Enable continuous backups
- Point-in-time recovery available

### 7. Upgrade for Production

Consider upgrading from M0 to M2 or M5:

| Tier | Storage | RAM | Price/Month |
|------|---------|-----|-------------|
| M0 (Free) | 512 MB | Shared | $0 |
| M2 | 2 GB | Shared | ~$9 |
| M5 | 5 GB | 0.5 GB | ~$25 |
| M10 | 10 GB | 2 GB | ~$57 |

**Recommendation:** Start with M0 for development, upgrade to M2/M5 for production.

---

## Cost Estimation

### Free Tier (M0 Sandbox)

- **Storage:** 512 MB
- **Operations:** Unlimited
- **Data Transfer:** 10 GB/month
- **Cost:** $0

**Sufficient for:**
- Development and testing
- ~5,000-10,000 users
- ~50,000-100,000 tasks
- Light traffic (<100 req/min)

### When to Upgrade

Upgrade when:
- Storage exceeds 400 MB (80% capacity)
- Need automatic backups
- Need dedicated resources
- Traffic exceeds 100 requests/minute
- Need better performance

---

## Next Steps

After MongoDB Atlas is configured:

1. ✅ Run `cd backend && npm install`
2. ✅ Create `.env` file with connection string
3. ✅ Test connection with `node test-mongo.js`
4. ✅ Deploy backend: `serverless deploy --stage dev`
5. ✅ Test API endpoints

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

---

## Useful Links

- **MongoDB Atlas Dashboard:** [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
- **MongoDB Node.js Driver Docs:** [https://docs.mongodb.com/drivers/node/](https://docs.mongodb.com/drivers/node/)
- **Connection String Reference:** [https://docs.mongodb.com/manual/reference/connection-string/](https://docs.mongodb.com/manual/reference/connection-string/)
- **MongoDB University (Free Courses):** [https://university.mongodb.com/](https://university.mongodb.com/)

---

**Need Help?**

- MongoDB Atlas Support: [https://www.mongodb.com/cloud/atlas/support](https://www.mongodb.com/cloud/atlas/support)
- Community Forums: [https://www.mongodb.com/community/forums/](https://www.mongodb.com/community/forums/)
- Open-Lance Issues: See [GitHub Issues](https://github.com/your-repo/issues)

---

**✅ MongoDB Atlas Setup Complete!**

Your database is now ready for the Open-Lance platform! 🎉
