# Terraform Outputs

output "account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS Account ID"
}

output "region" {
  value       = data.aws_region.current.name
  description = "AWS Region"
}

# IAM Roles
output "lambda_execution_role_arn" {
  value       = aws_iam_role.lambda_execution.arn
  description = "Lambda execution role ARN"
}

output "lambda_execution_role_name" {
  value       = aws_iam_role.lambda_execution.name
  description = "Lambda execution role name"
}

# Cognito
output "cognito_outputs" {
  value = {
    user_pool_id = try(aws_cognito_user_pool.main.id, "not-created")
    client_id    = try(aws_cognito_user_pool_client.main.id, "not-created")
    domain       = try(aws_cognito_user_pool_domain.main.domain, "not-created")
  }
  description = "Cognito configuration outputs (if cognito.tf exists)"
}

# MongoDB Configuration (from variables)
output "mongodb_database" {
  value       = var.mongodb_database
  description = "MongoDB database name"
}

# Instructions
output "deployment_instructions" {
  value = <<-EOT
    
    ============================================
    Open-Lance Infrastructure Deployed
    ============================================
    
    Database: MongoDB Atlas (configured externally)
    
    Next Steps:
    
    1. Set up MongoDB Atlas:
       See MONGODB_ATLAS_SETUP.md for detailed instructions
       - Create cluster
       - Get connection string
       - Configure network access
    
    2. Configure Backend Environment Variables:
       Create backend/.env file:
       
       MONGODB_URI=${var.mongodb_uri}
       MONGODB_DATABASE=${var.mongodb_database}
       JWT_SECRET=${var.jwt_secret}
       ALLOWED_ORIGIN=https://your-username.github.io
       STAGE=${var.environment}
    
    3. Deploy Lambda Functions:
       cd backend
       npm install
       serverless deploy --stage ${var.environment}
    
    4. Update Frontend Configuration:
       Edit frontend/js/config.js with:
       - API Gateway URL: (will be output by serverless deploy)
       - Region: ${var.aws_region}
    
    5. Deploy Frontend to GitHub Pages:
       - Push frontend/ directory to your GitHub repository
       - Enable GitHub Pages in repository settings
    
    ============================================
    
    Terraform Configuration:
    - Environment: ${var.environment}
    - Region: ${var.aws_region}
    - Account ID: ${data.aws_caller_identity.current.account_id}
    
    ============================================
  EOT
  description = "Deployment instructions"
}
