#!/usr/bin/env pwsh
# ============================================================================
# AETERNA — One-Click Deployment to NEW AWS Account (Windows)
# ============================================================================
# Prerequisites:
#   - AWS CLI configured with new account credentials (aws configure)
#   - Node.js 18+ installed
#   - npm installed
# 
# Usage: .\deploy-new-account.ps1
# ============================================================================

param(
    [string]$Region = "us-east-1",
    [string]$BucketName = "aeterna-frontend-hosting-$(Get-Random -Minimum 1000 -Maximum 9999)",
    [string]$ProjectName = "aeterna"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AETERNA — One-Click AWS Deployment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Verify AWS credentials
Write-Host "[1/8] Verifying AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --region $Region 2>&1 | ConvertFrom-Json
    Write-Host "  Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "  User: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Step 2: Create S3 bucket
Write-Host "`n[2/8] Creating S3 bucket: $BucketName..." -ForegroundColor Yellow
aws s3 mb "s3://$BucketName" --region $Region 2>&1 | Out-Null

# Configure for static website hosting
aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html --region $Region 2>&1 | Out-Null

# Set bucket policy for public read
$policy = @"
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::$BucketName/*"
    }]
}
"@
aws s3api put-bucket-policy --bucket $BucketName --policy $policy --region $Region 2>&1 | Out-Null
Write-Host "  S3 bucket created and configured" -ForegroundColor Green

# Step 3: Create CloudFront distribution
Write-Host "`n[3/8] Creating CloudFront distribution..." -ForegroundColor Yellow
$cfConfig = @"
{
    "CallerReference": "aeterna-$(Get-Date -Format 'yyyyMMddHHmmss')",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-$BucketName",
            "DomainName": "$BucketName.s3-website-$Region.amazonaws.com",
            "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only"
            }
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BucketName",
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
"@
$cfConfig | Out-File -FilePath "cf-config.json" -Encoding utf8
$cfResult = aws cloudfront create-distribution --distribution-config file://cf-config.json --region $Region 2>&1 | ConvertFrom-Json
$distributionId = $cfResult.Distribution.Id
$domainName = $cfResult.Distribution.DomainName
Remove-Item "cf-config.json" -Force
Write-Host "  Distribution ID: $distributionId" -ForegroundColor Green
Write-Host "  Domain: https://$domainName" -ForegroundColor Green

# Step 4: Create DynamoDB table
Write-Host "`n[4/8] Creating DynamoDB table..." -ForegroundColor Yellow
aws dynamodb create-table `
    --table-name "$ProjectName-vaults" `
    --attribute-definitions AttributeName=id,AttributeType=S AttributeName=owner,AttributeType=S `
    --key-schema AttributeName=id,KeyType=HASH `
    --global-secondary-indexes '[{"IndexName":"byOwner","KeySchema":[{"AttributeName":"owner","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' `
    --billing-mode PAY_PER_REQUEST `
    --region $Region 2>&1 | Out-Null
Write-Host "  DynamoDB table created: $ProjectName-vaults" -ForegroundColor Green

# Step 5: Create Cognito User Pool
Write-Host "`n[5/8] Creating Cognito User Pool..." -ForegroundColor Yellow
$poolResult = aws cognito-idp create-user-pool `
    --pool-name "$ProjectName-users" `
    --auto-verified-attributes email `
    --username-attributes email `
    --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' `
    --region $Region 2>&1 | ConvertFrom-Json
$userPoolId = $poolResult.UserPool.Id
Write-Host "  User Pool ID: $userPoolId" -ForegroundColor Green

# Create User Pool Client
$clientResult = aws cognito-idp create-user-pool-client `
    --user-pool-id $userPoolId `
    --client-name "$ProjectName-web" `
    --no-generate-secret `
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH `
    --region $Region 2>&1 | ConvertFrom-Json
$clientId = $clientResult.UserPoolClient.ClientId
Write-Host "  Client ID: $clientId" -ForegroundColor Green

# Step 6: Build frontend
Write-Host "`n[6/8] Building frontend..." -ForegroundColor Yellow
npm run build 2>&1 | Out-Null
Write-Host "  Build complete" -ForegroundColor Green

# Step 7: Deploy to S3
Write-Host "`n[7/8] Deploying to S3..." -ForegroundColor Yellow
aws s3 sync dist/ "s3://$BucketName/" --delete --region $Region 2>&1 | Out-Null
Write-Host "  Deployed to S3" -ForegroundColor Green

# Step 8: Invalidate CloudFront
Write-Host "`n[8/8] Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" --region $Region 2>&1 | Out-Null
Write-Host "  Cache invalidated" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n  Live URL: https://$domainName" -ForegroundColor Green
Write-Host "  S3 Bucket: $BucketName" -ForegroundColor White
Write-Host "  CloudFront: $distributionId" -ForegroundColor White
Write-Host "  Cognito Pool: $userPoolId" -ForegroundColor White
Write-Host "  Cognito Client: $clientId" -ForegroundColor White
Write-Host "  DynamoDB: $ProjectName-vaults" -ForegroundColor White
Write-Host "  Region: $Region" -ForegroundColor White

# Save deployment info
$deployInfo = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    region = $Region
    s3Bucket = $BucketName
    cloudFrontId = $distributionId
    cloudFrontDomain = $domainName
    cognitoPoolId = $userPoolId
    cognitoClientId = $clientId
    dynamoTable = "$ProjectName-vaults"
}
$deployInfo | ConvertTo-Json | Out-File -FilePath "deployment-info.json" -Encoding utf8
Write-Host "`n  Deployment info saved to: deployment-info.json" -ForegroundColor Yellow
Write-Host "`n  NOTE: Update amplify_outputs.json with the new Cognito/DynamoDB values" -ForegroundColor Yellow
Write-Host "  NOTE: If migrating, run .\migrate-data.ps1 to import user data`n" -ForegroundColor Yellow
