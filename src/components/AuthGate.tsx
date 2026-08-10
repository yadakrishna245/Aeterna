import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { Dashboard } from "./Dashboard";
import { LandingPage } from "./LandingPage";

export function AuthGate() {
  const [showAuth, setShowAuth] = useState(false);

  if (!showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <MasterPasswordGate signOut={signOut!} user={user!} />
      )}
    </Authenticator>
  );
}

interface MasterPasswordGateProps {
  signOut: () => void;
  user: { username: string; userId: string };
}

function MasterPasswordGate({ signOut, user }: MasterPasswordGateProps) {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 8) {
      setError("Master password must be at least 8 characters.");
      return;
    }
    setMasterPassword(passwordInput);
    setPasswordInput("");
  };

  // If master password is set, show the Dashboard
  if (masterPassword) {
    return (
      <Dashboard
        user={user}
        masterPassword={masterPassword}
        signOut={signOut}
        onLock={() => setMasterPassword(null)}
      />
    );
  }

  // Master Password unlock screen
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <Shield className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Unlock Your Vault</h1>
          <p className="text-slate-400 text-sm mt-2">
            Enter your Master Password to decrypt your assets.
            <br />
            <span className="text-slate-500">This password never leaves your device.</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="card space-y-5">
          <div>
            <label htmlFor="master-password" className="label">
              <Lock className="w-3.5 h-3.5 inline mr-1.5" />
              Master Password
            </label>
            <div className="relative">
              <input
                id="master-password"
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setError("");
                }}
                placeholder="Enter your master password..."
                className="input-field pr-10"
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs mt-1.5">{error}</p>
            )}
          </div>

          <button type="submit" className="btn-gold w-full">
            <Lock className="w-4 h-4 inline mr-2" />
            Unlock Vault
          </button>

          <div className="flex items-center justify-between pt-2 border-t border-navy-700">
            <span className="text-xs text-slate-500">
              Signed in as {user.username}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </form>

        {/* Security notice */}
        <p className="text-center text-xs text-slate-600 mt-6">
          🔒 End-to-End Encrypted — Your data is encrypted before it leaves this device.
        </p>
      </div>
    </div>
  );
}
