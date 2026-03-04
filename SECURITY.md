# Security Policy

## Security Architecture

Open-Lance implements multiple security layers to protect user data and ensure system integrity.

### Key Security Features

1. **No AWS Keys in Frontend**
   - Frontend is completely static
   - All AWS operations go through API Gateway
   - JWT tokens stored only in memory (not localStorage)

2. **Multi-Layer Authentication**
   - AWS Cognito for user management
   - JWT tokens for API authentication
   - API Gateway authorizer validates all requests

3. **Cross-Account Security**
   - IAM Roles with least privilege
   - STS AssumeRole for cross-account access
   - No hardcoded credentials

4. **Input Validation**
   - Server-side validation for all inputs
   - SQL injection prevention (NoSQL)
   - XSS protection through sanitization
   - CSRF protection via JWT

5. **Data Protection**
   - MongoDB Atlas encryption at rest
   - HTTPS/TLS for data in transit
   - Sensitive fields excluded from responses

## Secure Configuration

### Environment Variables

**Never commit these to Git:**

```bash
# Backend
JWT_SECRET=use-secrets-manager-in-production
PRIMARY_ACCOUNT_ID=xxx
SECONDARY_ACCOUNT_ID=xxx
COGNITO_USER_POOL_ID=xxx
COGNITO_CLIENT_ID=xxx
```

Use AWS Secrets Manager in production:

```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({
    SecretId: secretName
  }).promise();
  return JSON.parse(data.SecretString);
}
```

### CORS Configuration

**Production - Strict CORS:**

```yaml
# backend/serverless.yml
environment:
  ALLOWED_ORIGIN: https://your-username.github.io  # Exact domain only
```

**Never use:**
```yaml
ALLOWED_ORIGIN: "*"  # DON'T DO THIS IN PRODUCTION
```

### Rate Limiting

API Gateway has built-in rate limiting:

```yaml
# serverless.yml
provider:
  apiGateway:
    throttle:
      burstLimit: 100
      rateLimit: 50
```

Adjust based on your needs.

## Common Vulnerabilities & Mitigations

### 1. Authentication Bypass

**Risk:** Attacker accesses API without valid token

**Mitigation:**
- All endpoints require JWT token (except /auth/*)
- API Gateway authorizer validates token before Lambda execution
- Tokens expire after 7 days
- No token refresh without re-authentication

### 2. Cross-Site Scripting (XSS)

**Risk:** Malicious scripts in user input

**Mitigation:**
```javascript
// backend/src/utils/validation.js
function sanitizeString(str) {
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
}
```

### 3. SQL Injection

**Risk:** N/A - Using MongoDB Atlas (NoSQL)

**Note:** Still validate all inputs to prevent NoSQL injection patterns. MongoDB uses parameterized queries to prevent injection attacks.

### 4. Denial of Service (DoS)

**Risk:** Resource exhaustion

**Mitigation:**
- API Gateway rate limiting
- Lambda concurrency limits
- MongoDB Atlas connection pooling and rate limiting
- AWS WAF (enable in production)

### 5. Sensitive Data Exposure

**Risk:** Leaking passwords, keys, etc.

**Mitigation:**
```javascript
// Always remove sensitive fields
delete user.password_hash;
delete user._account_id;
```

### 6. Insecure Direct Object References

**Risk:** Accessing other users' data

**Mitigation:**
```javascript
// Check ownership before operations
if (task.owner_id !== userId) {
  return response.forbidden('Not authorized');
}
```

## Security Best Practices

### For Developers

1. **Never log sensitive data**
   ```javascript
   // DON'T
   console.log('User password:', password);
   
   // DO
   console.log('User authenticated:', userId);
   ```

2. **Validate all inputs**
   ```javascript
   const validation = validateTask(taskData);
   if (!validation.valid) {
     return response.error('Validation failed', 400, validation.errors);
   }
   ```

3. **Use parameterized queries**
   ```javascript
   // MongoDB automatically handles this with find() methods
   await collection.findOne({
     user_id: userId  // MongoDB driver sanitizes this
   });
   ```

4. **Implement proper error handling**
   ```javascript
   // DON'T expose internal errors
   catch (error) {
     return response.serverError('Internal error', error.stack); // BAD
   }
   
   // DO
   catch (error) {
     console.error('Error:', error);
     return response.serverError('An error occurred'); // GOOD
   }
   ```

### For Deployment

1. **Use AWS Secrets Manager**
   ```bash
   aws secretsmanager create-secret \
     --name open-lance/jwt-secret \
     --secret-string "your-secret-here"
   ```

2. **Enable CloudTrail**
   ```bash
   aws cloudtrail create-trail \
     --name open-lance-audit \
     --s3-bucket-name your-audit-bucket
   ```

3. **Configure WAF Rules**
   ```hcl
   # infrastructure/terraform/waf.tf
   resource "aws_wafv2_web_acl" "api" {
     # SQL injection protection
     # XSS protection
     # Rate limiting
   }
   ```

4. **Enable VPC Endpoints** (optional)
   - Keep Lambda traffic within AWS network
   - Prevents internet exposure

## Monitoring & Incident Response

### Detection

**CloudWatch Alarms:**

- Failed authentication attempts
- Unusual API call patterns
- MongoDB connection errors
- Lambda errors
- High latency

**AWS GuardDuty:**

Enable GuardDuty for threat detection:
```bash
aws guardduty create-detector --enable
```

### Response Plan

1. **Identify** the security incident
2. **Contain** - disable compromised resources
3. **Eradicate** - remove threat
4. **Recover** - restore from backups
5. **Review** - post-mortem analysis

### Emergency Contacts

Maintain an incident response team:
- Security lead
- AWS account admin
- Development team lead

## Compliance

### Data Privacy

- **GDPR**: User data deletion on request
- **CCPA**: Data export capability
- **Data residency**: Configure AWS region based on requirements

### Audit Logging

All API calls are logged to CloudWatch:
```javascript
console.log('API Call:', {
  userId: userId,
  action: 'create_task',
  taskId: taskId,
  timestamp: new Date().toISOString()
});
```

## Reporting Security Issues

**Please DO NOT open public issues for security vulnerabilities.**

Instead, email: security@open-lance.example.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 48 hours.

## Security Updates

Keep dependencies updated:

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Update AWS Lambda runtime
# Edit serverless.yml:
provider:
  runtime: nodejs18.x  # Use latest LTS
```

## Security Checklist

Before deploying to production:

- [ ] All secrets in AWS Secrets Manager
- [ ] CORS configured for exact domain
- [ ] Rate limiting enabled
- [ ] WAF configured
- [ ] CloudTrail enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS enforced everywhere
- [ ] MongoDB Atlas encryption enabled
- [ ] IAM policies follow least privilege
- [ ] MFA enabled on AWS accounts
- [ ] MongoDB Atlas network access properly configured
- [ ] Backup & disaster recovery tested
- [ ] Security audit completed
- [ ] Incident response plan documented

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [AWS Well-Architected Framework - Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)

---

**Security is an ongoing process. Review and update these practices regularly.**
