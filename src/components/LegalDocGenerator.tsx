import { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Scale,
  Plus,
  X,
} from "lucide-react";

interface FormData {
  fullName: string;
  dateOfBirth: string;
  address: string;
  executorName: string;
  executorRelationship: string;
  executorEmail: string;
  platforms: string[];
  customInstructions: string;
}

const INITIAL_FORM: FormData = {
  fullName: "",
  dateOfBirth: "",
  address: "",
  executorName: "",
  executorRelationship: "",
  executorEmail: "",
  platforms: [],
  customInstructions: "",
};

export function LegalDocGenerator() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [newPlatform, setNewPlatform] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addPlatform = () => {
    const trimmed = newPlatform.trim();
    if (trimmed && !form.platforms.includes(trimmed)) {
      setForm((prev) => ({ ...prev, platforms: [...prev.platforms, trimmed] }));
      setNewPlatform("");
    }
  };

  const removePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.filter((p) => p !== platform),
    }));
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const generateLetterText = (): string => {
    const platformList = form.platforms.length > 0
      ? form.platforms.map((p, i) => `${i + 1}. ${p}`).join("\n")
      : "[No platforms specified]";

    return `DIGITAL ESTATE AUTHORIZATION LETTER
${"=".repeat(50)}

Date: ${currentDate}

I, ${form.fullName || "[Full Legal Name]"}, born on ${form.dateOfBirth || "[Date of Birth]"}, residing at ${form.address || "[Address]"}, hereby authorize ${form.executorName || "[Executor Name]"} (${form.executorRelationship || "[Relationship]"}, Email: ${form.executorEmail || "[Email]"}) as my Digital Estate Executor with full authority to access, manage, transfer, or close the following digital accounts and assets upon my death or incapacitation:

AUTHORIZED PLATFORMS AND SERVICES:
${platformList}

${form.customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${form.customInstructions}\n` : ""}
This letter is to be presented alongside valid identification and a death certificate to the relevant service providers.

This document represents my express wishes regarding the disposition of my digital assets and accounts. I have prepared this document of my own free will and without coercion.


Signature: _________________________

Name: ${form.fullName || "[Full Legal Name]"}
Date: ${currentDate}


Witness 1: _________________________
Name:
Date:

Witness 2: _________________________
Name:
Date:
`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = generateLetterText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `digital-estate-letter-${form.fullName.replace(/\s+/g, "-").toLowerCase() || "draft"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isFormValid = form.fullName && form.executorName && form.platforms.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Scale className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Legal Document Generator</h2>
          <p className="text-xs text-slate-400">Generate a Digital Estate Authorization Letter</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" />
            Your Information
          </h3>

          <div>
            <label className="text-xs text-slate-400">Full Legal Name *</label>
            <input type="text" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="John Doe" className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
          </div>

          <div>
            <label className="text-xs text-slate-400">Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
          </div>

          <div>
            <label className="text-xs text-slate-400">Address</label>
            <textarea value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Your full address" rows={2} className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50 resize-none" />
          </div>

          <hr className="border-navy-700" />

          <h3 className="text-sm font-semibold text-slate-300">Executor Details</h3>

          <div>
            <label className="text-xs text-slate-400">Executor Name *</label>
            <input type="text" value={form.executorName} onChange={(e) => updateField("executorName", e.target.value)} placeholder="Jane Doe" className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Relationship</label>
              <input type="text" value={form.executorRelationship} onChange={(e) => updateField("executorRelationship", e.target.value)} placeholder="Spouse, Sibling..." className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input type="email" value={form.executorEmail} onChange={(e) => updateField("executorEmail", e.target.value)} placeholder="executor@email.com" className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
            </div>
          </div>

          <hr className="border-navy-700" />

          <h3 className="text-sm font-semibold text-slate-300">Platforms to Authorize *</h3>
          <div className="flex gap-2">
            <input type="text" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPlatform()} placeholder="e.g. Google, Meta, GitHub..." className="flex-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50" />
            <button onClick={addPlatform} className="btn-gold px-3 py-2 text-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.platforms.map((p) => (
                <span key={p} className="flex items-center gap-1 text-xs bg-navy-700 text-slate-300 px-2 py-1 rounded-full border border-navy-600">
                  {p}
                  <button onClick={() => removePlatform(p)} className="text-slate-500 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400">Custom Instructions</label>
            <textarea value={form.customInstructions} onChange={(e) => updateField("customInstructions", e.target.value)} placeholder="Any additional wishes or instructions..." rows={3} className="w-full mt-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-gold/50 resize-none" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowPreview(!showPreview)} className="btn-outline flex items-center gap-2 text-sm flex-1">
              <FileText className="w-4 h-4" />
              {showPreview ? "Hide Preview" : "Preview"}
            </button>
            <button onClick={handlePrint} disabled={!isFormValid} className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={handleDownload} disabled={!isFormValid} className="btn-gold flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className={`${showPreview ? "block" : "hidden lg:block"}`}>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 shadow-lg print:shadow-none" id="legal-doc-preview">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 tracking-wide">DIGITAL ESTATE AUTHORIZATION LETTER</h2>
              <div className="w-16 h-0.5 bg-gray-400 mx-auto mt-2" />
            </div>

            <p className="text-sm text-gray-600 mb-6 text-right">Date: {currentDate}</p>

            <div className="text-sm text-gray-800 leading-relaxed space-y-4">
              <p>
                I, <strong>{form.fullName || "[Full Legal Name]"}</strong>, born on{" "}
                <strong>{form.dateOfBirth || "[Date of Birth]"}</strong>, residing at{" "}
                <strong>{form.address || "[Address]"}</strong>, hereby authorize{" "}
                <strong>{form.executorName || "[Executor Name]"}</strong>{" "}
                ({form.executorRelationship || "[Relationship]"}, Email: {form.executorEmail || "[Email]"}){" "}
                as my Digital Estate Executor with full authority to access, manage, transfer, or close
                the following digital accounts and assets upon my death or incapacitation:
              </p>

              <div>
                <p className="font-semibold text-gray-900 mb-2">Authorized Platforms and Services:</p>
                {form.platforms.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    {form.platforms.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-500 italic">[No platforms specified]</p>
                )}
              </div>

              {form.customInstructions && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Additional Instructions:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{form.customInstructions}</p>
                </div>
              )}

              <p>
                This letter is to be presented alongside valid identification and a death certificate
                to the relevant service providers.
              </p>

              <p className="text-xs text-gray-500 mt-4">
                This document represents my express wishes regarding the disposition of my digital assets
                and accounts. I have prepared this document of my own free will and without coercion.
              </p>

              <div className="mt-8 pt-6 border-t border-gray-300 space-y-6">
                <div>
                  <p className="text-gray-700">Signature: ______________________________</p>
                  <p className="text-gray-600 mt-1">Name: {form.fullName || "[Full Legal Name]"}</p>
                  <p className="text-gray-600">Date: {currentDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700">Witness 1: ___________________</p>
                    <p className="text-gray-500 text-xs mt-1">Name:</p>
                    <p className="text-gray-500 text-xs">Date:</p>
                  </div>
                  <div>
                    <p className="text-gray-700">Witness 2: ___________________</p>
                    <p className="text-gray-500 text-xs mt-1">Name:</p>
                    <p className="text-gray-500 text-xs">Date:</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
