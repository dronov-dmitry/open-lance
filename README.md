# Open-Lance - P2P Freelance Marketplace

> A serverless freelance platform with Cloudflare Workers and MongoDB Atlas where users can be both clients and workers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020)](https://workers.cloudflare.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)](https://www.mongodb.com/atlas)
[![Русский](https://img.shields.io/badge/Русский-README-blue)](./QUICK_START_RU.md)

## 🚀 Overview

Open-Lance is a modern P2P freelance marketplace built with edge computing, featuring:

- 🎯 **Unified User Profile**: Everyone can be both client and worker
- 💰 **P2P Payments**: Direct payments between parties (no platform fees)
- 🔒 **Secure**: Contact exchange only after matching
- ⭐ **Rating System**: Mutual reviews for trust building
- ⚡ **Edge Computing**: Global deployment on Cloudflare's network (200+ locations)
- 🍃 **MongoDB Atlas**: Managed cloud database with automatic scaling
- 🚀 **Fast**: Low latency everywhere in the world
- 💸 **Free Tier**: Both Cloudflare Workers and MongoDB Atlas have generous free plans

## 🎯 Quick Start

### English
**Ready to deploy?** → [Quick Start Guide](#-quick-start)

### Русский (Russian)
**🇷🇺 Быстрый старт на русском** → [QUICK_START_RU.md](./QUICK_START_RU.md)

**Подробная инструкция по MongoDB Atlas** → [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) (есть раздел на русском!)

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Features](#-features)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🏗️ Architecture

```
Frontend (Cloudflare Pages / GitHub Pages)
         ↓ HTTPS
    Cloudflare Workers (Edge)
    (JWT Auth + API Routes)
         ↓
    MongoDB Atlas
    (Cloud Database)
```

**Key Components:**
- **Frontend**: Static SPA hosted on Cloudflare Pages or GitHub Pages
- **Backend**: Cloudflare Workers (serverless edge computing, global)
- **Database**: MongoDB Atlas (managed cloud database)
- **Auth**: JWT tokens (built-in)
- **Edge**: Deployed globally on Cloudflare's network (200+ locations)

See [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) for detailed documentation.

## ✨ Features

### For Users
- 👤 **Dual Role**: Act as both client (post tasks) and worker (complete tasks)
- 📝 **Task Management**: Create, browse, and apply to tasks
- 🤝 **Matching System**: Clients select workers, then contacts are revealed
- 💬 **Contact Links**: Add Telegram, WhatsApp, portfolio links
- ⭐ **Reputation**: Build trust through ratings and reviews
- 🔍 **Search & Filter**: Find tasks by category, budget, deadline

### For Developers
- 🔐 **Security First**: No AWS keys in frontend, JWT authentication
- 📊 **Observable**: CloudWatch metrics and logs
- 🔄 **Auto-Retry**: Exponential backoff on connection errors
- 🍃 **MongoDB Indexes**: Optimized queries with automatic indexing
- 📚 **Well Documented**: OpenAPI spec, Postman collection, MongoDB setup guide
- 🧪 **Testable**: Modular design, easy to test

## 🚀 Quick Start

### Automated Deployment (Recommended)

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows:**
```powershell
.\scripts\deploy.ps1
```

The script will:
- ✅ Check prerequisites
- ✅ Authenticate with Cloudflare
- ✅ Collect configuration
- ✅ Deploy backend (Cloudflare Workers)
- ✅ Configure frontend
- ✅ Test deployment

**Deployment time: ~5-10 minutes**

### Manual Deployment

If you prefer manual deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

### Prerequisites

- Node.js >= 18.x
- **MongoDB Atlas account** (Free tier available - [Setup guide →](./MONGODB_ATLAS_SETUP.md))
- **Cloudflare account** (Free tier available)
- Wrangler CLI (`npm install -g wrangler`)

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START_RU.md](./QUICK_START_RU.md) | 🇷🇺 Быстрый старт на русском |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Complete deployment guide |
| [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) | 🆕 MongoDB Atlas setup & configuration |
| [MONGODB_PASSWORD_HELP.md](./MONGODB_PASSWORD_HELP.md) | 🔑 Где взять `<db_password>`? |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture details |
| [SECURITY.md](./SECURITY.md) | Security best practices |
| [API Documentation](./docs/openapi.yaml) | OpenAPI/Swagger specification |
| [Postman Collection](./docs/postman-collection.json) | API testing collection |

### Quick Links

- **Backend**: [Backend README](./backend/README.md)
- **Infrastructure**: [Infrastructure README](./infrastructure/README.md)
- **API Docs**: Import `docs/openapi.yaml` into [Swagger Editor](https://editor.swagger.io/)

## 📁 Project Structure

```
open-lance/
├── frontend/                  # Static SPA
│   ├── index.html            # Main HTML file
│   ├── css/                  # Stylesheets
│   │   └── style.css
│   └── js/                   # JavaScript modules
│       ├── config.js         # Configuration
│       ├── api.js            # API client
│       ├── auth.js           # Authentication
│       ├── router.js         # SPA router
│       └── components/       # Page components
│
├── backend/                   # Lambda functions
│   ├── src/
│   │   ├── handlers/         # Lambda handlers
│   │   │   ├── auth.js       # Authentication
│   │   │   ├── tasks.js      # Task CRUD
│   │   │   ├── users.js      # User management
│   │   │   └── authorizer.js # JWT validator
│   │   └── utils/            # Utilities
│   │       ├── connectionManager.js  # Multi-account manager
│   │       ├── routingTable.js       # Entity routing
│   │       ├── validation.js         # Input validation
│   │       └── response.js           # HTTP responses
│   ├── serverless.yml        # Serverless config
│   └── package.json
│
├── infrastructure/            # Terraform IaC (Optional)
│   └── terraform/
│       ├── main.tf           # Main configuration
│       ├── variables.tf      # Input variables
│       ├── iam.tf            # IAM roles & policies
│       ├── cognito.tf        # User pool (optional)
│       └── outputs.tf        # Output values
│
├── docs/                      # Documentation
│   ├── openapi.yaml          # API specification
│   └── postman-collection.json
│
├── DEPLOYMENT.md             # Deployment guide
├── ARCHITECTURE.md           # Architecture docs
├── SECURITY.md               # Security guide
└── README.md                 # This file
```

## 🛠️ Technology Stack

### Frontend
- **Languages**: HTML5, CSS3, Vanilla JavaScript
- **Hosting**: Cloudflare Pages or GitHub Pages
- **Features**: SPA router, JWT auth, responsive design

### Backend
- **Runtime**: Node.js (V8 engine)
- **Compute**: Cloudflare Workers (Edge)
- **API**: RESTful API (built-in routing)
- **Database**: MongoDB Atlas (Cloud)
- **Auth**: JWT tokens
- **Deployment**: Wrangler CLI

### Infrastructure
- **Edge Network**: Cloudflare (200+ global locations)
- **Database**: MongoDB Atlas (managed service)
- **Monitoring**: Cloudflare Analytics, MongoDB Atlas metrics
- **Security**: Edge security, JWT authentication
- **Version Control**: Git

### Development Tools
- **API Testing**: Postman, curl
- **Documentation**: OpenAPI 3.0
- **Linting**: ESLint
- **Database GUI**: MongoDB Compass
- **Local Development**: wrangler dev

## 🔒 Security

Security is a top priority. Key measures include:

- ✅ **No AWS Keys in Frontend**: All API access via Cloudflare Workers
- ✅ **JWT Authentication**: Stateless, secure tokens
- ✅ **Input Validation**: Server-side validation for all inputs
- ✅ **Rate Limiting**: Cloudflare Workers rate limiting
- ✅ **CORS**: Strict origin policies
- ✅ **Encryption**: MongoDB Atlas encryption at rest, HTTPS in transit
- ✅ **Edge Security**: DDoS protection and WAF via Cloudflare

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation.

## 📦 Deployment

### Local Development

```bash
# Install dependencies
npm install

# Start local development
npm run dev

# Open browser
# Frontend: http://localhost:8080
# Backend: http://localhost:8787
```

### Production Deployment

**Option 1: Automated (Recommended)**

Use the deployment scripts:
- **Windows**: `.\scripts\deploy.ps1`
- **Linux/Mac**: `./scripts/deploy.sh`

**Option 2: Manual**

```bash
# Deploy Cloudflare Worker
cd backend
npm install
npx wrangler deploy

# Deploy Frontend (GitHub Pages)
# See GIT_GITHUB_GUIDE.md for instructions
```

### Upload to GitHub

**📚 Full guide**: [GIT_GITHUB_GUIDE.md](./GIT_GITHUB_GUIDE.md) (Russian)

**Quick commands:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/open-lance.git
git push -u origin main
```

**⚠️ Important**: Make sure `.env` and `.deploy-config*` are in `.gitignore` before pushing!

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Authors

- **Open-Lance Team** - *Initial work*

## 🙏 Acknowledgments

- Cloudflare for edge computing infrastructure and global CDN
- MongoDB Atlas for managed database service
- GitHub Pages for free static hosting
- Open source community for tools and libraries

## 📞 Support

- **Documentation**: Check [DEPLOYMENT.md](./DEPLOYMENT.md), [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md), and [GIT_GITHUB_GUIDE.md](./GIT_GITHUB_GUIDE.md)
- **Quick Start (Russian)**: [QUICK_START_RU.md](./QUICK_START_RU.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/open-lance/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/open-lance/discussions)

## 🗺️ Roadmap

- [ ] GraphQL API
- [ ] WebSocket real-time notifications
- [ ] ElasticSearch for full-text search
- [ ] File attachments (S3 with signed URLs)
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration (optional)
- [ ] Escrow service

## 📊 Status

- **Version**: 3.0.0
- **Status**: Production Ready (Cloudflare Workers + MongoDB Atlas)
- **Last Updated**: March 2026
- **Breaking Changes**: 
  - v3.0: Migrated from AWS Lambda to Cloudflare Workers
  - v2.0: Migrated from AWS DynamoDB to MongoDB Atlas

---

**Made with ❤️ using Cloudflare Workers and MongoDB Atlas**
