# Open-Lance Backend

Serverless backend for Open-Lance platform built with AWS Lambda and DynamoDB.

## Features

- **Multi-Account DynamoDB**: Automatic load balancing between multiple AWS accounts
- **Failover & Retry**: Exponential backoff and automatic failover on throttling
- **Cross-Account Access**: STS AssumeRole for secure cross-account operations
- **JWT Authentication**: Secure API authentication
- **Input Validation**: Comprehensive input sanitization and validation
- **Serverless Architecture**: Auto-scaling Lambda functions

## Structure

```
backend/
├── src/
│   ├── handlers/         # Lambda function handlers
│   │   ├── auth.js       # Authentication
│   │   ├── tasks.js      # Task operations
│   │   ├── users.js      # User/profile operations
│   │   └── authorizer.js # JWT authorizer
│   └── utils/
│       ├── connectionManager.js  # Multi-account DynamoDB manager
│       ├── routingTable.js       # Entity-to-account routing
│       ├── validation.js         # Input validation
│       └── response.js           # HTTP response helpers
├── serverless.yml        # Serverless Framework configuration
└── package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update environment variables with your AWS account IDs and region

## Deployment

Deploy to AWS using Serverless Framework:

```bash
# Deploy to dev stage
serverless deploy --stage dev

# Deploy to production
serverless deploy --stage prod
```

## Local Development

Run locally with serverless-offline:

```bash
serverless offline
```

API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Tasks
- `GET /tasks` - List all tasks (with filters)
- `GET /tasks/{taskId}` - Get single task
- `POST /tasks` - Create new task
- `PUT /tasks/{taskId}` - Update task
- `DELETE /tasks/{taskId}` - Delete task
- `POST /tasks/{taskId}/apply` - Apply to task
- `POST /tasks/{taskId}/match` - Match worker to task

### Users
- `GET /users/{userId}` - Get user profile
- `PUT /users/me` - Update own profile
- `POST /users/me/contacts` - Add contact link
- `DELETE /users/me/contacts/{linkId}` - Remove contact link

## Multi-Account Architecture

The Connection Manager automatically:
- Distributes load between multiple AWS accounts using round-robin
- Monitors throttling and switches accounts when needed
- Retries failed requests with exponential backoff
- Uses STS AssumeRole for cross-account access

## Security

- JWT tokens for authentication
- Input validation and sanitization
- Rate limiting via API Gateway
- IAM roles with least privilege
- No AWS keys in frontend
- CORS configuration

## Testing

```bash
npm test
```

## Environment Variables

See `.env.example` for required environment variables.
