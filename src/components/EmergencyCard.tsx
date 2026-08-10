import { useState, useRef, useCallback } from "react";
import { Shield, Printer, Download, Info } from "lucide-react";

interface EmergencyCardProps {
  userName: string;
  heirName?: string;
  heirEmail?: string;
}

/**
 * Generates a random 8-character alphanumeric claim code.
 */
function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  for (let i = 0; i < 8; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

export function EmergencyCard({ userName, heirName, heirEmail }: EmergencyCardProps) {
  const [claimCode] = useState(() => generateClaimCode());
  const [showBack, setShowBack] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(() => {
    // Trigger a screenshot hint — the user can use browser screenshot or OS tools
    const el = cardRef.current;
    if (!el) return;
    // Highlight the card visually for screenshot
    el.classList.add("ring-2", "ring-gold");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-gold");
    }, 3000);
    alert(
      "To save as image:\n• Windows: Win+Shift+S to screenshot the card\n• Mac: Cmd+Shift+4\n• Or right-click the card → Inspect → Screenshot node"
    );
  }, []);

  const displayHeirName = heirName || "[Heir Name]";
  const displayHeirEmail = heirEmail || "[heir@email.com]";
  const siteUrl = "aeterna.app/heir";

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-blue-300 font-medium mb-1">Emergency Wallet Card</p>
          <p className="text-xs text-slate-400">
            Print this card and keep it in your wallet next to your ID. If something happens to you,
            anyone who finds this card can notify your designated heir to claim your digital assets.
          </p>
        </div>
      </div>

      {/* Card Preview */}
      <div className="flex flex-col items-center gap-4">
        {/* Toggle Front/Back */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBack(false)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              !showBack
                ? "bg-gold/20 text-gold border border-gold/30"
                : "bg-navy-800 text-slate-400 border border-navy-700 hover:text-slate-200"
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setShowBack(true)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              showBack
                ? "bg-gold/20 text-gold border border-gold/30"
                : "bg-navy-800 text-slate-400 border border-navy-700 hover:text-slate-200"
            }`}
          >
            Back
          </button>
        </div>

        {/* The Card (3.5 x 2 inches = ~336 x 192px at 96dpi) */}
        <div
          ref={cardRef}
          id="emergency-card"
          className="emergency-card-container transition-all duration-300"
        >
          {!showBack ? (
            /* ─── FRONT ─── */
            <div className="emergency-card-front w-[336px] h-[192px] bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border-2 border-gold/60 rounded-lg p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
              {/* Gold corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gold/20 to-transparent" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-gold/10 to-transparent" />

              {/* Header */}
              <div className="flex items-center gap-2 relative z-10">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-[10px] font-bold tracking-wider text-gold uppercase">
                  Digital Estate — In Case of Emergency
                </span>
              </div>

              {/* Body */}
              <div className="relative z-10 space-y-1.5">
                <p className="text-[9px] text-slate-400">
                  If I am incapacitated or deceased, please visit:
                </p>
                <p className="text-xs font-mono font-bold text-slate-100 bg-navy-800/80 px-2 py-1 rounded border border-navy-700">
                  {siteUrl}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-slate-500">Designated Heir:</p>
                    <p className="text-[10px] text-slate-200 font-medium">
                      {displayHeirName} — {displayHeirEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500">Claim Code:</p>
                    <p className="text-[11px] font-mono font-bold text-gold tracking-wider">
                      {claimCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[8px] text-slate-600">Owner: {userName}</span>
                <span className="text-[8px] text-slate-600">Aeterna™</span>
              </div>
            </div>
          ) : (
            /* ─── BACK ─── */
            <div className="emergency-card-back w-[336px] h-[192px] bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border-2 border-gold/60 rounded-lg p-5 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
              {/* Subtle pattern */}
              <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(212,175,55,0.1)_10px,rgba(212,175,55,0.1)_20px)]" />

              <Shield className="w-6 h-6 text-gold/40 mb-2 relative z-10" />
              <p className="text-[10px] text-slate-300 leading-relaxed max-w-[280px] relative z-10">
                This person uses <span className="text-gold font-semibold">Aeterna</span> Digital
                Estate Planner. Their digital assets are encrypted and will be released to
                designated beneficiaries automatically.
              </p>
              <div className="mt-3 flex items-center gap-1.5 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[8px] text-emerald-400/80 uppercase tracking-wider font-medium">
                  Protected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePrint}
          className="btn-gold flex items-center gap-2 text-sm"
        >
          <Printer className="w-4 h-4" />
          Print Card
        </button>
        <button
          onClick={handleDownload}
          className="btn-outline flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          Download as Image
        </button>
      </div>

      {/* Print Styles (injected via style tag for @media print) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #emergency-card,
          #emergency-card * {
            visibility: visible !important;
          }
          #emergency-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 3.5in !important;
            height: 2in !important;
          }
          .emergency-card-front,
          .emergency-card-back {
            width: 3.5in !important;
            height: 2in !important;
          }
          @page {
            size: 3.5in 2in;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
