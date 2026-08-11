/**
 * Panic Mode / Duress Pin Utilities — Hardened Implementation
 *
 * Security improvements over v1:
 * 1. PBKDF2 with 600K iterations + random salt (replaces bare SHA-256)
 * 2. Single localStorage key with generic name (less obvious in DevTools)
 * 3. Behavior & alertEmail encrypted with AES-GCM using the panic password
 *    (only decryptable when panic password is entered — never stored plaintext)
 * 4. Config mixed with decoy app-settings fields to avoid suspicion
 *
 * Storage format (localStorage key: "aeterna_settings"):
 * {
 *   theme: "dark",           // decoy field
 *   locale: "en",            // decoy field
 *   v: 2,                    // schema version
 *   k: "<salt_hex>",         // PBKDF2 salt
 *   h: "<hash_hex>",         // PBKDF2-derived hash for password verification
 *   e: "<iv_hex>:<ciphertext_hex>"  // AES-GCM encrypted config (behavior + alertEmail)
 * }
 */

const SETTINGS_KEY = "aeterna_settings";
const PBKDF2_ITERATIONS = 600_000;

export type PanicBehavior = "empty" | "decoy" | "alert";

// --- Internal: last-decrypted config cache (survives only within session) ---
let _cachedBehavior: PanicBehavior | null = null;
let _cachedAlertEmail: string | null = null;

// ─── Crypto Helpers ─────────────────────────────────────────────────────────

function hexEncode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derive a CryptoKey from password + salt using PBKDF2.
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
  usage: KeyUsage[]
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // extractable — we need to export bits for hash comparison
    usage
  );
}

/**
 * Derive a hex hash from password + salt (for comparison).
 * Uses PBKDF2 deriveBits (32 bytes).
 */
async function deriveHash(password: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return hexEncode(bits);
}

/**
 * Encrypt plaintext JSON with AES-GCM using a key derived from password + salt.
 */
async function encryptConfig(
  plaintext: string,
  password: string,
  salt: Uint8Array
): Promise<string> {
  const key = await deriveKey(password, salt, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
    key,
    encoder.encode(plaintext)
  );

  return hexEncode(iv.buffer as ArrayBuffer) + ":" + hexEncode(ciphertext);
}

/**
 * Decrypt AES-GCM ciphertext using a key derived from password + salt.
 * Returns null if decryption fails (wrong password).
 */
async function decryptConfig(
  encrypted: string,
  password: string,
  salt: Uint8Array
): Promise<string | null> {
  try {
    const [ivHex, ciphertextHex] = encrypted.split(":");
    if (!ivHex || !ciphertextHex) return null;

    const iv = hexDecode(ivHex);
    const ciphertext = hexDecode(ciphertextHex);
    const key = await deriveKey(password, salt, ["decrypt"]);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
      key,
      ciphertext as unknown as ArrayBuffer
    );

    return new TextDecoder().decode(plainBuffer);
  } catch {
    return null;
  }
}

// ─── Storage Helpers ────────────────────────────────────────────────────────

interface StoredSettings {
  theme: string;
  locale: string;
  v: number;
  k?: string; // salt (hex)
  h?: string; // PBKDF2 hash (hex)
  e?: string; // encrypted config (iv:ciphertext hex)
}

function readSettings(): StoredSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSettings;
  } catch {
    return null;
  }
}

