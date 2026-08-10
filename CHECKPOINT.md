# 🔐 AETERNA — Project Checkpoint
**Date:** August 10, 2026 (Monday)
**Status:** ✅ FULLY DEPLOYED & LIVE
**Live URL:** https://d3mk78gm9j9bdd.cloudfront.net
**GitHub:** https://github.com/yadakrishna245/Aeterna

---

## 🏗️ Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Icons | Lucide React |
| Backend | AWS Amplify Gen 2 (Serverless) |
| Database | Amazon DynamoDB |
| Authentication | Amazon Cognito |
| Automation | AWS Lambda (daily cron) |
| CDN | Amazon CloudFront |
| Storage | Amazon S3 |
| Email | Amazon SES |
| Encryption | Web Crypto API (AES-256-GCM + PBKDF2) |
| Payments | Stripe (frontend ready) |

---

## ✅ All Features Built (30+)

### 🔒 Core Security
- [x] End-to-End Encrypted (ALL fields — name, email, payload)
- [x] Panic Mode / Duress Pin (fake vault under coercion)
- [x] Auto-Lock (5 min inactivity)
- [x] Password Strength Meter
- [x] Vault Export/Backup (.aeterna encrypted file)
- [x] Shamir's Secret Sharing (2-of-3 key recovery)
- [x] Key Recovery Setup (3 fragments distributed)

### 💓 Dead Man's Switch
- [x] Manual Heartbeat Check-In button
- [x] Scheduled Date Trigger (milestone-based)
- [x] Smartwatch Passive Check-In (Apple Watch, Pixel Watch, Fitbit)
- [x] Social Proof of Life (social media activity detection)
- [x] Emergency Escalation (grace period + 3 reminders before trigger)

### 🗄️ Vault Features
- [x] Multi-Beneficiary Management (assign per vault)
- [x] 2FA Recovery Vault (TOTP secrets + backup codes) ⭐ FIRST IN MARKET
- [x] Video/Voice Messages (MediaRecorder + encrypted)
- [x] File Upload (drag-drop, encrypted, up to 5 files)
- [x] Time Capsule Messages (milestone-based delivery) ⭐ FIRST IN MARKET

### 🧠 Intelligence
- [x] AI Grief Assistant (Digital DNA Wizard) ⭐ FIRST IN MARKET
- [x] Service Recovery Guides (15+ platforms)
- [x] Estate Value Calculator
- [x] Legal Document Generator (printable authorization letter)
- [x] Activity Log (full audit trail)

### 👤 User Experience
- [x] Premium Landing Page (hero, features, pricing)
- [x] Onboarding Flow (4-step guided tour)
- [x] Toast Notifications (no more alerts)
- [x] Heir Dashboard Preview (what beneficiaries see)
- [x] Emergency Wallet Card (printable ICE card)
- [x] Trusted Contact Awareness (notify people you use Aeterna)

### 🏛️ Orphan Account / No-Heir Policy
- [x] Unclaimed Estate Policy (45-day configurable)
- [x] Auto-Deletion option
- [x] Charity Donation (Wikipedia, EFF, GiveDirectly, PM CARES, custom)
- [x] Aeterna Community Fund option
- [x] Public Memorial option

### 💳 Payments (Stripe)
- [x] Pricing Page (Free / Pro ₹499 / Family ₹999)
- [x] Payment Modal (Stripe-style card form)
- [x] Plan management (upgrade/downgrade)
- [x] Feature gating per plan
- [ ] Backend Stripe webhook (needs API keys)

### ☁️ Infrastructure
- [x] AWS CloudFront CDN (global edge locations)
- [x] S3 Static Hosting
- [x] Cognito User Pool (active)
- [x] DynamoDB Table (active)
- [x] Lambda Heartbeat Monitor (daily cron)
- [x] SES Email Notifications
- [x] One-Click Deploy Script (deploy-new-account.ps1 / .sh)
- [x] Data Migration Script (migrate-data.ps1 / .sh) — export/import like rsync

### 📂 Document Vault (Life Locker)
- [x] 10 categories (Financial, Property, Identity, Utilities, Banking, Medical, Legal, Education, Digital, Personal)
- [x] Upload any file (PDF, images, docs) — AES-256-GCM encrypted
- [x] Rename documents after upload
- [x] Add notes per document
- [x] Preview (images inline, PDF via blob URL)
- [x] Search across all documents
- [x] Sort by date or name
- [x] Free tier: 2 documents, Pro/Family: Unlimited

### ⚖️ Legal & Compliance
- [x] Terms of Service (19 sections — bulletproof liability protection)
- [x] Privacy Policy (14 sections — DPDP Act 2023 compliant)
- [x] Mandatory acceptance at signup (timestamp recorded)
- [x] Terms accessible from Landing Page, Auth Screen, Dashboard
- [x] Unclaimed Account Transfer clause (admin gets data if no beneficiary)
- [x] Admin fallback for orphan accounts (45-day grace → notify admin)
- [x] Legal Protection Guide (LEGAL_PROTECTION.md — internal)

