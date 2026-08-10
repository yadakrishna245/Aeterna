import { useState, useEffect } from "react";
import { Check, X, CreditCard, Crown, Star, Zap, AlertTriangle, Calendar } from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { useToast } from "./Toast";
import {
  getCurrentPlan,
  setCurrentPlan,
  getNextBillingDate,
  cancelPlan,
  type PlanType,
} from "../utils/subscription";

interface PlanFeature {
  name: string;
  free: boolean;
  pro: boolean;
  family: boolean;
}

const FEATURES: PlanFeature[] = [
  { name: "Encrypted vaults (3)", free: true, pro: true, family: true },
  { name: "1 beneficiary", free: true, pro: true, family: true },
  { name: "Email dead man's switch", free: true, pro: true, family: true },
  { name: "AES-256 encryption", free: true, pro: true, family: true },
  { name: "Unlimited vaults", free: false, pro: true, family: true },
  { name: "5 beneficiaries", free: false, pro: true, family: true },
  { name: "1 GB encrypted storage", free: false, pro: true, family: true },
  { name: "Video messages", free: false, pro: true, family: true },
  { name: "2FA vault", free: false, pro: true, family: true },
  { name: "Time capsules", free: false, pro: true, family: true },
  { name: "Unlimited beneficiaries", free: false, pro: false, family: true },
  { name: "SMS + WhatsApp alerts", free: false, pro: false, family: true },
  { name: "Scheduled triggers", free: false, pro: false, family: true },
  { name: "Priority support", free: false, pro: false, family: true },
  { name: "Shamir key recovery", free: false, pro: false, family: true },
];

export function PricingPage() {
  const [currentPlan, setCurrentPlanState] = useState<PlanType>("free");
  const [showPaymentModal, setShowPaymentModal] = useState<"pro" | "family" | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [nextBilling, setNextBilling] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    setCurrentPlanState(getCurrentPlan());
    setNextBilling(getNextBillingDate());
  }, []);

  const handleUpgrade = (plan: "pro" | "family") => {
    setShowPaymentModal(plan);
  };

  const handlePaymentSuccess = () => {
    if (showPaymentModal) {
      setCurrentPlan(showPaymentModal);
      setCurrentPlanState(showPaymentModal);
      setNextBilling(getNextBillingDate());
      toast.success(`Successfully upgraded to ${showPaymentModal === "pro" ? "Pro" : "Family"} plan!`);
    }
    setShowPaymentModal(null);
  };

  const handleCancelPlan = () => {
    cancelPlan();
    setCurrentPlanState("free");
    setNextBilling(null);
    setShowCancelConfirm(false);
    toast.success("Plan cancelled. You're now on the Free plan.");
  };

  const getPlanBadge = () => {
    switch (currentPlan) {
      case "pro":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gold/20 text-gold border border-gold/30">
            <Crown className="w-4 h-4" />
            PRO
          </span>
        );
      case "family":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Star className="w-4 h-4" />
            FAMILY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/30">
            FREE
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-gold" />
            Subscription & Billing
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage your plan and billing preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Current Plan:</span>
          {getPlanBadge()}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-100">Free</h3>
            <div className="mt-3">
              <span className="text-4xl font-bold text-slate-100">₹0</span>
              <span className="text-slate-500 ml-1">forever</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Get started with basic protection</p>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex items-start gap-2 text-sm">
                {f.free ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-400/50 flex-shrink-0 mt-0.5" />
                )}
                <span className={f.free ? "text-slate-300" : "text-slate-600"}>
                  {f.name}
                </span>
              </li>
            ))}
          </ul>
          {currentPlan === "free" ? (
            <div className="w-full py-3 text-center rounded-lg bg-slate-700/30 border border-slate-600/30 text-slate-400 text-sm font-medium">
              Current Plan
            </div>
          ) : (
            <button
              onClick={handleCancelPlan}
              className="w-full py-3 text-center rounded-lg border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm font-medium transition-colors"
            >
              Downgrade to Free
            </button>
          )}
        </div>

        {/* Pro Plan */}
        <div className="relative bg-navy-800 border-2 border-gold/50 rounded-xl p-6 flex flex-col shadow-lg shadow-gold/5">
          {/* Most Popular Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gold text-navy-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Most Popular
            </span>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gold flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Pro
            </h3>
            <div className="mt-3">
              <span className="text-4xl font-bold text-gold">₹499</span>
              <span className="text-slate-500 ml-1">/year</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">For serious digital estate planning</p>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex items-start gap-2 text-sm">
                {f.pro ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-400/50 flex-shrink-0 mt-0.5" />
                )}
                <span className={f.pro ? "text-slate-300" : "text-slate-600"}>
                  {f.name}
                </span>
              </li>
            ))}
          </ul>
          {currentPlan === "pro" ? (
            <div className="w-full py-3 text-center rounded-lg bg-gold/20 border border-gold/30 text-gold text-sm font-semibold">
              ✓ Current Plan
            </div>
          ) : (
            <button
              onClick={() => handleUpgrade("pro")}
              className="w-full btn-gold py-3 text-sm font-semibold"
            >
              {currentPlan === "family" ? "Switch to Pro" : "Upgrade to Pro"}
            </button>
          )}
        </div>

        {/* Family Plan */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Family
            </h3>
            <div className="mt-3">
              <span className="text-4xl font-bold text-slate-100">₹999</span>
              <span className="text-slate-500 ml-1">/year</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Complete protection for your family</p>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex items-start gap-2 text-sm">
                {f.family ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-400/50 flex-shrink-0 mt-0.5" />
                )}
                <span className={f.family ? "text-slate-300" : "text-slate-600"}>
                  {f.name}
                </span>
              </li>
            ))}
          </ul>
          {currentPlan === "family" ? (
            <div className="w-full py-3 text-center rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-semibold">
              ✓ Current Plan
            </div>
          ) : (
            <button
              onClick={() => handleUpgrade("family")}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
            >
              Upgrade to Family
            </button>
          )}
        </div>
      </div>

      {/* Manage Subscription Section */}
      {currentPlan !== "free" && (
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            Manage Subscription
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Next Billing */}
            <div className="bg-navy-900 rounded-lg p-4 border border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Next Billing Date</span>
              </div>
              <p className="text-lg font-semibold text-slate-100">
                {nextBilling
                  ? new Date(nextBilling).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>

            {/* Billing History */}
            <div className="bg-navy-900 rounded-lg p-4 border border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Billing History</span>
              </div>
              <p className="text-sm text-slate-500 italic">No invoices yet</p>
            </div>

            {/* Cancel */}
            <div className="bg-navy-900 rounded-lg p-4 border border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Cancel Plan</span>
              </div>
              {showCancelConfirm ? (
                <div className="space-y-2">
                  <p className="text-xs text-red-400">
                    You'll lose access to premium features immediately.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelPlan}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg font-medium transition-colors"
                    >
                      Confirm Cancel
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-slate-300 text-xs rounded-lg font-medium transition-colors"
                    >
                      Keep Plan
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors underline underline-offset-2"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Note about real Stripe */}
      <div className="bg-navy-900/50 border border-navy-700 rounded-lg p-4 text-center">
        <p className="text-xs text-slate-500">
          💳 This is a simulated payment UI. Real Stripe integration requires backend API keys.
          The frontend is ready to plug into Stripe Checkout or Elements when backend is configured.
        </p>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          plan={showPaymentModal}
          price={showPaymentModal === "pro" ? 499 : 999}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(null)}
        />
      )}
    </div>
  );
}
