#!/bin/bash

###############################################################################
# Open-Lance Deployment Script v2.0 (Linux/Mac)
# MongoDB Atlas + AWS Lambda deployment automation
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

###############################################################################
# Check Prerequisites
###############################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        missing_tools+=("node")
        print_error "Node.js not found"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: v$NPM_VERSION"
    else
        missing_tools+=("npm")
        print_error "npm not found"
    fi
    
    # Check Wrangler (Cloudflare Workers CLI)
    if command -v wrangler &> /dev/null; then
        WRANGLER_VERSION=$(wrangler --version)
        print_success "Wrangler CLI found: $WRANGLER_VERSION"
    else
        print_warning "Wrangler CLI not found, will install"
        npm install -g wrangler
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install missing tools:"
        echo "  Node.js: https://nodejs.org/"
        echo "  Wrangler: npm install -g wrangler"
        exit 1
    fi
    
    echo ""
}

###############################################################################
# Check Cloudflare Authentication
###############################################################################

check_cloudflare_auth() {
    print_header "Checking Cloudflare Authentication"
    
    if wrangler whoami &> /dev/null; then
        print_success "Cloudflare authentication configured"
        wrangler whoami
    else
        print_warning "Cloudflare authentication not configured"
        echo ""
        echo "Please authenticate with Cloudflare:"
        echo "  wrangler login"
        echo ""
        read -p "Run 'wrangler login' now? (y/n): " run_login
        if [[ $run_login == "y" ]]; then
            wrangler login
        else
            print_error "Cloudflare authentication required"
            exit 1
        fi
    fi
    
    echo ""
}

###############################################################################
# Get Configuration
###############################################################################

get_configuration() {
    print_header "Configuration"
    
    # Check if config file exists
    if [ -f "$PROJECT_ROOT/.deploy-config" ]; then
        print_info "Found existing configuration"
        source "$PROJECT_ROOT/.deploy-config"
        
        read -p "Use existing configuration? (y/n): " use_existing
        if [[ $use_existing != "y" ]]; then
            configure_deployment
        fi
    else
        configure_deployment
    fi
    
    echo ""
}

configure_deployment() {
    echo ""
    print_info "Please provide deployment configuration:"
    echo ""
    
    # Environment
    read -p "Environment (dev/prod) [dev]: " ENVIRONMENT
    ENVIRONMENT=${ENVIRONMENT:-dev}
    
    # MongoDB Atlas
    print_warning "MongoDB Atlas Configuration Required!"
    echo ""
    echo "If you haven't set up MongoDB Atlas yet:"
    echo "  See: MONGODB_ATLAS_SETUP.md"
    echo ""
    echo -e "${BLUE}Example Connection URI format:${NC}"
    echo "  mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/"
    echo ""
    echo -e "${BLUE}Real example:${NC}"
    echo "  mongodb+srv://admin:MyPass123@cluster0.abc123.mongodb.net/"
    echo ""
    echo -e "${YELLOW}Important: Replace <username> and <password> with your actual credentials!${NC}"
    echo -e "${YELLOW}          Remove < > brackets!${NC}"
    echo ""
    read -p "MongoDB Connection URI: " MONGODB_URI
    while [ -z "$MONGODB_URI" ]; do
        echo ""
        print_error "MongoDB URI is required!"
        echo "Get it from: https://cloud.mongodb.com/ -> Database -> Connect"
        read -p "MongoDB Connection URI: " MONGODB_URI
    done
    
    read -p "MongoDB Database Name [open-lance]: " MONGODB_DATABASE
    MONGODB_DATABASE=${MONGODB_DATABASE:-open-lance}
    
    # Frontend URL (Cloudflare Pages or GitHub Pages)
    read -p "Frontend URL (e.g., https://open-lance.pages.dev) [*]: " FRONTEND_URL
    FRONTEND_URL=${FRONTEND_URL:-"*"}
    
    # Generate JWT Secret
    print_info "Generating JWT secret..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Save configuration
    cat > "$PROJECT_ROOT/.deploy-config" <<EOF
# Open-Lance Deployment Configuration v3.0 (Cloudflare Workers)
ENVIRONMENT=$ENVIRONMENT
MONGODB_URI=$MONGODB_URI
MONGODB_DATABASE=$MONGODB_DATABASE
FRONTEND_URL=$FRONTEND_URL
JWT_SECRET=$JWT_SECRET
EOF
    
    print_success "Configuration saved to .deploy-config"
    
    # Add to .gitignore
    if ! grep -q ".deploy-config" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
        echo ".deploy-config" >> "$PROJECT_ROOT/.gitignore"
    fi
}

###############################################################################
# Deploy Backend
###############################################################################

