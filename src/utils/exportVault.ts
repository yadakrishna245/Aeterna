import type { Schema } from "../../amplify/data/resource";
import { encryptData, decryptData } from "./crypto";

type VaultItem = Schema["Vault"]["type"];

interface BackupEnvelope {
  version: string;
  exportDate: string;
  vaultCount: number;
  vaults: VaultItem[];
}

/**
 * Export all vault data as an encrypted JSON backup file.
 * The vault data (already encrypted per-item) is wrapped in a metadata envelope
 * and then encrypted AGAIN with the master password for double-layer backup security.
 *
 * @param vaults - Array of vault items (already encrypted individually)
 * @param masterPassword - The master password for the second encryption layer
 * @returns A Blob that can be downloaded as a .aeterna file
 */
export async function exportVaultBackup(
  vaults: VaultItem[],
  masterPassword: string
): Promise<Blob> {
  const envelope: BackupEnvelope = {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    vaultCount: vaults.length,
    vaults,
  };

  const envelopeJson = JSON.stringify(envelope);

  // Double-encrypt: encrypt the entire envelope with master password
  const encrypted = await encryptData(envelopeJson, masterPassword);

  const backupPayload = JSON.stringify({
    format: "aeterna-backup",
    version: "1.0.0",
    encrypted,
  });

  return new Blob([backupPayload], { type: "application/json" });
}

/**
 * Import a vault backup from a .aeterna file.
 * Decrypts the outer envelope and returns the vault items.
 *
 * @param file - The .aeterna backup file
 * @param masterPassword - The master password used during export
 * @returns Array of VaultItem from the backup
 * @throws Error if file is invalid or password is wrong
 */
export async function importVaultBackup(
  file: File,
  masterPassword: string
): Promise<VaultItem[]> {
  const text = await file.text();

  let parsed: { format?: string; version?: string; encrypted?: { ciphertext: string; iv: string; salt: string } };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid backup file: not valid JSON.");
  }

  if (parsed.format !== "aeterna-backup" || !parsed.encrypted) {
    throw new Error("Invalid backup file: unrecognized format.");
  }

  // Decrypt the outer envelope
  const envelopeJson = await decryptData(parsed.encrypted, masterPassword);

  let envelope: BackupEnvelope;
  try {
    envelope = JSON.parse(envelopeJson);
  } catch {
    throw new Error("Decryption succeeded but envelope is corrupted.");
  }

  if (!Array.isArray(envelope.vaults)) {
    throw new Error("Invalid backup: no vaults found in envelope.");
  }

  return envelope.vaults;
}
