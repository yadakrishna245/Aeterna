import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { encryptData } from "../utils/crypto";
import {
  X,
  Shield,
  Lock,
  Mail,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";

const client = generateClient<Schema>();

interface AddAssetModalProps {
  masterPassword: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddAssetModal({ masterPassword, onClose, onAdded }: AddAssetModalProps) {
  const [assetName, setAssetName] = useState("");
  const [secretData, setSecretData] = useState("");
  const [heirEmail, setHeirEmail] = useState("");
  const [intervalDays, setIntervalDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!assetName.trim()) {
      setError("Asset name is required.");
      return;
    }
    if (!secretData.trim()) {
      setError("Secret data is required.");
      return;
    }
    if (!heirEmail.trim() || !heirEmail.includes("@")) {
      setError("A valid heir email is required.");
      return;
    }
    if (intervalDays < 1 || intervalDays > 365) {
      setError("Heartbeat interval must be between 1 and 365 days.");
      return;
    }

    setSubmitting(true);

    try {
      // Encrypt the secret data using the master password
      const encrypted = await encryptData(secretData, masterPassword);

      // Store in DynamoDB — only ciphertext goes to the server
      await client.models.Vault.create({
        assetName: assetName.trim(),
        encryptedPayload: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        heirEmail: heirEmail.trim().toLowerCase(),
        heartbeatIntervalDays: intervalDays,
        lastHeartbeat: new Date().toISOString(),
        status: "ACTIVE",
      });

      onAdded();
    } catch (err) {
      console.error("Failed to create vault:", err);
      setError("Failed to save vault. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-slate-100">Add Encrypted Asset</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Asset Name */}
          <div>
            <label htmlFor="asset-name" className="label">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Asset Name
            </label>
            <input
              id="asset-name"
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g., Bitcoin Wallet Seed, Gmail Password"
              className="input-field"
              autoFocus
            />
          </div>

          {/* Secret Data */}
          <div>
            <label htmlFor="secret-data" className="label">
              <Lock className="w-3.5 h-3.5 inline mr-1" />
              Secret Data
            </label>
            <textarea
              id="secret-data"
              value={secretData}
              onChange={(e) => setSecretData(e.target.value)}
              placeholder="Enter the sensitive data to encrypt (passwords, seed phrases, private keys, notes...)"
              className="input-field min-h-[120px] resize-y font-mono text-sm"
              rows={5}
            />
            <p className="text-xs text-slate-600 mt-1">
              🔒 This will be encrypted locally before being stored. The server never sees this data.
            </p>
          </div>

          {/* Heir Email */}
          <div>
            <label htmlFor="heir-email" className="label">
              <Mail className="w-3.5 h-3.5 inline mr-1" />
              Heir Email
            </label>
            <input
              id="heir-email"
              type="email"
              value={heirEmail}
              onChange={(e) => setHeirEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="input-field"
            />
            <p className="text-xs text-slate-600 mt-1">
              This person will be notified if your Dead Man's Switch triggers.
            </p>
          </div>

          {/* Heartbeat Interval */}
          <div>
            <label htmlFor="interval-days" className="label">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Heartbeat Interval (Days)
            </label>
            <input
              id="interval-days"
              type="number"
              min={1}
              max={365}
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="input-field"
            />
            <p className="text-xs text-slate-600 mt-1">
              If you don't check in within this many days, the switch triggers.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-gold flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Encrypting & Saving...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Encrypt & Store
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Security Footer */}
        <div className="px-6 py-3 border-t border-navy-700 bg-navy-900/50 rounded-b-2xl">
          <p className="text-xs text-slate-600 text-center">
            🛡️ AES-256-GCM encryption • PBKDF2 key derivation • Data encrypted client-side
          </p>
        </div>
      </div>
    </div>
  );
}
