#!/usr/bin/env bash
# ============================================================================
# AETERNA — Data Migration Script (Export/Import) - Linux/Mac
# ============================================================================
# Prerequisites:
#   - AWS CLI configured with appropriate account credentials
#   - jq installed (brew install jq / apt install jq)
#   - zip/unzip installed
#   - For EXPORT: credentials for the SOURCE account
#   - For IMPORT: credentials for the DESTINATION account
#
# Usage:
#   chmod +x migrate-data.sh
#   ./migrate-data.sh export --region us-east-1
#   ./migrate-data.sh import --region us-east-1 --backup-file aeterna-backup-2026-08-10.zip
# ============================================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m'

# ── Helpers ─────────────────────────────────────────────────────────────────
step() { echo -e "\n${YELLOW}[$1/$2] $3${NC}"; }
ok() { echo -e "${GREEN}  $1${NC}"; }
err() { echo -e "${RED}  ERROR: $1${NC}"; }
info() { echo -e "${WHITE}  $1${NC}"; }

# ── Parse Arguments ─────────────────────────────────────────────────────────
MODE="${1:-}"
shift || true

REGION="us-east-1"
PROJECT_NAME="aeterna"
TABLE_NAME=""
USER_POOL_ID=""
S3_BUCKET=""
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --region) REGION="$2"; shift 2 ;;
        --project) PROJECT_NAME="$2"; shift 2 ;;
        --table) TABLE_NAME="$2"; shift 2 ;;
        --user-pool-id) USER_POOL_ID="$2"; shift 2 ;;
        --s3-bucket) S3_BUCKET="$2"; shift 2 ;;
        --backup-file) BACKUP_FILE="$2"; shift 2 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

# Validate mode
if [[ "$MODE" != "export" && "$MODE" != "import" ]]; then
    echo -e "${RED}Usage: $0 <export|import> [options]${NC}"
    echo -e "${WHITE}  Options:${NC}"
    echo -e "${WHITE}    --region         AWS region (default: us-east-1)${NC}"
    echo -e "${WHITE}    --table          DynamoDB table name${NC}"
    echo -e "${WHITE}    --user-pool-id   Cognito User Pool ID${NC}"
    echo -e "${WHITE}    --s3-bucket      S3 bucket name${NC}"
    echo -e "${WHITE}    --backup-file    Backup zip file (import mode)${NC}"
    echo ""
    echo -e "${YELLOW}  Export: $0 export --region us-east-1${NC}"
    echo -e "${YELLOW}  Import: $0 import --region us-east-1 --backup-file aeterna-backup-2026-08-10.zip${NC}"
    exit 1
fi

# ── Load deployment-info.json defaults ──────────────────────────────────────
if [[ -f "deployment-info.json" ]]; then
    [[ -z "$TABLE_NAME" ]] && TABLE_NAME=$(jq -r '.dynamoTable // empty' deployment-info.json 2>/dev/null || true)
    [[ -z "$USER_POOL_ID" ]] && USER_POOL_ID=$(jq -r '.cognitoPoolId // empty' deployment-info.json 2>/dev/null || true)
    [[ -z "$S3_BUCKET" ]] && S3_BUCKET=$(jq -r '.s3Bucket // empty' deployment-info.json 2>/dev/null || true)
fi

# Apply defaults
[[ -z "$TABLE_NAME" ]] && TABLE_NAME="$PROJECT_NAME-vaults"

echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}  AETERNA — Data Migration ($(echo "$MODE" | tr '[:lower:]' '[:upper:]'))${NC}"
echo -e "${CYAN}========================================${NC}"

# ── Verify AWS credentials ──────────────────────────────────────────────────
echo -e "\n${YELLOW}Verifying AWS credentials...${NC}"
if ! IDENTITY=$(aws sts get-caller-identity --region "$REGION" 2>&1); then
    err "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi
ACCOUNT=$(echo "$IDENTITY" | jq -r '.Account')
ARN=$(echo "$IDENTITY" | jq -r '.Arn')
info "Account: $ACCOUNT | User: $ARN"

