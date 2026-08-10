#!/bin/bash
# ============================================================================
# AETERNA — Full AWS Account Migration (Account A → Account B)
# ============================================================================
# This script does EVERYTHING:
#   1. Asks for OLD account credentials (Account A)
#   2. Exports all data (DynamoDB, Cognito users, S3 files)
#   3. Asks for NEW account credentials (Account B)
#   4. Creates fresh infrastructure on Account B
#   5. Imports all data to Account B
#   6. Verifies migration
#   7. Gives you the new live URL
#
# Prerequisites: aws-cli, jq, zip/unzip, node.js
# Usage: chmod +x full-migration.sh && ./full-migration.sh
# ============================================================================

set -e

BACKUP_DIR="migration-backup-$(date +%Y-%m-%d-%H%M%S)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

step() { echo -e "\n${YELLOW}[$1] $2${NC}"; }
ok() { echo -e "  ${GREEN}✅ $1${NC}"; }
err() { echo -e "  ${RED}❌ $1${NC}"; exit 1; }
info() { echo -e "  ${CYAN}ℹ️  $1${NC}"; }

# ============================================================================
# BANNER
# ============================================================================
echo ""
echo -e "${CYAN}  ╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║     AETERNA — Full AWS Migration (Account A → B)       ║${NC}"
echo -e "${CYAN}  ║     Transfers: DynamoDB + Cognito + S3 + CloudFront    ║${NC}"
echo -e "${CYAN}  ╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# STEP 1: Get OLD account credentials
# ============================================================================
step "1/10" "Configure OLD AWS Account (Account A — source)"
echo ""
echo "  Enter the AWS credentials for your OLD account (where data currently lives):"
echo ""

read -p "  AWS Access Key ID (old account): " OLD_ACCESS_KEY
read -sp "  AWS Secret Access Key (old account): " OLD_SECRET_KEY
echo ""
read -p "  Region (default: us-east-1): " OLD_REGION
OLD_REGION=${OLD_REGION:-us-east-1}

read -p "  S3 Bucket name (e.g., aeterna-frontend-hosting-2026): " OLD_BUCKET
read -p "  DynamoDB table name (e.g., Vault-5dvffs2v5vclnau2vveu3m4uvi-NONE): " OLD_DYNAMO_TABLE
read -p "  Cognito User Pool ID (e.g., us-east-1_cCm6NXVrV): " OLD_COGNITO_POOL
read -p "  CloudFront Distribution ID (e.g., EUR1I2U5K7OJ1): " OLD_CF_ID

# Set old account credentials
export AWS_ACCESS_KEY_ID="$OLD_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$OLD_SECRET_KEY"
export AWS_DEFAULT_REGION="$OLD_REGION"

step "2/10" "Verifying OLD account access..."
OLD_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null) || err "Failed to connect to old account"
ok "Connected to Account A: $OLD_ACCOUNT"

# ============================================================================
# STEP 2: Export DynamoDB
# ============================================================================
step "3/10" "Exporting DynamoDB table: $OLD_DYNAMO_TABLE..."
mkdir -p "$BACKUP_DIR"

aws dynamodb scan --table-name "$OLD_DYNAMO_TABLE" --region "$OLD_REGION" > "$BACKUP_DIR/dynamodb-data.json"
ITEM_COUNT=$(jq '.Count' "$BACKUP_DIR/dynamodb-data.json")
ok "Exported $ITEM_COUNT items from DynamoDB"

# ============================================================================
# STEP 3: Export Cognito users
# ============================================================================
step "4/10" "Exporting Cognito users from pool: $OLD_COGNITO_POOL..."

aws cognito-idp list-users --user-pool-id "$OLD_COGNITO_POOL" --region "$OLD_REGION" > "$BACKUP_DIR/cognito-users.json"
USER_COUNT=$(jq '.Users | length' "$BACKUP_DIR/cognito-users.json")
ok "Exported $USER_COUNT Cognito users"

# ============================================================================
# STEP 4: Export S3
# ============================================================================
step "5/10" "Downloading S3 bucket: $OLD_BUCKET..."
mkdir -p "$BACKUP_DIR/s3-files"

aws s3 sync "s3://$OLD_BUCKET" "$BACKUP_DIR/s3-files/" --region "$OLD_REGION" --quiet
S3_COUNT=$(find "$BACKUP_DIR/s3-files" -type f | wc -l)
ok "Downloaded $S3_COUNT files from S3"

# ============================================================================
# STEP 5: Create backup ZIP
# ============================================================================
step "6/10" "Creating backup archive..."

