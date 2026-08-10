#!/usr/bin/env pwsh
# ============================================================================
# AETERNA — Data Migration Script (Export/Import) - Windows
# ============================================================================
# Prerequisites:
#   - AWS CLI configured with appropriate account credentials
#   - For EXPORT: credentials for the SOURCE account
#   - For IMPORT: credentials for the DESTINATION account
#
# Usage:
#   .\migrate-data.ps1 -Mode export -Region us-east-1
#   .\migrate-data.ps1 -Mode import -Region us-east-1 -BackupFile aeterna-backup-2026-08-10.zip
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("export", "import")]
    [string]$Mode,

    [string]$Region = "us-east-1",
    [string]$ProjectName = "aeterna",
    [string]$BackupFile = "",
    [string]$TableName = "",
    [string]$UserPoolId = "",
    [string]$S3Bucket = ""
)

$ErrorActionPreference = "Stop"

# ── Colors & Helpers ────────────────────────────────────────────────────────
function Write-Step($step, $total, $msg) {
    Write-Host "`n[$step/$total] $msg" -ForegroundColor Yellow
}
function Write-Ok($msg) {
    Write-Host "  $msg" -ForegroundColor Green
}
function Write-Err($msg) {
    Write-Host "  ERROR: $msg" -ForegroundColor Red
}
function Write-Info($msg) {
    Write-Host "  $msg" -ForegroundColor White
}

# ── Load deployment-info.json defaults ──────────────────────────────────────
if (Test-Path "deployment-info.json") {
    $deployInfo = Get-Content "deployment-info.json" | ConvertFrom-Json
    if (-not $TableName) { $TableName = $deployInfo.dynamoTable }
    if (-not $UserPoolId) { $UserPoolId = $deployInfo.cognitoPoolId }
    if (-not $S3Bucket) { $S3Bucket = $deployInfo.s3Bucket }
}

# Apply defaults if still empty
if (-not $TableName) { $TableName = "$ProjectName-vaults" }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AETERNA — Data Migration ($($Mode.ToUpper()))" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── Verify AWS credentials ──────────────────────────────────────────────────
Write-Host "`nVerifying AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --region $Region 2>&1 | ConvertFrom-Json
    Write-Info "Account: $($identity.Account) | User: $($identity.Arn)"
} catch {
    Write-Err "AWS credentials not configured. Run 'aws configure' first."
    exit 1
}