### 🔔 Smart Warnings
- [x] Beneficiary limit enforcement (Free:1, Pro:5, Family:∞)
- [x] "No Beneficiaries" red warning banner (when vaults > 0 but beneficiaries = 0)
- [x] Key Recovery reminder after adding beneficiary
- [x] Document upload limit with upgrade prompt

---

## 🏆 Competitive Advantage

| Feature | Aeterna | Killswitch ($480/yr) | Cipherwill ($40/yr) |
|---------|:---:|:---:|:---:|
| All fields encrypted | ✅ | ❌ | ❌ |
| 2FA Recovery Vault | ✅ | ❌ | ❌ |
| Time Capsule Messages | ✅ | ❌ | ❌ |
| AI Grief Assistant | ✅ | ❌ | ❌ |
| Panic Mode / Duress Pin | ✅ | ❌ | ❌ |
| Smartwatch Check-In | ✅ | ❌ | ❌ |
| Shamir's Secret Sharing | ✅ | ❌ | ❌ |
| Heir Dashboard | ✅ | ❌ | ❌ |
| Emergency Wallet Card | ✅ | ❌ | ❌ |
| Estate Value Calculator | ✅ | ❌ | ❌ |
| Legal Doc Generator | ✅ | ❌ | ❌ |
| Charity Legacy | ✅ | ❌ | ❌ |
| Video Messages | ✅ | ✅ | ❌ |
| Multi-beneficiary | ✅ | ✅ | ✅ |
| Price | ₹499/yr | $480/yr | $40/yr |

---

## 💰 Pricing Model

| Plan | Price | Limits |
|------|-------|--------|
| Free | ₹0 | 3 vaults, 1 beneficiary, email switch |
| Pro | ₹499/year | Unlimited vaults, 5 beneficiaries, video, 2FA, time capsules |
| Family | ₹999/year | Unlimited everything, SMS alerts, Shamir recovery, priority support |

---

## 🚀 Next Steps

### 📂 Document Vault (Life Locker) — IN PROGRESS
A comprehensive, categorized document storage system. Every document a person needs in their lifetime, encrypted and organized.

| Category | What People Store |
|----------|-------------------|
| 🏦 Financial | Bank passbooks, FD receipts, PPF, mutual funds, stock demat, LIC policies, bonds, chit fund docs |
| 🏠 Property | Land registry, sale deeds, house tax receipts, property tax, encumbrance certificates, building plans |
| 🪪 Identity | Aadhaar, PAN, passport, voter ID, driving license, birth/death certificates, caste certificate |
| ⛽ Utilities | Gas connection (HP/Bharat/Indane), electricity bills, water connection, telephone/broadband, DTH |
| 🏧 Banking & Lockers | Bank locker details (branch, locker number, nominee), credit/debit card info, net banking details |
| 💊 Medical | Health insurance, prescriptions, blood reports, vaccination records, hospital discharge summaries |
| ⚖️ Legal | Will, power of attorney, rental agreements, court orders, NOCs, affidavits |
| 🎓 Education | Degrees, marksheets, certificates, experience letters |
| 💻 Digital Accounts | Email recovery, social media, subscriptions, cloud storage |
| 📦 Personal | Family photos, marriage certificate, divorce papers, adoption papers |

**Features:**
- Upload any file (PDF, image, doc) — AES-256-GCM encrypted at rest
- Rename documents after upload
- Preview (PDF/image viewer in-browser)
- Add notes to each document
- Category-wise organization with file counts
- Sort by date added
- Search across all documents
- All encrypted client-side before storage

### Other Next Steps
- [ ] Custom domain (aeterna.in / aeterna.app)
- [ ] Razorpay payment gateway (register → get API keys → integrate)
- [ ] WhatsApp Business API for notifications
- [ ] Mobile app (React Native or PWA)
- [ ] Marketing: ProductHunt launch, Reddit posts, LinkedIn
- [ ] Beta users: 50 early adopters for feedback
- [ ] Register LLP / Pvt Ltd company (personal liability shield)
- [ ] Lawyer review of Terms of Service (one-time ₹5-10K)
- [ ] Cyber liability insurance (₹3-5K/year)

---

## 📊 Market Research

| Competitor | Price | Our Edge |
|-----------|-------|----------|
| Killswitch.app | $7.99-39.99/mo | 12 features they don't have, 80x cheaper |
| Cipherwill | $40/yr | 12 unique features, India-first pricing |
| DeathNote.ai | Free | Messages only, no vaults/encryption |
| Mortui | Free (Android) | Android-only, no web, no encryption |

---

**Built with** ❤️ **by Krishna** | 30+ Features | AWS Serverless | First-in-Market Digital Estate Planner
