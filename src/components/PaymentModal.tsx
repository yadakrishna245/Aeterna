import { useState } from "react";
import { CreditCard, Lock, X, CheckCircle } from "lucide-react";

interface PaymentModalProps {
  plan: "pro" | "family";
  price: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function PaymentModal({ plan, price, onSuccess, onClose }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(" ") : "";
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const cardDigits = cardNumber.replace(/\s/g, "");
    
    if (cardDigits.length !== 16) {
      newErrors.cardNumber = "Enter a valid 16-digit card number";
    }
    
    const expiryDigits = expiry.replace("/", "");
    if (expiryDigits.length !== 4) {
      newErrors.expiry = "Enter valid expiry (MM/YY)";
    } else {
      const month = parseInt(expiryDigits.slice(0, 2));
      if (month < 1 || month > 12) {
        newErrors.expiry = "Invalid month";
      }
    }

    if (cvv.length !== 3) {
      newErrors.cvv = "Enter 3-digit CVV";
    }

    if (name.trim().length < 2) {
      newErrors.name = "Enter cardholder name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setProcessing(true);

    // Simulate Stripe payment processing (2s delay)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setProcessing(false);
    setSuccess(true);

    // Show success animation then call onSuccess
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!processing && !success ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl animate-fade-in">
        {/* Close button */}
        {!processing && !success && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {success ? (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Payment Successful!</h3>
            <p className="text-slate-400">
              Welcome to Aeterna {plan === "pro" ? "Pro" : "Family"}. Enjoy premium features!
            </p>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">
                Upgrade to {plan === "pro" ? "Pro" : "Family"}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                ₹{price}/year • Cancel anytime
              </p>
            </div>

            {/* Card Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className={`w-full bg-navy-900 border ${
                    errors.cardNumber ? "border-red-500" : "border-navy-600"
                  } rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors font-mono`}
                  disabled={processing}
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              </div>
              {errors.cardNumber && (
                <p className="text-xs text-red-400 mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Expiry
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className={`w-full bg-navy-900 border ${
                    errors.expiry ? "border-red-500" : "border-navy-600"
                  } rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors font-mono`}
                  disabled={processing}
                />
                {errors.expiry && (
                  <p className="text-xs text-red-400 mt-1">{errors.expiry}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  CVV
                </label>
                <input
                  type="password"
                  placeholder="•••"
                  maxLength={3}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className={`w-full bg-navy-900 border ${
                    errors.cvv ? "border-red-500" : "border-navy-600"
                  } rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors font-mono`}
                  disabled={processing}
                />
                {errors.cvv && (
                  <p className="text-xs text-red-400 mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-navy-900 border ${
                  errors.name ? "border-red-500" : "border-navy-600"
                } rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors`}
                disabled={processing}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full btn-gold py-3.5 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ₹{price}
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock className="w-3 h-3" />
              <span>Powered by Stripe • 256-bit SSL encryption</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
