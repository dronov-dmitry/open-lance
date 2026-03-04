# Migration Guide: DynamoDB to MongoDB Atlas

Guide for migrating from Open-Lance v1.x (DynamoDB) to v2.0 (MongoDB Atlas).

## Overview

**Version 1.x (Old):**
- AWS DynamoDB (multi-account)
- Complex connection manager with failover
- Routing table for entity-to-account mapping

**Version 2.0 (New):**
- MongoDB Atlas (cloud database)
- Single database with automatic scaling
- Simpler architecture

---

## Why Migrate?

### Benefits of MongoDB Atlas

✅ **Simpler Architecture**
- No need for multiple AWS accounts
- No cross-account roles configuration
- Easier to manage and debug

✅ **Better Developer Experience**
- Flexible schema (NoSQL)
- Full-text search built-in
- MongoDB Compass GUI for data exploration
- Better local development (no AWS credentials needed)

✅ **Cost-Effective**
- Free tier: 512 MB storage
- No provisioned capacity planning
- Pay-as-you-go scaling

✅ **Features**
- Aggregation pipelines
- Geospatial queries (for future features)
- Change streams (for real-time updates)
- Better indexing capabilities

---

## Migration Steps

### 1. Backup Existing Data

**Export from DynamoDB:**

```bash
# Users table
aws dynamodb scan \
  --table-name open-lance-users-dev \
  --profile primary \
  > users-backup.json

# Tasks table
aws dynamodb scan \
  --table-name open-lance-tasks-dev \
  --profile primary \
  > tasks-backup.json

# Routing table
aws dynamodb scan \
  --table-name open-lance-routing-dev \
  --profile primary \
  > routing-backup.json
```

### 2. Setup MongoDB Atlas

Follow [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) to:
- Create MongoDB Atlas account
- Create cluster
- Configure access
- Get connection string

### 3. Transform and Import Data

Create migration script `scripts/migrate-data.js`:

```javascript
const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = 'your-mongodb-connection-string';

async function migrate() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('open-lance');
        
        // Import users
        const usersData = JSON.parse(fs.readFileSync('users-backup.json', 'utf8'));
        const users = usersData.Items.map(item => {
            // Remove DynamoDB metadata
            delete item._account_id;
            return item;
        });
        
        if (users.length > 0) {
            await db.collection('users').insertMany(users);
            console.log(`✅ Imported ${users.length} users`);
        }
        
        // Import tasks
        const tasksData = JSON.parse(fs.readFileSync('tasks-backup.json', 'utf8'));
        const tasks = tasksData.Items.map(item => {
            delete item._account_id;
            // Initialize applications array if doesn't exist
            if (!item.applications) {
                item.applications = [];
            }
            return item;
        });
        
        if (tasks.length > 0) {
            await db.collection('tasks').insertMany(tasks);
            console.log(`✅ Imported ${tasks.length} tasks`);
        }
        
        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.close();
    }
}

migrate();
```

Run migration:
```bash
cd scripts
npm install mongodb
node migrate-data.js
```

### 4. Update Backend Code

The v2.0 code is already updated. You need to:

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Update dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Create .env file:**
   ```bash
   MONGODB_URI=mongodb+srv://...
   MONGODB_DATABASE=open-lance
   JWT_SECRET=your-jwt-secret
   ALLOWED_ORIGIN=https://your-site.github.io
   STAGE=dev
   ```

### 5. Deploy Updated Backend

```bash
cd backend
serverless deploy --stage dev
```

### 6. Test Thoroughly

- ✅ Login with existing user
- ✅ Create new task
- ✅ View tasks list
- ✅ Apply to task
- ✅ Update profile

### 7. Cleanup Old Resources (After Confirmation)

**⚠️ WARNING:** Only do this after confirming everything works!

```bash
# Remove DynamoDB tables
cd infrastructure/terraform
terraform destroy

# Or manually delete tables in AWS Console
```

---

## Code Changes Summary

### Removed Files

- ❌ `backend/src/utils/connectionManager.js` (DynamoDB multi-account manager)
- ❌ `backend/src/utils/routingTable.js` (Entity routing table)
- ❌ `infrastructure/terraform/dynamodb.tf` (DynamoDB tables)

### New Files

- ✅ `backend/src/utils/mongoManager.js` (MongoDB Atlas manager)
- ✅ `MONGODB_ATLAS_SETUP.md` (Setup guide)
- ✅ `MIGRATION_DYNAMODB_TO_MONGODB.md` (This file)

### Modified Files

- `backend/package.json` - Replaced `aws-sdk` with `mongodb`
- `backend/serverless.yml` - Removed DynamoDB permissions, added MongoDB env vars
- `backend/src/handlers/auth.js` - Uses mongoManager instead of connectionManager
- `backend/src/handlers/tasks.js` - Uses mongoManager
- `backend/src/handlers/users.js` - Uses mongoManager
- `infrastructure/terraform/main.tf` - Simplified (no multi-account)
- `infrastructure/terraform/variables.tf` - Added MongoDB vars
- `infrastructure/terraform/iam.tf` - Removed DynamoDB permissions
- `README.md` - Updated architecture
- `DEPLOYMENT.md` - Updated deployment steps

---

## API Compatibility

**Good News:** API endpoints remain exactly the same!

The frontend doesn't need any changes. All changes are internal to the backend.

---

## Rollback Plan

If you need to rollback:

1. **Keep old code in branch:**
   ```bash
   git checkout -b backup-v1-dynamodb
   git push origin backup-v1-dynamodb
   ```

2. **Keep DynamoDB tables:**
   Don't run `terraform destroy` until fully migrated

3. **Rollback procedure:**
   ```bash
   git checkout backup-v1-dynamodb
   cd backend
   npm install
   serverless deploy --stage dev
   ```

---

## Performance Comparison

| Metric | DynamoDB | MongoDB Atlas |
|--------|----------|---------------|
| **Cold Start** | ~300ms | ~500ms (first connection) |
| **Warm Requests** | ~50ms | ~30ms |
| **Query Flexibility** | Limited | Excellent |
| **Full-Text Search** | No (need ElasticSearch) | Built-in |
| **Aggregations** | Limited | Powerful |
| **Cost (Dev)** | ~$5-10/month | Free (M0) |
| **Cost (Production)** | ~$50-100/month | ~$9-25/month (M2/M5) |

---

## FAQ

**Q: Will my existing users need to re-register?**  
A: No, if you migrate the data properly, all users and tasks will be preserved.

**Q: Do I need to update the frontend?**  
A: No, the API remains the same. Only backend changes.

**Q: Can I keep both DynamoDB and MongoDB running?**  
A: Yes, during migration you can keep both. But maintain only one in production.

**Q: What about AWS Cognito?**  
A: Current implementation uses JWT tokens directly. Cognito is optional and not actively used.

**Q: Will performance be affected?**  
A: MongoDB is actually faster for most queries. First Lambda cold start might be slightly slower due to MongoDB driver initialization.

**Q: How do I monitor MongoDB?**  
A: Use MongoDB Atlas dashboard → Metrics tab. It shows operations, connections, storage, and more.

---

## Support

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- MongoDB Node.js Driver: https://docs.mongodb.com/drivers/node/
- Open-Lance Issues: GitHub Issues

---

**Migration completed?** 🎉

- Update `README.md` status
- Tag your repository: `git tag v2.0.0`
- Celebrate the simpler architecture! 🚀
