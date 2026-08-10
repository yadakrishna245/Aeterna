/**
 * Panic Mode / Duress Pin Utilities
 * Uses Web Crypto API for SHA-256 hashing — no plaintext storage.
 */

const PANIC_HASH_KEY = "aeterna_panic_hash";
const PANIC_BEHAVIOR_KEY = "aeterna_panic_behavior";
const PANIC_ALERT_EMAIL_KEY = "aeterna_panic_alert_email";

export type PanicBehavior = "empty" | "decoy" | "alert";

/**
 * Hash a password string using SHA-256 via Web Crypto API.
 * Returns hex string.
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Store the SHA-256 hash of the duress/panic password in localStorage.
 * Never stores plaintext.
 */
export async function setPanicPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  localStorage.setItem(PANIC_HASH_KEY, hash);
}

/**
 * Check if the given password matches the stored panic password hash.
 */
export async function checkIsPanicPassword(password: string): Promise<boolean> {
  const storedHash = localStorage.getItem(PANIC_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

/**
 * Returns true if a panic password has been configured.
 */
export function isPanicModeEnabled(): boolean {
  return localStorage.getItem(PANIC_HASH_KEY) !== null;
}

/**
 * Get the configured panic behavior.
 */
export function getPanicBehavior(): PanicBehavior {
  const behavior = localStorage.getItem(PANIC_BEHAVIOR_KEY);
  if (behavior === "empty" || behavior === "decoy" || behavior === "alert") {
    return behavior;
  }
  return "empty";
}

/**
 * Set the panic behavior mode.
 */
export function setPanicBehavior(behavior: PanicBehavior): void {
  localStorage.setItem(PANIC_BEHAVIOR_KEY, behavior);
}

/**
 * Get the emergency alert email (for 'alert' behavior).
 */
export function getPanicAlertEmail(): string {
  return localStorage.getItem(PANIC_ALERT_EMAIL_KEY) || "";
}

/**
 * Set the emergency alert email.
 */
export function setPanicAlertEmail(email: string): void {
  localStorage.setItem(PANIC_ALERT_EMAIL_KEY, email);
}

/**
 * Clear all panic mode settings (disable).
 */
export function clearPanicMode(): void {
  localStorage.removeItem(PANIC_HASH_KEY);
  localStorage.removeItem(PANIC_BEHAVIOR_KEY);
  localStorage.removeItem(PANIC_ALERT_EMAIL_KEY);
}
