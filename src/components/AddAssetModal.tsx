import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { encryptData, decryptData } from "../utils/crypto";
import { FileUpload } from "./FileUpload";
import { VideoRecorder } from "./VideoRecorder";
import {
  X,
  Shield,
  Lock,
  Mail,
  Clock,
  FileText,
  Loader2,
  Users,
  Calendar,
  HeartPulse,
  Upload,
  Video,
  ChevronDown,
  Check,
} from "lucide-react";

const client = generateClient<Schema>();

interface AddAssetModalProps {
  masterPassword: string;
  onClose: () => void;
  onAdded: () => void;
}

type TriggerType = "heartbeat" | "scheduled";

interface DecryptedBeneficiary {
  id: string;
  name: string;
}

export function AddAssetModal({ masterPassword, onClose, onAdded }: AddAssetModalProps) {
  const [assetName, setAssetName] = useState("");
  const [secretData, setSecretData] = useState("");
  const [heirEmail, setHeirEmail] = useState("");
  const [intervalDays, setIntervalDays] = useState(30);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [triggerType, setTriggerType] = useState<TriggerType>("heartbeat");
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<DecryptedBeneficiary[]>([]);
  const [beneficiaryDropdownOpen, setBeneficiaryDropdownOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch and decrypt beneficiaries for the selector
  const fetchBeneficiaries = useCallback(async () => {
    try {
      const { data } = await (client.models as any).Beneficiary.list();
      const records = data || [];

      const decrypted: DecryptedBeneficiary[] = await Promise.all(
        records.map(async (record: any) => {
          let name = "[Encrypted]";
          try {
            const nameData = JSON.parse(record.encryptedName);
            name = await decryptData(nameData, masterPassword);
          } catch {
            // Failed to decrypt
          }
          return { id: record.id, name };
        })
      );

      setBeneficiaries(decrypted);
    } catch (err) {
      console.error("Failed to fetch beneficiaries:", err);
    }
  }, [masterPassword]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  const toggleBeneficiary = (id: string) => {
    setSelectedBeneficiaryIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

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
    if (triggerType === "heartbeat" && (intervalDays < 1 || intervalDays > 365)) {
      setError("Heartbeat interval must be between 1 and 365 days.");
      return;
    }
    if (triggerType === "scheduled" && !scheduledDate) {
      setError("Please select a scheduled date.");
      return;
    }
    if (gracePeriodDays < 1 || gracePeriodDays > 90) {
      setError("Grace period must be between 1 and 90 days.");
      return;
    }

    setSubmitting(true);

    try {
      // Encrypt ALL sensitive fields using the master password
      const encryptedSecret = await encryptData(secretData, masterPassword);
      const encryptedName = await encryptData(assetName.trim(), masterPassword);
      const encryptedEmail = await encryptData(heirEmail.trim().toLowerCase(), masterPassword);

      // Store in DynamoDB — only ciphertext goes to the server
      await client.models.Vault.create({
        encryptedAssetName: JSON.stringify({
          ciphertext: encryptedName.ciphertext,
          iv: encryptedName.iv,
          salt: encryptedName.salt,
        }),
        encryptedPayload: encryptedSecret.ciphertext,
        iv: encryptedSecret.iv,
        salt: encryptedSecret.salt,
        encryptedHeirEmail: JSON.stringify({
          ciphertext: encryptedEmail.ciphertext,
          iv: encryptedEmail.iv,
          salt: encryptedEmail.salt,
        }),
        heartbeatIntervalDays: intervalDays,
        lastHeartbeat: new Date().toISOString(),
        status: "ACTIVE",
        // New fields (will need schema update to persist)
        // triggerType,
        // scheduledDate: triggerType === "scheduled" ? scheduledDate : undefined,
        // gracePeriodDays,
        // beneficiaryIds: selectedBeneficiaryIds,
      } as any);

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
      <div className="relative w-full max-w-2xl bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-navy-700 bg-navy-800/95 backdrop-blur-sm rounded-t-2xl">
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
              className="input-field min-h-[100px] resize-y font-mono text-sm"
              rows={4}
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
              🔒 This email will be encrypted. Only you can see it with your master password.
            </p>
          </div>

          {/* Beneficiary Selector (Multi-Select) */}
          <div>
            <label className="label">
              <Users className="w-3.5 h-3.5 inline mr-1" />
              Assign Beneficiaries (optional)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setBeneficiaryDropdownOpen(!beneficiaryDropdownOpen)}
                className="input-field w-full text-left flex items-center justify-between"
              >
                <span className={selectedBeneficiaryIds.length > 0 ? "text-slate-200" : "text-slate-500"}>
                  {selectedBeneficiaryIds.length > 0
                    ? `${selectedBeneficiaryIds.length} beneficiar${selectedBeneficiaryIds.length > 1 ? "ies" : "y"} selected`
                    : "Select beneficiaries..."}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    beneficiaryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {beneficiaryDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-navy-900 border border-navy-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {beneficiaries.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No beneficiaries found. Add one first.
                    </div>
                  ) : (
                    beneficiaries.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBeneficiary(b.id)}
                        className="w-full px-4 py-2 flex items-center gap-2 hover:bg-navy-800 transition-colors text-left"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            selectedBeneficiaryIds.includes(b.id)
                              ? "bg-gold border-gold"
                              : "border-navy-600"
                          }`}
                        >
                          {selectedBeneficiaryIds.includes(b.id) && (
                            <Check className="w-3 h-3 text-navy-900" />
                          )}
                        </div>
                        <span className="text-sm text-slate-200">{b.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Selected Chips */}
            {selectedBeneficiaryIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedBeneficiaryIds.map((id) => {
                  const b = beneficiaries.find((ben) => ben.id === id);
                  return (
                    <span
                      key={id}
                      className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/20 flex items-center gap-1"
                    >
                      {b?.name || "Unknown"}
                      <button
                        type="button"
                        onClick={() => toggleBeneficiary(id)}
                        className="hover:text-gold-light"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trigger Type Selector */}
          <div>
            <label className="label">
              <HeartPulse className="w-3.5 h-3.5 inline mr-1" />
              Trigger Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTriggerType("heartbeat")}
                className={`p-3 rounded-lg border text-sm text-left transition-all ${
                  triggerType === "heartbeat"
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-navy-700 bg-navy-900 text-slate-400 hover:border-navy-600"
                }`}
              >
                <HeartPulse className="w-4 h-4 mb-1" />
                <span className="font-medium block">Heartbeat (Check-In)</span>
                <span className="text-xs opacity-70">Triggers if you miss a check-in</span>
              </button>
              <button
                type="button"
                onClick={() => setTriggerType("scheduled")}
                className={`p-3 rounded-lg border text-sm text-left transition-all ${
                  triggerType === "scheduled"
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-navy-700 bg-navy-900 text-slate-400 hover:border-navy-600"
                }`}
              >
                <Calendar className="w-4 h-4 mb-1" />
                <span className="font-medium block">Scheduled Date</span>
                <span className="text-xs opacity-70">Triggers on a specific date</span>
              </button>
            </div>
          </div>

          {/* Heartbeat Interval (shown for heartbeat trigger) */}
          {triggerType === "heartbeat" && (
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
          )}

          {/* Scheduled Date (shown for scheduled trigger) */}
          {triggerType === "scheduled" && (
            <div>
              <label htmlFor="scheduled-date" className="label">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Scheduled Release Date
              </label>
              <input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-slate-600 mt-1">
                The vault will be released to heirs on this date.
              </p>
            </div>
          )}

          {/* Grace Period */}
          <div>
            <label htmlFor="grace-period" className="label">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Grace Period (Days)
            </label>
            <input
              id="grace-period"
              type="number"
              min={1}
              max={90}
              value={gracePeriodDays}
              onChange={(e) => setGracePeriodDays(Number(e.target.value))}
              className="input-field"
            />
            <p className="text-xs text-slate-600 mt-1">
              After triggering, you have this many days to cancel before release. Default: 7 days.
            </p>
          </div>

          {/* Optional: File Upload Section */}
          <div className="border border-navy-700 rounded-lg p-3">
            <button
              type="button"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="w-full flex items-center justify-between text-sm text-slate-300 hover:text-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-gold" />
                Attach File (optional)
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFileUpload ? "rotate-180" : ""}`}
              />
            </button>
            {showFileUpload && (
              <div className="mt-3 pt-3 border-t border-navy-700">
                <FileUpload
                  masterPassword={masterPassword}
                  onFilesReady={(files) => {
                    // Store encrypted files for submission
                    console.log("Encrypted files ready:", files.length);
                  }}
                  onCancel={() => setShowFileUpload(false)}
                />
              </div>
            )}
          </div>

          {/* Optional: Video Record Section */}
          <div className="border border-navy-700 rounded-lg p-3">
            <button
              type="button"
              onClick={() => setShowVideoRecorder(!showVideoRecorder)}
              className="w-full flex items-center justify-between text-sm text-slate-300 hover:text-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Video className="w-4 h-4 text-gold" />
                Record Video Message (optional)
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showVideoRecorder ? "rotate-180" : ""}`}
              />
            </button>
            {showVideoRecorder && (
              <div className="mt-3 pt-3 border-t border-navy-700">
                <VideoRecorder
                  masterPassword={masterPassword}
                  onSave={(data) => {
                    // Store encrypted video for submission
                    console.log("Encrypted video ready:", data.mode, data.mimeType);
                  }}
                  onCancel={() => setShowVideoRecorder(false)}
                />
              </div>
            )}
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
            🛡️ AES-256-GCM encryption • PBKDF2 key derivation • ALL fields encrypted client-side
          </p>
        </div>
      </div>
    </div>
  );
}
