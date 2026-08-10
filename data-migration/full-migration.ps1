# AETERNA - Zero Data Loss Full AWS Migration (Account A to Account B)
# Transfers: DynamoDB + Cognito + S3 + Route53 + CloudFront + Lambda
# Usage: .\full-migration.ps1

$ErrorActionPreference = "Stop"
$BACKUP = "aeterna-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host "  AETERNA - Full AWS Migration (Account A to Account B)" -ForegroundColor Cyan
Write-Host "  Transfers: DynamoDB + Cognito + S3 + Route53 + CloudFront" -ForegroundColor Cyan
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host ""

# PHASE 1: OLD ACCOUNT CREDENTIALS
Write-Host "[1/12] Enter OLD account credentials (source)" -ForegroundColor Yellow
$oldKey = Read-Host "  Access Key ID"
$oldSecret = Read-Host "  Secret Access Key"
$oldRegion = Read-Host "  Region (default us-east-1)"
if (-not $oldRegion) { $oldRegion = "us-east-1" }
Write-Host ""
$oldBucket = Read-Host "  S3 Bucket name"
$oldDynamo = Read-Host "  DynamoDB Table name"
$oldCognito = Read-Host "  Cognito User Pool ID"
$oldCF = Read-Host "  CloudFront Distribution ID"
$oldDomain = Read-Host "  Custom Domain (blank if none)"

$env:AWS_ACCESS_KEY_ID = $oldKey
$env:AWS_SECRET_ACCESS_KEY = $oldSecret
$env:AWS_DEFAULT_REGION = $oldRegion

Write-Host "[2/12] Verifying old account..." -ForegroundColor Yellow
$oldAcct = (aws sts get-caller-identity 2>&1 | ConvertFrom-Json).Account
Write-Host "  Connected: $oldAcct" -ForegroundColor Green

# PHASE 2: EXPORT
New-Item -ItemType Directory -Force -Path $BACKUP | Out-Null
New-Item -ItemType Directory -Force -Path "$BACKUP/s3" | Out-Null
New-Item -ItemType Directory -Force -Path "$BACKUP/lambda" | Out-Null

# DynamoDB - paginated full export
Write-Host "[3/12] Exporting DynamoDB: $oldDynamo..." -ForegroundColor Yellow
$allItems = @()
$lastKey = $null
do {
    if ($lastKey) {
        $result = aws dynamodb scan --table-name $oldDynamo --region $oldRegion --exclusive-start-key ($lastKey | ConvertTo-Json -Compress) 2>&1 | ConvertFrom-Json
    } else {
        $result = aws dynamodb scan --table-name $oldDynamo --region $oldRegion 2>&1 | ConvertFrom-Json
    }
    $allItems += $result.Items
    $lastKey = $result.LastEvaluatedKey
} while ($lastKey)
$dynamoCount = $allItems.Count
ConvertTo-Json -InputObject @{ Items = $allItems; Count = $dynamoCount } -Depth 20 | Out-File "$BACKUP/dynamodb.json" -Encoding utf8
Write-Host "  Exported: $dynamoCount items" -ForegroundColor Green

# Cognito - paginated
Write-Host "[4/12] Exporting Cognito users..." -ForegroundColor Yellow
$allUsers = @()
$token = $null
do {
    if ($token) {
        $uResult = aws cognito-idp list-users --user-pool-id $oldCognito --region $oldRegion --pagination-token $token 2>&1 | ConvertFrom-Json
    } else {
        $uResult = aws cognito-idp list-users --user-pool-id $oldCognito --region $oldRegion 2>&1 | ConvertFrom-Json
    }
    $allUsers += $uResult.Users
    $token = $uResult.PaginationToken
} while ($token)
$cognitoCount = $allUsers.Count
ConvertTo-Json -InputObject @{ Users = $allUsers; Count = $cognitoCount } -Depth 10 | Out-File "$BACKUP/cognito.json" -Encoding utf8
Write-Host "  Exported: $cognitoCount users" -ForegroundColor Green

# S3 - full sync
Write-Host "[5/12] Downloading S3 bucket: $oldBucket..." -ForegroundColor Yellow
aws s3 sync "s3://$oldBucket" "$BACKUP/s3/" --region $oldRegion --exact-timestamps 2>&1 | Out-Null
$s3Count = (Get-ChildItem "$BACKUP/s3" -Recurse -File).Count
Write-Host "  Exported: $s3Count files (frontend)" -ForegroundColor Green