# ============================================================================
# EXPORT MODE
# ============================================================================
if ($Mode -eq "export") {
    $timestamp = Get-Date -Format "yyyy-MM-dd"
    $backupDir = "aeterna-backup-$timestamp"
    $zipFile = "$backupDir.zip"

    # Create backup directory
    if (Test-Path $backupDir) { Remove-Item $backupDir -Recurse -Force }
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    New-Item -ItemType Directory -Path "$backupDir\dynamodb" | Out-Null
    New-Item -ItemType Directory -Path "$backupDir\cognito" | Out-Null
    New-Item -ItemType Directory -Path "$backupDir\s3" | Out-Null

    $totalSteps = 4

    # ── Step 1: Export DynamoDB ─────────────────────────────────────────────
    Write-Step 1 $totalSteps "Exporting DynamoDB table: $TableName..."
    try {
        $scanResult = aws dynamodb scan --table-name $TableName --region $Region 2>&1
        $scanResult | Out-File -FilePath "$backupDir\dynamodb\$TableName.json" -Encoding utf8
        $items = ($scanResult | ConvertFrom-Json).Items
        Write-Ok "Exported $($items.Count) items from $TableName"
    } catch {
        Write-Err "Failed to export DynamoDB: $_"
        Write-Info "Table may not exist or you lack permissions"
    }

    # ── Step 2: Export Cognito Users ────────────────────────────────────────
    Write-Step 2 $totalSteps "Exporting Cognito users..."
    if ($UserPoolId) {
        try {
            $allUsers = @()
            $paginationToken = $null
            do {
                $cmd = "aws cognito-idp list-users --user-pool-id $UserPoolId --region $Region --max-results 60"
                if ($paginationToken) {
                    $cmd += " --pagination-token $paginationToken"
                }
                $result = Invoke-Expression $cmd 2>&1 | ConvertFrom-Json
                $allUsers += $result.Users
                $paginationToken = $result.PaginationToken
            } while ($paginationToken)

            $allUsers | ConvertTo-Json -Depth 10 | Out-File -FilePath "$backupDir\cognito\users.json" -Encoding utf8
            Write-Ok "Exported $($allUsers.Count) users"
        } catch {
            Write-Err "Failed to export Cognito users: $_"
        }
    } else {
        Write-Info "No UserPoolId specified, skipping Cognito export"
    }

    # ── Step 3: Export S3 Contents ──────────────────────────────────────────
    Write-Step 3 $totalSteps "Exporting S3 bucket contents..."
    if ($S3Bucket) {
        try {
            aws s3 sync "s3://$S3Bucket" "$backupDir\s3\" --region $Region 2>&1 | Out-Null
            $fileCount = (Get-ChildItem "$backupDir\s3" -Recurse -File).Count
            Write-Ok "Exported $fileCount files from s3://$S3Bucket"
        } catch {
            Write-Err "Failed to export S3: $_"
        }
    } else {
        Write-Info "No S3 bucket specified, skipping S3 export"
    }

    # ── Step 4: Create zip bundle ──────────────────────────────────────────
    Write-Step 4 $totalSteps "Creating backup archive..."
    # Save metadata
    @{
        exportDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        sourceAccount = $identity.Account
        region = $Region
        tableName = $TableName
        userPoolId = $UserPoolId
        s3Bucket = $S3Bucket
    } | ConvertTo-Json | Out-File -FilePath "$backupDir\metadata.json" -Encoding utf8

    if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
    Compress-Archive -Path "$backupDir\*" -DestinationPath $zipFile -Force
    Remove-Item $backupDir -Recurse -Force
    $zipSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
    Write-Ok "Backup created: $zipFile ($zipSize MB)"

    # ── Summary ────────────────────────────────────────────────────────────
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  EXPORT COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`n  Backup file: $zipFile" -ForegroundColor Green
    Write-Host "  To import: .\migrate-data.ps1 -Mode import -BackupFile $zipFile`n" -ForegroundColor Yellow
}

