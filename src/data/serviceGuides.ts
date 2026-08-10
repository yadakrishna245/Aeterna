/**
 * Service Recovery Guides for the AI Grief Assistant
 *
 * Contains platform-specific recovery instructions that heirs will need
 * to access or manage the deceased's digital accounts.
 */

export type ServiceCategory =
  | "email"
  | "social"
  | "finance"
  | "smartHome"
  | "subscriptions"
  | "crypto"
  | "business";

export interface ServiceGuide {
  id: string;
  name: string;
  category: ServiceCategory;
  icon: string; // emoji for display
  steps: string[];
  needs: string[];
  warning: string;
  officialUrl: string;
  estimatedTime: string;
}

export const SERVICE_CATEGORIES: Record<ServiceCategory, { label: string; emoji: string }> = {
  email: { label: "Email", emoji: "📧" },
  social: { label: "Social Media", emoji: "📱" },
  finance: { label: "Finance & Banking", emoji: "💰" },
  crypto: { label: "Crypto & Web3", emoji: "🔐" },
  smartHome: { label: "Smart Home", emoji: "🏠" },
  subscriptions: { label: "Subscriptions", emoji: "📺" },
  business: { label: "Business", emoji: "💼" },
};

export const SERVICE_GUIDES: ServiceGuide[] = [
  // --- EMAIL ---
  {
    id: "google",
    name: "Google (Gmail)",
    category: "email",
    icon: "📧",
    steps: [
      "Go to support.google.com/accounts/troubleshooter/6357590",
      "Submit a request for a deceased person's account using Google's official form",
      "If Inactive Account Manager was set up, the designated contact will receive data automatically",
      "Provide death certificate and proof of relationship/authority",
      "Google will review and respond within 30 days",
    ],
    needs: [
      "Deceased's Gmail address",
      "Death certificate (certified copy)",
      "Proof of authority (executor letter, power of attorney)",
      "Your government-issued ID",
      "Recovery email or phone if available",
    ],
    warning:
      "If 2FA was enabled without backup codes, recovery is significantly harder. Google may not grant full access — they may only provide data export.",
    officialUrl: "https://support.google.com/accounts/troubleshooter/6357590",
    estimatedTime: "2-4 weeks",
  },
  {
    id: "apple",
    name: "Apple (iCloud)",
    category: "email",
    icon: "🍎",
    steps: [
      "If Digital Legacy was set up: Use the Access Key provided during setup",
      "Go to digital-legacy.apple.com and enter the Access Key + death certificate",
      "If NO Digital Legacy: Contact Apple Support with court order",
      "Apple will create a Legacy Contact account with 3 years of access",
      "Download data before the 3-year window closes",
    ],
    needs: [
      "Digital Legacy Access Key (if set up)",
      "Death certificate",
      "Court order granting access (if no Legacy Contact)",
      "Deceased's Apple ID email",
      "Device passcode (if available — for local device access)",
    ],
    warning:
      "Without Digital Legacy or a court order, Apple will NOT unlock devices or accounts. Physical device access requires the passcode — there is no workaround.",
    officialUrl: "https://support.apple.com/en-us/102638",
    estimatedTime: "1-3 weeks (with Legacy Key) / 4-8 weeks (court order)",
  },
  {
    id: "microsoft",
    name: "Microsoft (Outlook)",
    category: "email",
    icon: "💻",
    steps: [
      "Go to Microsoft's Next of Kin process page",
      "Submit the 'Request for Deceased User's Content' form",
      "Provide required legal documentation",
      "Microsoft will review and provide a data DVD or download link",
      "Note: They provide data export, NOT account access",
    ],
    needs: [
      "Deceased's Microsoft/Outlook email",
      "Death certificate",
      "Proof you are next of kin or executor",
      "Your government-issued ID",
      "A valid subpoena or court order (varies by jurisdiction)",
    ],
    warning:
      "Microsoft typically provides data export only — not login access. The process can take 4-6 weeks. Account will eventually be deleted per inactivity policy.",
    officialUrl: "https://support.microsoft.com/en-us/account-billing/accessing-a-deceased-person-s-account",
    estimatedTime: "4-6 weeks",
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    category: "email",
    icon: "📨",
    steps: [
      "Contact Yahoo/AOL support for deceased user account closure",
      "Submit written request with legal documentation",
      "Yahoo will close the account — they do NOT provide account access",
      "Content cannot be recovered after closure",
      "Consider alternative: Check if email forwards were set up",
    ],
    needs: [
      "Deceased's Yahoo email address",
      "Death certificate",
      "Proof of relationship",
      "Your contact information",
    ],
    warning:
      "Yahoo does NOT provide access to deceased accounts to family. They will only close the account. Save any forwarding rules info beforehand.",
    officialUrl: "https://help.yahoo.com/kb/close-account-deceased-yahoo-user",
    estimatedTime: "2-4 weeks (closure only)",
  },
  {
    id: "protonmail",
    name: "ProtonMail",
    category: "email",
    icon: "🔒",
    steps: [
      "Contact ProtonMail support at support@proton.me",
      "Note: ProtonMail uses zero-knowledge encryption — even Proton cannot decrypt emails",
      "Without the account password, email content is permanently inaccessible",
      "Proton can close the account upon receiving legal documentation",
      "If password is known, login and export data immediately",
    ],
    needs: [
      "Account password (CRITICAL — without it, data is lost forever)",
      "Deceased's ProtonMail address",
      "Death certificate (for account closure)",
    ],
    warning:
      "ProtonMail's zero-knowledge encryption means WITHOUT the password, all emails are permanently lost. There is NO recovery path. This is the most critical account to document.",
    officialUrl: "https://proton.me/support/account-recovery",
    estimatedTime: "Immediate (with password) / N/A (without)",
  },

  // --- SOCIAL MEDIA ---
  {
    id: "facebook",
    name: "Facebook",
    category: "social",
    icon: "👤",
    steps: [
      "Go to facebook.com/help/contact/305593649477238",
      "Choose: Memorialize account OR Request account removal",
      "If Legacy Contact was set up, they can manage the memorialized profile",
      "Submit death certificate and proof of relationship",
      "For data download: Submit special request with legal authority documentation",
    ],
    needs: [
      "Link to deceased's Facebook profile",
      "Death certificate or obituary",
      "Proof of immediate family or executor status",
      "Legacy Contact info (if set up)",
    ],
    warning:
      "Facebook will NOT provide login access. Memorialized accounts show 'Remembering' before the name. Legacy Contacts have limited abilities (pin posts, update profile photo).",
    officialUrl: "https://www.facebook.com/help/1506822589577997",
    estimatedTime: "1-4 weeks",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    icon: "📸",
    steps: [
      "Go to Instagram's memorialization request form",
      "Submit proof of death (death certificate, obituary link, news article)",
      "For removal: Immediate family can request account deletion",
      "Memorialized accounts cannot be logged into",
      "Contact Instagram support for data download requests",
    ],
    needs: [
      "Deceased's Instagram username",
      "Death certificate or proof of death",
      "Proof of immediate family relationship",
      "Your Instagram account (for verification)",
    ],
    warning:
      "Instagram (owned by Meta) follows similar rules to Facebook. No login access is granted. Downloaded photos may lose quality compared to originals.",
    officialUrl: "https://help.instagram.com/264154560391256",
    estimatedTime: "1-4 weeks",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    category: "social",
    icon: "🐦",
    steps: [
      "Go to help.twitter.com/forms/privacy (deactivation request)",
      "Submit request as authorized estate representative",
      "Provide death certificate and proof of authorization",
      "Twitter/X will deactivate the account",
      "Note: No data export is provided to family — only deactivation",
    ],
    needs: [
      "Deceased's Twitter/X username or profile URL",
      "Death certificate",
      "Proof of executor/family status",
      "Your government-issued ID",
    ],
    warning:
      "Twitter/X only offers deactivation — no memorialization and no data export to family. If you need tweets preserved, screenshot or archive them first via web.archive.org.",
    officialUrl: "https://help.twitter.com/en/rules-and-policies/contact-twitter-about-a-deceased-family-members-account",
    estimatedTime: "2-4 weeks",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "social",
    icon: "💬",
    steps: [
      "Chat history is stored locally on the phone (not WhatsApp servers)",
      "If phone is accessible: Open WhatsApp → Settings → Chats → Export Chat",
      "If phone is locked: You need the device passcode or biometric",
      "Cloud backups (Google Drive / iCloud) require the linked account access",
      "Contact WhatsApp support to deactivate the account",
    ],
    needs: [
      "Physical access to the phone",
      "Phone passcode or biometric access",
      "Google/iCloud account access (for cloud backups)",
      "SIM card (to receive verification codes if needed)",
    ],
    warning:
      "WhatsApp uses end-to-end encryption. Messages exist only on the device and optional cloud backup. Without phone access, messages are likely unrecoverable.",
    officialUrl: "https://faq.whatsapp.com/1523271564652669",
    estimatedTime: "Immediate (with phone access) / 1-2 weeks (deactivation)",
  },
  {
    id: "telegram",
    name: "Telegram",
    category: "social",
    icon: "✈️",
    steps: [
      "Telegram accounts auto-delete after inactivity (default: 6 months)",
      "If phone is accessible: Login with SMS verification code",
      "Secret chats are device-specific and cannot be recovered elsewhere",
      "Regular chats are stored on Telegram's cloud and accessible from any device with the account",
      "Contact Telegram support (@TelegramSupport) for special requests",
    ],
    needs: [
      "Access to the phone number (to receive SMS code)",
      "Two-step verification password (if enabled)",
      "Physical device (for Secret Chats only)",
    ],
    warning:
      "Telegram's auto-delete feature means the account WILL be automatically deleted after the inactivity period. Act quickly. Secret Chats are device-bound and unrecoverable.",
    officialUrl: "https://telegram.org/faq#q-what-happens-if-i-change-my-phone-number",
    estimatedTime: "Immediate (with phone) / Account auto-deletes after inactivity",
  },

  // --- FINANCE ---
  {
    id: "paypal",
    name: "PayPal",
    category: "finance",
    icon: "💳",
    steps: [
      "Call PayPal's deceased account support line",
      "Provide death certificate and estate documentation",
      "PayPal will freeze the account and work with the executor",
      "Remaining balance will be transferred to the estate",
      "Any subscriptions/recurring payments will be cancelled",
    ],
    needs: [
      "Deceased's PayPal email",
      "Death certificate",
      "Letters testamentary or executor documentation",
      "Estate bank account info (for fund transfer)",
      "Your government-issued ID",
    ],
    warning:
      "PayPal disputes and chargebacks may be pending. Resolve any open cases before requesting account closure. Balance transfers can take 3-4 weeks.",
    officialUrl: "https://www.paypal.com/us/smarthelp/article/how-do-i-close-a-deceased-person's-account-faq2579",
    estimatedTime: "3-6 weeks",
  },
  {
    id: "bank_generic",
    name: "Bank Accounts (Generic)",
    category: "finance",
    icon: "🏦",
    steps: [
      "Visit the local branch with death certificate and executor documents",
      "If joint account: Surviving owner retains access automatically",
      "If sole account: Executor must present Letters Testamentary",
      "Bank will freeze the account and transfer to estate account",
      "Cancel any direct debits, standing orders, and linked cards",
    ],
    needs: [
      "Death certificate (multiple certified copies recommended)",
      "Letters Testamentary / Letters of Administration",
      "Executor's government-issued ID",
      "Account numbers (check statements, apps, or documents)",
      "Grant of Probate (if applicable in your jurisdiction)",
    ],
    warning:
      "Banks vary significantly by country and institution. Start with the branch — they have specific procedures. Notify early to prevent unauthorized transactions.",
    officialUrl: "",
    estimatedTime: "2-8 weeks (varies by institution)",
  },

  // --- CRYPTO ---
  {
    id: "binance",
    name: "Binance",
    category: "crypto",
    icon: "🪙",
    steps: [
      "Contact Binance Support with inheritance claim",
      "Submit: Death certificate, proof of relationship, government ID",
      "Binance will verify and assign a case manager",
      "Complete their inheritance verification process",
      "Funds will be transferred to a verified account you designate",
    ],
    needs: [
      "Deceased's Binance email or UID",
      "Death certificate (notarized)",
      "Proof of inheritance rights (will, court order)",
      "Your KYC-verified Binance account (to receive funds)",
      "Your government-issued ID",
    ],
    warning:
      "If 2FA (Google Authenticator) was enabled and the phone is lost, recovery is extremely difficult. Document 2FA backup codes. Process takes 4-12 weeks.",
    officialUrl: "https://www.binance.com/en/support",
    estimatedTime: "4-12 weeks",
  },
  {
    id: "coinbase",
    name: "Coinbase",
    category: "crypto",
    icon: "🌐",
    steps: [
      "Email Coinbase support requesting deceased account access",
      "Submit death certificate and legal documentation",
      "Coinbase will verify your legal authority over the estate",
      "Complete their beneficiary verification process",
      "Assets will be liquidated or transferred per estate instructions",
    ],
    needs: [
      "Deceased's Coinbase email",
      "Death certificate",
      "Letters Testamentary or court order",
      "Your government-issued ID",
      "Probate court documentation (if applicable)",
    ],
    warning:
      "Coinbase requires extensive verification. If crypto was in Coinbase Wallet (self-custody), you need the seed phrase — Coinbase cannot help without it.",
    officialUrl: "https://help.coinbase.com/en/coinbase/managing-my-account/other/deceased-account-holder",
    estimatedTime: "4-8 weeks",
  },

  // --- SUBSCRIPTIONS ---
  {
    id: "netflix",
    name: "Netflix",
    category: "subscriptions",
    icon: "🎬",
    steps: [
      "Login to the account (if password is known)",
      "Go to Account → Cancel Membership",
      "If no login access: Contact Netflix support via chat or phone",
      "Provide account email and proof of death",
      "Netflix will cancel the subscription and stop billing",
    ],
    needs: [
      "Account email address",
      "Account password (ideal) or last 4 digits of payment card",
      "Death certificate (if contacting support without login)",
    ],
    warning:
      "Netflix profiles and watch history will be lost upon cancellation. Download any viewing history data first if desired.",
    officialUrl: "https://help.netflix.com/en/node/407",
    estimatedTime: "Immediate (with login) / 1-2 weeks (support)",
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "subscriptions",
    icon: "🎵",
    steps: [
      "Login and go to Account → Subscription → Cancel",
      "If no login: Contact Spotify support via their web form",
      "Provide the account email and proof of death",
      "Spotify will close the account and stop billing",
      "Playlists will be lost — consider making them public first for others to save",
    ],
    needs: [
      "Account email or username",
      "Account password (ideal)",
      "Death certificate (for support requests)",
    ],
    warning:
      "Spotify playlists are tied to the account. Once deleted, they're gone. If playlists have sentimental value, make them collaborative or public first so others can copy them.",
    officialUrl: "https://support.spotify.com/us/article/close-account/",
    estimatedTime: "Immediate (with login) / 1-2 weeks (support)",
  },
  {
    id: "amazon",
    name: "Amazon",
    category: "subscriptions",
    icon: "📦",
    steps: [
      "Contact Amazon Customer Service via chat or phone",
      "Request account closure for a deceased family member",
      "Provide death certificate and relationship proof",
      "Cancel Prime and any active subscriptions",
      "Request refund for any recent unused subscription period",
      "Check for digital content (Kindle books, music) — these are non-transferable",
    ],
    needs: [
      "Deceased's Amazon email",
      "Death certificate",
      "Proof of relationship or executor status",
      "Last order details or payment method (for verification)",
    ],
    warning:
      "Amazon digital purchases (Kindle, music, apps) are NON-TRANSFERABLE — they die with the account. Physical Kindle devices can be factory-reset and reused.",
    officialUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GDK92DNLSGWTV54N",
    estimatedTime: "1-3 weeks",
  },

  // --- SMART HOME ---
  {
    id: "smart_home_generic",
    name: "Smart Home Devices",
    category: "smartHome",
    icon: "🏠",
    steps: [
      "Identify all smart home devices (Alexa, Google Home, Ring, Nest, Hue, etc.)",
      "Most devices are tied to the owner's account (Google, Amazon, Apple)",
      "Factory reset devices to delink from the deceased's account",
      "Re-register devices under your own account",
      "Check for any security cameras with stored footage you may need",
      "Update WiFi passwords if the deceased managed the network",
    ],
    needs: [
      "Physical access to devices",
      "WiFi network password",
      "Account credentials for linked platforms (Google, Amazon, Apple)",
      "Device-specific reset procedures (usually a physical button hold)",
    ],
    warning:
      "Smart locks, security cameras, and alarm systems should be addressed first for home security. Factory resetting deletes all routines and history.",
    officialUrl: "",
    estimatedTime: "1-2 hours per device",
  },
];

/**
 * Get guides filtered by category
 */
export function getGuidesByCategory(category: ServiceCategory): ServiceGuide[] {
  return SERVICE_GUIDES.filter((g) => g.category === category);
}

/**
 * Get a specific guide by ID
 */
export function getGuideById(id: string): ServiceGuide | undefined {
  return SERVICE_GUIDES.find((g) => g.id === id);
}

/**
 * Get all category labels with counts
 */
export function getCategorySummary(): Array<{ category: ServiceCategory; label: string; emoji: string; count: number }> {
  return Object.entries(SERVICE_CATEGORIES).map(([cat, meta]) => ({
    category: cat as ServiceCategory,
    label: meta.label,
    emoji: meta.emoji,
    count: SERVICE_GUIDES.filter((g) => g.category === cat).length,
  }));
}
