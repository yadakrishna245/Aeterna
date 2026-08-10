import { useState, useCallback } from "react";
import {
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  Save,
  AlertTriangle,
  Clock,
  Link,
  Shield,
  BookOpen,
  Mail,
  Smartphone,
  CreditCard,
  Tv,
  Building2,
  Home,
  Bitcoin,
} from "lucide-react";
import {
  SERVICE_GUIDES,
  SERVICE_CATEGORIES,
  type ServiceCategory,
  type ServiceGuide,
} from "../data/serviceGuides";
import { encryptData } from "../utils/crypto";

interface GriefAssistantProps {
  masterPassword: string;
  mode: "owner" | "preview";
}

// --- Wizard Step Types ---

interface WizardStep {
  id: string;
  question: string;
  type: "multiselect" | "yesno" | "yesno-expand";
  options?: { id: string; label: string; icon?: string }[];
  expandOptions?: { id: string; label: string }[];
  category: ServiceCategory;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "email",
    question: "What email providers do you use?",
    type: "multiselect",
    options: [
      { id: "google", label: "Gmail / Google", icon: "📧" },
      { id: "apple", label: "Apple iCloud", icon: "🍎" },
      { id: "microsoft", label: "Outlook / Microsoft", icon: "💻" },
      { id: "yahoo", label: "Yahoo Mail", icon: "📨" },
      { id: "protonmail", label: "ProtonMail", icon: "🔒" },
    ],
    category: "email",
  },
  {
    id: "crypto",
    question: "Do you have crypto wallets or exchange accounts?",
    type: "yesno-expand",
    expandOptions: [
      { id: "binance", label: "Binance" },
      { id: "coinbase", label: "Coinbase" },
    ],
    category: "crypto",
  },
  {
    id: "social",
    question: "What social media accounts do you have?",
    type: "multiselect",
    options: [
      { id: "facebook", label: "Facebook", icon: "👤" },
      { id: "instagram", label: "Instagram", icon: "📸" },
      { id: "twitter", label: "Twitter / X", icon: "🐦" },
      { id: "whatsapp", label: "WhatsApp", icon: "💬" },
      { id: "telegram", label: "Telegram", icon: "✈️" },
    ],
    category: "social",
  },
  {
    id: "smart_home",
    question: "Do you have smart home devices?",
    type: "yesno-expand",
    expandOptions: [
      { id: "smart_home_generic", label: "Smart Home Devices (Alexa, Google Home, Ring, etc.)" },
    ],
    category: "smartHome",
  },
  {
    id: "finance",
    question: "Any online banking or investments?",
    type: "yesno-expand",
    expandOptions: [
      { id: "paypal", label: "PayPal" },
      { id: "bank_generic", label: "Bank Accounts" },
    ],
    category: "finance",
  },
  {
    id: "subscriptions",
    question: "Any subscriptions to cancel?",
    type: "multiselect",
    options: [
      { id: "netflix", label: "Netflix", icon: "🎬" },
      { id: "spotify", label: "Spotify", icon: "🎵" },
      { id: "amazon", label: "Amazon / Prime", icon: "📦" },
    ],
    category: "subscriptions",
  },
  {
    id: "business",
    question: "Do you have a business with digital assets?",
    type: "yesno",
    category: "business",
  },
];

// --- Helper: get icon for category ---
function getCategoryIcon(category: ServiceCategory) {
  switch (category) {
    case "email":
      return <Mail className="w-4 h-4" />;
    case "social":
      return <Smartphone className="w-4 h-4" />;
    case "finance":
      return <CreditCard className="w-4 h-4" />;
    case "crypto":
      return <Bitcoin className="w-4 h-4" />;
    case "smartHome":
      return <Home className="w-4 h-4" />;
    case "subscriptions":
      return <Tv className="w-4 h-4" />;
    case "business":
      return <Building2 className="w-4 h-4" />;
  }
}

// --- Main Component ---

