# Open-Lance Architecture

> **⚠️ NOTE:** This document describes the v1.0 architecture with AWS DynamoDB. 
> **For v2.0 (MongoDB Atlas) architecture**, see [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) and [README.md](./README.md).

Detailed technical architecture documentation for the Open-Lance P2P Freelance Marketplace platform (v1.0 - Legacy).

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Multi-Account Strategy](#multi-account-strategy)
6. [Security Architecture](#security-architecture)
7. [Scalability](#scalability)
8. [Monitoring & Observability](#monitoring--observability)

---

## System Overview

Open-Lance is a serverless P2P freelance marketplace built on AWS, designed for high availability, scalability, and cost efficiency.

### Key Characteristics

- **Serverless**: No servers to manage, auto-scaling
- **Multi-Account**: Load distributed across multiple AWS accounts
- **Static Frontend**: Hosted on GitHub Pages
- **RESTful API**: Clean, versioned API design
- **NoSQL Database**: DynamoDB for flexible data model
- **JWT Authentication**: Stateless authentication

### Design Principles

1. **Stateless**: All functions are stateless for horizontal scaling
2. **Fail-Safe**: Automatic failover between accounts
3. **Security-First**: No AWS keys in client, JWT-based auth
4. **Cost-Effective**: Pay only for what you use
5. **Observable**: Comprehensive logging and monitoring

---

## Technology Stack

### Frontend

| Technology | Purpose | Why? |
|------------|---------|------|
| Vanilla JavaScript | UI logic | No build step, simple deployment |
| HTML5/CSS3 | Layout & styling | Modern, responsive design |
| GitHub Pages | Hosting | Free, reliable, global CDN |

**No frameworks** = No build complexity, faster load times

### Backend

| Technology | Purpose | Why? |
|------------|---------|------|
| Node.js 18.x | Runtime | Fast, mature, AWS native support |
| AWS Lambda | Compute | Serverless, auto-scaling |
| API Gateway | API management | CORS, rate limiting, request validation |
| DynamoDB | Database | NoSQL, auto-scaling, multi-region |
| Cognito | Authentication | Managed user pools, OAuth 2.0 |

### Infrastructure

| Technology | Purpose | Why? |
|------------|---------|------|
| Terraform | IaC | Version control infrastructure |
| Serverless Framework | Lambda deployment | Simplified Lambda management |
| CloudWatch | Monitoring | Native AWS integration |

---

## Component Architecture

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                         │
│                      (GitHub Pages CDN)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Router    │  │   API Svc   │  │  Auth Svc   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└──────────────────────────┬────────────────────────────────────┘
                           │ HTTPS/JSON
                           ▼
┌───────────────────────────────────────────────────────────────┐
│                       API GATEWAY                              │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐      │
│  │ Rate Limiting  │  │ JWT Authoriz │  │    CORS     │      │
│  └────────────────┘  └──────────────┘  └─────────────┘      │
└──────────────────────────┬────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Auth    │    │  Tasks   │    │  Users   │
    │ Lambda   │    │  Lambda  │    │  Lambda  │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
              ┌────────────────────┐
              │ Connection Manager │
              │  (Multi-Account)   │
              └──────┬──────┬──────┘
                     │      │
          ┌──────────┘      └──────────┐
          ▼                            ▼
   ┌─────────────┐            ┌─────────────┐
   │  Account A  │            │  Account B  │
   │  DynamoDB   │            │  DynamoDB   │
   │  - users    │            │  - users    │
   │  - tasks    │            │  - tasks    │
   └─────────────┘            └─────────────┘
```

### Frontend Components

**1. Router (`js/router.js`)**
- SPA routing without page reloads
- Hash-based navigation
- Component lazy loading

**2. API Service (`js/api.js`)**
- HTTP request wrapper
- Retry logic with exponential backoff
- JWT token management
- Error handling

**3. Auth Service (`js/auth.js`)**
- Login/register flows
- Token storage (memory only)
- Session management

**4. Components**
- `home.js` - Landing page
- `tasks.js` - Task listing and creation
- `profile.js` - User profile management

### Backend Components

**1. Connection Manager (`backend/src/utils/connectionManager.js`)**

```javascript
class ConnectionManager {
  - accounts: [Account]
  - currentAccountIndex: number
  
  + getNextAccount(): Account        // Round-robin
  + executeWithRetry(): Promise      // Retry with failover
  + markThrottled(account): void     // Mark account as throttled
}
```

**Responsibilities:**
- Manage multiple DynamoDB connections
- Implement round-robin load balancing
- Handle throttling and failover
- Retry failed requests with exponential backoff

**2. Routing Table (`backend/src/utils/routingTable.js`)**

Maps entities to their storage account:

```
┌──────────────┬──────────────┬──────────────┐
│  entity_id   │ entity_type  │  account_id  │
├──────────────┼──────────────┼──────────────┤
│ user-uuid-1  │    user      │  account_a   │
│ task-uuid-1  │    task      │  account_b   │
│ user-uuid-2  │    user      │  account_b   │
└──────────────┴──────────────┴──────────────┘
```

**3. Lambda Handlers**

```
handlers/
├── auth.js          # Login, Register
├── tasks.js         # CRUD operations for tasks
├── users.js         # Profile management
└── authorizer.js    # JWT validation
```

Each handler:
- Validates input
- Calls Connection Manager
- Returns formatted response

---

## Data Flow

### User Registration Flow

```
User                Frontend            API Gateway         Lambda             DynamoDB
 │                     │                     │                 │                  │
 │  Fill form          │                     │                 │                  │
 ├─────────────────────>                     │                 │                  │
 │                     │                     │                 │                  │
 │                     │  POST /auth/register│                 │                  │
 │                     ├────────────────────>│                 │                  │
 │                     │                     │                 │                  │
 │                     │                     │  Invoke Lambda  │                  │
 │                     │                     ├────────────────>│                  │
 │                     │                     │                 │                  │
 │                     │                     │                 │  Check existing  │
 │                     │                     │                 ├─────────────────>│
 │                     │                     │                 │<─────────────────┤
 │                     │                     │                 │                  │
 │                     │                     │                 │  Create user     │
 │                     │                     │                 ├─────────────────>│
 │                     │                     │                 │<─────────────────┤
 │                     │                     │                 │                  │
 │                     │                     │  Success + ID   │                  │
 │                     │                     │<────────────────┤                  │
 │                     │                     │                 │                  │
 │                     │   Success Response  │                 │                  │
 │                     │<────────────────────┤                 │                  │
 │                     │                     │                 │                  │
 │  Show success msg   │                     │                 │                  │
 │<────────────────────┤                     │                 │                  │
```

### Task Creation with Multi-Account

```
User                Frontend            API Gateway         Lambda             Conn Manager        DynamoDB
 │                     │                     │                 │                     │                │
 │  Create task        │                     │                 │                     │                │
 ├─────────────────────>                     │                 │                     │                │
 │                     │  POST /tasks        │                 │                     │                │
 │                     │  + JWT token        │                 │                     │                │
 │                     ├────────────────────>│                 │                     │                │
 │                     │                     │                 │                     │                │
 │                     │                     │  Validate JWT   │                     │                │
 │                     │                     ├────────────────>│                     │                │
 │                     │                     │<────────────────┤                     │                │
 │                     │                     │                 │                     │                │
 │                     │                     │  Invoke Lambda  │                     │                │
 │                     │                     ├────────────────>│                     │                │
 │                     │                     │                 │                     │                │
 │                     │                     │                 │  Validate input     │                │
 │                     │                     │                 ├────────────>        │                │
 │                     │                     │                 │                     │                │
 │                     │                     │                 │  Get next account   │                │
 │                     │                     │                 │  (round-robin)      │                │
 │                     │                     │                 ├────────────────────>│                │
 │                     │                     │                 │<────────────────────┤                │
 │                     │                     │                 │                     │                │
 │                     │                     │                 │                     │  PUT Item      │
 │                     │                     │                 │                     ├───────────────>│
 │                     │                     │                 │                     │                │
 │                     │                     │                 │                     │  If throttled  │
 │                     │                     │                 │                     │  retry account │
 │                     │                     │                 │                     │  B             │
 │                     │                     │                 │                     │<───────────────┤
 │                     │                     │                 │                     │                │
 │                     │                     │                 │  Store route        │                │
 │                     │                     │                 │  (task -> account)  │                │
 │                     │                     │                 ├────────────────────>│                │
 │                     │                     │                 │                     │                │
 │                     │                     │  Success + task │                     │                │
 │                     │                     │<────────────────┤                     │                │
 │                     │   201 Created       │                 │                     │                │
 │                     │<────────────────────┤                 │                     │                │
 │  Show task          │                     │                 │                     │                │
 │<────────────────────┤                     │                 │                     │                │
```

---

## Multi-Account Strategy

### Why Multi-Account?

1. **Avoid Throttling**: DynamoDB has per-table throughput limits
2. **Cost Distribution**: Spread costs across accounts
3. **Isolation**: Failures in one account don't affect another
4. **Scalability**: Linear scaling by adding accounts

### Connection Manager Algorithm

```javascript
function getNextAccount() {
  startIndex = currentAccountIndex
  attempts = 0
  
  while (attempts < accounts.length) {
    account = accounts[currentAccountIndex]
    
    // Reset throttle if enough time passed
    if (account.throttleExpired()) {
      account.reset()
    }
    
    // Check availability
    if (account.isAvailable && account.throttleCount < 5) {
      currentAccountIndex = (currentAccountIndex + 1) % accounts.length
      return account
    }
    
    // Try next
    currentAccountIndex = (currentAccountIndex + 1) % accounts.length
    attempts++
  }
  
  // All throttled, use first anyway
  return accounts[0]
}
```

### Failover Strategy

**On ProvisionedThroughputExceededException:**
1. Mark account as throttled
2. Increment throttle counter
3. Wait with exponential backoff (1s, 2s, 4s)
4. Retry with next account

**On NetworkingError:**
1. Mark account as unavailable
2. Retry immediately with next account
3. Max 3 attempts total

### Routing Table

Central table in primary account maps entities to storage:

**Schema:**
```json
{
  "entity_id": "uuid",
  "entity_type": "user|task",
  "account_id": "account_a|account_b",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Indexes:**
- Primary: `entity_id`
- GSI: `account_id` (for queries by account)

---

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Lambda validates against Cognito/DB
3. Generate JWT with:
   - userId
   - email
   - expiration (7 days)
4. Sign with JWT_SECRET
5. Return token to frontend
6. Frontend stores in memory (not localStorage!)
7. All subsequent requests include: Authorization: Bearer <token>
8. API Gateway Authorizer validates token before Lambda
9. Decoded userId passed to Lambda in context
```

### Cross-Account Access

**Using STS AssumeRole:**

```javascript
const sts = new AWS.STS();

// Assume role in secondary account
const assumeRoleResult = await sts.assumeRole({
  RoleArn: 'arn:aws:iam::ACCOUNT_B:role/CrossAccountRole',
  RoleSessionName: 'open-lance-session'
}).promise();

// Use temporary credentials
const dynamodb = new AWS.DynamoDB.DocumentClient({
  credentials: new AWS.Credentials({
    accessKeyId: assumeRoleResult.Credentials.AccessKeyId,
    secretAccessKey: assumeRoleResult.Credentials.SecretAccessKey,
    sessionToken: assumeRoleResult.Credentials.SessionToken
  })
});
```

**IAM Trust Relationship (Account B):**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::ACCOUNT_A:role/LambdaExecutionRole"
    },
    "Action": "sts:AssumeRole"
  }]
}
```

---

## Scalability

### Horizontal Scaling

| Component | Scaling Method | Limit |
|-----------|----------------|-------|
| Frontend | GitHub Pages CDN | Unlimited |
| API Gateway | Auto-scaling | 10,000 req/sec |
| Lambda | Concurrent executions | 1,000 default (increasable) |
| DynamoDB | Multi-account | N accounts × throughput |

### Vertical Scaling

| Resource | Tunable Parameters |
|----------|-------------------|
| Lambda | memory (256-10,240 MB) |
| DynamoDB | RCU/WCU or On-Demand |
| API Gateway | Throttle limits |

### Performance Optimizations

1. **Lambda Cold Start**: Keep functions warm with CloudWatch Events
2. **DynamoDB**: Use consistent reads only when necessary
3. **API Gateway**: Enable caching for GET requests
4. **Frontend**: Minimize bundle size, lazy load components

---

## Monitoring & Observability

### CloudWatch Metrics

**Lambda:**
- Invocations
- Duration
- Errors
- Throttles
- Concurrent Executions

**DynamoDB:**
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits
- UserErrors (throttling)
- SystemErrors

**API Gateway:**
- Count (requests)
- Latency
- 4XXError
- 5XXError

### Alarms

**Critical:**
- Lambda error rate > 5%
- DynamoDB throttling > 5/min
- API Gateway 5XX > 1%

**Warning:**
- Lambda duration > 10s
- DynamoDB consumed capacity > 80%

### X-Ray Tracing

Enable X-Ray for end-to-end request tracing:

```yaml
# serverless.yml
provider:
  tracing:
    lambda: true
    apiGateway: true
```

### Logging Strategy

**Log Levels:**
- ERROR: Failures requiring attention
- WARN: Degraded performance, throttling
- INFO: Business events (user created, task matched)
- DEBUG: Detailed execution flow

**Example:**
```javascript
console.log('INFO', {
  action: 'task_created',
  userId: userId,
  taskId: taskId,
  account: accountId
});
```

---

## Future Enhancements

### Potential Improvements

1. **GraphQL API**: Replace REST with GraphQL for flexible queries
2. **WebSocket**: Real-time notifications for task updates
3. **ElasticSearch**: Full-text search for tasks
4. **S3**: File attachments for tasks (with signed URLs)
5. **CloudFront**: CDN for API Gateway (reduce latency)
6. **EventBridge**: Event-driven architecture for async operations
7. **Step Functions**: Complex workflow orchestration

### Scaling Beyond Current Design

**When to add more accounts:**
- Consistent throttling despite capacity increases
- Need to isolate customers (multi-tenancy)

**When to shard DynamoDB:**
- Single table > 100GB
- Need better query performance

---

## Conclusion

This architecture provides:
- ✅ High availability through multi-account failover
- ✅ Horizontal scalability
- ✅ Cost efficiency (serverless)
- ✅ Security by design
- ✅ Observable and maintainable

For questions or improvements, please contribute to the repository.
