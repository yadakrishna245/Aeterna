/**
 * Client-Side Cryptography Module for Aeterna
 *
 * Uses browser-native Web Crypto API:
 * - PBKDF2 for key derivation from master password
 * - AES-GCM for authenticated encryption
 *
 * The server NEVER sees plaintext data. Only encrypted blobs are stored.
 */

const PBKDF2_ITERATIONS = 600_000; // OWASP recommended minimum for PBKDF2-SHA256
const KEY_LENGTH = 256; // AES-256
const SALT_LENGTH = 16; // 128-bit salt
const IV_LENGTH = 12; // 96-bit IV for AES-GCM (recommended)

/**
 * Convert ArrayBuffer to Base64 string for storage
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string back to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive an AES-GCM key from a master password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: KEY_LENGTH,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface EncryptedData {
  ciphertext: string; // Base64-encoded encrypted payload
  iv: string; // Base64-encoded initialization vector
  salt: string; // Base64-encoded salt used for key derivation
}

/**
 * Encrypt plaintext data using AES-GCM with a password-derived key
 *
 * @param plaintext - The secret data to encrypt
 * @param masterPassword - The user's master password (never leaves the browser)
 * @returns Object containing Base64-encoded ciphertext, IV, and salt
 */
export async function encryptData(
  plaintext: string,
  masterPassword: string
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(masterPassword, salt);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

/**
 * Decrypt ciphertext using AES-GCM with a password-derived key
 *
 * @param encryptedData - Object containing ciphertext, IV, and salt (all Base64)
 * @param masterPassword - The user's master password
 * @returns Decrypted plaintext string
 * @throws Error if password is wrong or data is corrupted
 */
export async function decryptData(
  encryptedData: EncryptedData,
  masterPassword: string
): Promise<string> {
  const decoder = new TextDecoder();
  const salt = new Uint8Array(base64ToBuffer(encryptedData.salt));
  const iv = new Uint8Array(base64ToBuffer(encryptedData.iv));
  const ciphertext = base64ToBuffer(encryptedData.ciphertext);

  const key = await deriveKey(masterPassword, salt);

  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );

    return decoder.decode(plaintext);
  } catch {
    throw new Error(
      "Decryption failed. Wrong master password or corrupted data."
    );
  }
}
