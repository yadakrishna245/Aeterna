import { useState, useEffect } from "react";
import { AlertTriangle, Shield, EyeOff, Lock, Eye, Mail, Trash2, CheckCircle } from "lucide-react";
import {
  isPanicModeEnabled,
  setupPanicMode,
  getPanicBehavior,
  getPanicAlertEmail,
  clearPanicMode,
  type PanicBehavior,
} from "../utils/panicMode";

export function PanicModeSetup() {
  const [enabled, setEnabled] = useState(false);
  const [duressPassword, setDuressPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [behavior, setBehavior] = useState<PanicBehavior>("empty");
  const [alertEmail, setAlertEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(isPanicModeEnabled());
    setBehavior(getPanicBehavior());
    setAlertEmail(getPanicAlertEmail());
  }, []);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (duressPassword.length < 8) {
      setError("Duress password must be at least 8 characters.");
      return;
    }

    if (duressPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (behavior === "alert" && !alertEmail.trim()) {
      setError("Emergency contact email is required for Silent Alert mode.");
      return;
    }

    setSaving(true);
    try {
      await setupPanicMode(duressPassword, behavior, behavior === "alert" ? alertEmail.trim() : "");
      setEnabled(true);
      setDuressPassword("");
      setConfirmPassword("");
      setSuccess("Panic mode configured successfully. Your duress PIN is active.");
    } catch {
      setError("Failed to save panic mode settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = () => {
    if (!confirm("Are you sure you want to disable Panic Mode? Your duress PIN will be removed.")) {
      return;
    }
    clearPanicMode();
    setEnabled(false);
    setDuressPassword("");
    setConfirmPassword("");
    setAlertEmail("");
    setBehavior("empty");
    setSuccess("Panic mode disabled.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-navy-700">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Panic Mode / Duress PIN</h2>
          <p className="text-sm text-slate-400">
            Coercion protection for extreme situations
          </p>
        </div>
        {enabled && (
          <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Active
          </span>
        )}
      </div>

      {/* Explanation */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200/80">
            If you are ever forced to reveal your password, enter the duress PIN instead.
            It shows a convincing fake vault while your real data stays hidden.
          </p>
        </div>
      </div>

      {/* Status */}
      {enabled && (
        <div className="p-4 bg-navy-800 border border-navy-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-slate-200">Panic Mode is Active</p>
              <p className="text-xs text-slate-400">
                Behavior: {behavior === "empty" ? "Show Empty Vault" : behavior === "decoy" ? "Show Decoy Vaults" : "Show & Silent Alert"}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisable}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Disable
          </button>
        </div>
      )}

      {/* Configuration Form */}
      <div className="space-y-5">
        {/* Duress Password */}
        <div>
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mb-2">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            {enabled ? "Update Duress Password" : "Set Duress Password"}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={duressPassword}
              onChange={(e) => {
                setDuressPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter duress password (min 8 characters)..."
              className="input-field pr-10"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Must be different from your master password. Min 8 characters.
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mb-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Confirm Duress Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            placeholder="Re-enter duress password..."
            className="input-field"
            autoComplete="off"
          />
        </div>

        {/* Decoy Behavior */}
        <div>
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mb-3">
            <Shield className="w-3.5 h-3.5 text-gold" />
            Decoy Behavior
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-navy-800 border border-navy-700 rounded-lg cursor-pointer hover:border-navy-600 transition-colors">
              <input
                type="radio"
                name="behavior"
                value="empty"
                checked={behavior === "empty"}
                onChange={() => setBehavior("empty")}
                className="text-gold focus:ring-gold"
              />
              <div>
                <p className="text-sm text-slate-200">Show Empty Vault</p>
                <p className="text-xs text-slate-500">Displays an empty vault with no data</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-navy-800 border border-navy-700 rounded-lg cursor-pointer hover:border-navy-600 transition-colors">
              <input
                type="radio"
                name="behavior"
                value="decoy"
                checked={behavior === "decoy"}
                onChange={() => setBehavior("decoy")}
                className="text-gold focus:ring-gold"
              />
              <div>
                <p className="text-sm text-slate-200">Show Decoy Vaults</p>
                <p className="text-xs text-slate-500">Displays fake vault entries that look convincing</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-navy-800 border border-navy-700 rounded-lg cursor-pointer hover:border-navy-600 transition-colors">
              <input
                type="radio"
                name="behavior"
                value="alert"
                checked={behavior === "alert"}
                onChange={() => setBehavior("alert")}
                className="text-gold focus:ring-gold"
              />
              <div>
                <p className="text-sm text-slate-200">Show & Silent Alert</p>
                <p className="text-xs text-slate-500">Shows fake vault AND sends a silent distress signal to an emergency contact</p>
              </div>
            </label>
          </div>
        </div>

        {/* Alert Email (shown only for 'alert' behavior) */}
        {behavior === "alert" && (
          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mb-2">
              <Mail className="w-3.5 h-3.5 text-red-400" />
              Emergency Contact Email
            </label>
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="emergency@example.com"
              className="input-field"
            />
            <p className="text-xs text-slate-500 mt-1">
              A silent distress signal will be sent to this email when the duress PIN is used.
            </p>
          </div>
        )}

        {/* Error / Success Messages */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !duressPassword || !confirmPassword}
          className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shield className="w-4 h-4" />
          {saving ? "Saving..." : enabled ? "Update Panic Mode" : "Enable Panic Mode"}
        </button>
      </div>

      {/* Security Warning */}
      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 space-y-1">
            <p className="text-red-300 font-medium">Security Notice</p>
            <p>Your duress password is verified using PBKDF2 (600K iterations) with a random salt. Behavior settings are AES-256-GCM encrypted.</p>
            <p>Make sure your duress password is significantly different from your real master password to avoid accidental activation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
