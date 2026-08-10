import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { encryptData, decryptData } from "../utils/crypto";
import {
  Shield,
  Key,
  Smartphone,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
} from "lucide-react";

const client = generateClient<Schema>();

interface TwoFAVaultProps {
  masterPassword: string;
}

interface TwoFAFormData {
  serviceName: string;
  account: string;
  totpSecret: string;
  backupCodes: string;
  recoveryEmail: string;
  recoveryPhone: string;
}

interface DecryptedTwoFAEntry {
  id: string;
  serviceName: string;
  account: string;
  totpSecret: string;
  backupCodes: string;
  recoveryEmail: string;
  recoveryPhone: string;
}

const SERVICE_PRESETS = [
  "Google",
  "Apple",
  "Microsoft",
  "GitHub",
  "AWS",
  "Binance",
  "Coinbase",
  "Instagram",
  "Twitter/X",
  "WhatsApp",
  "Telegram",
  "Discord",
] as const;

const INITIAL_FORM: TwoFAFormData = {
  serviceName: "",
  account: "",
  totpSecret: "",
  backupCodes: "",
  recoveryEmail: "",
  recoveryPhone: "",
};

export function TwoFAVault({ masterPassword }: TwoFAVaultProps) {
  const [entries, setEntries] = useState<DecryptedTwoFAEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TwoFAFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const { data } = await client.models.Vault.list();
      const twoFAVaults = (data || []).filter(
        (v) => v.triggerType === "HEARTBEAT" && v.encryptedAssetName
      );

      // Try to decrypt each and check if it's a 2FA entry
      const decrypted: DecryptedTwoFAEntry[] = [];
      for (const vault of twoFAVaults) {
        try {
          const nameData = JSON.parse(vault.encryptedAssetName);
          const raw = await decryptData(nameData, masterPassword);

          // Check if it's a 2FA entry by trying to parse JSON with our marker
          const parsed = JSON.parse(raw);
          if (parsed.__type === "TWO_FA_ENTRY") {
            decrypted.push({
              id: vault.id,
              serviceName: parsed.serviceName || "",
              account: parsed.account || "",
              totpSecret: parsed.totpSecret || "",
              backupCodes: parsed.backupCodes || "",
              recoveryEmail: parsed.recoveryEmail || "",
              recoveryPhone: parsed.recoveryPhone || "",
            });
          }
        } catch {
          // Not a 2FA entry or can't decrypt — skip
        }
      }

      setEntries(decrypted);
    } catch (err) {
      console.error("Failed to fetch 2FA entries:", err);
    } finally {
      setLoading(false);
    }
  }, [masterPassword]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceName || !form.account) return;

    setSaving(true);
    try {
      // Create JSON payload with type marker
      const payload = JSON.stringify({
        __type: "TWO_FA_ENTRY",
        serviceName: form.serviceName,
        account: form.account,
        totpSecret: form.totpSecret,
        backupCodes: form.backupCodes,
        recoveryEmail: form.recoveryEmail,
        recoveryPhone: form.recoveryPhone,
      });

      // Encrypt the entire payload into encryptedAssetName
      const encryptedName = await encryptData(payload, masterPassword);
      // Also encrypt a placeholder for the required encryptedPayload field
      const encryptedPayload = await encryptData(
        `2FA: ${form.serviceName} - ${form.account}`,
        masterPassword
      );
      // Encrypt a placeholder for heir email (required field)
      const encryptedHeirEmail = await encryptData("N/A", masterPassword);

      await client.models.Vault.create({
        encryptedAssetName: JSON.stringify(encryptedName),
        encryptedPayload: encryptedPayload.ciphertext,
        iv: encryptedPayload.iv,
        salt: encryptedPayload.salt,
        encryptedHeirEmail: JSON.stringify(encryptedHeirEmail),
        heartbeatIntervalDays: 9999, // No heartbeat for 2FA entries
        lastHeartbeat: new Date().toISOString(),
        status: "ACTIVE",
        gracePeriodDays: 7,
        triggerType: "HEARTBEAT",
      });

      setForm(INITIAL_FORM);
      setShowForm(false);
      await fetchEntries();
    } catch (err) {
      console.error("Failed to save 2FA entry:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.models.Vault.delete({ id });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setRevealedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete 2FA entry:", err);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const selectPreset = (preset: string) => {
    setForm((prev) => ({ ...prev, serviceName: preset }));
    setShowPresets(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Shield className="w-8 h-8 text-slate-500 animate-pulse mx-auto mb-3" />
        <p className="text-slate-400">Loading 2FA vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-gold" />
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              2FA Recovery Vault
            </h2>
            <p className="text-xs text-slate-400">
              Store TOTP secrets & backup codes for your heirs
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-gold flex items-center gap-2 text-sm"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add 2FA Entry
            </>
          )}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-4 animate-slide-up"
        >
          <h3 className="text-sm font-semibold text-gold flex items-center gap-2">
            <Key className="w-4 h-4" />
            New 2FA Entry
          </h3>

          {/* Service Name with Presets */}
          <div className="relative">
            <label className="block text-xs text-slate-400 mb-1">
              Service Name *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.serviceName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, serviceName: e.target.value }))
                }
                placeholder="e.g., Google, GitHub, Binance"
                className="input flex-1"
                required
              />
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="btn-outline flex items-center gap-1 text-xs whitespace-nowrap"
              >
                Presets
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showPresets && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-navy-700 border border-navy-600 rounded-lg shadow-xl p-2 grid grid-cols-2 gap-1 w-64">
                {SERVICE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className="text-left text-xs text-slate-300 hover:text-gold hover:bg-navy-600 px-2 py-1.5 rounded transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account/Username */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Account / Username *
            </label>
            <input
              type="text"
              value={form.account}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, account: e.target.value }))
              }
              placeholder="e.g., user@email.com"
              className="input w-full"
              required
            />
          </div>

          {/* TOTP Secret */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              TOTP Secret Key
            </label>
            <input
              type="text"
              value={form.totpSecret}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, totpSecret: e.target.value }))
              }
              placeholder="Base32 string from QR code setup (e.g., JBSWY3DPEHPK3PXP)"
              className="input w-full font-mono text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              The secret key used to generate TOTP codes. Usually shown when
              setting up 2FA.
            </p>
          </div>

          {/* Backup Codes */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Backup Codes
            </label>
            <textarea
              value={form.backupCodes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, backupCodes: e.target.value }))
              }
              placeholder="One code per line&#10;1234-5678&#10;9012-3456&#10;..."
              className="input w-full h-24 resize-none font-mono text-sm"
            />
          </div>

          {/* Recovery Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Recovery Email
              </label>
              <input
                type="email"
                value={form.recoveryEmail}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    recoveryEmail: e.target.value,
                  }))
                }
                placeholder="recovery@email.com"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Recovery Phone
              </label>
              <input
                type="tel"
                value={form.recoveryPhone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    recoveryPhone: e.target.value,
                  }))
                }
                placeholder="+1 234 567 8900"
                className="input w-full"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !form.serviceName || !form.account}
              className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Shield className="w-4 h-4 animate-pulse" />
                  Encrypting & Saving...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Encrypt & Save
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      {entries.length === 0 && !showForm ? (
        <div className="bg-navy-800 border border-navy-700 rounded-xl text-center py-12">
          <Key className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No 2FA entries yet.</p>
          <p className="text-sm text-slate-500">
            Store your TOTP secrets and backup codes so heirs can bypass 2FA
            locks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isRevealed = revealedIds.has(entry.id);
            const isDeleting = deleteConfirmId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-navy-800 border border-navy-700 rounded-xl p-4 animate-slide-up"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">
                        {entry.serviceName}
                      </h3>
                      <p className="text-xs text-slate-400">{entry.account}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReveal(entry.id)}
                      className="btn-outline flex items-center gap-1.5 text-xs"
                      title={isRevealed ? "Hide secrets" : "Reveal secrets"}
                    >
                      {isRevealed ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          Reveal
                        </>
                      )}
                    </button>

                    {isDeleting ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="btn-danger flex items-center gap-1 text-xs"
                          title="Confirm delete"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="btn-outline flex items-center gap-1 text-xs"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(entry.id)}
                        className="btn-danger flex items-center gap-1.5 text-xs"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Revealed Content */}
                {isRevealed && (
                  <div className="border-t border-navy-700 pt-3 space-y-3 animate-fade-in">
                    {/* TOTP Secret */}
                    {entry.totpSecret && (
                      <div className="bg-navy-900 rounded-lg p-3 border border-gold/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase text-gold font-semibold tracking-wider flex items-center gap-1">
                            <Key className="w-3 h-3" />
                            TOTP Secret
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                entry.totpSecret,
                                `totp-${entry.id}`
                              )
                            }
                            className="text-slate-400 hover:text-gold transition-colors flex items-center gap-1 text-[10px]"
                          >
                            {copiedField === `totp-${entry.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <code className="text-sm text-slate-200 font-mono break-all">
                          {entry.totpSecret}
                        </code>
                      </div>
                    )}

                    {/* Backup Codes */}
                    {entry.backupCodes && (
                      <div className="bg-navy-900 rounded-lg p-3 border border-gold/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase text-gold font-semibold tracking-wider flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Backup Codes
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                entry.backupCodes,
                                `codes-${entry.id}`
                              )
                            }
                            className="text-slate-400 hover:text-gold transition-colors flex items-center gap-1 text-[10px]"
                          >
                            {copiedField === `codes-${entry.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap">
                          {entry.backupCodes}
                        </pre>
                      </div>
                    )}

                    {/* Recovery Info */}
                    {(entry.recoveryEmail || entry.recoveryPhone) && (
                      <div className="bg-navy-900 rounded-lg p-3 border border-navy-700">
                        <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1 mb-2">
                          <Smartphone className="w-3 h-3" />
                          Recovery Info
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {entry.recoveryEmail && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                Email:
                              </span>
                              <span className="text-xs text-slate-200 font-mono">
                                {entry.recoveryEmail}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    entry.recoveryEmail,
                                    `email-${entry.id}`
                                  )
                                }
                                className="text-slate-500 hover:text-gold transition-colors"
                              >
                                {copiedField === `email-${entry.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {entry.recoveryPhone && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                Phone:
                              </span>
                              <span className="text-xs text-slate-200 font-mono">
                                {entry.recoveryPhone}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    entry.recoveryPhone,
                                    `phone-${entry.id}`
                                  )
                                }
                                className="text-slate-500 hover:text-gold transition-colors"
                              >
                                {copiedField === `phone-${entry.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