# ============================================================================
# EXPORT MODE
# ============================================================================
if [[ "$MODE" == "export" ]]; then
    TIMESTAMP=$(date +%Y-%m-%d)
    BACKUP_DIR="aeterna-backup-$TIMESTAMP"
    ZIP_FILE="$BACKUP_DIR.zip"

    # Create backup directory structure
    rm -rf "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/dynamodb" "$BACKUP_DIR/cognito" "$BACKUP_DIR/s3"

    TOTAL=4

    # ── Step 1: Export DynamoDB ─────────────────────────────────────────────
    step 1 $TOTAL "Exporting DynamoDB table: $TABLE_NAME..."
    if SCAN_RESULT=$(aws dynamodb scan --table-name "$TABLE_NAME" --region "$REGION" 2>&1); then
        echo "$SCAN_RESULT" > "$BACKUP_DIR/dynamodb/$TABLE_NAME.json"
        ITEM_COUNT=$(echo "$SCAN_RESULT" | jq '.Items | length')
        ok "Exported $ITEM_COUNT items from $TABLE_NAME"
    else
        err "Failed to export DynamoDB table"
        info "Table may not exist or you lack permissions"
    fi

    # ── Step 2: Export Cognito Users ────────────────────────────────────────
    step 2 $TOTAL "Exporting Cognito users..."
    if [[ -n "$USER_POOL_ID" ]]; then
        ALL_USERS="[]"
        PAGINATION_TOKEN=""

        while true; do
            CMD="aws cognito-idp list-users --user-pool-id $USER_POOL_ID --region $REGION --max-results 60"
            if [[ -n "$PAGINATION_TOKEN" ]]; then
                CMD="$CMD --pagination-token $PAGINATION_TOKEN"
            fi

            if RESULT=$(eval "$CMD" 2>&1); then
                PAGE_USERS=$(echo "$RESULT" | jq '.Users')
                ALL_USERS=$(echo "$ALL_USERS $PAGE_USERS" | jq -s '.[0] + .[1]')
                PAGINATION_TOKEN=$(echo "$RESULT" | jq -r '.PaginationToken // empty')
                [[ -z "$PAGINATION_TOKEN" ]] && break
            else
                err "Failed to list users"
                break
            fi
        done

        echo "$ALL_USERS" | jq '.' > "$BACKUP_DIR/cognito/users.json"
        USER_COUNT=$(echo "$ALL_USERS" | jq 'length')
        ok "Exported $USER_COUNT users"
    else
        info "No UserPoolId specified, skipping Cognito export"
    fi

    # ── Step 3: Export S3 Contents ──────────────────────────────────────────
    step 3 $TOTAL "Exporting S3 bucket contents..."
    if [[ -n "$S3_BUCKET" ]]; then
        if aws s3 sync "s3://$S3_BUCKET" "$BACKUP_DIR/s3/" --region "$REGION" > /dev/null 2>&1; then
            FILE_COUNT=$(find "$BACKUP_DIR/s3" -type f | wc -l | tr -d ' ')
            ok "Exported $FILE_COUNT files from s3://$S3_BUCKET"
        else
            err "Failed to export S3 bucket"
        fi
    else
        info "No S3 bucket specified, skipping S3 export"
    fi

    # ── Step 4: Create zip bundle ──────────────────────────────────────────
    step 4 $TOTAL "Creating backup archive..."

    # Save metadata
    cat > "$BACKUP_DIR/metadata.json" <<EOF
{
    "exportDate": "$(date '+%Y-%m-%d %H:%M:%S')",
    "sourceAccount": "$ACCOUNT",
    "region": "$REGION",
    "tableName": "$TABLE_NAME",
    "userPoolId": "$USER_POOL_ID",
    "s3Bucket": "$S3_BUCKET"
}
EOF

    rm -f "$ZIP_FILE"
    (cd "$BACKUP_DIR" && zip -r "../$ZIP_FILE" . > /dev/null 2>&1)
    rm -rf "$BACKUP_DIR"
    ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
    ok "Backup created: $ZIP_FILE ($ZIP_SIZE)"

    # ── Summary ────────────────────────────────────────────────────────────
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${GREEN}  EXPORT COMPLETE!${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "\n${GREEN}  Backup file: $ZIP_FILE${NC}"
    echo -e "${YELLOW}  To import: ./migrate-data.sh import --backup-file $ZIP_FILE${NC}\n"
fi

# ============================================================================
# IMPORT MODE
# ============================================================================
if [[ "$MODE" == "import" ]]; then
    if [[ -z "$BACKUP_FILE" ]]; then
        err "Backup file required for import mode."
        echo -e "${YELLOW}  Usage: $0 import --backup-file aeterna-backup-2026-08-10.zip${NC}"
        exit 1
    fi
    if [[ ! -f "$BACKUP_FILE" ]]; then
        err "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    EXTRACT_DIR="aeterna-import-temp"
    rm -rf "$EXTRACT_DIR"

    TOTAL=4

    # ── Step 1: Extract backup ─────────────────────────────────────────────
    step 1 $TOTAL "Extracting backup archive..."
    mkdir -p "$EXTRACT_DIR"
    unzip -o "$BACKUP_FILE" -d "$EXTRACT_DIR" > /dev/null 2>&1
    ok "Extracted to $EXTRACT_DIR"

    # Load metadata
    if [[ -f "$EXTRACT_DIR/metadata.json" ]]; then
        SOURCE_ACCOUNT=$(jq -r '.sourceAccount' "$EXTRACT_DIR/metadata.json")
        EXPORT_DATE=$(jq -r '.exportDate' "$EXTRACT_DIR/metadata.json")
        info "Source account: $SOURCE_ACCOUNT | Date: $EXPORT_DATE"
    fi

    # ── Step 2: Import DynamoDB ────────────────────────────────────────────
    step 2 $TOTAL "Importing DynamoDB data..."
    DYNAMO_FILE="$EXTRACT_DIR/dynamodb/$TABLE_NAME.json"
    if [[ -f "$DYNAMO_FILE" ]]; then
        ITEM_COUNT=$(jq '.Items | length' "$DYNAMO_FILE")
        IMPORTED=0
        SKIPPED=0

        for i in $(seq 0 $((ITEM_COUNT - 1))); do
            ITEM=$(jq -c ".Items[$i]" "$DYNAMO_FILE")
            echo "$ITEM" > /tmp/aeterna-import-item.json

            if aws dynamodb put-item \
                --table-name "$TABLE_NAME" \
                --item file:///tmp/aeterna-import-item.json \
                --condition-expression "attribute_not_exists(id)" \
                --region "$REGION" > /dev/null 2>&1; then
                IMPORTED=$((IMPORTED + 1))
            else
                SKIPPED=$((SKIPPED + 1))
            fi
        done
        rm -f /tmp/aeterna-import-item.json
        ok "Imported: $IMPORTED | Skipped (existing): $SKIPPED | Total: $ITEM_COUNT"
    else
        info "No DynamoDB data found in backup"
    fi

    # ── Step 3: Import Cognito Users ───────────────────────────────────────
    step 3 $TOTAL "Importing Cognito users..."
    COGNITO_FILE="$EXTRACT_DIR/cognito/users.json"
    if [[ -f "$COGNITO_FILE" && -n "$USER_POOL_ID" ]]; then
        USER_COUNT=$(jq 'length' "$COGNITO_FILE")
        IMPORTED=0
        SKIPPED=0

        for i in $(seq 0 $((USER_COUNT - 1))); do
            EMAIL=$(jq -r ".[$i].Attributes[] | select(.Name==\"email\") | .Value" "$COGNITO_FILE")
            [[ -z "$EMAIL" || "$EMAIL" == "null" ]] && continue

            # Generate temporary password
            TEMP_PASS="Temp$((RANDOM % 90000 + 10000))!"

            if aws cognito-idp admin-create-user \
                --user-pool-id "$USER_POOL_ID" \
                --username "$EMAIL" \
                --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
                --temporary-password "$TEMP_PASS" \
                --message-action SUPPRESS \
                --region "$REGION" > /dev/null 2>&1; then
                IMPORTED=$((IMPORTED + 1))
            else
                SKIPPED=$((SKIPPED + 1))
            fi
        done
        ok "Imported: $IMPORTED | Skipped (existing): $SKIPPED | Total: $USER_COUNT"
        if [[ $IMPORTED -gt 0 ]]; then
            info "Users created with temporary passwords - they must reset on first login"
        fi
    else
        if [[ -z "$USER_POOL_ID" ]]; then
            info "No UserPoolId specified, skipping Cognito import"
        else
            info "No Cognito data found in backup"
        fi
    fi

    # ── Step 4: Import S3 Contents ─────────────────────────────────────────
    step 4 $TOTAL "Syncing S3 contents..."
    S3_DIR="$EXTRACT_DIR/s3"
    if [[ -d "$S3_DIR" && -n "$S3_BUCKET" ]]; then
        FILE_COUNT=$(find "$S3_DIR" -type f | wc -l | tr -d ' ')
        if [[ $FILE_COUNT -gt 0 ]]; then
            # Uses sync for resume capability (like rsync)
            aws s3 sync "$S3_DIR" "s3://$S3_BUCKET/" --region "$REGION" > /dev/null 2>&1
            ok "Synced $FILE_COUNT files to s3://$S3_BUCKET"
        else
            info "S3 backup directory is empty"
        fi
    else
        if [[ -z "$S3_BUCKET" ]]; then
            info "No S3 bucket specified, skipping S3 import"
        else
            info "No S3 data found in backup"
        fi
    fi

    # ── Cleanup ────────────────────────────────────────────────────────────
    rm -rf "$EXTRACT_DIR"

    # ── Summary ────────────────────────────────────────────────────────────
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${GREEN}  IMPORT COMPLETE!${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "\n${GREEN}  Target Account: $ACCOUNT${NC}"
    echo -e "${WHITE}  DynamoDB Table: $TABLE_NAME${NC}"
    echo -e "${WHITE}  Cognito Pool: $USER_POOL_ID${NC}"
    echo -e "${WHITE}  S3 Bucket: $S3_BUCKET${NC}"
    echo -e "${WHITE}  Region: $REGION${NC}"
    echo -e "\n${YELLOW}  NOTE: Cognito users will need to reset their passwords on first login${NC}"
    echo -e "${YELLOW}  NOTE: Run again to resume/retry any failed items (idempotent)${NC}\n"
fi