# ============================================================================
# IMPORT MODE
# ============================================================================
if ($Mode -eq "import") {
    if (-not $BackupFile) {
        Write-Err "BackupFile parameter required for import mode."
        Write-Host "  Usage: .\migrate-data.ps1 -Mode import -BackupFile aeterna-backup-2026-08-10.zip" -ForegroundColor Yellow
        exit 1
    }
    if (-not (Test-Path $BackupFile)) {
        Write-Err "Backup file not found: $BackupFile"
        exit 1
    }

    $extractDir = "aeterna-import-temp"
    if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }

    $totalSteps = 4

    # ── Step 1: Extract backup ─────────────────────────────────────────────
    Write-Step 1 $totalSteps "Extracting backup archive..."
    Expand-Archive -Path $BackupFile -DestinationPath $extractDir -Force
    Write-Ok "Extracted to $extractDir"

    # Load metadata
    $metadata = $null
    if (Test-Path "$extractDir\metadata.json") {
        $metadata = Get-Content "$extractDir\metadata.json" | ConvertFrom-Json
        Write-Info "Source account: $($metadata.sourceAccount) | Date: $($metadata.exportDate)"
    }

    # ── Step 2: Import DynamoDB ────────────────────────────────────────────
    Write-Step 2 $totalSteps "Importing DynamoDB data..."
    $dynamoFiles = Get-ChildItem "$extractDir\dynamodb\*.json" -ErrorAction SilentlyContinue
    if ($dynamoFiles) {
        foreach ($file in $dynamoFiles) {
            $data = Get-Content $file.FullName | ConvertFrom-Json
            $items = $data.Items
            $imported = 0
            $skipped = 0

            foreach ($item in $items) {
                try {
                    $itemJson = $item | ConvertTo-Json -Depth 10 -Compress
                    $itemJson | Out-File -FilePath "temp-item.json" -Encoding utf8
                    aws dynamodb put-item `
                        --table-name $TableName `
                        --item file://temp-item.json `
                        --condition-expression "attribute_not_exists(id)" `
                        --region $Region 2>&1 | Out-Null
                    $imported++
                } catch {
                    # Item already exists (condition check failed) - skip
                    $skipped++
                }
            }
            Remove-Item "temp-item.json" -Force -ErrorAction SilentlyContinue
            Write-Ok "Imported: $imported | Skipped (existing): $skipped | Total: $($items.Count)"
        }
    } else {
        Write-Info "No DynamoDB data found in backup"
    }

    # ── Step 3: Import Cognito Users ───────────────────────────────────────
    Write-Step 3 $totalSteps "Importing Cognito users..."
    $cognitoFile = "$extractDir\cognito\users.json"
    if ((Test-Path $cognitoFile) -and $UserPoolId) {
        $users = Get-Content $cognitoFile | ConvertFrom-Json
        $imported = 0
        $skipped = 0

        foreach ($user in $users) {
            $email = ($user.Attributes | Where-Object { $_.Name -eq "email" }).Value
            if (-not $email) { continue }

            try {
                # Generate temporary password
                $tempPass = "Temp" + (Get-Random -Minimum 10000 -Maximum 99999) + "!"

                aws cognito-idp admin-create-user `
                    --user-pool-id $UserPoolId `
                    --username $email `
                    --user-attributes Name=email,Value=$email Name=email_verified,Value=true `
                    --temporary-password $tempPass `
                    --message-action SUPPRESS `
                    --region $Region 2>&1 | Out-Null
                $imported++
            } catch {
                # User already exists
                $skipped++
            }
        }
        Write-Ok "Imported: $imported | Skipped (existing): $skipped | Total: $($users.Count)"
        if ($imported -gt 0) {
            Write-Info "Users created with temporary passwords - they must reset on first login"
        }
    } else {
        if (-not $UserPoolId) {
            Write-Info "No UserPoolId specified, skipping Cognito import"
        } else {
            Write-Info "No Cognito data found in backup"
        }
    }

    # ── Step 4: Import S3 Contents ─────────────────────────────────────────
    Write-Step 4 $totalSteps "Syncing S3 contents..."
    $s3Dir = "$extractDir\s3"
    if ((Test-Path $s3Dir) -and $S3Bucket) {
        $fileCount = (Get-ChildItem $s3Dir -Recurse -File -ErrorAction SilentlyContinue).Count
        if ($fileCount -gt 0) {
            # Uses sync for resume capability (like rsync)
            aws s3 sync "$s3Dir" "s3://$S3Bucket/" --region $Region 2>&1 | Out-Null
            Write-Ok "Synced $fileCount files to s3://$S3Bucket"
        } else {
            Write-Info "S3 backup directory is empty"
        }
    } else {
        if (-not $S3Bucket) {
            Write-Info "No S3 bucket specified, skipping S3 import"
        } else {
            Write-Info "No S3 data found in backup"
        }
    }

    # ── Cleanup ────────────────────────────────────────────────────────────
    Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue

    # ── Summary ────────────────────────────────────────────────────────────
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  IMPORT COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`n  Target Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "  DynamoDB Table: $TableName" -ForegroundColor White
    Write-Host "  Cognito Pool: $UserPoolId" -ForegroundColor White
    Write-Host "  S3 Bucket: $S3Bucket" -ForegroundColor White
    Write-Host "  Region: $Region" -ForegroundColor White
    Write-Host "`n  NOTE: Cognito users will need to reset their passwords on first login" -ForegroundColor Yellow
    Write-Host "  NOTE: Run again to resume/retry any failed items (idempotent)`n" -ForegroundColor Yellow
}
