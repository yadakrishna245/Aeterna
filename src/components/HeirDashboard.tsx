import { useState } from "react";
import {
  Heart,
  Download,
  MessageCircle,
  Shield,
  FileText,
  Phone,
  ChevronDown,
  ChevronUp,
  Lock,
  Key,
  Globe,
  CreditCard,
  Mail,
  HardDrive,
  BookOpen,
  ExternalLink,
} from "lucide-react";

interface VaultItem {
  id: string;
  assetName: string;
  category: string;
  instructions?: string;
  twoFA?: { service: string; code: string }[];
}

interface Message {
  id: string;
  subject: string;
  body: string;
  date: string;
}

interface HeirDashboardProps {
  heirName: string;
  ownerName: string;
  vaults: VaultItem[];
  messages: Message[];
}

/** Map vault category to an icon component */
function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case "email":
      return <Mail className="w-5 h-5 text-blue-400" />;
    case "finance":
    case "banking":
      return <CreditCard className="w-5 h-5 text-emerald-400" />;
    case "social":
      return <Globe className="w-5 h-5 text-purple-400" />;
    case "storage":
    case "cloud":
      return <HardDrive className="w-5 h-5 text-amber-400" />;
    case "crypto":
    case "wallet":
      return <Key className="w-5 h-5 text-gold" />;
    default:
      return <Lock className="w-5 h-5 text-slate-400" />;
  }
}

export function HeirDashboard({ heirName, ownerName, vaults, messages }: HeirDashboardProps) {
  const [expandedVault, setExpandedVault] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  const twoFAItems = vaults.filter((v) => v.twoFA && v.twoFA.length > 0);

  const toggleVault = (id: string) => {
    setExpandedVault(expandedVault === id ? null : id);
  };

  const toggleMessage = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  const handleDownloadAll = () => {
    // In a real implementation, this would trigger an encrypted file download
    alert("Downloading encrypted estate archive...");
  };

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="border-b border-navy-800/60 bg-navy-900/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-gold" />
            <span className="text-xl font-bold text-slate-100">Aeterna</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mb-2">
            You've been designated as a Digital Estate Recipient
          </h1>
          <p className="text-sm text-slate-400">
            This portal contains digital assets prepared for you with care.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Intro Card */}
        <div className="rounded-2xl border border-gold/20 bg-navy-900/50 p-8 text-center">
          <Heart className="w-10 h-10 text-gold/80 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-slate-100 mb-3">
            Dear {heirName},
          </h2>
          <p className="text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            {ownerName} has prepared these digital assets for you. Take your time.
            There is no rush. Everything here has been organized to make this process
            as simple as possible for you.
          </p>
        </div>

        {/* Released Vaults */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-slate-100">Released Vaults</h2>
            <span className="text-xs bg-navy-800 text-slate-400 px-2 py-0.5 rounded-full">
              {vaults.length} {vaults.length === 1 ? "item" : "items"}
            </span>
          </div>

          {vaults.length === 0 ? (
            <div className="rounded-xl border border-navy-800/60 bg-navy-900/30 p-8 text-center">
              <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">No vault items have been released yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vaults.map((vault) => (
                <div
                  key={vault.id}
                  className="rounded-xl border border-navy-800/60 bg-navy-900/30 overflow-hidden transition-all"
                >
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-navy-800/50 border border-navy-700/50 flex items-center justify-center">
                        {getCategoryIcon(vault.category)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-100 text-base">{vault.assetName}</h3>
                        <p className="text-xs text-slate-500 capitalize">{vault.category || "General"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleVault(vault.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 text-gold border border-gold/20 text-sm font-medium hover:bg-gold/20 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      {expandedVault === vault.id ? "Hide" : "View Instructions"}
                      {expandedVault === vault.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {expandedVault === vault.id && vault.instructions && (
                    <div className="border-t border-navy-800/40 p-5 bg-navy-950/50">
                      <p className="text-xs text-gold mb-3 font-medium uppercase tracking-wide">
                        Step-by-step access instructions
                      </p>
                      <div className="space-y-2">
                        {vault.instructions.split("\n").map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                              {i + 1}
                            </span>
                            <p className="text-sm text-slate-300 pt-0.5">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Messages Section */}
        {messages.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-slate-100">Personal Messages</h2>
            </div>

            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-navy-800/60 bg-navy-900/30 overflow-hidden"
                >
                  <button
                    onClick={() => toggleMessage(message.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-navy-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-rose-400/70" />
                      <div>
                        <h3 className="font-medium text-slate-100">{message.subject}</h3>
                        <p className="text-xs text-slate-500">{message.date}</p>
                      </div>
                    </div>
                    {expandedMessage === message.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedMessage === message.id && (
                    <div className="border-t border-navy-800/40 p-5 bg-navy-950/50">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {message.body}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2FA Recovery Section */}
        {twoFAItems.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-slate-100">2FA Recovery Codes</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              These are two-factor authentication codes needed to access certain accounts.
              Keep them safe and use them only when prompted during login.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {twoFAItems.map((vault) =>
                vault.twoFA!.map((entry, idx) => (
                  <div
                    key={`${vault.id}-${idx}`}
                    className="rounded-xl border border-navy-800/60 bg-navy-900/30 p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-slate-100">{entry.service}</span>
                    </div>
                    <code className="block bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 text-sm font-mono text-gold select-all">
                      {entry.code}
                    </code>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Service Guides */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-slate-100">Service Guides</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Helpful guides for managing or closing the digital services in these vaults.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "Google Account", desc: "How to access or memorialize a Google account" },
              { name: "Social Media", desc: "Steps to memorialize or close social accounts" },
              { name: "Banking & Finance", desc: "How to handle online banking and investments" },
              { name: "Cryptocurrency", desc: "Accessing crypto wallets and exchanges" },
              { name: "Email Accounts", desc: "Forwarding or archiving email accounts" },
              { name: "Cloud Storage", desc: "Downloading and preserving cloud files" },
            ].map((guide) => (
              <div
                key={guide.name}
                className="rounded-xl border border-navy-800/60 bg-navy-900/30 p-4 flex items-start gap-3 hover:border-gold/20 transition-colors cursor-pointer"
              >
                <FileText className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-slate-200">{guide.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{guide.desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* Support Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-slate-100">Support & Resources</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            You don't have to go through this alone. Here are resources that may help.
          </p>

          <div className="rounded-xl border border-navy-800/60 bg-navy-900/30 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-200">Crisis Helpline</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  If you need someone to talk to:{" "}
                  <span className="text-emerald-400 font-medium">988 (Suicide & Crisis Lifeline)</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-200">Grief Support</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  <a href="https://www.grief.com" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                    grief.com
                  </a>{" "}
                  — Resources for navigating loss and grief
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-200">GriefNet</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  <a href="https://www.griefnet.org" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                    griefnet.org
                  </a>{" "}
                  — Online support communities for bereaved individuals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-200">Digital Estate Help</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  If you need help managing digital accounts, consult with an estate attorney
                  who specializes in digital assets.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Download All */}
        <section className="text-center py-6">
          <button
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gold/10 text-gold border border-gold/20 font-medium text-base hover:bg-gold/20 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download All Released Data (Encrypted)
          </button>
          <p className="text-xs text-slate-500 mt-3">
            Downloads an encrypted archive of all released vault data. You'll need the provided decryption key to access it.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-navy-800/40">
          <p className="text-xs text-slate-600">
            Aeterna — Digital Estate Planner
          </p>
          <p className="text-xs text-slate-700 mt-1">
            This portal was created with love and forethought.
          </p>
        </footer>
      </main>
    </div>
  );
}
