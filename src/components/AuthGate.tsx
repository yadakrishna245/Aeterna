import { useState, useEffect, useRef } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Shield, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { Dashboard } from "./Dashboard";
import { LandingPage } from "./LandingPage";
import { PasswordStrength } from "./PasswordStrength";
import { checkIsPanicPassword } from "../utils/panicMode";
import { createPasswordVerification, verifyMasterPassword } from "../utils/crypto";
import type { EncryptedData } from "../utils/crypto";
import { TermsOfService } from "./TermsOfService";
import { PrivacyPolicy } from "./PrivacyPolicy";

const client = generateClient<Schema>();

const TERMS_ACCEPTED_KEY = "aeterna_terms_accepted";
const TERMS_VERSION = "2026-08-10";
const PRIVACY_VERSION = "2026-08-10";

export function AuthGate() {
  const [showAuth, setShowAuth] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (showTerms) {
    return <TermsOfService onBack={() => setShowTerms(false)} />;
  }

  if (showPrivacy) {
    return <PrivacyPolicy onBack={() => setShowPrivacy(false)} />;
  }

  if (!showAuth) {
    return (
      <LandingPage
        onGetStarted={() => setShowAuth(true)}
        onShowTerms={() => setShowTerms(true)}
        onShowPrivacy={() => setShowPrivacy(true)}
      />
    );
  }

  return (
    <div>
      {/* Terms Acceptance Banner - Always visible during auth */}
      <div className="bg-navy-900 border-b border-navy-800 px-4 py-3">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs text-slate-400">
            By creating an account, you agree to our{" "}
            <button
              onClick={() => setShowTerms(true)}
              className="text-gold hover:text-gold/80 underline transition-colors"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-gold hover:text-gold/80 underline transition-colors"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
      <Authenticator
        components={{
          SignUp: {
            Footer() {
              return (
                <div className="px-4 pb-4">
                  <div className="bg-navy-800 border border-navy-700 rounded-lg p-3 mt-2">
                    <p className="text-xs text-slate-300 text-center">
                      ✅ By signing up, I confirm that I have read and accept the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="text-gold hover:text-gold/80 underline font-medium"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={() => setShowPrivacy(true)}
                        className="text-gold hover:text-gold/80 underline font-medium"
                      >
                        Privacy Policy
                      </button>
                      , including all liability limitations and dispute resolution clauses.
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center mt-2">
                    Your acceptance is recorded with timestamp for legal purposes.
                  </p>
                </div>
              );
            },
          },
        }}
      >
        {({ signOut, user }) => (
          <MasterPasswordGate signOut={signOut!} user={user!} onShowTerms={() => setShowTerms(true)} onShowPrivacy={() => setShowPrivacy(true)} />
        )}
      </Authenticator>
    </div>
  );
}

interface MasterPasswordGateProps {
  signOut: () => void;
  user: { username: string; userId: string };
  onShowTerms: () => void;
  onShowPrivacy: () => void;
}

