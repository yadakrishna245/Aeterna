import { CheckCircle } from "lucide-react";

export interface Charity {
  id: string;
  name: string;
  description: string;
  category: "Technology" | "Education" | "Poverty" | "General";
  walletAddress?: string;
}

const PARTNER_CHARITIES: Charity[] = [
  {
    id: "wikipedia",
    name: "Wikipedia Foundation",
    description: "Free knowledge for the entire world",
    category: "Education",
  },
  {
    id: "internet-archive",
    name: "Internet Archive",
    description: "Preserving the world's digital history",
    category: "Technology",
  },
  {
    id: "eff",
    name: "Electronic Frontier Foundation (EFF)",
    description: "Defending digital privacy and free speech",
    category: "Technology",
  },
  {
    id: "givedirectly",
    name: "GiveDirectly",
    description: "Direct cash transfers to people in poverty",
    category: "Poverty",
  },
  {
    id: "pm-cares",
    name: "PM CARES Fund (India)",
    description: "National disaster and emergency relief",
    category: "General",
  },
];

interface CharityPartnersProps {
  selectedCharityId: string | null;
  onSelect: (charity: Charity) => void;
}

export function CharityPartners({ selectedCharityId, onSelect }: CharityPartnersProps) {
  const getCategoryColor = (category: Charity["category"]) => {
    switch (category) {
      case "Technology":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "Education":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Poverty":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "General":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {PARTNER_CHARITIES.map((charity) => {
        const isSelected = selectedCharityId === charity.id;
        return (
          <button
            key={charity.id}
            type="button"
            onClick={() => onSelect(charity)}
            className={`text-left p-3 rounded-lg border transition-all duration-200 ${
              isSelected
                ? "border-gold/50 bg-gold/5 shadow-sm"
                : "border-navy-700 bg-navy-900/50 hover:border-navy-600"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-slate-200 truncate">{charity.name}</h4>
                  <span className="flex items-center gap-0.5 text-gold" title="Verified Partner">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{charity.description}</p>
                <span
                  className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(
                    charity.category
                  )}`}
                >
                  {charity.category}
                </span>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { PARTNER_CHARITIES };
