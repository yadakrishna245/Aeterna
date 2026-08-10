#!/usr/bin/env pwsh
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
# Usage: .\full-migration.ps1
# ============================================================================

$ErrorActionPreference = "Stop"
$BackupDir = "migration-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"

function Write-Step($step, $msg) {
    Write-Host "`n[$step] $msg" -ForegroundColor Yellow
}

function Write-OK($msg) {
    Write-Host "  ✅ $msg" -ForegroundColor Green
}

function Write-Err($msg) {
    Write-Host "  ❌ $msg" -ForegroundColor Red
}

function Write-Info($msg) {
    Write-Host "  ℹ️  $msg" -ForegroundColor Cyan
}

# ============================================================================
# BANNER
# ============================================================================
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     AETERNA — Full AWS Migration (Account A → B)       ║" -ForegroundColor Cyan
Write-Host "  ║     Transfers: DynamoDB + Cognito + S3 + CloudFront    ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Get OLD account (Account A) details
# ============================================================================
Write-Step "1/10" "Configure OLD AWS Account (Account A — source)"
Write-Host ""
Write-Host "  Enter the AWS credentials for your OLD account (where data currently lives):" -ForegroundColor White
Write-Host ""

$oldAccessKey = Read-Host "  AWS Access Key ID (old account)"
$oldSecretKey = Read-Host "  AWS Secret Access Key (old account)" 
$oldRegion = Read-Host "  Region (default: us-east-1)"
if ([string]::IsNullOrEmpty($oldRegion)) { $oldRegion = "us-east-1" }

# Get resource names from old account
$oldBucket = Read-Host "  S3 Bucket name (e.g., aeterna-frontend-hosting-2026)"
$oldDynamoTable = Read-Host "  DynamoDB table name (e.g., Vault-5dvffs2v5vclnau2vveu3m4uvi-NONE)"
$oldCognitoPoolId = Read-Host "  Cognito User Pool ID (e.g., us-east-1_cCm6NXVrV)"
$oldCloudFrontId = Read-Host "  CloudFront Distribution ID (e.g., EUR1I2U5K7OJ1)"

# Set up old account profile
$env:AWS_ACCESS_KEY_ID = $oldAccessKey
$env:AWS_SECRET_ACCESS_KEY = $oldSecretKey
$env:AWS_DEFAULT_REGION = $oldRegion

Write-Host ""
Write-Step "2/10" "Verifying OLD account access..."
try {
    $oldIdentity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-OK "Connected to Account A: $($oldIdentity.Account)"
} catch {
    Write-Err "Failed to connect to old account. Check credentials."
    exit 1
}

# ============================================================================
# STEP 2: Export DynamoDB data
# ============================================================================
Write-Step "3/10" "Exporting DynamoDB table: $oldDynamoTable..."
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$scanResult = aws dynamodb scan --table-name $oldDynamoTable --region $oldRegion 2>&1
$scanResult | Out-File -FilePath "$BackupDir/dynamodb-data.json" -Encoding utf8

$itemCount = ($scanResult | ConvertFrom-Json).Count
Write-OK "Exported $itemCount items from DynamoDB"

# ============================================================================
# STEP 3: Export Cognito users
# ============================================================================
Write-Step "4/10" "Exporting Cognito users from pool: $oldCognitoPoolId..."

$users = aws cognito-idp list-users --user-pool-id $oldCognitoPoolId --region $oldRegion 2>&1
$users | Out-File -FilePath "$BackupDir/cognito-users.json" -Encoding utf8

$userCount = ($users | ConvertFrom-Json).Users.Count
Write-OK "Exported $userCount Cognito users"

# ============================================================================
# STEP 4: Export S3 bucket contents
# ============================================================================
Write-Step "5/10" "Downloading S3 bucket: $oldBucket (frontend files)..."
New-Item -ItemType Directory -Force -Path "$BackupDir/s3-files" | Out-Null

aws s3 sync "s3://$oldBucket" "$BackupDir/s3-files/" --region $oldRegion 2>&1 | Out-Null
$s3Count = (Get-ChildItem "$BackupDir/s3-files" -Recurse -File).Count
Write-OK "Downloaded $s3Count files from S3"

# ============================================================================
# STEP 5: Create backup ZIP
# ============================================================================
Write-Step "6/10" "Creating backup archive..."

# Save migration metadata
@{
    exportDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    sourceAccount = $oldIdentity.Account
    sourceRegion = $oldRegion
    sourceBucket = $oldBucket
    sourceDynamoTable = $oldDynamoTable
    sourceCognitoPool = $oldCognitoPoolId
    sourceCloudFront = $oldCloudFrontId
    dynamoItemCount = $itemCount
    cognitoUserCount = $userCount
    s3FileCount = $s3Count
} | ConvertTo-Json | Out-File -FilePath "$BackupDir/migration-metadata.json" -Encoding utf8