function MasterPasswordGate({ signOut, user, onShowTerms, onShowPrivacy }: MasterPasswordGateProps) {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const termsRecordedRef = useRef(false);
  const verificationTokenRef = useRef<EncryptedData | null>(null);

  // Load verification token from DynamoDB on mount
  useEffect(() => {
    async function loadVerification() {
      try {
        const { data: logs } = await client.models.ActivityLog.list({
          filter: { action: { eq: "MASTER_PASSWORD_SET" } },
        });
        if (logs && logs.length > 0) {
          // Parse the stored verification token
          const token = JSON.parse(logs[0].metadata || "{}") as EncryptedData;
          if (token.ciphertext && token.iv && token.salt) {
            verificationTokenRef.current = token;
          } else {
            setIsFirstTime(true);
          }
        } else {
          setIsFirstTime(true);
        }
      } catch (err) {
        console.error("[Aeterna] Failed to load password verification:", err);
        // If we can't load, check localStorage fallback
        const local = localStorage.getItem("aeterna_pw_verify");
        if (local) {
          try {
            verificationTokenRef.current = JSON.parse(local) as EncryptedData;
          } catch {
            setIsFirstTime(true);
          }
        } else {
          setIsFirstTime(true);
        }
      }
    }
    loadVerification();
  }, []);

  // Record terms acceptance to DynamoDB on first authenticated session
  useEffect(() => {
    if (termsRecordedRef.current) return;
    termsRecordedRef.current = true;

    const recordTermsAcceptance = async () => {
      const alreadyRecorded = localStorage.getItem(TERMS_ACCEPTED_KEY);
      if (alreadyRecorded) return;

      try {
        const { data: existingLogs } = await client.models.ActivityLog.list({
          filter: { action: { eq: "TERMS_ACCEPTED" } },
        });

        if (existingLogs && existingLogs.length > 0) {
          localStorage.setItem(TERMS_ACCEPTED_KEY, existingLogs[0].timestamp);
          return;
        }

        const timestamp = new Date().toISOString();
        await client.models.ActivityLog.create({
          action: "TERMS_ACCEPTED",
          timestamp,
          metadata: JSON.stringify({
            termsVersion: TERMS_VERSION,
            privacyVersion: PRIVACY_VERSION,
            userAgent: navigator.userAgent,
          }),
        });

        localStorage.setItem(TERMS_ACCEPTED_KEY, timestamp);
      } catch (err) {
        console.error("[Aeterna] Failed to record terms acceptance:", err);
        localStorage.setItem("aeterna_terms_pending", new Date().toISOString());
      }
    };

    recordTermsAcceptance();
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 8) {
      setError("Master password must be at least 8 characters.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      // FIRST TIME: Set the master password (create verification token)
      if (isFirstTime) {
        if (!confirmInput) {
          setVerifying(false);
          setError("Please confirm your master password below.");
          return;
        }
        if (passwordInput !== confirmInput) {
          setVerifying(false);
          setError("Passwords do not match. Please try again.");
          return;
        }

        // Create verification token and store in DynamoDB
        const token = await createPasswordVerification(passwordInput);
        verificationTokenRef.current = token;

        // Save to DynamoDB
        await client.models.ActivityLog.create({
          action: "MASTER_PASSWORD_SET",
          timestamp: new Date().toISOString(),
          metadata: JSON.stringify(token),
        });

        // Also save locally as fallback
        localStorage.setItem("aeterna_pw_verify", JSON.stringify(token));

        setMasterPassword(passwordInput);
        setPasswordInput("");
        setConfirmInput("");
        setVerifying(false);
        return;
      }

      // RETURNING USER: Verify the master password
      if (verificationTokenRef.current) {
        const isValid = await verifyMasterPassword(passwordInput, verificationTokenRef.current);
        if (!isValid) {
          setVerifying(false);
          setError("Wrong master password. Please try again.");
          setPasswordInput("");
          return;
        }
      }

      // Check if this is the panic/duress password
      const isPanic = await checkIsPanicPassword(passwordInput);
      if (isPanic) {
        setIsPanicMode(true);
      }

      setMasterPassword(passwordInput);
      setPasswordInput("");
    } catch (err) {
      setError("Verification failed. Please try again.");
      console.error("[Aeterna] Unlock error:", err);
    } finally {
      setVerifying(false);
    }
  };

  // If master password is set, show the Dashboard
  if (masterPassword) {
    return (
      <Dashboard
        user={user}
        masterPassword={masterPassword}
        signOut={signOut}
        onLock={() => {
          setMasterPassword(null);
          setIsPanicMode(false);
        }}
        isPanicMode={isPanicMode}
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
              {isFirstTime ? "Create Master Password" : "Master Password"}
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
                placeholder={isFirstTime ? "Create a strong master password..." : "Enter your master password..."}
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
            {isFirstTime && (
              <div className="mt-3">
                <label htmlFor="confirm-password" className="label">
                  <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                  Confirm Master Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmInput}
                  onChange={(e) => {
                    setConfirmInput(e.target.value);
                    setError("");
                  }}
                  placeholder="Re-enter your master password..."
                  className="input-field"
                  autoComplete="off"
                />
              </div>
            )}
            {error && (
              <p className="text-red-400 text-xs mt-1.5">{error}</p>
            )}
            <PasswordStrength password={passwordInput} />
            {isFirstTime && (
              <p className="text-amber-400/80 text-xs mt-2">
                ⚠️ This password cannot be recovered. If you forget it, your encrypted data is lost forever.
              </p>
            )}
          </div>

          <button type="submit" className="btn-gold w-full" disabled={verifying}>
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 inline mr-2" />
                {isFirstTime ? "Set Master Password" : "Unlock Vault"}
              </>
            )}
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
        <div className="text-center mt-3">
          <button onClick={onShowTerms} className="text-xs text-slate-500 hover:text-gold transition-colors mx-2 underline">
            Terms of Service
          </button>
          <span className="text-slate-700">|</span>
          <button onClick={onShowPrivacy} className="text-xs text-slate-500 hover:text-gold transition-colors mx-2 underline">
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}
