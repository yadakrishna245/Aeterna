# Contributing to Aeterna 🤝

Thank you for your interest in contributing to Aeterna! This guide will help you get started.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Code Style Guidelines](#code-style-guidelines)
- [Making Contributions](#making-contributions)
- [Security Policy](#security-policy)

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React | 19.x |
| **Build Tool** | Vite | 8.x |
| **Language** | TypeScript | 7.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **Icons** | Lucide React | 1.31.x |
| **Backend** | AWS Amplify Gen 2 | Serverless |
| **Auth** | Amazon Cognito | — |
| **Database** | Amazon DynamoDB | — |
| **Automation** | AWS Lambda | Node.js |
| **CDN** | Amazon CloudFront | — |
| **Storage** | Amazon S3 | — |
| **Email** | Amazon SES | — |
| **Encryption** | Web Crypto API | AES-256-GCM + PBKDF2 |
| **Linter** | OxLint | 1.75.x |

---

## ✅ Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **AWS CLI** configured (for backend development)
- **AWS Amplify CLI** (`npm install -g @aws-amplify/backend-cli`)
- A code editor with TypeScript support (VS Code recommended)

---

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yadakrishna245/Aeterna.git
cd Aeterna
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Backend (AWS Amplify)

For backend changes, you'll need an AWS account and Amplify sandbox:

```bash
npx ampx sandbox
```

This starts a local cloud sandbox connected to your AWS account.

### 5. Build for Production

```bash
npm run build
```

### 6. Preview Production Build

```bash
npm run preview
```

---

## 📂 Project Structure

```
aeterna/
├── index.html                  # Entry HTML with OG meta tags
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript config
├── .oxlintrc.json              # Linter configuration
├── amplify/                    # AWS Amplify backend
│   ├── backend.ts              # Backend definition
│   ├── auth/                   # Cognito auth configuration
│   ├── data/                   # DynamoDB schema & resolvers
│   └── functions/              # Lambda functions
│       ├── heartbeat-monitor/  # Daily heartbeat cron
│       └── send-notification/  # SES email notifications
├── public/                     # Static assets
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx                # App entry point
    ├── App.tsx                 # Root component & routing
    ├── index.css               # Global styles
    ├── components/             # React components
    │   ├── LandingPage.tsx     # Public landing page
    │   ├── Dashboard.tsx       # Main authenticated dashboard
    │   ├── AuthGate.tsx        # Authentication wrapper
    │   ├── PricingPage.tsx     # Pricing plans
    │   └── ...                 # 20+ feature components
    ├── utils/                  # Utility functions
    │   ├── crypto.ts           # Encryption/decryption (AES-256-GCM)
    │   ├── shamirSecret.ts     # Shamir's Secret Sharing
    │   ├── panicMode.ts        # Panic/duress mode logic
    │   ├── subscription.ts     # Plan management
    │   └── exportVault.ts      # Vault export/backup
    ├── hooks/                  # Custom React hooks
    │   └── useAutoLock.ts      # Auto-lock on inactivity
    ├── data/                   # Static data
    │   └── serviceGuides.ts    # Platform recovery guides
    └── assets/                 # Images & SVGs
```

---

## 🎨 Code Style Guidelines

### TypeScript

- Use **strict TypeScript** — no `any` types unless absolutely unavoidable
- Prefer `interface` over `type` for object shapes
- Use meaningful variable and function names
- Export types alongside their implementations

```typescript
// ✅ Good
interface VaultEntry {
  id: string;
  name: string;
  encryptedPayload: string;
  beneficiaryIds: string[];
  createdAt: number;
}

// ❌ Bad
type Entry = {
  id: any;
  data: any;
}
```

### React Components

- Use **functional components** with hooks (no class components)
- One component per file
- Component files use PascalCase: `Dashboard.tsx`, `AddAssetModal.tsx`
- Keep components focused — extract sub-components when > 200 lines
- Use Tailwind CSS for styling (no CSS modules or styled-components)

```tsx
// ✅ Good
const VaultCard = ({ vault, onEdit }: VaultCardProps) => {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="text-lg font-semibold text-white">{vault.name}</h3>
    </div>
  );
};
```

### Tailwind CSS

- Use Tailwind utility classes directly in JSX
- Group related classes: layout → spacing → typography → colors → effects
- Use the project's color palette (defined in `tailwind.config.js`)
- Responsive: mobile-first approach (`sm:`, `md:`, `lg:` breakpoints)

### Icons

- Use **Lucide React** exclusively for icons
- Import only the icons you need (tree-shakeable)

```tsx
import { Shield, Lock, Heart } from 'lucide-react';
```

### Encryption

- All user data MUST be encrypted before storage
- Use the utilities in `src/utils/crypto.ts`
- Never log or expose plaintext secrets
- Never store encryption keys in localStorage without protection

### Linting

Run the linter before committing:

```bash
npm run lint
```

We use OxLint (configured in `.oxlintrc.json`) — it's fast and catches common issues.

---

## 🔀 Making Contributions

### 1. Fork & Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` — new features
- `fix/` — bug fixes
- `refactor/` — code refactoring
- `docs/` — documentation updates

### 2. Make Your Changes

- Write clean, typed code
- Add comments for complex logic
- Test your changes locally
- Ensure `npm run build` passes without errors

### 3. Commit Messages

Follow conventional commits:

```
feat: add biometric authentication option
fix: resolve vault decryption failure on Safari
refactor: extract encryption logic into shared utility
docs: update README with new setup instructions
```

### 4. Pull Request

- Open a PR against `main`
- Describe what your PR does and why
- Include screenshots for UI changes
- Reference any related issues

### 5. Review Process

- All PRs require at least one review
- Security-sensitive changes require additional review
- CI must pass (lint + build)

---

## 🔒 Security Policy

Aeterna handles extremely sensitive user data. Security is non-negotiable.

### Reporting Vulnerabilities

If you discover a security vulnerability, **DO NOT** open a public issue. Instead:

1. Email: yadakrishna245@gmail.com
2. Include: description, reproduction steps, potential impact
3. Allow 48 hours for initial response

### Security Requirements for Contributions

- Never commit secrets, API keys, or credentials
- Never weaken encryption (no algorithm downgrades)
- Never add telemetry or analytics that transmit user data
- Never store plaintext sensitive data
- All new data storage must use the existing encryption utilities
- Test edge cases: empty inputs, malformed data, concurrent access

---

## 💡 Ideas for Contributions

Looking for something to work on? Here are areas where help is welcome:

- [ ] PWA support (offline access, push notifications)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] i18n / localization (Hindi, Spanish, etc.)
- [ ] Additional service recovery guides
- [ ] Performance optimization (bundle size, lazy loading)
- [ ] E2E test suite (Playwright or Cypress)
- [ ] Dark/light theme toggle
- [ ] Mobile responsiveness improvements

---

## 📄 License

This project is currently source-available. See the repository for licensing details.

---

**Questions?** Open a discussion on GitHub or reach out to [@yadakrishna245](https://github.com/yadakrishna245).

Thank you for helping make digital estate planning accessible to everyone! 🙏
