import { useState, useEffect } from "react";
import {
  Bitcoin,
  Banknote,
  TrendingUp,
  Globe,
  Cloud,
  Users,
  CreditCard,
  Palette,
  Briefcase,
  Calculator,
  Star,
} from "lucide-react";

interface EstateCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: "currency" | "stars" | "subscription" | "followers";
  value: number;
  color: string;
}

const STORAGE_KEY = "aeterna-estate-values";

const STAR_VALUE_MAP: Record<number, number> = {
  1: 10000,
  2: 50000,
  3: 150000,
  4: 500000,
  5: 1000000,
};

export function EstateCalculator() {
  const [categories, setCategories] = useState<EstateCategory[]>([
    { id: "crypto", label: "Cryptocurrency", icon: <Bitcoin className="w-5 h-5" />, type: "currency", value: 0, color: "#f7931a" },
    { id: "banking", label: "Online Banking", icon: <Banknote className="w-5 h-5" />, type: "currency", value: 0, color: "#22c55e" },
    { id: "investments", label: "Investments/Stocks", icon: <TrendingUp className="w-5 h-5" />, type: "currency", value: 0, color: "#3b82f6" },
    { id: "domains", label: "Domain Names", icon: <Globe className="w-5 h-5" />, type: "currency", value: 0, color: "#8b5cf6" },
    { id: "cloud", label: "Cloud Storage", icon: <Cloud className="w-5 h-5" />, type: "stars", value: 0, color: "#06b6d4" },
    { id: "social", label: "Social Media Accounts", icon: <Users className="w-5 h-5" />, type: "followers", value: 0, color: "#ec4899" },
    { id: "subscriptions", label: "Subscriptions", icon: <CreditCard className="w-5 h-5" />, type: "subscription", value: 0, color: "#f59e0b" },
    { id: "nfts", label: "NFTs/Digital Art", icon: <Palette className="w-5 h-5" />, type: "currency", value: 0, color: "#ef4444" },
    { id: "business", label: "Business Digital Assets", icon: <Briefcase className="w-5 h-5" />, type: "currency", value: 0, color: "#14b8a6" },
  ]);

  const [subscriptionMonths, setSubscriptionMonths] = useState(12);
  const [starRating, setStarRating] = useState(3);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.categories) {
          setCategories((prev) =>
            prev.map((cat) => {
              const savedCat = parsed.categories.find((s: any) => s.id === cat.id);
              return savedCat ? { ...cat, value: savedCat.value } : cat;
            })
          );
        }
        if (parsed.subscriptionMonths) setSubscriptionMonths(parsed.subscriptionMonths);
        if (parsed.starRating) setStarRating(parsed.starRating);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  useEffect(() => {
    const data = {
      categories: categories.map((c) => ({ id: c.id, value: c.value })),
      subscriptionMonths,
      starRating,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [categories, subscriptionMonths, starRating]);

  const updateValue = (id: string, value: number) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, value } : cat))
    );
  };

  const getEffectiveValue = (cat: EstateCategory): number => {
    if (cat.id === "cloud") return STAR_VALUE_MAP[starRating] || 0;
    if (cat.id === "subscriptions") return cat.value * subscriptionMonths;
    if (cat.id === "social") return cat.value * 2;
    return cat.value;
  };

  const totalValue = categories.reduce((sum, cat) => sum + getEffectiveValue(cat), 0);

  const formatINR = (value: number): string => {
    if (value === 0) return "\u20B90";
    return "\u20B9" + value.toLocaleString("en-IN");
  };

  const pieSegments = categories
    .map((cat) => ({ ...cat, effectiveValue: getEffectiveValue(cat) }))
    .filter((cat) => cat.effectiveValue > 0);

  const generatePieGradient = (): string => {
    if (pieSegments.length === 0) return "conic-gradient(from 0deg, #1e293b 0% 100%)";
    let accumulated = 0;
    const stops: string[] = [];
    for (const seg of pieSegments) {
      const percentage = (seg.effectiveValue / totalValue) * 100;
      stops.push(`${seg.color} ${accumulated}% ${accumulated + percentage}%`);
      accumulated += percentage;
    }
    return `conic-gradient(from 0deg, ${stops.join(", ")})`;
  };

  const renderInput = (cat: EstateCategory) => {
    if (cat.id === "cloud") {
      return (
        <div>
          <p className="text-xs text-slate-400 mb-2">Sentimental Value Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setStarRating(star)} className="p-0.5 transition-transform hover:scale-110">
                <Star className={`w-6 h-6 ${star <= starRating ? "text-gold fill-gold" : "text-slate-600"}`} />
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">Estimated: {formatINR(STAR_VALUE_MAP[starRating] || 0)}</p>
        </div>
      );
    }
    if (cat.id === "subscriptions") {
      return (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-400">Monthly Cost (&#8377;)</label>
            <input type="number" min="0" value={cat.value || ""} onChange={(e) => updateValue(cat.id, Number(e.target.value) || 0)} placeholder="0" className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Remaining Months: {subscriptionMonths}</label>
            <input type="range" min="1" max="60" value={subscriptionMonths} onChange={(e) => setSubscriptionMonths(Number(e.target.value))} className="w-full mt-1 accent-gold" />
          </div>
          <p className="text-xs text-slate-500">Total: {formatINR(cat.value * subscriptionMonths)}</p>
        </div>
      );
    }
    if (cat.id === "social") {
      return (
        <div>
          <label className="text-xs text-slate-400">Follower Count</label>
          <input type="number" min="0" value={cat.value || ""} onChange={(e) => updateValue(cat.id, Number(e.target.value) || 0)} placeholder="e.g. 10000" className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
          <p className="text-xs text-slate-500 mt-1">Est. monetization: {formatINR(cat.value * 2)} (&#8377;2/follower)</p>
        </div>
      );
    }
    return (
      <div>
        <label className="text-xs text-slate-400">Estimated Value (&#8377;)</label>
        <input type="number" min="0" value={cat.value || ""} onChange={(e) => updateValue(cat.id, Number(e.target.value) || 0)} placeholder="0" className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Digital Estate Calculator</h2>
          <p className="text-xs text-slate-400">Estimate the total value of your digital life</p>
        </div>
      </div>

      <div className="bg-navy-800 border border-gold/20 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-400 mb-2">Your Digital Estate</p>
        <p className="text-4xl md:text-5xl font-bold text-gold tracking-tight">{formatINR(totalValue)}</p>
        <p className="text-xs text-slate-500 mt-3 max-w-md mx-auto">
          Your digital life is worth protecting. 72% of estates lose access to these assets without proper planning.
        </p>
      </div>

      {totalValue > 0 && (
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Estate Breakdown</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-40 h-40 rounded-full shrink-0" style={{ background: generatePieGradient() }} />
            <div className="flex flex-wrap gap-2">
              {pieSegments.map((seg) => (
                <div key={seg.id} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                  <span>{seg.label}: {formatINR(seg.effectiveValue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-navy-800 border border-navy-700 rounded-xl p-4 hover:border-navy-600 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                {cat.icon}
              </div>
              <span className="text-sm font-medium text-slate-200">{cat.label}</span>
            </div>
            {renderInput(cat)}
          </div>
        ))}
      </div>

      <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-4 text-center">
        <p className="text-xs text-slate-500">&#128274; All values are stored locally on your device. Nothing is sent to any server.</p>
      </div>
    </div>
  );
}