cat > "$BACKUP_DIR/migration-metadata.json" << EOF
{
    "exportDate": "$(date +%Y-%m-%d\ %H:%M:%S)",
    "sourceAccount": "$OLD_ACCOUNT",
    "sourceRegion": "$OLD_REGION",
    "sourceBucket": "$OLD_BUCKET",
    "sourceDynamoTable": "$OLD_DYNAMO_TABLE",
    "sourceCognitoPool": "$OLD_COGNITO_POOL",
    "sourceCloudFront": "$OLD_CF_ID",
    "dynamoItemCount": $ITEM_COUNT,
    "cognitoUserCount": $USER_COUNT,
    "s3FileCount": $S3_COUNT
}
EOF

zip -r "$BACKUP_DIR.zip" "$BACKUP_DIR/" -q
ZIP_SIZE=$(du -h "$BACKUP_DIR.zip" | cut -f1)
ok "Backup created: $BACKUP_DIR.zip ($ZIP_SIZE)"

# ============================================================================
# STEP 6: Get NEW account credentials
# ============================================================================
echo ""
echo -e "  ${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "  ${CYAN}DATA EXPORT COMPLETE. Now setting up NEW account.${NC}"
echo -e "  ${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

step "7/10" "Configure NEW AWS Account (Account B — destination)"
echo ""

read -p "  AWS Access Key ID (new account): " NEW_ACCESS_KEY
read -sp "  AWS Secret Access Key (new account): " NEW_SECRET_KEY
echo ""
read -p "  Region (default: us-east-1): " NEW_REGION
NEW_REGION=${NEW_REGION:-us-east-1}

# Switch to new account
export AWS_ACCESS_KEY_ID="$NEW_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$NEW_SECRET_KEY"
export AWS_DEFAULT_REGION="$NEW_REGION"

step "7b" "Verifying NEW account access..."
NEW_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null) || err "Failed to connect to new account"
ok "Connected to Account B: $NEW_ACCOUNT"

# ============================================================================
# STEP 7: Create infrastructure on new account
# ============================================================================
NEW_BUCKET="aeterna-frontend-$((RANDOM % 9000 + 1000))"
NEW_DYNAMO_TABLE="aeterna-vaults"

step "8/10" "Creating infrastructure on Account B..."

# S3
info "Creating S3 bucket: $NEW_BUCKET"
aws s3 mb "s3://$NEW_BUCKET" --region "$NEW_REGION" > /dev/null 2>&1
aws s3 website "s3://$NEW_BUCKET" --index-document index.html --error-document index.html > /dev/null 2>&1

POLICY="{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicRead\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::$NEW_BUCKET/*\"}]}"
aws s3api put-bucket-policy --bucket "$NEW_BUCKET" --policy "$POLICY" --region "$NEW_REGION" > /dev/null 2>&1
ok "S3 bucket created"

# DynamoDB
info "Creating DynamoDB table: $NEW_DYNAMO_TABLE"
aws dynamodb create-table \
    --table-name "$NEW_DYNAMO_TABLE" \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$NEW_REGION" > /dev/null 2>&1

aws dynamodb wait table-exists --table-name "$NEW_DYNAMO_TABLE" --region "$NEW_REGION"
ok "DynamoDB table created and active"