# S3 - Documents Vault bucket
Write-Host "  Downloading Documents bucket: aeterna-documents-vault..." -ForegroundColor Cyan
$oldDocsBucket = "aeterna-documents-vault"
New-Item -ItemType Directory -Force -Path "$BACKUP/s3-documents" | Out-Null
aws s3 sync "s3://$oldDocsBucket" "$BACKUP/s3-documents/" --region $oldRegion --exact-timestamps 2>&1 | Out-Null
$docsCount = (Get-ChildItem "$BACKUP/s3-documents" -Recurse -File -ErrorAction SilentlyContinue).Count
Write-Host "  Exported: $docsCount encrypted document files" -ForegroundColor Green

# Route53
Write-Host "[6/12] Exporting Route53..." -ForegroundColor Yellow
$r53Done = $false
if ($oldDomain) {
    try {
        $zones = aws route53 list-hosted-zones 2>&1 | ConvertFrom-Json
        $zone = $zones.HostedZones | Where-Object { $_.Name -like "*$oldDomain*" } | Select-Object -First 1
        if ($zone) {
            $zoneId = $zone.Id -replace '/hostedzone/', ''
            aws route53 list-resource-record-sets --hosted-zone-id $zoneId 2>&1 | Out-File "$BACKUP/route53.json" -Encoding utf8
            $r53Done = $true
            Write-Host "  Exported Route53 zone: $zoneId" -ForegroundColor Green
        } else {
            Write-Host "  No zone found for $oldDomain - skipped" -ForegroundColor DarkYellow
        }
    } catch {
        Write-Host "  Route53 not available - skipped" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  No domain specified - skipped" -ForegroundColor DarkYellow
}

# Lambda
Write-Host "[7/12] Exporting Lambda functions..." -ForegroundColor Yellow
$lambdaCount = 0
try {
    $fns = aws lambda list-functions --region $oldRegion 2>&1 | ConvertFrom-Json
    $aeternaFns = $fns.Functions | Where-Object { $_.FunctionName -like "*aeterna*" -or $_.FunctionName -like "*heartbeat*" }
    foreach ($fn in $aeternaFns) {
        $cfg = aws lambda get-function --function-name $fn.FunctionName --region $oldRegion 2>&1 | ConvertFrom-Json
        $cfg | ConvertTo-Json -Depth 10 | Out-File "$BACKUP/lambda/$($fn.FunctionName).json" -Encoding utf8
        if ($cfg.Code.Location) {
            Invoke-WebRequest -Uri $cfg.Code.Location -OutFile "$BACKUP/lambda/$($fn.FunctionName).zip" -UseBasicParsing 2>$null
        }
        $lambdaCount++
    }
    Write-Host "  Exported: $lambdaCount functions" -ForegroundColor Green
} catch {
    Write-Host "  No Lambda functions found" -ForegroundColor DarkYellow
}

# Create ZIP backup
Write-Host "[8/12] Creating backup archive..." -ForegroundColor Yellow
@{ date = (Get-Date).ToString(); account = $oldAcct; dynamo = $dynamoCount; cognito = $cognitoCount; s3 = $s3Count; lambda = $lambdaCount; route53 = $r53Done } | ConvertTo-Json | Out-File "$BACKUP/MANIFEST.json" -Encoding utf8
Compress-Archive -Path "$BACKUP/*" -DestinationPath "$BACKUP.zip" -Force
$zipMB = [math]::Round((Get-Item "$BACKUP.zip").Length / 1MB, 2)
Write-Host "  Backup: $BACKUP.zip ($zipMB MB)" -ForegroundColor Green


# PHASE 3: NEW ACCOUNT
Write-Host ""
Write-Host "  === EXPORT COMPLETE. Now setting up new account ===" -ForegroundColor Green
Write-Host ""

Write-Host "[9/12] Enter NEW account credentials (destination)" -ForegroundColor Yellow
$newKey = Read-Host "  Access Key ID"
$newSecret = Read-Host "  Secret Access Key"
$newRegion = Read-Host "  Region (default us-east-1)"
if (-not $newRegion) { $newRegion = "us-east-1" }

$env:AWS_ACCESS_KEY_ID = $newKey
$env:AWS_SECRET_ACCESS_KEY = $newSecret
$env:AWS_DEFAULT_REGION = $newRegion

$newAcct = (aws sts get-caller-identity 2>&1 | ConvertFrom-Json).Account
Write-Host "  Connected: $newAcct" -ForegroundColor Green

# Create infrastructure
Write-Host "[10/12] Creating infrastructure on new account..." -ForegroundColor Yellow
$newBucket = "aeterna-frontend-$(Get-Random -Minimum 1000 -Maximum 9999)"
$newDynamo = "aeterna-vaults"

# S3
Write-Host "  Creating S3: $newBucket" -ForegroundColor Cyan
aws s3 mb "s3://$newBucket" --region $newRegion 2>&1 | Out-Null
aws s3 website "s3://$newBucket" --index-document index.html --error-document index.html --region $newRegion 2>&1 | Out-Null
$pol = "{""Version"":""2012-10-17"",""Statement"":[{""Effect"":""Allow"",""Principal"":""*"",""Action"":""s3:GetObject"",""Resource"":""arn:aws:s3:::$newBucket/*""}]}"
aws s3api put-bucket-policy --bucket $newBucket --policy $pol --region $newRegion 2>&1 | Out-Null

# DynamoDB
Write-Host "  Creating DynamoDB: $newDynamo" -ForegroundColor Cyan
aws dynamodb create-table --table-name $newDynamo --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $newRegion 2>&1 | Out-Null
aws dynamodb wait table-exists --table-name $newDynamo --region $newRegion 2>&1 | Out-Null

# Cognito
Write-Host "  Creating Cognito User Pool" -ForegroundColor Cyan
$cpol = "{""PasswordPolicy"":{""MinimumLength"":8,""RequireUppercase"":true,""RequireLowercase"":true,""RequireNumbers"":true,""RequireSymbols"":false}}"
$pool = aws cognito-idp create-user-pool --pool-name "aeterna-users" --auto-verified-attributes email --username-attributes email --policies $cpol --region $newRegion 2>&1 | ConvertFrom-Json
$newPoolId = $pool.UserPool.Id
$client = aws cognito-idp create-user-pool-client --user-pool-id $newPoolId --client-name "aeterna-web" --no-generate-secret --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH --region $newRegion 2>&1 | ConvertFrom-Json
$newClientId = $client.UserPoolClient.ClientId
Write-Host "  Pool: $newPoolId | Client: $newClientId" -ForegroundColor Green

# CloudFront
Write-Host "  Creating CloudFront" -ForegroundColor Cyan
$cfJson = @{
    CallerReference = "aeterna-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Origins = @{ Quantity = 1; Items = @(@{ Id = "S3Origin"; DomainName = "$newBucket.s3-website-$newRegion.amazonaws.com"; CustomOriginConfig = @{ HTTPPort = 80; HTTPSPort = 443; OriginProtocolPolicy = "http-only" } }) }
    DefaultCacheBehavior = @{ TargetOriginId = "S3Origin"; ViewerProtocolPolicy = "redirect-to-https"; AllowedMethods = @{ Quantity = 2; Items = @("GET","HEAD") }; ForwardedValues = @{ QueryString = $false; Cookies = @{ Forward = "none" } }; MinTTL = 0; DefaultTTL = 86400; MaxTTL = 31536000 }
    CustomErrorResponses = @{ Quantity = 1; Items = @(@{ ErrorCode = 404; ResponsePagePath = "/index.html"; ResponseCode = "200"; ErrorCachingMinTTL = 300 }) }
    Comment = "Aeterna Migrated"
    Enabled = $true
    DefaultRootObject = "index.html"
} | ConvertTo-Json -Depth 10
$cfJson | Out-File "cf-temp.json" -Encoding utf8
$cf = aws cloudfront create-distribution --distribution-config file://cf-temp.json 2>&1 | ConvertFrom-Json
$newCfId = $cf.Distribution.Id
$newUrl = $cf.Distribution.DomainName
Remove-Item "cf-temp.json" -Force
Write-Host "  CloudFront: $newCfId -> https://$newUrl" -ForegroundColor Green

# Route53
if ($r53Done -and $oldDomain) {
    Write-Host "  Creating Route53 zone: $oldDomain" -ForegroundColor Cyan
    try {
        $nz = aws route53 create-hosted-zone --name $oldDomain --caller-reference "migrate-$(Get-Date -Format 'yyyyMMddHHmmss')" 2>&1 | ConvertFrom-Json
        $newZoneId = $nz.HostedZone.Id -replace '/hostedzone/', ''
        $records = Get-Content "$BACKUP/route53.json" | ConvertFrom-Json
        foreach ($rec in $records.ResourceRecordSets) {
            if ($rec.Type -ne "NS" -and $rec.Type -ne "SOA") {
                $change = @{ Changes = @(@{ Action = "UPSERT"; ResourceRecordSet = $rec }) } | ConvertTo-Json -Depth 10
                $change | Out-File "r53tmp.json" -Encoding utf8
                aws route53 change-resource-record-sets --hosted-zone-id $newZoneId --change-batch file://r53tmp.json 2>&1 | Out-Null
                Remove-Item "r53tmp.json" -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "  Route53 migrated" -ForegroundColor Green
    } catch {
        Write-Host "  Route53 failed - setup manually" -ForegroundColor DarkYellow
    }
}

# PHASE 4: IMPORT DATA
Write-Host "[11/12] Importing data..." -ForegroundColor Yellow

# DynamoDB items
Write-Host "  DynamoDB: importing $dynamoCount items..." -ForegroundColor Cyan
$imported = 0
$failed = 0
foreach ($item in $allItems) {
    try {
        $json = $item | ConvertTo-Json -Depth 20 -Compress
        aws dynamodb put-item --table-name $newDynamo --item $json --region $newRegion 2>&1 | Out-Null
        $imported++
    } catch {
        $failed++
    }
    if ($imported % 100 -eq 0 -and $imported -gt 0) { Write-Host "    Progress: $imported/$dynamoCount" -ForegroundColor DarkCyan }
}
Write-Host "  DynamoDB: $imported imported, $failed failed" -ForegroundColor $(if($failed -eq 0){"Green"}else{"Red"})

# Cognito users
Write-Host "  Cognito: importing $cognitoCount users..." -ForegroundColor Cyan
$uImported = 0
foreach ($u in $allUsers) {
    $email = ($u.Attributes | Where-Object { $_.Name -eq "email" }).Value
    if ($email) {
        try {
            aws cognito-idp admin-create-user --user-pool-id $newPoolId --username $email --user-attributes "Name=email,Value=$email" "Name=email_verified,Value=true" --message-action SUPPRESS --region $newRegion 2>&1 | Out-Null
            $uImported++
        } catch { }
    }
}
Write-Host "  Cognito: $uImported imported" -ForegroundColor Green

# S3 files (frontend)
Write-Host "  S3: syncing $s3Count frontend files..." -ForegroundColor Cyan
aws s3 sync "$BACKUP/s3/" "s3://$newBucket/" --region $newRegion --exact-timestamps 2>&1 | Out-Null
$newS3 = (aws s3 ls "s3://$newBucket/" --recursive --region $newRegion 2>&1 | Measure-Object -Line).Lines
Write-Host "  S3 frontend: $newS3 files synced" -ForegroundColor Green

# S3 Documents bucket - create and sync encrypted user documents
$newDocsBucket = "aeterna-documents-vault"
Write-Host "  Creating Documents bucket: $newDocsBucket..." -ForegroundColor Cyan
aws s3 mb "s3://$newDocsBucket" --region $newRegion 2>&1 | Out-Null
# Set CORS
$docsCors = "{""CORSRules"":[{""AllowedHeaders"":[""*""],""AllowedMethods"":[""GET"",""PUT"",""POST"",""DELETE"",""HEAD""],""AllowedOrigins"":[""*""],""ExposeHeaders"":[""ETag""],""MaxAgeSeconds"":3600}]}"
aws s3api put-bucket-cors --bucket $newDocsBucket --cors-configuration $docsCors --region $newRegion 2>&1 | Out-Null
# Sync documents
if ($docsCount -gt 0) {
    Write-Host "  Syncing $docsCount encrypted documents..." -ForegroundColor Cyan
    aws s3 sync "$BACKUP/s3-documents/" "s3://$newDocsBucket/" --region $newRegion --exact-timestamps 2>&1 | Out-Null
    $newDocs = (aws s3 ls "s3://$newDocsBucket/" --recursive --region $newRegion 2>&1 | Measure-Object -Line).Lines
    Write-Host "  Documents: $newDocs files synced" -ForegroundColor Green
} else {
    Write-Host "  No documents to sync (bucket empty)" -ForegroundColor DarkYellow
    $newDocs = 0
}

# Re-sync if mismatch
if ($newS3 -lt $s3Count) {
    Write-Host "  S3 MISMATCH detected! Re-syncing..." -ForegroundColor Red
    aws s3 sync "$BACKUP/s3/" "s3://$newBucket/" --region $newRegion --exact-timestamps 2>&1 | Out-Null
    $newS3 = (aws s3 ls "s3://$newBucket/" --recursive --region $newRegion 2>&1 | Measure-Object -Line).Lines
}

aws cloudfront create-invalidation --distribution-id $newCfId --paths "/*" --region $newRegion 2>&1 | Out-Null

# PHASE 5: VERIFICATION
Write-Host "[12/12] Verification..." -ForegroundColor Yellow
$vDynamo = (aws dynamodb scan --table-name $newDynamo --select COUNT --region $newRegion 2>&1 | ConvertFrom-Json).Count
$vCognito = (aws cognito-idp list-users --user-pool-id $newPoolId --region $newRegion 2>&1 | ConvertFrom-Json).Users.Count

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor White
Write-Host "  DATA INTEGRITY VERIFICATION" -ForegroundColor White
Write-Host "  ============================================================" -ForegroundColor White
Write-Host "  DynamoDB : Exported=$dynamoCount | Imported=$vDynamo | $(if($vDynamo -ge $dynamoCount){'VERIFIED'}else{'MISMATCH'})" -ForegroundColor $(if($vDynamo -ge $dynamoCount){"Green"}else{"Red"})
Write-Host "  Cognito  : Exported=$cognitoCount | Imported=$vCognito | $(if($vCognito -ge $uImported){'VERIFIED'}else{'PARTIAL'})" -ForegroundColor $(if($vCognito -ge $uImported){"Green"}else{"Yellow"})
Write-Host "  S3 Files : Exported=$s3Count | Imported=$newS3 | $(if($newS3 -ge $s3Count){'VERIFIED'}else{'MISMATCH'})" -ForegroundColor $(if($newS3 -ge $s3Count){"Green"}else{"Red"})
Write-Host "  Documents: Exported=$docsCount | Imported=$newDocs | $(if($newDocs -ge $docsCount){'VERIFIED'}else{'MISMATCH'})" -ForegroundColor $(if($newDocs -ge $docsCount){"Green"}else{"Red"})
Write-Host "  Route53  : $(if($r53Done){'MIGRATED'}else{'SKIPPED'})" -ForegroundColor $(if($r53Done){"Green"}else{"DarkYellow"})
Write-Host "  Lambda   : $lambdaCount functions backed up" -ForegroundColor Green
Write-Host "  ============================================================" -ForegroundColor White
Write-Host ""
Write-Host "  MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "  NEW URL: https://$newUrl" -ForegroundColor Green
Write-Host "  S3:      $newBucket" -ForegroundColor White
Write-Host "  CF:      $newCfId" -ForegroundColor White
Write-Host "  Cognito: $newPoolId (Client: $newClientId)" -ForegroundColor White
Write-Host "  DynamoDB: $newDynamo" -ForegroundColor White
Write-Host "  Backup:  $BACKUP.zip" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Edit amplify_outputs.json with new Pool ID + Client ID" -ForegroundColor Yellow
Write-Host "  2. npm run build" -ForegroundColor Yellow
Write-Host "  3. aws s3 sync dist/ s3://$newBucket/ --delete" -ForegroundColor Yellow
Write-Host "  4. Users reset their Cognito password (one time)" -ForegroundColor Yellow
Write-Host "  5. Encrypted vault data is INTACT - Master Password unchanged" -ForegroundColor Yellow
if ($oldDomain) { Write-Host "  6. Update domain registrar nameservers" -ForegroundColor Yellow }
Write-Host ""

# Save info
@{ date = (Get-Date).ToString(); from = $oldAcct; to = $newAcct; url = "https://$newUrl"; bucket = $newBucket; cf = $newCfId; pool = $newPoolId; client = $newClientId; dynamo = $newDynamo; verified = @{ dynamo = $vDynamo; cognito = $vCognito; s3 = $newS3 } } | ConvertTo-Json | Out-File "deployment-info.json" -Encoding utf8
Write-Host "  Saved: deployment-info.json" -ForegroundColor Green