deploy_backend() {
    print_header "Deploying Backend (Cloudflare Workers)"
    
    cd "$PROJECT_ROOT/backend"
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm install
    
    # Set environment secrets with Wrangler
    print_info "Setting Cloudflare Workers secrets..."
    
    # MongoDB URI
    echo "$MONGODB_URI" | wrangler secret put MONGODB_URI --env $ENVIRONMENT
    
    # JWT Secret
    echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env $ENVIRONMENT
    
    # Deploy with Wrangler
    print_info "Deploying Cloudflare Worker..."
    wrangler deploy --env $ENVIRONMENT
    
    # Get Worker URL
    API_URL="https://open-lance-backend-$ENVIRONMENT.<your-subdomain>.workers.dev"
    
    print_success "Backend deployed successfully"
    print_info "Worker URL: $API_URL"
    print_warning "Update your worker URL in Cloudflare dashboard if needed"
    
    # Save to config
    cat >> "$PROJECT_ROOT/.deploy-config" <<EOF
API_URL=$API_URL
EOF
    
    cd "$PROJECT_ROOT"
    echo ""
}

###############################################################################
# Configure Frontend
###############################################################################

configure_frontend() {
    print_header "Configuring Frontend"
    
    # Update frontend config
    print_info "Updating frontend configuration..."
    
    cat > "$PROJECT_ROOT/frontend/js/config.js" <<EOF
// Configuration for Open-Lance v3.0 (Cloudflare Workers + MongoDB Atlas)
const CONFIG = {
    // Environment
    ENV: '$ENVIRONMENT',
    
    // API Endpoints
    API: {
        development: {
            baseURL: '$API_URL'
        },
        production: {
            baseURL: '$API_URL'
        }
    },
    
    // App Settings
    SETTINGS: {
        maxContactLinks: 10,
        defaultPageSize: 20,
        retryAttempts: 3,
        retryDelay: 1000 // ms
    }
};

// Get current environment config
function getConfig() {
    const env = CONFIG.ENV;
    return {
        apiBaseURL: CONFIG.API[env].baseURL,
        ...CONFIG.SETTINGS
    };
}

// Export for use in other modules
window.APP_CONFIG = getConfig();
EOF
    
    print_success "Frontend configured successfully"
    echo ""
}

###############################################################################
# Test Deployment
###############################################################################

test_deployment() {
    print_header "Testing Deployment"
    
    print_info "Testing backend health..."
    
    # Test registration endpoint
    REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"TestPass123!"}' 2>/dev/null || echo "000")
    
    HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
    
    if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "400" ]; then
        print_success "Backend is responding correctly"
        print_info "Test registration: HTTP $HTTP_CODE"
    else
        print_warning "Backend may not be fully ready (HTTP $HTTP_CODE)"
    fi
    
    echo ""
}

###############################################################################
# Print Summary
###############################################################################

print_summary() {
    print_header "Deployment Summary"
    
    echo ""
    echo "Environment:          $ENVIRONMENT"
    echo "Platform:             Cloudflare Workers (Edge)"
    echo "Database:             MongoDB Atlas"
    echo "MongoDB Database:     $MONGODB_DATABASE"
    echo ""
    echo "Worker URL:           $API_URL"
    echo "Frontend URL:         $FRONTEND_URL"
    echo ""
    
    print_header "Next Steps"
    echo ""
    echo "1. Test backend:"
    echo "   curl -X POST $API_URL/auth/register \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\"}'"
    echo ""
    echo "2. Test frontend locally:"
    echo "   cd frontend"
    echo "   python -m http.server 8080"
    echo "   Open http://localhost:8080"
    echo ""
    echo "3. Check MongoDB Atlas:"
    echo "   https://cloud.mongodb.com/"
    echo "   Database → Browse Collections → open-lance"
    echo ""
    echo "4. Deploy to Cloudflare Pages (or GitHub Pages):"
    echo "   git add ."
    echo "   git commit -m 'Deploy Open-Lance v3.0'"
    echo "   git push origin main"
    echo "   Or use: wrangler pages deploy frontend"
    echo ""
    echo "5. Monitor:"
    echo "   Cloudflare Dashboard: https://dash.cloudflare.com/"
    echo "   Workers Logs: wrangler tail"
    echo "   MongoDB Atlas: Cluster → Metrics"
    echo ""
    
    print_success "Deployment completed successfully!"
    print_info "For more information, see:"
    echo "  - MONGODB_ATLAS_SETUP.md"
    echo "  - DEPLOYMENT.md"
    echo ""
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    print_header "Open-Lance Deployment Script v3.0"
    echo ""
    echo "This script will deploy Open-Lance with Cloudflare Workers + MongoDB Atlas"
    echo ""
    echo "Changes in v3.0:"
    echo "  ✓ Cloudflare Workers (Edge computing, global)"
    echo "  ✓ MongoDB Atlas (cloud database)"
    echo "  ✓ No AWS required"
    echo "  ✓ Simpler deployment"
    echo ""
    read -p "Continue? (y/n): " continue_deploy
    
    if [[ $continue_deploy != "y" ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    echo ""
    
    # Run deployment steps
    check_prerequisites
    check_cloudflare_auth
    get_configuration
    
    # Deploy backend
    if deploy_backend; then
        # Configure frontend
        configure_frontend
        
        # Test deployment
        test_deployment
        
        # Print summary
        print_summary
    else
        print_error "Backend deployment failed"
        exit 1
    fi
}

# Run main function
main
