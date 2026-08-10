# 📦 Aeterna — AWS Account Migration Guide

## ⚡ ONE COMMAND MIGRATION

When your AWS free tier credits expire and you need to move to a new account:

**Windows:**
```powershell
cd data-migration
.\full-migration.ps1
```

**Linux/Mac:**
```bash
cd data-migration
chmod +x full-migration.sh
./full-migration.sh
```

**That's it. The script handles everything automatically.**

---

## 🔄 What Happens When You Run It

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MIGRATION FLOW                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [1] Script asks: OLD account Access Key + Secret Key                │
│  [2] Script asks: OLD account resource names (bucket, table, etc.)   │
│  [3] Script EXPORTS everything from old account:                     │
│      • DynamoDB → all items (paginated, no limit)                    │
│      • Cognito → all users (paginated)                               │
│      • S3 → every single file (exact timestamps preserved)           │
│      • Route53 → all DNS records (if domain exists)                  │
│      • Lambda → function code + config                               │
│  [4] Creates a backup ZIP (keep this SAFE!)                          │
│  [5] Script asks: NEW account Access Key + Secret Key                │
│  [6] Script CREATES infrastructure on new account:                   │
│      • New S3 bucket (with website hosting + public read)            │
│      • New DynamoDB table (pay-per-request billing)                  │
│      • New Cognito User Pool + Client                                │
│      • New CloudFront distribution (HTTPS, SPA routing)              │
│      • New Route53 hosted zone (if domain exists)                    │
│  [7] Script IMPORTS all data:                                        │
│      • DynamoDB items (one by one, with progress counter)            │
│      • Cognito users (all emails recreated)                          │
│      • S3 files (full sync with verification)                        │
│      • Route53 DNS records (UPSERT)                                  │
│  [8] Script VERIFIES:                                                │
│      • DynamoDB: exported count == imported count                     │
│      • S3: exported file count == imported file count                 │
│      • Cognito: user count check                                     │
│  [9] Prints new live URL + all resource IDs                          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 What You Need Before Running

| Item | Where to Find It |
|------|-----------------|
| OLD AWS Access Key ID | AWS Console → IAM → Your User → Security Credentials |
| OLD AWS Secret Access Key | Same place (you got this when you created the key) |
| OLD S3 Bucket name | AWS Console → S3 → Look for `aeterna-frontend-*` |
| OLD DynamoDB Table name | AWS Console → DynamoDB → Tables |
| OLD Cognito User Pool ID | AWS Console → Cognito → User Pools → Pool ID |
| OLD CloudFront Distribution ID | AWS Console → CloudFront → Distributions |
| NEW AWS Account | Create at https://aws.amazon.com (use different email) |
| NEW AWS Access Key | New account → IAM → Create User → Attach AdministratorAccess → Create Access Key |

---

## 🛡️ Zero Data Loss Guarantee

| Protection | How |
|-----------|-----|
| **Paginated DynamoDB scan** | Script uses `LastEvaluatedKey` pagination — gets ALL items even if table has 10,000+ entries |
| **Full S3 sync** | Uses `aws s3 sync --exact-timestamps` — byte-for-byte copy |
| **Count verification** | After import, script queries new account and compares counts |
| **Backup ZIP** | Everything is saved locally BEFORE importing — if anything fails, you have the backup |
| **Cognito pagination** | Uses `PaginationToken` to get ALL users |
| **Route53 full export** | Exports every DNS record, imports with UPSERT (won't fail on duplicates) |
| **Retry on S3 mismatch** | If S3 file count doesn't match, auto-retries sync |

---

## ⚠️ Important Notes

### Users Will Need To Reset Their Cognito Password
- Cognito doesn't allow exporting password hashes (security feature)
- Users will get a "Reset Password" prompt on first login to new system
- **Their encrypted vault data is 100% intact** — Master Password is unchanged
- Only their Cognito login password needs reset (one-time)

### After Migration — 3 Manual Steps

```bash
# Step 1: Update config with new Cognito IDs
# Edit amplify_outputs.json → replace old Pool ID and Client ID with new ones

# Step 2: Rebuild frontend
npm run build

# Step 3: Deploy to new bucket
aws s3 sync dist/ s3://NEW_BUCKET_NAME/ --delete --region us-east-1
```

### If You Have a Custom Domain
- The script migrates Route53 DNS records automatically
- But you MUST update your domain registrar (GoDaddy, Namecheap, etc.)
- Go to registrar → change nameservers to the new Route53 hosted zone nameservers
- The new nameservers are shown in AWS Console → Route53 → Hosted Zone → NS record

---

## 📁 Files in This Folder

| File | Purpose |
|------|---------|
| `full-migration.ps1` | **⭐ USE THIS** — Complete A→B migration (Windows) |
| `full-migration.sh` | **⭐ USE THIS** — Complete A→B migration (Linux/Mac) |
| `README.md` | This documentation |

---

## 🧪 Testing the Script

To verify the script works without actually migrating:

1. You can run it with your SAME account as both source and destination (it'll create new resources in the same account)
2. Check the verification table at the end — all should show ✅ VERIFIED
3. Delete the test resources after: `aws s3 rb s3://BUCKET --force`, `aws dynamodb delete-table --table-name TABLE`

---

## 💡 When Should You Migrate?

| Scenario | Action |
|----------|--------|
| Free tier credits expiring soon | Run migration to new free account |
| Paying for current account (~₹500-1000/month) | No need to migrate — just keep paying |
| Got 10+ paid users (₹4,990+/year revenue) | Don't migrate — revenue covers AWS costs |
| Security breach on current account | Migrate immediately + revoke old credentials |
| Changing regions for better latency | Run migration with different region |

---

## 🔒 Security

- The script NEVER stores credentials to disk (only in memory during execution)
- Backup ZIP contains encrypted data (useless without user Master Passwords)
- Delete the backup ZIP after confirming migration is successful
- Revoke old account's access keys after migration is confirmed

---

*Last updated: August 10, 2026*
