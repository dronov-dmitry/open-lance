# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-04

### Added
- **Frontend**: Static SPA with vanilla JavaScript
  - User authentication (login/register)
  - Task creation and browsing
  - Profile management
  - Contact links management
  - Responsive design
  - SPA router

- **Backend**: Serverless AWS Lambda functions
  - JWT authentication
  - Multi-account DynamoDB connection manager
  - Automatic failover on throttling
  - Round-robin load balancing
  - Task CRUD operations
  - User profile management
  - Input validation and sanitization

- **Infrastructure**: Terraform IaC
  - Multi-account DynamoDB setup
  - AWS Cognito user pool
  - IAM roles and policies
  - Cross-account access via STS AssumeRole
  - CloudWatch alarms for monitoring

- **Documentation**
  - Comprehensive README
  - Deployment guide
  - Architecture documentation
  - Security best practices
  - API documentation (OpenAPI 3.0)
  - Postman collection
  - Contributing guidelines

- **Security**
  - No AWS keys in frontend
  - JWT-based authentication
  - CORS configuration
  - Rate limiting
  - Input validation
  - Encryption at rest and in transit

### Features
- Unified user profile (client + worker roles)
- Task creation and matching
- Worker application system
- Contact exchange after matching
- Rating system (placeholder for future)
- Multi-account load distribution
- Automatic retry with exponential backoff
- Central routing table for entity-to-account mapping

### Technical
- Node.js 18.x runtime
- DynamoDB NoSQL database
- API Gateway REST API
- GitHub Pages hosting
- Serverless Framework deployment
- Terraform >= 1.0

## [Unreleased]

### Planned
- GraphQL API
- Real-time notifications (WebSocket)
- Full-text search (ElasticSearch)
- File attachments (S3)
- Mobile app
- Payment gateway integration (optional)
- Escrow service
- Review and rating implementation
- Task completion workflow
- Application management UI
- Enhanced search filters
- User statistics dashboard

### Known Issues
- Authentication currently uses mock password validation (needs bcrypt)
- No email verification flow yet
- Reviews and ratings are placeholders
- Contact links only visible after matching (needs implementation)
- No file upload support yet

## Version History

### Version 1.0.0 (Current)
- Initial production-ready release
- Core features implemented
- Multi-account architecture working
- Full documentation

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to suggest changes or improvements.

## Support

For issues or questions, see:
- [GitHub Issues](https://github.com/your-username/open-lance/issues)
- [Documentation](./README.md)
