#!/bin/bash

# AWS Region Consistency Checker
# Verifies that all configuration files use the same AWS region

set -e

echo "🔍 Checking AWS Region Consistency..."
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if files exist
TERRAFORM_FILE="$PROJECT_ROOT/infrastructure/terraform/terraform.tfvars"
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
FRONTEND_CONFIG="$PROJECT_ROOT/frontend/js/config.js"

# Function to extract region from file
get_aws_cli_region() {
    if aws configure get region &>/dev/null; then
        aws configure get region 2>/dev/null || echo "NOT_SET"
    else
        echo "NOT_SET"
    fi
}

get_terraform_region() {
    if [ -f "$TERRAFORM_FILE" ]; then
        grep "aws_region" "$TERRAFORM_FILE" | grep -oP '"\K[^"]+' || echo "NOT_SET"
    else
        echo "FILE_NOT_FOUND"
    fi
}

get_backend_region() {
    if [ -f "$BACKEND_ENV" ]; then
        grep "AWS_REGION=" "$BACKEND_ENV" | cut -d'=' -f2 | tr -d ' ' || echo "NOT_SET"
    else
        echo "FILE_NOT_FOUND"
    fi
}

get_frontend_region() {
    if [ -f "$FRONTEND_CONFIG" ]; then
        grep "region:" "$FRONTEND_CONFIG" | grep -oP "'[^']+'" | head -1 | tr -d "'" || echo "NOT_SET"
    else
        echo "FILE_NOT_FOUND"
    fi
}

# Get regions from all configs
echo "📍 Detected Regions:"
echo "-------------------"

CLI_REGION=$(get_aws_cli_region)
TERRAFORM_REGION=$(get_terraform_region)
BACKEND_REGION=$(get_backend_region)
FRONTEND_REGION=$(get_frontend_region)

echo "AWS CLI:      $CLI_REGION"
echo "Terraform:    $TERRAFORM_REGION"
echo "Backend:      $BACKEND_REGION"
echo "Frontend:     $FRONTEND_REGION"
echo ""

# Check consistency
ERRORS=0

if [ "$CLI_REGION" == "NOT_SET" ]; then
    echo -e "${YELLOW}⚠️  WARNING: AWS CLI region not configured${NC}"
    echo "   Run: aws configure set region <your-region>"
    ERRORS=$((ERRORS + 1))
fi

if [ "$TERRAFORM_REGION" == "FILE_NOT_FOUND" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Terraform config not found${NC}"
    echo "   Create: infrastructure/terraform/terraform.tfvars"
    ERRORS=$((ERRORS + 1))
elif [ "$TERRAFORM_REGION" == "NOT_SET" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Terraform region not set${NC}"
    echo "   Set aws_region in terraform.tfvars"
    ERRORS=$((ERRORS + 1))
fi

if [ "$BACKEND_REGION" == "FILE_NOT_FOUND" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Backend .env not found${NC}"
    echo "   Create: backend/.env"
    ERRORS=$((ERRORS + 1))
elif [ "$BACKEND_REGION" == "NOT_SET" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Backend region not set${NC}"
    echo "   Set AWS_REGION in backend/.env"
    ERRORS=$((ERRORS + 1))
fi

if [ "$FRONTEND_REGION" == "FILE_NOT_FOUND" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Frontend config not found${NC}"
    echo "   Check: frontend/js/config.js"
    ERRORS=$((ERRORS + 1))
elif [ "$FRONTEND_REGION" == "NOT_SET" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Frontend region not set${NC}"
    echo "   Set region in frontend/js/config.js"
    ERRORS=$((ERRORS + 1))
fi

# Compare regions (ignore NOT_SET and FILE_NOT_FOUND)
REGIONS=()
[ "$CLI_REGION" != "NOT_SET" ] && [ "$CLI_REGION" != "FILE_NOT_FOUND" ] && REGIONS+=("$CLI_REGION")
[ "$TERRAFORM_REGION" != "NOT_SET" ] && [ "$TERRAFORM_REGION" != "FILE_NOT_FOUND" ] && REGIONS+=("$TERRAFORM_REGION")
[ "$BACKEND_REGION" != "NOT_SET" ] && [ "$BACKEND_REGION" != "FILE_NOT_FOUND" ] && REGIONS+=("$BACKEND_REGION")
[ "$FRONTEND_REGION" != "NOT_SET" ] && [ "$FRONTEND_REGION" != "FILE_NOT_FOUND" ] && REGIONS+=("$FRONTEND_REGION")

# Check if all regions are the same
UNIQUE_REGIONS=($(printf "%s\n" "${REGIONS[@]}" | sort -u))

if [ ${#UNIQUE_REGIONS[@]} -eq 0 ]; then
    echo ""
    echo -e "${RED}❌ FAILED: No regions configured${NC}"
    echo ""
    echo "📖 Please configure AWS region first:"
    echo "   See: AWS_REGION_GUIDE.md"
    exit 1
elif [ ${#UNIQUE_REGIONS[@]} -gt 1 ]; then
    echo ""
    echo -e "${RED}❌ FAILED: Region mismatch detected!${NC}"
    echo ""
    echo "Different regions found: ${UNIQUE_REGIONS[*]}"
    echo ""
    echo "🔧 Fix by setting all configs to the same region:"
    echo ""
    echo "   # Choose your region (example: us-east-1)"
    echo "   export TARGET_REGION=\"us-east-1\""
    echo ""
    echo "   # AWS CLI"
    echo "   aws configure set region \$TARGET_REGION"
    echo ""
    echo "   # Terraform"
    echo "   # Edit: infrastructure/terraform/terraform.tfvars"
    echo "   # Set: aws_region = \"\$TARGET_REGION\""
    echo ""
    echo "   # Backend"
    echo "   # Edit: backend/.env"
    echo "   # Set: AWS_REGION=\$TARGET_REGION"
    echo ""
    echo "   # Frontend"
    echo "   # Edit: frontend/js/config.js"
    echo "   # Set: region: '\$TARGET_REGION'"
    echo ""
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ SUCCESS: All regions consistent!${NC}"
    echo ""
    echo "   Target Region: ${GREEN}${UNIQUE_REGIONS[0]}${NC}"
    echo ""
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Note: $ERRORS warnings found (see above)${NC}"
        echo ""
    fi
    
    echo "📚 Region Information:"
    echo "   AWS_REGION_GUIDE.md - Complete region guide"
    echo "   docs/AWS_REGION_CHEATSHEET.md - Quick reference"
    echo ""
    echo "🚀 You're ready to deploy!"
    exit 0
fi