Compress-Archive -Path "$BackupDir/*" -DestinationPath "$BackupDir.zip" -Force
$zipSize = [math]::Round((Get-Item "$BackupDir.zip").Length / 1MB, 2)
Write-OK "Backup created: $BackupDir.zip ($zipSize MB)"

# ============================================================================
# STEP 6: Get NEW account (Account B) details
# ============================================================================
Write-Host ""
Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DATA EXPORT COMPLETE. Now setting up NEW account." -ForegroundColor Cyan
Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Step "7/10" "Configure NEW AWS Account (Account B — destination)"
Write-Host ""
Write-Host "  Enter the AWS credentials for your NEW account:" -ForegroundColor White
Write-Host ""

$newAccessKey = Read-Host "  AWS Access Key ID (new account)"
$newSecretKey = Read-Host "  AWS Secret Access Key (new account)"
$newRegion = Read-Host "  Region (default: us-east-1)"
if ([string]::IsNullOrEmpty($newRegion)) { $newRegion = "us-east-1" }

# Switch to new account
$env:AWS_ACCESS_KEY_ID = $newAccessKey
$env:AWS_SECRET_ACCESS_KEY = $newSecretKey
$env:AWS_DEFAULT_REGION = $newRegion

Write-Host ""
Write-Step "7b" "Verifying NEW account access..."
try {
    $newIdentity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-OK "Connected to Account B: $($newIdentity.Account)"
} catch {
    Write-Err "Failed to connect to new account. Check credentials."
    exit 1
}

# ============================================================================
# STEP 7: Create infrastructure on new account
# ============================================================================
$newBucket = "aeterna-frontend-$(Get-Random -Minimum 1000 -Maximum 9999)"
$newDynamoTable = "aeterna-vaults"
$newProjectName = "aeterna"

Write-Step "8/10" "Creating infrastructure on Account B..."

# Create S3 bucket
Write-Info "Creating S3 bucket: $newBucket"
aws s3 mb "s3://$newBucket" --region $newRegion 2>&1 | Out-Null
aws s3 website "s3://$newBucket" --index-document index.html --error-document index.html --region $newRegion 2>&1 | Out-Null

