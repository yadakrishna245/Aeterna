import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { decryptData } from "../utils/crypto";
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
} from "lucide-react";
import { AddAssetModal } from "./AddAssetModal";

const client = generateClient<Schema>();

interface DashboardProps {
  user: { username: string; userId: string };
  masterPassword: string;
  signOut: () => void;
  onLock: () => void;
}

type VaultItem = Schema["Vault"]["type"];

export function Dashboard({ user, masterPassword, signOut, onLock }: DashboardProps) {
  const [vaults, setVaults] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [decryptedItems, setDecryptedItems] = useState<Record<string, string>>({});
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchVaults = useCallback(async () => {
    try {
      const { data } = await client.models.Vault.list();
      setVaults(data || []);
    } catch (err) {
      console.error("Failed to fetch vaults:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

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
    } catch (err) {
      console.error("Check-in failed:", err);
    } finally {
      setCheckingIn(false);
    }
  };

  // Decrypt a vault item
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
    } catch (err) {
      alert("Decryption failed. Wrong master password or corrupted data.");
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
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const daysLeft = getNextHeartbeatDays();
  const isUrgent = daysLeft !== null && daysLeft <= 3;

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
          </div>
          <div className="flex items-center gap-3">
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
        {/* Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                alert("Add at least one vault first to activate the Dead Man's Switch.");
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
            {vaults.map((vault) => (
              <div
                key={vault.id}
                className="card flex flex-col md:flex-row md:items-center gap-4 animate-slide-up"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-100 truncate">
                      {vault.assetName}
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
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {vault.heirEmail}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Every {vault.heartbeatIntervalDays} days
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
            ))}
          </div>
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
    </div>
  );
}
