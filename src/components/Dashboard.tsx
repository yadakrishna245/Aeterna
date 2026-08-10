import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { decryptData } from "../utils/crypto";
import { exportVaultBackup } from "../utils/exportVault";
import { useAutoLock } from "../hooks/useAutoLock";
import { useToast } from "./Toast";
import {
  Shield,
  ShieldCheck,
  HeartPulse,
  Plus,
  Lock,
  LogOut,
  Clock,
  Mail,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Users,
  Calendar,
  Activity,
  Download,
  Timer,
  Key,
  MessageCircle,
  Sparkles,
  Watch,
  Wrench,
  CreditCard,
  Bell,
} from "lucide-react";
import { AddAssetModal } from "./AddAssetModal";
import { BeneficiaryManager } from "./BeneficiaryManager";
import { ActivityLog, logActivity } from "./ActivityLog";
import { GriefAssistant } from "./GriefAssistant";
import { TimeCapsule } from "./TimeCapsule";
import { TwoFAVault } from "./TwoFAVault";
import { EstateCalculator } from "./EstateCalculator";
import { SocialProofOfLife } from "./SocialProofOfLife";
import { LegalDocGenerator } from "./LegalDocGenerator";
import { PanicModeSetup } from "./PanicModeSetup";
import { HeirDashboard } from "./HeirDashboard";
import { SmartWatchConnect } from "./SmartWatchConnect";
import { KeyRecoverySetup } from "./KeyRecoverySetup";
import { EmergencyCard } from "./EmergencyCard";
import { TrustedContactSetup } from "./TrustedContactSetup";
import { UnclaimedPolicy } from "./UnclaimedPolicy";

const client = generateClient<Schema>();

interface DashboardProps {
  user: { username: string; userId: string };
  masterPassword: string;
  signOut: () => void;
  onLock: () => void;
  isPanicMode?: boolean;
}

type VaultItem = Schema["Vault"]["type"];

interface DecryptedVaultMeta {
  assetName: string;
  heirEmail: string;
}

