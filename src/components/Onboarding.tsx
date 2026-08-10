import { useState } from "react";
import { Shield, Users, Lock, HeartPulse, ChevronRight } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Shield,
    title: "Welcome to Aeterna",
    description:
      "Your digital estate planner with military-grade encryption. Every secret you store is encrypted client-side before it ever leaves your device — not even we can read it.",
  },
  {
    icon: Users,
    title: "Add Your First Beneficiary",
    description:
      "Choose trusted people who should receive your digital assets. They'll only gain access if you stop checking in — your secrets stay yours until then.",
  },
  {
    icon: Lock,
    title: "Create Your First Vault",
    description:
      "Store passwords, crypto keys, private notes, or any sensitive data. Each vault is individually encrypted and assigned to a specific beneficiary.",
  },
  {
    icon: HeartPulse,
    title: "Set Your Check-In Schedule",
    description:
      "The heartbeat system is your dead man's switch. Check in regularly to prove you're active. Miss a check-in, and after a grace period, your vaults are released to your heirs.",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      return;
    }
    setDirection("next");
    setCurrentStep((prev) => prev + 1);
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-6 bg-gold"
                  : index < currentStep
                  ? "w-2 bg-gold/50"
                  : "w-2 bg-navy-600"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div
          key={currentStep}
          className={`px-8 py-10 text-center ${
            direction === "next" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`}
        >
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Icon className="w-8 h-8 text-gold" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-100 mb-3">{step.title}</h2>

          {/* Description */}
          <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip
          </button>

          <button
            onClick={handleNext}
            className="btn-gold flex items-center gap-2 text-sm px-6 py-2.5"
          >
            {isLastStep ? "Get Started" : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Step indicator text */}
        <div className="absolute top-4 right-4 text-xs text-slate-600">
          {currentStep + 1}/{steps.length}
        </div>
      </div>
    </div>
  );
}