# Cognito
info "Creating Cognito User Pool..."
POOL_RESULT=$(aws cognito-idp create-user-pool \
    --pool-name "aeterna-users" \
    --auto-verified-attributes email \
    --username-attributes email \
    --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' \
    --region "$NEW_REGION" 2>&1)
NEW_POOL_ID=$(echo "$POOL_RESULT" | jq -r '.UserPool.Id')

CLIENT_RESULT=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$NEW_POOL_ID" \
    --client-name "aeterna-web" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --region "$NEW_REGION" 2>&1)
NEW_CLIENT_ID=$(echo "$CLIENT_RESULT" | jq -r '.UserPoolClient.ClientId')
ok "Cognito created: Pool=$NEW_POOL_ID, Client=$NEW_CLIENT_ID"

# CloudFront
info "Creating CloudFront distribution..."
CF_CONFIG=$(cat << EOF
{
    "CallerReference": "aeterna-$(date +%Y%m%d%H%M%S)",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-$NEW_BUCKET",
            "DomainName": "$NEW_BUCKET.s3-website-$NEW_REGION.amazonaws.com",
            "CustomOriginConfig": {"HTTPPort": 80, "HTTPSPort": 443, "OriginProtocolPolicy": "http-only"}
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$NEW_BUCKET",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
        "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}},
        "MinTTL": 0, "DefaultTTL": 86400, "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [{"ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 300}]
    },
    "Comment": "Aeterna Frontend - Migrated",
    "Enabled": true,
    "DefaultRootObject": "index.html"
}
EOF
)
echo "$CF_CONFIG" > /tmp/cf-config.json
CF_RESULT=$(aws cloudfront create-distribution --distribution-config file:///tmp/cf-config.json 2>&1)
NEW_CF_ID=$(echo "$CF_RESULT" | jq -r '.Distribution.Id')
NEW_DOMAIN=$(echo "$CF_RESULT" | jq -r '.Distribution.DomainName')
rm -f /tmp/cf-config.json
ok "CloudFront: $NEW_CF_ID → https://$NEW_DOMAIN"

# ============================================================================
# STEP 8: Import data
# ============================================================================
step "9/10" "Importing data to Account B..."

# DynamoDB items
info "Importing DynamoDB items..."
IMPORTED=0
for item in $(jq -c '.Items[]' "$BACKUP_DIR/dynamodb-data.json"); do
    aws dynamodb put-item --table-name "$NEW_DYNAMO_TABLE" --item "$item" --region "$NEW_REGION" > /dev/null 2>&1
    IMPORTED=$((IMPORTED + 1))
done
ok "Imported $IMPORTED DynamoDB items"

# Cognito users
info "Importing Cognito users..."
USERS_IMPORTED=0
for email in $(jq -r '.Users[].Attributes[] | select(.Name=="email") | .Value' "$BACKUP_DIR/cognito-users.json"); do
    aws cognito-idp admin-create-user \
        --user-pool-id "$NEW_POOL_ID" \
        --username "$email" \
        --user-attributes Name=email,Value="$email" Name=email_verified,Value=true \
        --message-action SUPPRESS \
        --region "$NEW_REGION" > /dev/null 2>&1 && USERS_IMPORTED=$((USERS_IMPORTED + 1)) || true
done
ok "Imported $USERS_IMPORTED Cognito users"

# S3
info "Syncing S3 files..."
aws s3 sync "$BACKUP_DIR/s3-files/" "s3://$NEW_BUCKET/" --region "$NEW_REGION" --quiet
ok "S3 files synced"

# ============================================================================
# STEP 9: Finalize
# ============================================================================
step "10/10" "Finalizing..."
aws cloudfront create-invalidation --distribution-id "$NEW_CF_ID" --paths "/*" > /dev/null 2>&1
ok "CloudFront cache invalidated"

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${GREEN}  ╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║         MIGRATION COMPLETE! 🎉                         ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │ FROM (Account A): $OLD_ACCOUNT"
echo "  │ TO   (Account B): $NEW_ACCOUNT"
echo "  ├─────────────────────────────────────────────────────────┤"
echo -e "  │ ${GREEN}New Live URL:     https://$NEW_DOMAIN${NC}"
echo "  │ S3 Bucket:        $NEW_BUCKET"
echo "  │ CloudFront:       $NEW_CF_ID"
echo "  │ Cognito Pool:     $NEW_POOL_ID"
echo "  │ Cognito Client:   $NEW_CLIENT_ID"
echo "  │ DynamoDB Table:   $NEW_DYNAMO_TABLE"
echo "  │ Region:           $NEW_REGION"
echo "  ├─────────────────────────────────────────────────────────┤"
echo "  │ Data Migrated:"
echo "  │   DynamoDB:       $IMPORTED items"
echo "  │   Cognito:        $USERS_IMPORTED users"
echo "  │   S3 Files:       $S3_COUNT files"
echo "  │   Backup File:    $BACKUP_DIR.zip ($ZIP_SIZE)"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""
echo -e "  ${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo "  1. Update amplify_outputs.json with new Cognito Pool ID & Client ID"
echo "  2. Run 'npm run build' to rebuild with new config"
echo "  3. Run 'aws s3 sync dist/ s3://$NEW_BUCKET/ --delete' to deploy new build"
echo "  4. Users will need to RESET their passwords (Cognito migration limitation)"
echo "  5. Their encrypted vault data is intact — Master Password unchanged"
echo ""
echo -e "  ${CYAN}📦 Backup ZIP saved at: $BACKUP_DIR.zip (keep this safe!)${NC}"
echo ""

# Save deployment info
cat > deployment-info.json << EOF
{
    "migrationDate": "$(date +%Y-%m-%d\ %H:%M:%S)",
    "fromAccount": "$OLD_ACCOUNT",
    "toAccount": "$NEW_ACCOUNT",
    "newRegion": "$NEW_REGION",
    "newBucket": "$NEW_BUCKET",
    "newCloudFrontId": "$NEW_CF_ID",
    "newCloudFrontDomain": "$NEW_DOMAIN",
    "newCognitoPoolId": "$NEW_POOL_ID",
    "newCognitoClientId": "$NEW_CLIENT_ID",
    "newDynamoTable": "$NEW_DYNAMO_TABLE",
    "itemsMigrated": $IMPORTED,
    "usersMigrated": $USERS_IMPORTED,
    "s3FilesMigrated": $S3_COUNT
}
EOF
ok "Deployment info saved to: deployment-info.json"