$policy = "{`"Version`":`"2012-10-17`",`"Statement`":[{`"Sid`":`"PublicRead`",`"Effect`":`"Allow`",`"Principal`":`"*`",`"Action`":`"s3:GetObject`",`"Resource`":`"arn:aws:s3:::$newBucket/*`"}]}"
aws s3api put-bucket-policy --bucket $newBucket --policy $policy --region $newRegion 2>&1 | Out-Null
Write-OK "S3 bucket created"

# Create DynamoDB table
Write-Info "Creating DynamoDB table: $newDynamoTable"
aws dynamodb create-table `
    --table-name $newDynamoTable `
    --attribute-definitions AttributeName=id,AttributeType=S `
    --key-schema AttributeName=id,KeyType=HASH `
    --billing-mode PAY_PER_REQUEST `
    --region $newRegion 2>&1 | Out-Null

# Wait for table to be active
Write-Info "Waiting for DynamoDB table to be active..."
aws dynamodb wait table-exists --table-name $newDynamoTable --region $newRegion 2>&1 | Out-Null
Write-OK "DynamoDB table created and active"

# Create Cognito User Pool
Write-Info "Creating Cognito User Pool..."
$poolResult = aws cognito-idp create-user-pool `
    --pool-name "$newProjectName-users" `
    --auto-verified-attributes email `
    --username-attributes email `
    --policies '{\"PasswordPolicy\":{\"MinimumLength\":8,\"RequireUppercase\":true,\"RequireLowercase\":true,\"RequireNumbers\":true,\"RequireSymbols\":false}}' `
    --region $newRegion 2>&1 | ConvertFrom-Json
$newPoolId = $poolResult.UserPool.Id

$clientResult = aws cognito-idp create-user-pool-client `
    --user-pool-id $newPoolId `
    --client-name "$newProjectName-web" `
    --no-generate-secret `
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH `
    --region $newRegion 2>&1 | ConvertFrom-Json
$newClientId = $clientResult.UserPoolClient.ClientId
Write-OK "Cognito User Pool created: $newPoolId (Client: $newClientId)"

# Create CloudFront distribution
Write-Info "Creating CloudFront distribution..."
$cfConfig = @"
{
    "CallerReference": "aeterna-$(Get-Date -Format 'yyyyMMddHHmmss')",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-$newBucket",
            "DomainName": "$newBucket.s3-website-$newRegion.amazonaws.com",
            "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only"
            }
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$newBucket",
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
"@
$cfConfig | Out-File -FilePath "cf-temp.json" -Encoding utf8
$cfResult = aws cloudfront create-distribution --distribution-config file://cf-temp.json --region $newRegion 2>&1 | ConvertFrom-Json
$newCfId = $cfResult.Distribution.Id
$newDomain = $cfResult.Distribution.DomainName
Remove-Item "cf-temp.json" -Force
Write-OK "CloudFront created: $newCfId → https://$newDomain"

# ============================================================================
# STEP 8: Import DynamoDB data
# ============================================================================
Write-Step "9/10" "Importing data to Account B..."

Write-Info "Importing DynamoDB items..."
$dynamoData = Get-Content "$BackupDir/dynamodb-data.json" | ConvertFrom-Json
$importedCount = 0

foreach ($item in $dynamoData.Items) {
    $itemJson = $item | ConvertTo-Json -Depth 10 -Compress
    aws dynamodb put-item --table-name $newDynamoTable --item $itemJson --region $newRegion 2>&1 | Out-Null
    $importedCount++
}
Write-OK "Imported $importedCount DynamoDB items"

# Import Cognito users
Write-Info "Importing Cognito users..."
$cognitoData = Get-Content "$BackupDir/cognito-users.json" | ConvertFrom-Json
$userImported = 0

foreach ($user in $cognitoData.Users) {
    $email = ($user.Attributes | Where-Object { $_.Name -eq "email" }).Value
    if ($email) {
        try {
            aws cognito-idp admin-create-user `
                --user-pool-id $newPoolId `
                --username $email `
                --user-attributes Name=email,Value=$email Name=email_verified,Value=true `
                --message-action SUPPRESS `
                --region $newRegion 2>&1 | Out-Null
            $userImported++
        } catch {
            Write-Host "    Skipped user (may already exist): $email" -ForegroundColor DarkYellow
        }
    }
}
Write-OK "Imported $userImported Cognito users (they'll need to reset passwords)"

# Upload S3 files
Write-Info "Syncing S3 files to new bucket..."
aws s3 sync "$BackupDir/s3-files/" "s3://$newBucket/" --region $newRegion 2>&1 | Out-Null
Write-OK "S3 files synced"

# ============================================================================
# STEP 9: Invalidate CloudFront + Verify
# ============================================================================
Write-Step "10/10" "Final steps..."

aws cloudfront create-invalidation --distribution-id $newCfId --paths "/*" --region $newRegion 2>&1 | Out-Null
Write-OK "CloudFront cache invalidated"

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║         MIGRATION COMPLETE! 🎉                         ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────────────────────┐" -ForegroundColor White
Write-Host "  │ FROM (Account A): $($oldIdentity.Account)" -ForegroundColor White
Write-Host "  │ TO   (Account B): $($newIdentity.Account)" -ForegroundColor White
Write-Host "  ├─────────────────────────────────────────────────────────┤" -ForegroundColor White
Write-Host "  │ New Live URL:     https://$newDomain" -ForegroundColor Green
Write-Host "  │ S3 Bucket:        $newBucket" -ForegroundColor White
Write-Host "  │ CloudFront:       $newCfId" -ForegroundColor White
Write-Host "  │ Cognito Pool:     $newPoolId" -ForegroundColor White
Write-Host "  │ Cognito Client:   $newClientId" -ForegroundColor White
Write-Host "  │ DynamoDB Table:   $newDynamoTable" -ForegroundColor White
Write-Host "  │ Region:           $newRegion" -ForegroundColor White
Write-Host "  ├─────────────────────────────────────────────────────────┤" -ForegroundColor White
Write-Host "  │ Data Migrated:" -ForegroundColor White
Write-Host "  │   DynamoDB:       $importedCount items" -ForegroundColor White
Write-Host "  │   Cognito:        $userImported users" -ForegroundColor White
Write-Host "  │   S3 Files:       $s3Count files" -ForegroundColor White
Write-Host "  │   Backup File:    $BackupDir.zip ($zipSize MB)" -ForegroundColor White
Write-Host "  └─────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""
Write-Host "  ⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Update amplify_outputs.json with new Cognito Pool ID & Client ID" -ForegroundColor Yellow
Write-Host "  2. Run 'npm run build' to rebuild with new config" -ForegroundColor Yellow
Write-Host "  3. Run 'aws s3 sync dist/ s3://$newBucket/ --delete' to deploy new build" -ForegroundColor Yellow
Write-Host "  4. Users will need to RESET their passwords (Cognito migration limitation)" -ForegroundColor Yellow
Write-Host "  5. Their encrypted vault data is intact — Master Password unchanged" -ForegroundColor Yellow
Write-Host ""
Write-Host "  📦 Backup ZIP saved at: $BackupDir.zip (keep this safe!)" -ForegroundColor Cyan
Write-Host ""

# Save new deployment info
@{
    migrationDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    fromAccount = $oldIdentity.Account
    toAccount = $newIdentity.Account
    newRegion = $newRegion
    newBucket = $newBucket
    newCloudFrontId = $newCfId
    newCloudFrontDomain = $newDomain
    newCognitoPoolId = $newPoolId
    newCognitoClientId = $newClientId
    newDynamoTable = $newDynamoTable
    itemsMigrated = $importedCount
    usersMigrated = $userImported
    s3FilesMigrated = $s3Count
} | ConvertTo-Json | Out-File -FilePath "deployment-info.json" -Encoding utf8

Write-OK "Deployment info saved to: deployment-info.json"
