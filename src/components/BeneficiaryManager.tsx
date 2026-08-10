import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { encryptData, decryptData } from "../utils/crypto";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Edit,
  Trash2,
  Shield,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";

const client = generateClient<Schema>();

interface BeneficiaryManagerProps {
  masterPassword: string;
}

type Relationship =
  | "Spouse"
  | "Child"
  | "Parent"
  | "Sibling"
  | "Lawyer"
  | "Business Partner"
  | "Friend"
  | "Other";

const RELATIONSHIPS: Relationship[] = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Lawyer",
  "Business Partner",
  "Friend",
  "Other",
];

interface BeneficiaryRecord {
  id: string;
  encryptedName: string;
  encryptedEmail: string;
  encryptedPhone: string;
  relationship: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DecryptedBeneficiary {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  relationship: Relationship;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  phone: "",
  relationship: "Spouse",
};

export function BeneficiaryManager({ masterPassword }: BeneficiaryManagerProps) {
  const [beneficiaries, setBeneficiaries] = useState<DecryptedBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const decryptBeneficiary = useCallback(
    async (record: BeneficiaryRecord): Promise<DecryptedBeneficiary> => {
      let name = "[Encrypted]";
      let email = "[Encrypted]";
      let phone = "";

      try {
        const nameData = JSON.parse(record.encryptedName);
        name = await decryptData(nameData, masterPassword);
      } catch {
        // Failed to decrypt
      }

      try {
        const emailData = JSON.parse(record.encryptedEmail);
        email = await decryptData(emailData, masterPassword);
      } catch {
        // Failed to decrypt
      }

      if (record.encryptedPhone) {
        try {
          const phoneData = JSON.parse(record.encryptedPhone);
          phone = await decryptData(phoneData, masterPassword);
        } catch {
          // Failed to decrypt or empty
        }
      }

      return {
        id: record.id,
        name,
        email,
        phone,
        relationship: record.relationship || "Other",
      };
    },
    [masterPassword]
  );

  const fetchBeneficiaries = useCallback(async () => {
    try {
      const { data } = await (client.models as any).Beneficiary.list();
      const records: BeneficiaryRecord[] = data || [];

      const decrypted = await Promise.all(
        records.map((r) => decryptBeneficiary(r))
      );
      setBeneficiaries(decrypted);
    } catch (err) {
      console.error("Failed to fetch beneficiaries:", err);
    } finally {
      setLoading(false);
    }
  }, [decryptBeneficiary]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
    setShowPanel(true);
  };

  const handleOpenEdit = (beneficiary: DecryptedBeneficiary) => {
    setEditingId(beneficiary.id);
    setFormData({
      name: beneficiary.name,
      email: beneficiary.email,
      phone: beneficiary.phone,
      relationship: beneficiary.relationship as Relationship,
    });
    setError("");
    setShowPanel(true);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("A valid email is required.");
      return;
    }

    setSubmitting(true);

    try {
      const encryptedName = await encryptData(formData.name.trim(), masterPassword);
      const encryptedEmail = await encryptData(formData.email.trim().toLowerCase(), masterPassword);
      const encryptedPhone = formData.phone.trim()
        ? await encryptData(formData.phone.trim(), masterPassword)
        : null;

      const payload = {
        encryptedName: JSON.stringify({
          ciphertext: encryptedName.ciphertext,
          iv: encryptedName.iv,
          salt: encryptedName.salt,
        }),
        encryptedEmail: JSON.stringify({
          ciphertext: encryptedEmail.ciphertext,
          iv: encryptedEmail.iv,
          salt: encryptedEmail.salt,
        }),
        encryptedPhone: encryptedPhone
          ? JSON.stringify({
              ciphertext: encryptedPhone.ciphertext,
              iv: encryptedPhone.iv,
              salt: encryptedPhone.salt,
            })
          : "",
        relationship: formData.relationship,
      };

      if (editingId) {
        await (client.models as any).Beneficiary.update({
          id: editingId,
          ...payload,
        });
      } else {
        await (client.models as any).Beneficiary.create(payload);
      }

      handleClosePanel();
      await fetchBeneficiaries();
    } catch (err) {
      console.error("Failed to save beneficiary:", err);
      setError("Failed to save beneficiary. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await (client.models as any).Beneficiary.delete({ id });
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete beneficiary:", err);
    }
  };

  const getInitial = (name: string) => {
    return name && name !== "[Encrypted]" ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" />
          <h2 className="text-lg font-semibold text-slate-100">Beneficiaries</h2>
          <span className="text-xs bg-navy-700 text-slate-400 px-2 py-0.5 rounded-full">
            {beneficiaries.length}
          </span>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-gold flex items-center gap-2 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Beneficiary
        </button>
      </div>

      {/* Beneficiary List */}
      {loading ? (
        <div className="card text-center py-8">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading beneficiaries...</p>
        </div>
      ) : beneficiaries.length === 0 ? (
        <div className="card text-center py-8">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No beneficiaries yet.</p>
          <p className="text-sm text-slate-500">
            Add people who should receive your encrypted assets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="bg-navy-800 border border-navy-700 rounded-xl p-4 flex items-start gap-3 hover:border-gold/20 transition-colors group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-gold">
                  {getInitial(b.name)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-200 truncate">
                    {b.name}
                  </h3>
                  <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 shrink-0">
                    {b.relationship}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    {b.email}
                  </p>
                  {b.phone && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 shrink-0" />
                      {b.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="p-1.5 text-slate-400 hover:text-gold transition-colors rounded-lg hover:bg-navy-700"
                  title="Edit beneficiary"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(b.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-navy-700"
                  title="Delete beneficiary"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
            aria-hidden="true"
          />
          <div className="relative bg-navy-800 border border-navy-700 rounded-xl p-6 max-w-sm w-full animate-slide-up">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Delete Beneficiary?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              This action cannot be undone. The beneficiary will be removed from
              all vault assignments.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Panel for Add/Edit */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClosePanel}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-navy-900 border-l border-navy-700 h-full overflow-y-auto animate-slide-in-right shadow-2xl">
            {/* Panel Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-navy-700 bg-navy-900/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                <h3 className="text-lg font-semibold text-slate-100">
                  {editingId ? "Edit Beneficiary" : "Add Beneficiary"}
                </h3>
              </div>
              <button
                onClick={handleClosePanel}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="beneficiary-name" className="label">
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Full Name *
                </label>
                <input
                  id="beneficiary-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g., John Doe"
                  className="input-field"
                  autoFocus
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="beneficiary-email" className="label">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />
                  Email Address *
                </label>
                <input
                  id="beneficiary-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="recipient@example.com"
                  className="input-field"
                />
                <p className="text-xs text-slate-600 mt-1">
                  🔒 Encrypted before storage — only visible with your master password.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="beneficiary-phone" className="label">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  Phone (optional)
                </label>
                <input
                  id="beneficiary-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+1 (555) 000-0000"
                  className="input-field"
                />
              </div>

              {/* Relationship */}
              <div>
                <label htmlFor="beneficiary-relationship" className="label">
                  <ChevronRight className="w-3.5 h-3.5 inline mr-1" />
                  Relationship *
                </label>
                <select
                  id="beneficiary-relationship"
                  value={formData.relationship}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      relationship: e.target.value as Relationship,
                    }))
                  }
                  className="input-field"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingId ? "Updating..." : "Encrypting & Saving..."}
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      {editingId ? "Update Beneficiary" : "Add Beneficiary"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClosePanel}
                  className="btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Security Footer */}
            <div className="px-6 py-3 border-t border-navy-700 bg-navy-950/50">
              <p className="text-xs text-slate-600 text-center">
                🛡️ All personal data encrypted client-side with AES-256-GCM
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
