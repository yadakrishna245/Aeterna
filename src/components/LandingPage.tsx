import {
  Shield,
  Lock,
  Video,
  Users,
  AlertTriangle,
  Vault,
  Bell,
  CheckCircle,
  ArrowRight,
  Bitcoin,
  KeyRound,
  Scale,
  ShieldCheck,
  Fingerprint,
  Server,
  Eye,
  Calendar,
  Zap,
  ChevronRight,
  Heart,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
}

export function LandingPage({ onGetStarted, onShowTerms, onShowPrivacy }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-navy-950/80 backdrop-blur-xl border-b border-navy-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-gold" />
            <span className="text-xl font-bold text-slate-100">Aeterna</span>
          </div>
          <button
            onClick={onGetStarted}
            className="btn-gold text-sm px-5 py-2.5"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05),transparent_50%)]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-8">
            <Lock className="w-3.5 h-3.5" />
            End-to-End Encrypted Digital Vault
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-100 leading-tight tracking-tight">
            Your Digital Life Shouldn't
            <br />
            <span className="text-gradient-gold">Die With You</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Billions in crypto lost forever. Accounts locked in limbo. Families
            left without access. Aeterna ensures your digital legacy reaches the
            right people, at the right time.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onGetStarted} className="btn-gold text-lg px-8 py-4 shadow-glow-lg">
              <Shield className="w-5 h-5 inline mr-2" />
              Protect Your Legacy
            </button>
            <a
              href="#how-it-works"
              className="btn-outline flex items-center gap-2"
            >
              See How It Works
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Free forever for up to 3 vaults · No credit card required
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 md:py-28 px-6 bg-navy-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
              The Problem Is <span className="text-red-400">Real</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Every day, digital wealth and memories vanish because there's no plan for what happens after.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="card group hover:border-gold/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <Bitcoin className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Lost Crypto</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Over $140 billion in Bitcoin alone is permanently inaccessible. Seeds, keys, and wallets buried with their owners.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card group hover:border-gold/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Locked Accounts</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Photos, emails, cloud files — all behind passwords no one else knows. Tech companies won't help without legal battles.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card group hover:border-gold/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Legal Nightmares</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Families spend months in court trying to access digital assets. The process is expensive, slow, and emotionally draining.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
              How <span className="text-gradient-gold">Aeterna</span> Works
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Four simple steps to ensure your digital legacy is protected forever.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 md:gap-0 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20" />

            {[
              { icon: Vault, label: "Vault", desc: "Store secrets, keys, messages, and files in encrypted vaults" },
              { icon: Bell, label: "Check-In", desc: "Regular check-ins confirm you're alive and well" },
              { icon: Fingerprint, label: "Verify", desc: "Missed check-ins trigger multi-step verification" },
              { icon: CheckCircle, label: "Release", desc: "Verified absence releases vaults to your beneficiaries" },
            ].map((step, i) => (
              <div key={step.label} className="relative flex flex-col items-center text-center px-4">
                <div className="w-24 h-24 rounded-2xl bg-navy-800 border border-gold/20 flex items-center justify-center mb-5 relative z-10 shadow-glow">
                  <step.icon className="w-10 h-10 text-gold" />
                </div>
                <span className="text-xs font-mono text-gold/60 mb-1">STEP {i + 1}</span>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{step.label}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                {/* Arrow between steps (mobile) */}
                {i < 3 && (
                  <ArrowRight className="w-5 h-5 text-gold/30 mt-4 md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28 px-6 bg-navy-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
              Built for <span className="text-gradient-gold">Peace of Mind</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Enterprise-grade security with consumer-grade simplicity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "End-to-End Encrypted",
                desc: "Your data is encrypted on your device. We never see your secrets — not even our servers can read them.",
              },
              {
                icon: AlertTriangle,
                title: "Dead Man's Switch",
                desc: "Automated check-ins with customizable intervals. Miss too many? Verification protocols activate.",
              },
              {
                icon: Video,
                title: "Video Messages",
                desc: "Record personal video messages for your loved ones. Delivered only when the time comes.",
              },
              {
                icon: Users,
                title: "Multi-Beneficiary",
                desc: "Assign different vaults to different people. Your spouse, kids, business partner — each gets what's theirs.",
              },
              {
                icon: Eye,
                title: "Emergency Verification",
                desc: "Multi-step verification before any release: SMS, email, WhatsApp, and trusted contact confirmation.",
              },
              {
                icon: Calendar,
                title: "Scheduled Delivery",
                desc: "Set specific dates for vault delivery — birthdays, anniversaries, or any future milestone.",
              },
              {
                icon: Heart,
                title: "Charity Legacy",
                desc: "No heirs? Your digital assets can fund digital literacy programs instead of being lost forever.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="card group hover:border-gold/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
              Simple, Transparent <span className="text-gradient-gold">Pricing</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Start free. Upgrade when you need more protection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="card flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Free</h3>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-slate-100">₹0</span>
                  <span className="text-slate-500 ml-1">forever</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-6">
                {["3 encrypted vaults", "1 beneficiary", "Email dead man's switch", "AES-256 encryption"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="btn-outline w-full">
                Start Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="relative card flex flex-col border-gold/50 shadow-glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gold text-navy-950 text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Pro</h3>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-gold">₹499</span>
                  <span className="text-slate-500 ml-1">/year</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-6">
                {[
                  "Unlimited vaults",
                  "5 beneficiaries",
                  "1 GB encrypted storage",
                  "Video messages",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="btn-gold w-full">
                Get Pro
              </button>
            </div>

            {/* Family Tier */}
            <div className="card flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Family</h3>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-slate-100">₹999</span>
                  <span className="text-slate-500 ml-1">/year</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-6">
                {[
                  "Unlimited everything",
                  "Unlimited beneficiaries",
                  "SMS + WhatsApp alerts",
                  "Scheduled triggers",
                  "Family dashboard",
                  "Dedicated support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="btn-outline w-full">
                Get Family
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 md:py-28 px-6 bg-navy-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
              Security That's <span className="text-gradient-gold">Uncompromising</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Your secrets are encrypted before they leave your device. Even we can't access them.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "AES-256",
                desc: "Military-grade encryption used by governments and banks worldwide.",
              },
              {
                icon: Zap,
                title: "PBKDF2",
                desc: "600,000 iterations of key derivation to resist brute-force attacks.",
              },
              {
                icon: Server,
                title: "Client-Side Only",
                desc: "Encryption and decryption happen entirely on your device. Zero knowledge.",
              },
              {
                icon: Eye,
                title: "Open Architecture",
                desc: "Transparent security model. Our encryption approach is fully documented.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center px-4">
                <div className="w-14 h-14 rounded-xl bg-navy-800 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <Shield className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
            Start Protecting Your Legacy Today
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            It takes 2 minutes to set up. Your loved ones will thank you.
          </p>
          <button onClick={onGetStarted} className="btn-gold text-lg px-10 py-4 shadow-glow-lg">
            <Shield className="w-5 h-5 inline mr-2" />
            Protect Your Legacy — Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" />
            <span className="font-semibold text-slate-100">Aeterna</span>
            <span className="text-slate-500 text-sm ml-2">Your digital legacy, forever protected.</span>
          </div>
          <div className="flex items-center gap-4">
            {onShowTerms && (
              <button onClick={onShowTerms} className="text-sm text-slate-400 hover:text-gold transition-colors underline">
                Terms of Service
              </button>
            )}
            {onShowPrivacy && (
              <button onClick={onShowPrivacy} className="text-sm text-slate-400 hover:text-gold transition-colors underline">
                Privacy Policy
              </button>
            )}
            <p className="text-sm text-slate-500">
              © 2026 Aeterna. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
