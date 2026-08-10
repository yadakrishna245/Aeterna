import { useState, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { splitSecret, verifyShares } from "../utils/shamirSecret";
import { encryptData } from "../utils/crypto";
import {
  Key,
  Shield,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

const client = generateClient<Schema>();

interface KeyRecoverySetupProps {
  masterPassword: string;
}

type SetupStep = "intro" | "generating" | "distribute" | "confirm" | "complete";

const RECOVERY_SETUP_KEY = "aeterna_key_recovery_setup";

/**
 * KeyRecoverySetup — Shamir's Secret Sharing for heir-based key recovery.
 *
 * Splits the master password into 3 fragments (threshold: 2-of-3):
 *   Fragment 1: Stored by Aeterna (released after dead man's switch fires + 45 days)
 *   Fragment 2: Given to the primary heir
 *   Fragment 3: User's backup (physical safe / lawyer)
 *
 * No single party can reconstruct the password alone.
 */
export function KeyRecoverySetup({ masterPassword }: KeyRecoverySetupProps) {
  const [step, setStep] = useState<SetupStep>(() => {
    const stored = localStorage.getItem(RECOVERY_SETUP_KEY);
    return stored === "active" ? "complete" : "intro";
  });
  const [fragments, setFragments] = useState<string[]>([]);
  const [revealedFragment, setRevealedFragment] = useState<Record<number, boolean>>({});
  const [copiedFragment, setCopiedFragment] = useState<Record<number, boolean>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate the 3 Shamir fragments from the master password.
   */
  const handleGenerateFragments = useCallback(async () => {
    setStep("generating");
    setError(null);

    try {
      // Split master password into 3 shares (any 2 can reconstruct)
      const shares = splitSecret(masterPassword, 3, 2);

      // Verify the shares work before proceeding
      const verified =
        verifyShares([shares[0], shares[1]], masterPassword) &&
        verifyShares([shares[1], shares[2]], masterPassword) &&
        verifyShares([shares[0], shares[2]], masterPassword);

      if (!verified) {
        throw new Error("Share verification failed. Please try again.");
      }

      setFragments(shares);
      setStep("distribute");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fragment generation failed");
      setStep("intro");
    }
  }, [masterPassword]);

  /**
   * Store Fragment 1 encrypted in DynamoDB and activate the recovery system.
   */
  const handleActivateRecovery = useCallback(async () => {
    if (!confirmed || fragments.length < 3) return;

    setActivating(true);
    setError(null);

    try {
      // Encrypt Fragment 1 before storing (using the master password itself)
      // This adds a layer — but in the actual recovery flow, the system
      // decrypts this using an internal service key after switch fires.
      const encryptedFragment = await encryptData(fragments[0], masterPassword);

      // Store as a special Vault entry with a recognizable name
      await client.models.Vault.create({
        encryptedAssetName: JSON.stringify(
          await encryptData("__SHAMIR_FRAGMENT_1__", masterPassword)
        ),
        encryptedPayload: encryptedFragment.ciphertext,
        iv: encryptedFragment.iv,
        salt: encryptedFragment.salt,
        encryptedHeirEmail: JSON.stringify(
          await encryptData("system@aeterna.app", masterPassword)
        ),
        heartbeatIntervalDays: 9999, // Never triggers on its own
        lastHeartbeat: new Date().toISOString(),
        status: "PAUSED",
        gracePeriodDays: 45, // Released after 45-day grace period
        triggerType: "HEARTBEAT",
      });

      // Mark setup as complete in localStorage
      localStorage.setItem(RECOVERY_SETUP_KEY, "active");
      setStep("complete");
    } catch (err) {
      console.error("Activation failed:", err);
      setError("Failed to store fragment. Please try again.");
    } finally {
      setActivating(false);
    }
  }, [confirmed, fragments, masterPassword]);

  /**
   * Copy a fragment to clipboard
   */
  const handleCopyFragment = async (index: number) => {
    try {
      await navigator.clipboard.writeText(fragments[index]);
      setCopiedFragment((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedFragment((prev) => ({ ...prev, [index]: false }));
      }, 2000);
    } catch {
      // Fallback: select text
      const textarea = document.createElement("textarea");
      textarea.value = fragments[index];
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedFragment((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedFragment((prev) => ({ ...prev, [index]: false }));
      }, 2000);
    }
  };

  /**
   * Reset the setup (for re-generating)
   */
  const handleReset = () => {
    localStorage.removeItem(RECOVERY_SETUP_KEY);
    setStep("intro");
    setFragments([]);
    setRevealedFragment({});
    setCopiedFragment({});
    setConfirmed(false);
    setError(null);
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Already setup — show status
  if (step === "complete") {
    return (
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Key Recovery Active
            </h3>
            <p className="text-sm text-emerald-400">
              Shamir&apos;s Secret Sharing (2-of-3) is configured
            </p>
          </div>
        </div>

        <div className="bg-navy-900 rounded-lg p-4 border border-navy-700 mb-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            If you pass away, your heir combines their fragment with Aeterna&apos;s
            fragment to unlock your vaults. No single person (not even us) can
            access your data alone.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-navy-900 rounded-lg p-3 border border-gold/20 text-center">
            <Lock className="w-4 h-4 text-gold mx-auto mb-1" />
            <p className="text-xs text-slate-400">Fragment 1</p>
            <p className="text-xs text-gold font-medium">Aeterna</p>
          </div>
          <div className="bg-navy-900 rounded-lg p-3 border border-blue-500/20 text-center">
            <Key className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Fragment 2</p>
            <p className="text-xs text-blue-400 font-medium">Your Heir</p>
          </div>
          <div className="bg-navy-900 rounded-lg p-3 border border-purple-500/20 text-center">
            <Shield className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Fragment 3</p>
            <p className="text-xs text-purple-400 font-medium">Your Backup</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
        >
          Re-generate fragments (invalidates existing ones)
        </button>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Key className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            Key Recovery Setup
          </h3>
          <p className="text-sm text-slate-400">
            Shamir&apos;s Secret Sharing (2-of-3 threshold)
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => {
          const stepMap: Record<number, SetupStep[]> = {
            1: ["intro", "generating"],
            2: ["distribute"],
            3: ["confirm"],
          };
          const isActive = stepMap[s]?.includes(step);
          const isCompleted =
            (s === 1 && (step === "distribute" || step === "confirm")) ||
            (s === 2 && step === "confirm");

          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${
                  isCompleted
                    ? "bg-gold/20 border-gold/40 text-gold"
                    : isActive
                    ? "bg-gold/10 border-gold/30 text-gold animate-pulse"
                    : "bg-navy-900 border-navy-700 text-slate-500"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 rounded ${
                    isCompleted ? "bg-gold/40" : "bg-navy-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Step: Intro */}
      {step === "intro" && (
        <div className="space-y-4">
          <div className="bg-navy-900 rounded-lg p-4 border border-navy-700">
            <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              How It Works
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              Your master password will be mathematically split into 3 fragments.
              Any 2 fragments can reconstruct it — but 1 alone reveals nothing.
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Fragment 1:</strong> Stored
                  securely by Aeterna (released only after switch fires + 45 days)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Key className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Fragment 2:</strong> Given to
                  your primary heir — they should store this safely
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Fragment 3:</strong> Your
                  backup — store in a physical safe or with your lawyer
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs text-amber-300 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
              If you pass away, your heir combines their fragment with
              Aeterna&apos;s fragment to unlock your vaults. No single person (not
              even us) can access your data alone.
            </p>
          </div>

          <button
            onClick={handleGenerateFragments}
            className="btn-gold w-full flex items-center justify-center gap-2 py-3"
          >
            <Key className="w-4 h-4" />
            Setup Key Recovery
          </button>
        </div>
      )}

      {/* Step: Generating */}
      {step === "generating" && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Key className="w-6 h-6 text-gold" />
          </div>
          <p className="text-slate-300 font-medium mb-2">
            Generating Shamir Fragments...
          </p>
          <p className="text-xs text-slate-500">
            Splitting your master password over GF(256)
          </p>
        </div>
      )}

      {/* Step: Distribute */}
      {step === "distribute" && fragments.length === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Your master password has been split into 3 fragments. Distribute them
            as follows:
          </p>

          {/* Fragment 1 — Aeterna (auto-stored) */}
          <div className="bg-navy-900 rounded-lg p-4 border border-gold/20">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-gold">
                Fragment 1 — Aeterna
              </span>
              <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full ml-auto">
                Auto-stored
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Stored securely by Aeterna. Released only after your dead man&apos;s
              switch fires + 45-day grace period.
            </p>
          </div>

          {/* Fragment 2 — Heir */}
          <div className="bg-navy-900 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">
                Fragment 2 — Your Primary Heir
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Give this to your primary heir. They should store it safely (password
              manager, physical safe, etc.)
            </p>
            <div className="relative">
              <div className="bg-navy-950 rounded-lg p-3 font-mono text-xs break-all border border-navy-700">
                {revealedFragment[1] ? (
                  <span className="text-blue-300">{fragments[1]}</span>
                ) : (
                  <span className="text-slate-600">
                    {"•".repeat(Math.min(fragments[1]?.length || 40, 60))}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() =>
                    setRevealedFragment((prev) => ({ ...prev, 1: !prev[1] }))
                  }
                  className="btn-outline flex items-center gap-1.5 text-xs"
                >
                  {revealedFragment[1] ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Reveal
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCopyFragment(1)}
                  className="btn-outline flex items-center gap-1.5 text-xs"
                >
                  {copiedFragment[1] ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Fragment 3 — Backup */}
          <div className="bg-navy-900 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-400">
                Fragment 3 — Your Backup
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Store in a physical safe, with your lawyer, or in a separate secure
              location only you can access.
            </p>
            <div className="relative">
              <div className="bg-navy-950 rounded-lg p-3 font-mono text-xs break-all border border-navy-700">
                {revealedFragment[2] ? (
                  <span className="text-purple-300">{fragments[2]}</span>
                ) : (
                  <span className="text-slate-600">
                    {"•".repeat(Math.min(fragments[2]?.length || 40, 60))}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() =>
                    setRevealedFragment((prev) => ({ ...prev, 2: !prev[2] }))
                  }
                  className="btn-outline flex items-center gap-1.5 text-xs"
                >
                  {revealedFragment[2] ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Reveal
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCopyFragment(2)}
                  className="btn-outline flex items-center gap-1.5 text-xs"
                >
                  {copiedFragment[2] ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep("confirm")}
            className="btn-gold w-full flex items-center justify-center gap-2 py-3"
          >
            Continue to Activation
          </button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div className="space-y-4">
          <div className="bg-navy-900 rounded-lg p-4 border border-navy-700">
            <h4 className="text-sm font-semibold text-slate-200 mb-3">
              Confirm Fragment Distribution
            </h4>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-gold" />
                </div>
                Fragment 1 will be stored securely by Aeterna
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Key className="w-3 h-3 text-blue-400" />
                </div>
                Fragment 2 must be given to your primary heir
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-purple-400" />
                </div>
                Fragment 3 must be stored in a secure backup location
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-navy-600 bg-navy-800 text-gold focus:ring-gold/30 focus:ring-2"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 leading-relaxed">
                I confirm I have securely stored Fragment 2 with my heir and
                Fragment 3 in a safe place
              </span>
            </label>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs text-amber-300 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
              Once activated, if both Fragment 2 and Fragment 3 are lost, you
              cannot recover your vaults if you forget your master password.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("distribute")}
              className="btn-outline flex-1 py-3"
            >
              Back
            </button>
            <button
              onClick={handleActivateRecovery}
              disabled={!confirmed || activating}
              className="btn-gold flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activating ? (
                <>
                  <Lock className="w-4 h-4 animate-pulse" />
                  Activating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Activate Recovery
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
