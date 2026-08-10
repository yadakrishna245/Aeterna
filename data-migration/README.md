# 📦 Aeterna — Data Migration Scripts

## Quick Start

### Full Migration (AWS Account A → Account B) — ONE COMMAND

**Windows:**
```powershell
.\full-migration.ps1
```

**Linux/Mac:**
```bash
chmod +x full-migration.sh
./full-migration.sh
```

The script will:
1. ✅ Ask for your OLD AWS account credentials
2. ✅ Export ALL data (DynamoDB tables, Cognito users, S3 files)
3. ✅ Create a backup ZIP file
4. ✅ Ask for your NEW AWS account credentials
5. ✅ Create fresh infrastructure (S3 + CloudFront + DynamoDB + Cognito)
6. ✅ Import all data to the new account
7. ✅ Give you the new live URL

---

## What Gets Migrated

| Data | Method | Notes |
|------|--------|-------|
| DynamoDB (vault data) | Full table scan → put-item | All encrypted data preserved |
| Cognito users | List users → admin-create-user | Users need to reset passwords |
| S3 frontend files | s3 sync | Complete static site |
| CloudFront CDN | New distribution created | New URL (or attach custom domain) |

---

## Prerequisites

- AWS CLI installed and working (`aws --version`)
- `jq` installed (Linux/Mac: `brew install jq` or `apt install jq`)
- Node.js 18+ (for rebuilding frontend)
- Access keys for BOTH accounts

---

## After Migration

1. Update `amplify_outputs.json` with new Cognito Pool ID and Client ID
2. Run `npm run build` to rebuild with new config
3. Deploy: `aws s3 sync dist/ s3://NEW_BUCKET/ --delete`
4. Tell users to reset their passwords (one-time only)
5. Their encrypted data is SAFE — Master Password didn't change

---

## Individual Scripts

| Script | Purpose |
|--------|---------|
| `full-migration.ps1` | Complete A→B migration (Windows) |
| `full-migration.sh` | Complete A→B migration (Linux/Mac) |
| `deploy-new-account.ps1` | Fresh deploy only (no data import) |
| `deploy-new-account.sh` | Fresh deploy only (no data import) |
| `migrate-data.ps1` | Export/Import separately |
| `migrate-data.sh` | Export/Import separately |

---

## Important Notes

- **User passwords:** Cognito doesn't allow exporting password hashes. Users will receive a "reset password" email on first login to the new system.
- **Encrypted vault data:** Completely safe! The encrypted blobs are migrated byte-for-byte. Master Password stays the same.
- **Backup ZIP:** Always keep the backup ZIP file safe. It contains all user data (encrypted).
- **Old account:** Don't delete the old account immediately. Keep it running for 1-2 weeks in case something was missed.