export function Dashboard({ user, masterPassword, signOut, onLock, isPanicMode }: DashboardProps) {
  const [vaults, setVaults] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const [beneficiaryCount, setBeneficiaryCount] = useState(0);
  const [decryptedItems, setDecryptedItems] = useState<Record<string, string>>({});
  const [decryptedMeta, setDecryptedMeta] = useState<Record<string, DecryptedVaultMeta>>({});
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"vaults" | "activity" | "2fa" | "capsules" | "guide" | "devices" | "security" | "tools">("vaults");
  const [exportingBackup, setExportingBackup] = useState(false);
  const [showHeirPreview, setShowHeirPreview] = useState(false);

  const toast = useToast();

  // Auto-lock after 5 minutes of inactivity
  const { remainingSeconds } = useAutoLock({ onLock });

  /**
   * Decrypt the encrypted metadata fields (assetName, heirEmail) for display.
   * On failure (wrong password or corrupted data), shows '[Encrypted]' placeholder.
   */
  const decryptVaultMeta = useCallback(
    async (vault: VaultItem): Promise<DecryptedVaultMeta> => {
      let assetName = "[Encrypted]";
      let heirEmail = "[Encrypted]";

      try {
        const nameData = JSON.parse(vault.encryptedAssetName);
        assetName = await decryptData(nameData, masterPassword);
      } catch {
        // Failed to decrypt — show placeholder
      }

      try {
        const emailData = JSON.parse(vault.encryptedHeirEmail);
        heirEmail = await decryptData(emailData, masterPassword);
      } catch {
        // Failed to decrypt — show placeholder
      }

      return { assetName, heirEmail };
    },
    [masterPassword]
  );

  const fetchVaults = useCallback(async () => {
    try {
      const { data } = await client.models.Vault.list();
      const vaultData = data || [];
      setVaults(vaultData);

      // Decrypt all vault metadata for display
      const metaMap: Record<string, DecryptedVaultMeta> = {};
      await Promise.all(
        vaultData.map(async (vault) => {
          metaMap[vault.id] = await decryptVaultMeta(vault);
        })
      );
      setDecryptedMeta(metaMap);
    } catch (err) {
      console.error("Failed to fetch vaults:", err);
    } finally {
      setLoading(false);
    }
  }, [decryptVaultMeta]);

  // Fetch beneficiary count
  const fetchBeneficiaryCount = useCallback(async () => {
    try {
      const { data } = await (client.models as any).Beneficiary.list();
      setBeneficiaryCount(data?.length || 0);
    } catch {
      // Model may not exist yet
      setBeneficiaryCount(0);
    }
  }, []);

  useEffect(() => {
    fetchVaults();
    fetchBeneficiaryCount();
  }, [fetchVaults, fetchBeneficiaryCount]);

  // Calculate days until next heartbeat is required
  const getNextHeartbeatDays = () => {
    if (vaults.length === 0) return null;
    
    const activeVaults = vaults.filter((v) => v.status === "ACTIVE");
    if (activeVaults.length === 0) return null;

    let minDaysLeft = Infinity;
    for (const vault of activeVaults) {
      const lastBeat = new Date(vault.lastHeartbeat).getTime();
      const now = Date.now();
      const daysSince = (now - lastBeat) / (1000 * 60 * 60 * 24);
      const daysLeft = vault.heartbeatIntervalDays - daysSince;
      if (daysLeft < minDaysLeft) minDaysLeft = daysLeft;
    }

    return Math.max(0, Math.ceil(minDaysLeft));
  };

  // Check-in: update all active vaults' lastHeartbeat
  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const now = new Date().toISOString();
      const activeVaults = vaults.filter((v) => v.status === "ACTIVE");
      await Promise.all(
        activeVaults.map((vault) =>
          client.models.Vault.update({
            id: vault.id,
            lastHeartbeat: now,
          })
        )
      );
      await fetchVaults();
      await logActivity("CHECK_IN");

      // Calculate new days left for toast message
      const minInterval = Math.min(...activeVaults.map((v) => v.heartbeatIntervalDays));
      toast.success(`Heartbeat recorded! You're safe for ${minInterval} more days.`);
    } catch (err) {
      console.error("Check-in failed:", err);
      toast.error("Check-in failed. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  // Decrypt a vault item's secret payload
  const handleDecrypt = async (vault: VaultItem) => {
    if (decryptedItems[vault.id]) {
      // Toggle off
      setDecryptedItems((prev) => {
        const next = { ...prev };
        delete next[vault.id];
        return next;
      });
      return;
    }

    setDecryptingId(vault.id);
    try {
      const plaintext = await decryptData(
        {
          ciphertext: vault.encryptedPayload,
          iv: vault.iv,
          salt: vault.salt,
        },
        masterPassword
      );
      setDecryptedItems((prev) => ({ ...prev, [vault.id]: plaintext }));
      await logActivity("VAULT_DECRYPTED");
    } catch (err) {
      toast.error("Decryption failed. Wrong master password?");
      console.error(err);
    } finally {
      setDecryptingId(null);
    }
  };

  // Delete a vault
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This vault will be permanently deleted.")) return;
    try {
      await client.models.Vault.delete({ id });
      setVaults((prev) => prev.filter((v) => v.id !== id));
      setDecryptedItems((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDecryptedMeta((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Vault deleted successfully");
      await logActivity("VAULT_DELETED");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete vault. Please try again.");
    }
  };

  // Helper: get trigger type and grace period from vault (extended fields)
  const getVaultExtras = (vault: VaultItem) => {
    const extras = vault as any;
    return {
      triggerType: extras.triggerType || "heartbeat",
      scheduledDate: extras.scheduledDate || null,
      gracePeriodDays: extras.gracePeriodDays || 7,
    };
  };

  const daysLeft = getNextHeartbeatDays();
  const isUrgent = daysLeft !== null && daysLeft <= 3;

  // Export vault backup
  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const blob = await exportVaultBackup(vaults, masterPassword);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aeterna-backup-${new Date().toISOString().slice(0, 10)}.aeterna`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup exported! Store this file safely.");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed. Please try again.");
    } finally {
      setExportingBackup(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="border-b border-navy-800 bg-navy-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-gold" />
            <h1 className="text-xl font-bold text-slate-100">Aeterna</h1>
            <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/20">
              End-to-End Encrypted
            </span>
            {(() => {
              try {
                const policy = localStorage.getItem("aeterna_unclaimed_policy");
                if (policy) {
                  const parsed = JSON.parse(policy);
                  const labels: Record<string, string> = { deletion: "Delete", charity: "Donate", community: "Community", memorial: "Memorial" };
                  return (
                    <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                      Estate: {labels[parsed.option] || "Set"} · {parsed.period}d
                    </span>
                  );
                }
              } catch { /* ignore */ }
              return null;
            })()}
          </div>
          <div className="flex items-center gap-3">
            {remainingSeconds < 60 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full animate-pulse">
                <Timer className="w-3 h-3" />
                {remainingSeconds}s
              </span>
            )}
            <button
              onClick={() => setShowHeirPreview(true)}
              className="btn-outline flex items-center gap-2 text-sm"
              title="Preview what your heirs will see"
            >
              <Eye className="w-3.5 h-3.5" />
              Heir Preview
            </button>
            <button
              onClick={handleExportBackup}
              disabled={exportingBackup || vaults.length === 0}
              className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export encrypted backup"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={onLock}
              className="btn-outline flex items-center gap-2 text-sm"
              title="Lock vault"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>
            <button
              onClick={signOut}
              className="text-slate-400 hover:text-red-400 transition-colors p-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Panic Mode: Decoy View */}
        {isPanicMode ? (
          <>
            {/* Fake Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">System Status</p>
                  <p className="text-lg font-semibold text-emerald-400">Secure</p>
                </div>
              </div>

              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Next Heartbeat Due</p>
                  <p className="text-lg font-semibold text-slate-500">No active vaults</p>
                </div>
              </div>

              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Vaults</p>
                  <p className="text-lg font-semibold text-slate-100">0</p>
                </div>
              </div>

              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Beneficiaries</p>
                  <p className="text-lg font-semibold text-slate-100">0</p>
                </div>
              </div>
            </div>

            {/* Fake Empty Vault */}
            <div className="card text-center py-12">
              <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">No vaults yet.</p>
              <p className="text-sm text-slate-500">
                Add your first encrypted asset to get started.
              </p>
            </div>

            {/* Footer */}
            <footer className="text-center py-6 border-t border-navy-800 mt-8">
              <p className="text-xs text-slate-600">
                Aeterna v1.0 — Digital Estate Planner
              </p>
              <p className="text-xs text-slate-700 mt-1">
                Logged in as {user.username}
              </p>
            </footer>
          </>
        ) : (
        <>
        {/* Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* System Status */}
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">System Status</p>
              <p className="text-lg font-semibold text-emerald-400">Secure</p>
            </div>
          </div>

          {/* Heartbeat Countdown */}
          <div className={`card flex items-center gap-4 ${isUrgent ? "border-red-500/30" : ""}`}>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isUrgent
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-gold/10 border border-gold/20"
              }`}
            >
              <Clock className={`w-6 h-6 ${isUrgent ? "text-red-400" : "text-gold"}`} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Next Heartbeat Due</p>
              {daysLeft !== null ? (
                <p className={`text-lg font-semibold ${isUrgent ? "text-red-400" : "text-slate-100"}`}>
                  {daysLeft === 0 ? "TODAY!" : `${daysLeft} Day${daysLeft > 1 ? "s" : ""}`}
                </p>
              ) : (
                <p className="text-lg font-semibold text-slate-500">No active vaults</p>
              )}
            </div>
          </div>

          {/* Vault Count */}
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Vaults</p>
              <p className="text-lg font-semibold text-slate-100">{vaults.length}</p>
            </div>
          </div>

          {/* Beneficiary Count */}
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Beneficiaries</p>
              <p className="text-lg font-semibold text-slate-100">{beneficiaryCount}</p>
            </div>
          </div>
        </div>

        {/* Check-In Button */}
        <div className="card text-center py-8">
          <HeartPulse className="w-10 h-10 text-gold mx-auto mb-3 animate-pulse-slow" />
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Dead Man's Switch</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Press this button to confirm you're alive. If you miss a check-in, your encrypted
            vaults will be released to designated heirs.
          </p>
          <button
            onClick={() => {
              if (vaults.filter((v) => v.status === "ACTIVE").length === 0) {
                toast.warning("Add a vault first to activate Dead Man's Switch");
                return;
              }
              handleCheckIn();
            }}
            disabled={checkingIn}
            className="btn-gold text-lg px-10 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingIn ? (
              <>
                <RefreshCw className="w-5 h-5 inline mr-2 animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <HeartPulse className="w-5 h-5 inline mr-2" />
                I Am Alive (Check-In)
              </>
            )}
          </button>
        </div>

        {/* Beneficiaries Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-slate-100">Beneficiaries</h2>
              <span className="text-xs bg-navy-700 text-slate-400 px-2 py-0.5 rounded-full">
                {beneficiaryCount}
              </span>
            </div>
            <button
              onClick={() => setShowBeneficiaries(!showBeneficiaries)}
              className="btn-gold flex items-center gap-2 text-sm"
            >
              <Users className="w-4 h-4" />
              {showBeneficiaries ? "Hide" : "Manage Beneficiaries"}
            </button>
          </div>

          {!showBeneficiaries && (
            <p className="text-sm text-slate-400">
              Manage the people who will receive your encrypted assets. All personal data is encrypted client-side.
            </p>
          )}

          {showBeneficiaries && (
            <BeneficiaryManager masterPassword={masterPassword} />
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-navy-900 rounded-lg p-1 border border-navy-800">
          <button
            onClick={() => setActiveTab("vaults")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "vaults"
                ? "bg-navy-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-4 h-4" />
            Vaults
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "activity"
                ? "bg-navy-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            Activity
          </button>
          <button
            onClick={() => setActiveTab("2fa")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "2fa"
                ? "bg-navy-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            2FA Vault
          </button>
          <button
            onClick={() => setActiveTab("capsules")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "capsules"
                ? "bg-navy-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Time Capsules
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "guide"
                ? "bg-navy-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Guide
          </button>
          <button
            onClick={() => setActiveTab("devices")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "devices"
                ? "bg-navy-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Watch className="w-4 h-4" />
            Devices
          </button>
          {!isPanicMode && (
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "security"
                  ? "bg-navy-700 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              Security
            </button>
          )}
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "tools"
                ? "bg-navy-700 text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench className="w-4 h-4" />
            Tools
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "activity" ? (
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-slate-100">Activity History</h2>
            </div>
            <ActivityLog />
          </div>
        ) : activeTab === "2fa" ? (
          <div className="card">
            <TwoFAVault masterPassword={masterPassword} />
          </div>
        ) : activeTab === "capsules" ? (
          <TimeCapsule masterPassword={masterPassword} />
        ) : activeTab === "guide" ? (
          <div className="card">
            <GriefAssistant masterPassword={masterPassword} mode="owner" />
          </div>
        ) : activeTab === "devices" ? (
          <div className="space-y-6">
            <div className="card">
              <SmartWatchConnect onHeartbeatDetected={handleCheckIn} />
            </div>
            <div className="card">
              <SocialProofOfLife />
            </div>
          </div>
        ) : activeTab === "security" && !isPanicMode ? (
          <div className="space-y-6">
            {/* Key Recovery (Shamir's Secret Sharing) */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-5 h-5 text-gold" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    Key Recovery (Shamir&apos;s Secret Sharing)
                  </h2>
                  <p className="text-sm text-slate-400">
                    Split your master password so heirs can recover vaults without knowing it
                  </p>
                </div>
              </div>
              <KeyRecoverySetup masterPassword={masterPassword} />
            </div>
            <div className="card">
              <PanicModeSetup />
            </div>
            <div className="card">
              <UnclaimedPolicy />
            </div>
          </div>
        ) : activeTab === "tools" ? (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold text-slate-100">Emergency Wallet Card</h2>
              </div>
              <EmergencyCard
                userName={user.username}
              />
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold text-slate-100">Awareness Contacts</h2>
              </div>
              <TrustedContactSetup />
            </div>
            <div className="card">
              <EstateCalculator />
            </div>
            <div className="card">
              <LegalDocGenerator />
            </div>
          </div>
        ) : (
        <>
        {/* Vault List */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Your Vaults</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-gold flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-400">Loading vaults...</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="card text-center py-12">
            <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No vaults yet.</p>
            <p className="text-sm text-slate-500">
              Add your first encrypted asset to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vaults.map((vault) => {
              const meta = decryptedMeta[vault.id] || {
                assetName: "[Encrypted]",
                heirEmail: "[Encrypted]",
              };
              const extras = getVaultExtras(vault);

              return (
                <div
                  key={vault.id}
                  className="card flex flex-col md:flex-row md:items-center gap-4 animate-slide-up"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-100 truncate">
                        {meta.assetName}
                      </h3>
                      {vault.status === "TRIGGERED" && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Triggered
                        </span>
                      )}
                      {vault.status === "PAUSED" && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">
                          Paused
                        </span>
                      )}
                      {/* Trigger Type Badge */}
                      {extras.triggerType === "heartbeat" ? (
                        <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 flex items-center gap-0.5">
                          <HeartPulse className="w-2.5 h-2.5" />
                          Heartbeat
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          Scheduled: {extras.scheduledDate
                            ? new Date(extras.scheduledDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "TBD"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {meta.heirEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Every {vault.heartbeatIntervalDays} days
                      </span>
                      <span className="flex items-center gap-1 text-gold/70">
                        <Shield className="w-3 h-3" />
                        Grace: {extras.gracePeriodDays} days
                      </span>
                    </div>

                    {/* Decrypted content */}
                    {decryptedItems[vault.id] && (
                      <div className="mt-3 p-3 bg-navy-950 border border-gold/20 rounded-lg">
                        <p className="text-xs text-gold mb-1 font-medium">🔓 Decrypted Secret:</p>
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap break-all">
                          {decryptedItems[vault.id]}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDecrypt(vault)}
                      disabled={decryptingId === vault.id}
                      className="btn-outline flex items-center gap-1.5 text-xs"
                      title={decryptedItems[vault.id] ? "Hide secret" : "Decrypt & view"}
                    >
                      {decryptingId === vault.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : decryptedItems[vault.id] ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      {decryptedItems[vault.id] ? "Hide" : "Decrypt"}
                    </button>
                    <button
                      onClick={() => handleDelete(vault.id)}
                      className="btn-danger flex items-center gap-1.5 text-xs"
                      title="Delete vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}

        {/* Footer */}
        <footer className="text-center py-6 border-t border-navy-800 mt-8">
          <p className="text-xs text-slate-600">
            Aeterna v1.0 — Digital Estate Planner
          </p>
          <p className="text-xs text-slate-700 mt-1">
            Logged in as {user.username}
          </p>
        </footer>
        </>
        )}
      </main>

      {/* Add Asset Modal */}
      {showAddModal && (
        <AddAssetModal
          masterPassword={masterPassword}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchVaults();
          }}
        />
      )}

      {/* Heir Preview Overlay */}
      {showHeirPreview && (
        <div className="fixed inset-0 z-50 overflow-auto">
          {/* Preview Banner */}
          <div className="sticky top-0 z-60 bg-amber-500 text-navy-950 text-center py-2 px-4 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg">
            <Eye className="w-4 h-4" />
            PREVIEW MODE — This is what your heirs will see
            <button
              onClick={() => setShowHeirPreview(false)}
              className="ml-4 px-3 py-1 bg-navy-900 text-white rounded-md text-xs font-medium hover:bg-navy-800 transition-colors"
            >
              Close Preview
            </button>
          </div>

          {/* Heir Dashboard */}
          <HeirDashboard
            heirName="Your Beneficiary"
            ownerName={user.username}
            vaults={vaults.map((v) => ({
              id: v.id,
              assetName: decryptedMeta[v.id]?.assetName || "[Encrypted Asset]",
              category: (v as any).category || "general",
              instructions: "Log in to the account using the credentials below.\nNavigate to Settings > Security.\nUpdate the recovery email to your own.\nChange the password to secure the account.",
              twoFA: [],
            }))}
            messages={[
              {
                id: "sample-1",
                subject: "A message for you",
                body: "This is a preview of what personal messages will look like when delivered to your heirs. You can create time capsules in the Time Capsules tab.",
                date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
