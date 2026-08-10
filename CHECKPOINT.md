# 🔐 AETERNA — Project Checkpoint
**Date:** August 10, 2026 (Monday)
**Status:** ✅ FULLY DEPLOYED & LIVE

---

## 🌐 Live URL

**https://d3mk78gm9j9bdd.cloudfront.net**

---

## ✅ Deployment Status — All Systems Operational

| Service | Resource ID | Status |
|---------|------------|--------|
| CloudFront CDN | `EUR1I2U5K7OJ1` → `d3mk78gm9j9bdd.cloudfront.net` | ✅ Deployed |
| S3 Hosting | `aeterna-frontend-hosting-2026` | ✅ Active |
| Cognito User Pool | `us-east-1_cCm6NXVrV` | ✅ Active |
| Cognito Client | `3eih3b9hocqhcerrj61tinijvr` | ✅ Configured |
| Cognito Identity Pool | `us-east-1:abb7298e-15cc-4c22-a973-3a5ace3fbf8d` | ✅ Active |
| DynamoDB Table | `Vault-5dvffs2v5vclnau2vveu3m4uvi-NONE` | ✅ Active (PAY_PER_REQUEST) |
| Lambda Function | `amplify-aeterna-krishna-s-heartbeatmonitorlambda96-xYE4YETBQ8Vq` | ✅ Active |
| AppSync GraphQL | `auc5gayebngjblluahj4x2hlbu.appsync-api.us-east-1.amazonaws.com` | ✅ Active |
| Amplify Stack | `amplify-aeterna-krishna-sandbox-c8308b0f28` | ✅ Deployed |

---

## 📌 What's Done

- ✅ Vite + React + TypeScript project initialized
- ✅ AWS Amplify Gen 2 backend configured (Auth, Data, Functions)
- ✅ DynamoDB schema — Vault model with owner isolation
- ✅ Cognito email-based authentication
- ✅ Client-side AES-256-GCM + PBKDF2 encryption (crypto.ts)
- ✅ AuthGate component (Login + Master Password unlock)
- ✅ Dashboard (status cards, heartbeat countdown, check-in button, vault list)
- ✅ AddAssetModal (encrypt & store vault entries)
- ✅ Dead Man's Switch Lambda (daily cron, scans vaults, triggers alerts)
- ✅ Dark navy/gold "Swiss Bank" UI theme (Tailwind)
- ✅ README with problem/solution, mermaid diagrams, setup docs
- ✅ Code pushed to GitHub: https://github.com/yadakrishna245/Aeterna
- ✅ Build verified (`npm run build` passes clean)
- ✅ **Backend deployed** — Cognito + DynamoDB + AppSync + Lambda
- ✅ **Frontend deployed** — S3 + CloudFront (HTTPS, globally cached)
- ✅ **CloudFront cache invalidated** — Latest build served worldwide
- ✅ **amplify_outputs.json** — Real AWS resource IDs configured

---

## 🏗️ Architecture (Live)

```
React Build (dist/) → S3 Bucket → CloudFront CDN → Users Globally
                                        ↓
                        Cognito + DynamoDB + Lambda + AppSync (serverless backend)
```

```
User → https://d3mk78gm9j9bdd.cloudfront.net
        → CloudFront (EUR1I2U5K7OJ1)
            → S3 (aeterna-frontend-hosting-2026)
        → Cognito Auth (us-east-1_cCm6NXVrV)
        → AppSync GraphQL API
            → DynamoDB (Vault table)
        → Lambda Heartbeat Monitor (daily EventBridge cron)
```

**Region:** us-east-1
**Account:** 575589967706
**Cost estimate:** ~$1-3/month for thousands of users (AWS Free Tier covers first 12 months)

---

## 🚀 Next Steps — SaaS Features to Add

- [ ] Custom domain setup (e.g., aeterna.app or aeterna.in)
- [ ] Stripe integration (₹499/year plan)
- [ ] Amazon SES for real heir email notifications
- [ ] Emergency verification chain (SMS + backup contacts before release)
- [ ] Video message recording/upload for heirs
- [ ] Multi-tier executor system (different vaults → different people)
- [ ] Landing page with waitlist

---

## 🏆 Market Research — Competitors

| Competitor | Pricing | Our Edge |
|-----------|---------|----------|
| Cipherwill | $40/year | No video messages, no multi-tier executors |
| Killswitch.app | Unknown | Basic features, no heartbeat customization |
| DMS.today | Unknown | Instructions only, no full estate planning |
| AfterKey | Open-source | CLI-only, no UI |
| DeadSerious | Hackathon | Not production-ready |

### Our Differentiation:
1. 📹 Video messages to heirs (nobody does this well)
2. 👥 Multi-tier executor system (spouse ≠ lawyer ≠ kids)
3. 🇮🇳 India-first pricing (₹499/year vs $40/year)
4. ⚠️ Emergency verification chain (no false triggers)
5. 🔐 End-to-end encrypted (server never sees plaintext)

---

## 📂 Repo
- **GitHub:** https://github.com/yadakrishna245/Aeterna
- **Local:** C:\Gemini-Krishna-Data-june-2026\Gemini-Krishna-Data-june-2026\Videos\Aeterna
- **Branch:** main

---

## 💡 Notes
- No "zero-knowledge" branding anywhere (removed per decision)
- App name: **Aeterna** (Latin for "eternal")
- Target: Crypto investors, parents, entrepreneurs, IT professionals
- Market validated — competitors exist and charge $40/year = people pay for this
- Deployed: August 10, 2026 at 8:22 AM IST