export function GriefAssistant({ masterPassword, mode }: GriefAssistantProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [yesNoAnswers, setYesNoAnswers] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(mode === "preview");

  // Toggle selection for multiselect
  const toggleSelection = (stepId: string, optionId: string) => {
    setSelections((prev) => {
      const current = prev[stepId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [stepId]: current.filter((id) => id !== optionId) };
      }
      return { ...prev, [stepId]: [...current, optionId] };
    });
  };

  // Handle yes/no answers
  const handleYesNo = (stepId: string, value: boolean) => {
    setYesNoAnswers((prev) => ({ ...prev, [stepId]: value }));
    if (value) {
      // Auto-select all expand options
      const step = WIZARD_STEPS.find((s) => s.id === stepId);
      if (step?.expandOptions) {
        setSelections((prev) => ({
          ...prev,
          [stepId]: step.expandOptions!.map((o) => o.id),
        }));
      }
    } else {
      setSelections((prev) => ({ ...prev, [stepId]: [] }));
    }
  };

  // Get all selected service IDs
  const getSelectedServiceIds = useCallback((): string[] => {
    const ids: string[] = [];
    for (const stepId of Object.keys(selections)) {
      ids.push(...selections[stepId]);
    }
    return ids;
  }, [selections]);

  // Get selected guides
  const getSelectedGuides = useCallback((): ServiceGuide[] => {
    const ids = getSelectedServiceIds();
    return SERVICE_GUIDES.filter((g) => ids.includes(g.id));
  }, [getSelectedServiceIds]);

  // Navigate
  const goNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCompleted(true);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  // Save guide as encrypted vault entry
  const handleSave = async () => {
    setSaving(true);
    try {
      const guides = getSelectedGuides();
      const guideData = JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          services: guides.map((g) => ({
            id: g.id,
            name: g.name,
            category: g.category,
            steps: g.steps,
            needs: g.needs,
            warning: g.warning,
            officialUrl: g.officialUrl,
            estimatedTime: g.estimatedTime,
          })),
        },
        null,
        2
      );

      // Encrypt the guide
      const encrypted = await encryptData(guideData, masterPassword);

      // Store in localStorage as a digital access guide
      const existingRaw = localStorage.getItem("aeterna_grief_guide");
      const entry = {
        encryptedGuide: JSON.stringify(encrypted),
        createdAt: new Date().toISOString(),
        serviceCount: guides.length,
      };
      localStorage.setItem("aeterna_grief_guide", JSON.stringify(entry));

      // If there was existing data, keep as backup
      if (existingRaw) {
        localStorage.setItem("aeterna_grief_guide_backup", existingRaw);
      }

      setSaved(true);
    } catch (err) {
      console.error("Failed to save grief guide:", err);
    } finally {
      setSaving(false);
    }
  };

  // --- OWNER MODE: Wizard UI ---
  if (!showPreview && !completed) {
    const step = WIZARD_STEPS[currentStep];
    const stepSelections = selections[step.id] || [];

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Digital Access Guide</h2>
            <p className="text-xs text-slate-400">
              Build a comprehensive access guide for your heirs. Select the services you use and we'll generate step-by-step recovery instructions.
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1">
          {WIZARD_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx < currentStep
                  ? "bg-gold"
                  : idx === currentStep
                  ? "bg-gold/60"
                  : "bg-navy-700"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </p>

        {/* Chat Bubble */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0 mt-1">
            <MessageCircle className="w-4 h-4 text-gold" />
          </div>
          <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-tl-sm px-5 py-4 max-w-lg">
            <p className="text-slate-100 font-medium">{step.question}</p>
            <p className="text-xs text-slate-400 mt-1">
              {step.type === "multiselect"
                ? "Select all that apply"
                : step.type === "yesno-expand"
                ? "If yes, specific recovery guides will be included"
                : "This helps tailor your guide"}
            </p>
          </div>
        </div>

        {/* Answer Area */}
        <div className="ml-11 space-y-2">
          {step.type === "multiselect" && step.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {step.options.map((opt) => {
                const isSelected = stepSelections.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleSelection(step.id, opt.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "bg-gold/10 border-gold/40 text-slate-100"
                        : "bg-navy-900 border-navy-700 text-slate-300 hover:border-navy-600"
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-gold ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}

          {step.type === "yesno" && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleYesNo(step.id, true);
                  goNext();
                }}
                className="px-6 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold font-medium hover:bg-gold/20 transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  handleYesNo(step.id, false);
                  goNext();
                }}
                className="px-6 py-3 rounded-xl bg-navy-800 border border-navy-700 text-slate-300 font-medium hover:border-navy-600 transition-all"
              >
                No
              </button>
            </div>
          )}

          {step.type === "yesno-expand" && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => handleYesNo(step.id, true)}
                  className={`px-6 py-3 rounded-xl border font-medium transition-all ${
                    yesNoAnswers[step.id] === true
                      ? "bg-gold/10 border-gold/30 text-gold"
                      : "bg-navy-900 border-navy-700 text-slate-300 hover:border-navy-600"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleYesNo(step.id, false)}
                  className={`px-6 py-3 rounded-xl border font-medium transition-all ${
                    yesNoAnswers[step.id] === false
                      ? "bg-gold/10 border-gold/30 text-gold"
                      : "bg-navy-900 border-navy-700 text-slate-300 hover:border-navy-600"
                  }`}
                >
                  No
                </button>
              </div>

              {yesNoAnswers[step.id] && step.expandOptions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                  {step.expandOptions.map((opt) => {
                    const isSelected = stepSelections.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleSelection(step.id, opt.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                          isSelected
                            ? "bg-gold/10 border-gold/40 text-slate-100"
                            : "bg-navy-900 border-navy-700 text-slate-300 hover:border-navy-600"
                        }`}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-gold ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="ml-11 flex items-center justify-between pt-4">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step.type !== "yesno" && (
            <button onClick={goNext} className="btn-gold flex items-center gap-2 text-sm">
              {currentStep === WIZARD_STEPS.length - 1 ? "Generate Guide" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- COMPLETED: Show summary + save ---
  if (completed && !showPreview) {
    const guides = getSelectedGuides();

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Guide Generated!</h2>
            <p className="text-xs text-slate-400">
              {guides.length} service{guides.length !== 1 ? "s" : ""} — ready to save &amp; encrypt
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-4 space-y-3">
          <p className="text-sm text-slate-300">
            Your personalized heir access guide covers:
          </p>
          <div className="flex flex-wrap gap-2">
            {guides.map((g) => (
              <span
                key={g.id}
                className="text-xs bg-navy-900 border border-navy-700 px-3 py-1.5 rounded-full text-slate-300"
              >
                {g.icon} {g.name}
              </span>
            ))}
          </div>
          {guides.length === 0 && (
            <p className="text-sm text-slate-500 italic">
              No services selected. Go back to select services.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || saved || guides.length === 0}
            className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Shield className="w-4 h-4 animate-pulse" />
                Encrypting &amp; Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved &amp; Encrypted
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save &amp; Encrypt Guide
              </>
            )}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            disabled={guides.length === 0}
            className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Preview Heir View
          </button>
          <button
            onClick={() => {
              setCompleted(false);
              setCurrentStep(0);
            }}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Start Over
          </button>
        </div>

        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-300 font-medium">Guide encrypted and saved</p>
              <p className="text-xs text-slate-400 mt-1">
                Your heir access guide is stored with AES-256 encryption. Only your master password can decrypt it.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- PREVIEW MODE (what heirs will see) ---
  const guides = getSelectedGuides();
  const categories = Object.entries(SERVICE_CATEGORIES).filter(([cat]) =>
    guides.some((g) => g.category === cat)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Heir Access Guide</h2>
            <p className="text-xs text-slate-400">
              {mode === "preview"
                ? "This is what your heirs will see"
                : "Preview — organized by category for easy navigation"}
            </p>
          </div>
        </div>
        {mode === "owner" && (
          <button
            onClick={() => setShowPreview(false)}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Setup
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-300 font-medium">
            Important: Gather documents first
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Most platforms require a death certificate and proof of executor/family status.
            Have certified copies ready before contacting any service.
          </p>
        </div>
      </div>

      {/* Category Sections */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No services selected yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            Complete the setup wizard to generate your guide.
          </p>
        </div>
      ) : (
        categories.map(([cat, meta]) => {
          const categoryGuides = guides.filter((g) => g.category === cat);
          return (
            <div key={cat} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center gap-2 pb-1 border-b border-navy-800">
                {getCategoryIcon(cat as ServiceCategory)}
                <h3 className="text-md font-semibold text-slate-200">
                  {meta.emoji} {meta.label}
                </h3>
                <span className="text-xs text-slate-500">
                  ({categoryGuides.length} service{categoryGuides.length !== 1 ? "s" : ""})
                </span>
              </div>

              {/* Service Cards */}
              {categoryGuides.map((guide) => (
                <ServiceCard key={guide.id} guide={guide} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

// --- Service Card Component ---

function ServiceCard({ guide }: { guide: ServiceGuide }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-navy-800/50 border border-navy-700 rounded-xl overflow-hidden transition-all">
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-navy-800 transition-colors"
      >
        <span className="text-xl">{guide.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-100">{guide.name}</h4>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {guide.estimatedTime}
            </span>
            {guide.officialUrl && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Link className="w-3 h-3" />
                Official guide available
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 animate-fade-in border-t border-navy-700 pt-4">
          {/* Steps */}
          <div>
            <h5 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">
              Recovery Steps
            </h5>
            <ol className="space-y-2">
              {guide.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs text-gold font-medium shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* What You'll Need */}
          <div>
            <h5 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              What You'll Need
            </h5>
            <ul className="space-y-1.5">
              {guide.needs.map((need, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  {need}
                </li>
              ))}
            </ul>
          </div>

          {/* Warning */}
          {guide.warning && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">{guide.warning}</p>
            </div>
          )}

          {/* Official URL */}
          {guide.officialUrl && (
            <a
              href={guide.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Link className="w-3 h-3" />
              Official Platform Guide →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
