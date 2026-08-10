#!/usr/bin/env bash
# ============================================================================
# AETERNA — One-Click Deployment to NEW AWS Account (Linux/Mac)
# ============================================================================
# Prerequisites:
#   - AWS CLI configured with new account credentials (aws configure)
#   - Node.js 18+ installed
#   - npm installed
#   - jq installed (brew install jq / apt install jq)
#
# Usage: chmod +x deploy-new-account.sh && ./deploy-new-account.sh
# ============================================================================

set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────
REGION="${1:-us-east-1}"
BUCKET_NAME="${2:-aeterna-frontend-hosting-$((RANDOM % 9000 + 1000))}"
PROJECT_NAME="${3:-aeterna}"

# ── Colors ──────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m'

echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}  AETERNA — One-Click AWS Deployment${NC}"
echo -e "${CYAN}========================================${NC}\n"

# ── Step 1: Verify AWS credentials ─────────────────────────────────────────
echo -e "${YELLOW}[1/8] Verifying AWS credentials...${NC}"
if ! IDENTITY=$(aws sts get-caller-identity --region "$REGION" 2>&1); then
    echo -e "${RED}  ERROR: AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi
ACCOUNT=$(echo "$IDENTITY" | jq -r '.Account')
ARN=$(echo "$IDENTITY" | jq -r '.Arn')
echo -e "${GREEN}  Account: $ACCOUNT${NC}"
echo -e "${GREEN}  User: $ARN${NC}"

# ── Step 2: Create S3 bucket ───────────────────────────────────────────────
echo -e "\n${YELLOW}[2/8] Creating S3 bucket: $BUCKET_NAME...${NC}"
aws s3 mb "s3://$BUCKET_NAME" --region "$REGION" > /dev/null 2>&1

# Configure for static website hosting
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html > /dev/null 2>&1

# Set bucket policy for public read
POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }]
}
EOF
)
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "$POLICY" --region "$REGION" > /dev/null 2>&1
echo -e "${GREEN}  S3 bucket created and configured${NC}"

# ── Step 3: Create CloudFront distribution ─────────────────────────────────
echo -e "\n${YELLOW}[3/8] Creating CloudFront distribution...${NC}"
CALLER_REF="aeterna-$(date +%Y%m%d%H%M%S)"

cat > /tmp/cf-config.json <<EOF
{
    "CallerReference": "$CALLER_REF",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-$BUCKET_NAME",
            "DomainName": "$BUCKET_NAME.s3-website-$REGION.amazonaws.com",
            "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only"
            }
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
        "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}},
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [{
            "ErrorCode": 404,
            "ResponsePagePath": "/index.html",
            "ResponseCode": "200",
            "ErrorCachingMinTTL": 300
        }]
    },
    "Comment": "Aeterna Frontend",
    "Enabled": true,
    "DefaultRootObject": "index.html"
}
EOF

CF_RESULT=$(aws cloudfront create-distribution --distribution-config file:///tmp/cf-config.json --region "$REGION" 2>&1)
DISTRIBUTION_ID=$(echo "$CF_RESULT" | jq -r '.Distribution.Id')
DOMAIN_NAME=$(echo "$CF_RESULT" | jq -r '.Distribution.DomainName')
rm -f /tmp/cf-config.json
echo -e "${GREEN}  Distribution ID: $DISTRIBUTION_ID${NC}"
echo -e "${GREEN}  Domain: https://$DOMAIN_NAME${NC}"

# ── Step 4: Create DynamoDB table ──────────────────────────────────────────
echo -e "\n${YELLOW}[4/8] Creating DynamoDB table...${NC}"
aws dynamodb create-table \
    --table-name "$PROJECT_NAME-vaults" \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=owner,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes '[{"IndexName":"byOwner","KeySchema":[{"AttributeName":"owner","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" > /dev/null 2>&1
echo -e "${GREEN}  DynamoDB table created: $PROJECT_NAME-vaults${NC}"

# ── Step 5: Create Cognito User Pool ──────────────────────────────────────
echo -e "\n${YELLOW}[5/8] Creating Cognito User Pool...${NC}"
POOL_RESULT=$(aws cognito-idp create-user-pool \
    --pool-name "$PROJECT_NAME-users" \
    --auto-verified-attributes email \
    --username-attributes email \
    --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' \
    --region "$REGION" 2>&1)
USER_POOL_ID=$(echo "$POOL_RESULT" | jq -r '.UserPool.Id')
echo -e "${GREEN}  User Pool ID: $USER_POOL_ID${NC}"

# Create User Pool Client
CLIENT_RESULT=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "$PROJECT_NAME-web" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --region "$REGION" 2>&1)
CLIENT_ID=$(echo "$CLIENT_RESULT" | jq -r '.UserPoolClient.ClientId')
echo -e "${GREEN}  Client ID: $CLIENT_ID${NC}"

# ── Step 6: Build frontend ────────────────────────────────────────────────
echo -e "\n${YELLOW}[6/8] Building frontend...${NC}"
npm run build > /dev/null 2>&1
echo -e "${GREEN}  Build complete${NC}"

# ── Step 7: Deploy to S3 ──────────────────────────────────────────────────
echo -e "\n${YELLOW}[7/8] Deploying to S3...${NC}"
aws s3 sync dist/ "s3://$BUCKET_NAME/" --delete --region "$REGION" > /dev/null 2>&1
echo -e "${GREEN}  Deployed to S3${NC}"

# ── Step 8: Invalidate CloudFront ──────────────────────────────────────────
echo -e "\n${YELLOW}[8/8] Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --region "$REGION" > /dev/null 2>&1
echo -e "${GREEN}  Cache invalidated${NC}"

# ── Summary ────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "\n${GREEN}  Live URL: https://$DOMAIN_NAME${NC}"
echo -e "${WHITE}  S3 Bucket: $BUCKET_NAME${NC}"
echo -e "${WHITE}  CloudFront: $DISTRIBUTION_ID${NC}"
echo -e "${WHITE}  Cognito Pool: $USER_POOL_ID${NC}"
echo -e "${WHITE}  Cognito Client: $CLIENT_ID${NC}"
echo -e "${WHITE}  DynamoDB: $PROJECT_NAME-vaults${NC}"
echo -e "${WHITE}  Region: $REGION${NC}"

# Save deployment info
cat > deployment-info.json <<EOF
{
    "timestamp": "$(date '+%Y-%m-%d %H:%M:%S')",
    "region": "$REGION",
    "s3Bucket": "$BUCKET_NAME",
    "cloudFrontId": "$DISTRIBUTION_ID",
    "cloudFrontDomain": "$DOMAIN_NAME",
    "cognitoPoolId": "$USER_POOL_ID",
    "cognitoClientId": "$CLIENT_ID",
    "dynamoTable": "$PROJECT_NAME-vaults"
}
EOF
echo -e "\n${YELLOW}  Deployment info saved to: deployment-info.json${NC}"
echo -e "\n${YELLOW}  NOTE: Update amplify_outputs.json with the new Cognito/DynamoDB values${NC}"
echo -e "${YELLOW}  NOTE: If migrating, run ./migrate-data.sh to import user data${NC}\n"
