import { useState, useEffect } from "react";
import {
  Trash2,
  Heart,
  Building,
  Globe,
  Timer,
  AlertTriangle,
  Check,
} from "lucide-react";
import { CharityPartners, type Charity } from "./CharityPartners";

type PolicyOption = "deletion" | "charity" | "community" | "memorial";
type UnclaimedPeriod = 30 | 45 | 60 | 90;

interface UnclaimedPolicyData {
  option: PolicyOption;
  period: UnclaimedPeriod;
  charityId: string | null;
  customCharityName: string;
  customCharityWallet: string;
  consentGiven: boolean;
}

const STORAGE_KEY = "aeterna_unclaimed_policy";

function loadPolicy(): UnclaimedPolicyData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore parse errors
  }
  return null;
}

function savePolicy(data: UnclaimedPolicyData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function UnclaimedPolicy() {
  const [selectedOption, setSelectedOption] = useState<PolicyOption>("deletion");
  const [period, setPeriod] = useState<UnclaimedPeriod>(45);
  const [selectedCharityId, setSelectedCharityId] = useState<string | null>(null);
  const [customCharityName, setCustomCharityName] = useState("");
  const [customCharityWallet, setCustomCharityWallet] = useState("");
  const [useCustomCharity, setUseCustomCharity] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<UnclaimedPolicyData | null>(null);

  // Load saved policy on mount
  useEffect(() => {
    const policy = loadPolicy();
    if (policy) {
      setCurrentPolicy(policy);
      setSelectedOption(policy.option);
      setPeriod(policy.period);
      setSelectedCharityId(policy.charityId);
      setCustomCharityName(policy.customCharityName);
      setCustomCharityWallet(policy.customCharityWallet);
      setConsentGiven(policy.consentGiven);
      if (policy.charityId === "custom") {
        setUseCustomCharity(true);
      }
    }
  }, []);

  const handleSave = () => {
    const policyData: UnclaimedPolicyData = {
      option: selectedOption,
      period,
      charityId: selectedOption === "charity" ? (useCustomCharity ? "custom" : selectedCharityId) : null,
      customCharityName: useCustomCharity ? customCharityName : "",
      customCharityWallet: useCustomCharity ? customCharityWallet : "",
      consentGiven,
    };

    savePolicy(policyData);
    setCurrentPolicy(policyData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCharitySelect = (charity: Charity) => {
    setUseCustomCharity(false);
    setSelectedCharityId(charity.id);
  };

  const getOptionLabel = (option: PolicyOption): string => {
    switch (option) {
      case "deletion":
        return "Permanent Deletion";
      case "charity":
        return "Donate to Charity";
      case "community":
        return "Aeterna Community Fund";
      case "memorial":
        return "Public Memorial";
    }
  };

  const canSave =
    consentGiven &&
    (selectedOption !== "charity" ||
      selectedCharityId !== null ||
      (useCustomCharity && customCharityName.trim() && customCharityWallet.trim()));

  const options: {
    id: PolicyOption;
    icon: typeof Trash2;
    title: string;
    description: string;
    borderColor: string;
    iconColor: string;
    bgColor: string;
  }[] = [
    {
      id: "deletion",
      icon: Trash2,
      title: "Permanent Deletion",
      description: "All vault data will be permanently destroyed. No recovery possible.",
      borderColor: "border-red-500/40",
      iconColor: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      id: "charity",
      icon: Heart,
      title: "Donate to Charity",
      description:
        "Crypto assets donated to your chosen charity. Aeterna facilitates the transfer (10% processing fee, 90% to charity).",
      borderColor: "border-emerald-500/40",
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      id: "community",
      icon: Building,
      title: "Aeterna Community Fund",
      description:
        "Contribute to digital literacy programs for underprivileged communities. You're making the internet a better place.",
      borderColor: "border-blue-500/40",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "memorial",
      icon: Globe,
      title: "Public Memorial",
      description:
        "Non-sensitive messages/time capsules are published as a public memorial page. Secrets are permanently deleted.",
      borderColor: "border-purple-500/40",
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Timer className="w-5 h-5 text-gold" />
          Unclaimed Estate Policy
        </h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          If your Dead Man's Switch fires and no beneficiary claims your assets within{" "}
          <span className="text-gold font-medium">{period} days</span>, what should happen?
        </p>
      </div>

      {/* Current Policy Status */}
      {currentPolicy && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-900/80 border border-navy-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-300">
            Your policy:{" "}
            <span className="font-medium text-slate-100">{getOptionLabel(currentPolicy.option)}</span>{" "}
            after <span className="font-medium text-gold">{currentPolicy.period} days</span>
          </span>
        </div>
      )}

      {/* Policy Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedOption(option.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? `${option.borderColor} ${option.bgColor}`
                  : "border-navy-700 bg-navy-800 hover:border-navy-600"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? option.bgColor : "bg-navy-700"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? option.iconColor : "text-slate-500"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-semibold ${
                        isSelected ? "text-slate-100" : "text-slate-300"
                      }`}
                    >
                      {option.title}
                    </h3>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-gold/20 border border-gold/50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gold" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Charity Picker (shown when 'charity' is selected) */}
      {selectedOption === "charity" && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Choose a Charity Partner</h3>
          <p className="text-xs text-slate-400 mb-3">
            90% of your crypto assets go directly to the selected charity. 10% processing fee covers gas
            fees and transfer facilitation.
          </p>

          <CharityPartners selectedCharityId={useCustomCharity ? null : selectedCharityId} onSelect={handleCharitySelect} />

          {/* Custom Charity Option */}
          <div className="mt-4 border-t border-navy-700 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomCharity}
                onChange={(e) => {
                  setUseCustomCharity(e.target.checked);
                  if (e.target.checked) setSelectedCharityId(null);
                }}
                className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-gold focus:ring-gold/30"
              />
              <span className="text-sm text-slate-300">Custom charity (enter details manually)</span>
            </label>

            {useCustomCharity && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Charity Name</label>
                  <input
                    type="text"
                    value={customCharityName}
                    onChange={(e) => setCustomCharityName(e.target.value)}
                    placeholder="e.g., Save the Children"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-navy-900 border border-navy-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Crypto Wallet Address</label>
                  <input
                    type="text"
                    value={customCharityWallet}
                    onChange={(e) => setCustomCharityWallet(e.target.value)}
                    placeholder="0x... or bc1..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-navy-900 border border-navy-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/50 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timer Configuration */}
      <div className="p-4 rounded-xl border border-navy-700 bg-navy-800">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold text-slate-200">Unclaimed period before action:</h3>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value) as UnclaimedPeriod)}
          className="w-full sm:w-auto px-4 py-2 text-sm rounded-lg bg-navy-900 border border-navy-700 text-slate-200 focus:outline-none focus:border-gold/50"
        >
          <option value={30}>30 days</option>
          <option value={45}>45 days (recommended)</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {/* Consent Checkbox */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-navy-600 bg-navy-800 text-gold focus:ring-gold/30"
          />
          <span className="text-sm text-slate-300 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 inline text-amber-400 mr-1" />
            I understand that after <span className="font-medium text-gold">{period} days</span> of no heir
            claiming my estate, the selected action will be taken automatically.{" "}
            <span className="text-red-400 font-medium">This is irreversible.</span>
          </span>
        </label>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Policy Saved!
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Policy
            </>
          )}
        </button>
        {saved && <span className="text-xs text-emerald-400">✓ Saved to your account</span>}
      </div>
    </div>
  );
}