function writeSettings(settings: StoredSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getBaseSettings(): StoredSettings {
  // Preserve any existing decoy fields or create defaults
  const existing = readSettings();
  return {
    theme: existing?.theme ?? "dark",
    locale: existing?.locale ?? "en",
    v: 2,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Configure panic mode with a duress password, behavior, and optional alert email.
 * Stores PBKDF2 hash (salted, 600K iterations) and AES-GCM encrypted config.
 *
 * Replaces: setPanicPassword() + setPanicBehavior() + setPanicAlertEmail()
 */
export async function setupPanicMode(
  panicPassword: string,
  behavior: PanicBehavior,
  alertEmail: string = ""
): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const saltHex = hexEncode(salt.buffer);

  // Derive verification hash
  const hash = await deriveHash(panicPassword, salt);

  // Encrypt the sensitive config with the panic password
  const configPayload = JSON.stringify({ behavior, alertEmail });
  const encConfig = await encryptConfig(configPayload, panicPassword, salt);

  // Store as a single blob with decoy fields
  const settings = getBaseSettings();
  settings.k = saltHex;
  settings.h = hash;
  settings.e = encConfig;
  writeSettings(settings);

  // Cache for session use
  _cachedBehavior = behavior;
  _cachedAlertEmail = alertEmail;
}

/**
 * Check if the entered password is the panic/duress password.
 * Uses PBKDF2 (600K iterations) for comparison — resistant to brute force.
 * If match, decrypts and caches the behavior/alertEmail for session use.
 */
export async function checkIsPanicPassword(enteredPassword: string): Promise<boolean> {
  const settings = readSettings();
  if (!settings?.k || !settings?.h) return false;

  const salt = hexDecode(settings.k);
  const derivedHash = await deriveHash(enteredPassword, salt);

  // Constant-time-ish comparison (both are hex strings of same length)
  if (derivedHash.length !== settings.h.length) return false;
  let mismatch = 0;
  for (let i = 0; i < derivedHash.length; i++) {
    mismatch |= derivedHash.charCodeAt(i) ^ settings.h.charCodeAt(i);
  }

  if (mismatch !== 0) return false;

  // Password matched — decrypt the config
  if (settings.e) {
    const decrypted = await decryptConfig(settings.e, enteredPassword, salt);
    if (decrypted) {
      try {
        const config = JSON.parse(decrypted);
        _cachedBehavior = config.behavior ?? "empty";
        _cachedAlertEmail = config.alertEmail ?? "";
      } catch {
        _cachedBehavior = "empty";
        _cachedAlertEmail = "";
      }
    }
  }

  return true;
}

/**
 * Returns true if panic mode is configured (a hash exists in settings).
 * Does NOT reveal behavior or email — those are encrypted.
 */
export function isPanicModeEnabled(): boolean {
  const settings = readSettings();
  return !!(settings?.k && settings?.h && settings?.e);
}

/**
 * Get the panic behavior. Only returns a meaningful value after a successful
 * checkIsPanicPassword() call (which decrypts and caches it).
 * Falls back to "empty" if not available.
 */
export function getPanicBehavior(): PanicBehavior {
  return _cachedBehavior ?? "empty";
}

/**
 * Get the emergency alert email. Only available after successful panic auth.
 */
export function getPanicAlertEmail(): string {
  return _cachedAlertEmail ?? "";
}

/**
 * Clear all panic mode settings and cached data.
 */
export function clearPanicMode(): void {
  const settings = readSettings();
  if (settings) {
    // Remove panic fields but preserve decoy app settings
    delete settings.k;
    delete settings.h;
    delete settings.e;
    writeSettings(settings);
  } else {
    localStorage.removeItem(SETTINGS_KEY);
  }
  _cachedBehavior = null;
  _cachedAlertEmail = null;
}

// ─── Legacy Compat Aliases ──────────────────────────────────────────────────
// These maintain backward compatibility with PanicModeSetup.tsx imports

/**
 * @deprecated Use setupPanicMode() instead. Kept for PanicModeSetup.tsx compat.
 * Sets only the hash; behavior must be set separately via setPanicBehavior().
 */
export async function setPanicPassword(password: string): Promise<void> {
  // Store password temporarily for combined save (behavior set afterward)
  _pendingPassword = password;
}

/**
 * @deprecated Use setupPanicMode() instead.
 */
export function setPanicBehavior(behavior: PanicBehavior): void {
  _pendingBehavior = behavior;
  // Trigger combined save if password was already set
  if (_pendingPassword) {
    _flushPendingSetup();
  }
}

/**
 * @deprecated Use setupPanicMode() instead.
 */
export function setPanicAlertEmail(email: string): void {
  _pendingAlertEmail = email;
  // Re-flush with updated email
  if (_pendingPassword) {
    _flushPendingSetup();
  }
}

// Internal pending state for legacy compat layer
let _pendingPassword: string | null = null;
let _pendingBehavior: PanicBehavior = "empty";
let _pendingAlertEmail: string = "";

function _flushPendingSetup(): void {
  if (!_pendingPassword) return;
  const pw = _pendingPassword;
  const beh = _pendingBehavior;
  const email = _pendingAlertEmail;

  // Fire async setup (best-effort in legacy compat mode)
  setupPanicMode(pw, beh, email).then(() => {
    _pendingPassword = null;
    _pendingBehavior = "empty";
    _pendingAlertEmail = "";
  });
}
