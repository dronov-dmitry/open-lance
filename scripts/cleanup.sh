#!/bin/bash

###############################################################################
# Open-Lance Cleanup Script v2.0
# This script removes all deployed AWS resources
# Note: MongoDB Atlas data is NOT deleted automatically
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_header "Open-Lance Cleanup Script v2.0"

echo ""
echo -e "${RED}WARNING: This will DELETE AWS Lambda functions and API Gateway!${NC}"
echo -e "${RED}This action CANNOT be undone!${NC}"
echo ""
echo "This will remove:"
echo "  - All Lambda functions"
echo "  - API Gateway"
echo "  - CloudWatch Log Groups"
echo ""
echo -e "${YELLOW}MongoDB Atlas data will NOT be deleted.${NC}"
echo "You can manually delete MongoDB data from MongoDB Atlas dashboard."
echo ""

read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

if [[ $confirmation != "yes" ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

# Load configuration
if [ -f "$PROJECT_ROOT/.deploy-config" ]; then
    source "$PROJECT_ROOT/.deploy-config"
else
    echo "Configuration file not found."
    read -p "Enter environment to clean up (dev/prod): " ENVIRONMENT
fi

echo ""
print_warning "Cleaning up environment: $ENVIRONMENT"
echo ""

# Remove backend
print_header "Removing Backend (Lambda + API Gateway)"
cd "$PROJECT_ROOT/backend"

if command -v serverless &> /dev/null; then
    echo "Removing Lambda functions and API Gateway..."
    serverless remove --stage $ENVIRONMENT || true
    print_success "Backend removed"
else
    print_warning "Serverless not found, skipping backend cleanup"
fi

cd "$PROJECT_ROOT"

# Remove Terraform infrastructure (if exists)
print_header "Removing Infrastructure (if Terraform was used)"

if [ -d "$PROJECT_ROOT/infrastructure/terraform/.terraform" ]; then
    cd "$PROJECT_ROOT/infrastructure/terraform"
    
    if command -v terraform &> /dev/null; then
        echo "Destroying Terraform resources..."
        terraform destroy -auto-approve || true
        print_success "Terraform resources removed"
    else
        print_warning "Terraform not found"
    fi
    
    cd "$PROJECT_ROOT"
else
    print_warning "No Terraform state found (skip infrastructure cleanup)"
fi

# Clean up local files
print_header "Cleaning Local Files"

echo "Removing generated files..."
rm -f "$PROJECT_ROOT/.deploy-config"
rm -f "$PROJECT_ROOT/.terraform-outputs.json"
rm -f "$PROJECT_ROOT/backend/.env"
rm -f "$PROJECT_ROOT/infrastructure/terraform/terraform.tfvars"
rm -f "$PROJECT_ROOT/infrastructure/terraform/tfplan"
rm -rf "$PROJECT_ROOT/infrastructure/terraform/.terraform"
rm -f "$PROJECT_ROOT/infrastructure/terraform/.terraform.lock.hcl"

print_success "Local files cleaned"

echo ""
print_header "Cleanup Complete"
echo ""
print_success "AWS resources have been removed"
echo ""
echo -e "${YELLOW}Note: MongoDB Atlas data was NOT deleted${NC}"
echo ""
echo "To delete MongoDB Atlas data:"
echo "  1. Go to https://cloud.mongodb.com/"
echo "  2. Select your cluster"
echo "  3. Click 'Browse Collections'"
echo "  4. Delete collections or the entire database"
echo "  5. (Optional) Delete the cluster"
echo ""
echo "Your code is still intact in: $PROJECT_ROOT"
echo ""
