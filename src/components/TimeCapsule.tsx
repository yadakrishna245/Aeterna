import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { encryptData, decryptData } from "../utils/crypto";
import { useToast } from "./Toast";
import {
  Heart,
  Gift,
  GraduationCap,
  Baby,
  Star,
  Calendar,
  Send,
  Clock,
  Plus,
  Eye,
  Trash2,
  MessageCircle,
  X,
  Loader2,
} from "lucide-react";

const client = generateClient<Schema>();

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Milestone =
  | "Wedding Day"
  | "18th Birthday"
  | "21st Birthday"
  | "Graduation"
  | "First Child Born"
  | "Anniversary"
  | "Custom Date"
  | "First Job";

interface TimeCapsuleProps {
  masterPassword: string;
}

interface CapsuleForm {
  recipientName: string;
  recipientEmail: string;
  milestone: Milestone;
  deliveryDate: string;
  messageTitle: string;
  messageBody: string;
  includeVideoNote: boolean;
}

interface DecryptedCapsule {
  id: string;
  recipientName: string;
  recipientEmail: string;
  milestone: Milestone;
  deliveryDate: string;
  messageTitle: string;
  messageBody: string;
  status: "Scheduled" | "Delivered";
  includeVideoNote: boolean;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const MILESTONES: Milestone[] = [
  "Wedding Day",
  "18th Birthday",
  "21st Birthday",
  "Graduation",
  "First Child Born",
  "Anniversary",
  "Custom Date",
  "First Job",
];

const MILESTONE_CONFIG: Record<
  Milestone,
  { icon: typeof Heart; color: string; bg: string; border: string }
> = {
  "Wedding Day": {
    icon: Heart,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  "18th Birthday": {
    icon: Gift,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  "21st Birthday": {
    icon: Gift,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  Graduation: {
    icon: GraduationCap,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  "First Child Born": {
    icon: Baby,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  Anniversary: {
    icon: Star,
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold/20",
  },
  "Custom Date": {
    icon: Calendar,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  "First Job": {
    icon: Star,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

const EMPTY_FORM: CapsuleForm = {
  recipientName: "",
  recipientEmail: "",
  milestone: "Wedding Day",
  deliveryDate: "",
  messageTitle: "",
  messageBody: "",
  includeVideoNote: false,
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getCountdown(deliveryDate: string): string {
  const now = new Date();
  const target = new Date(deliveryDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return "Delivered";

  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
  if (days > 0 && years === 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

  return parts.length > 0 ? `Delivers in ${parts.join(", ")}` : "Delivers today";
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function TimeCapsule({ masterPassword }: TimeCapsuleProps) {
  const [capsules, setCapsules] = useState<DecryptedCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CapsuleForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const toast = useToast();

  /* ─── Fetch & Decrypt Capsules ─────────────────────────────────────────── */

  const fetchCapsules = useCallback(async () => {
    try {
      const { data } = await client.models.Vault.list();
      const capsuleVaults = (data || []).filter((v: any) => {
        // Time capsules are stored with triggerType SCHEDULED_DATE and have metadata
        return v.triggerType === "SCHEDULED_DATE" && v.encryptedFileKeys;
      });

      const decrypted: DecryptedCapsule[] = [];

      for (const vault of capsuleVaults) {
        try {
          // Decrypt metadata stored in encryptedFileKeys (we repurpose this for capsule metadata)
          const metaRaw = JSON.parse(vault.encryptedFileKeys || "{}");
          const metaJson = await decryptData(metaRaw, masterPassword);
          const meta = JSON.parse(metaJson);

          // Decrypt message title from encryptedAssetName
          const titleData = JSON.parse(vault.encryptedAssetName);
          const messageTitle = await decryptData(titleData, masterPassword);

          // Decrypt message body from payload
          const messageBody = await decryptData(
            { ciphertext: vault.encryptedPayload, iv: vault.iv, salt: vault.salt },
            masterPassword
          );

          // Decrypt recipient email
          const emailData = JSON.parse(vault.encryptedHeirEmail);
          const recipientEmail = await decryptData(emailData, masterPassword);

          const deliveryDate = vault.scheduledTriggerDate || "";
          const isDelivered =
            vault.status === "DELIVERED" ||
            (deliveryDate && new Date(deliveryDate).getTime() <= Date.now());

          decrypted.push({
            id: vault.id,
            recipientName: meta.recipientName || "[Encrypted]",
            recipientEmail,
            milestone: meta.milestone || "Custom Date",
            deliveryDate,
            messageTitle,
            messageBody,
            status: isDelivered ? "Delivered" : "Scheduled",
            includeVideoNote: meta.includeVideoNote || false,
          });
        } catch {
          // Skip capsules that fail to decrypt (wrong password or corrupted)
        }
      }

      // Sort by delivery date
      decrypted.sort(
        (a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
      );

      setCapsules(decrypted);
    } catch (err) {
      console.error("Failed to fetch time capsules:", err);
      toast.error("Failed to load time capsules.");
    } finally {
      setLoading(false);
    }
  }, [masterPassword, toast]);

  useEffect(() => {
    fetchCapsules();
  }, [fetchCapsules]);

  /* ─── Submit Handler ───────────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!form.recipientName.trim()) {
      toast.error("Recipient name is required.");
      return;
    }
    if (!form.recipientEmail.trim() || !form.recipientEmail.includes("@")) {
      toast.error("A valid recipient email is required.");
      return;
    }
    if (!form.deliveryDate) {
      toast.error("Please select a delivery date.");
      return;
    }
    if (new Date(form.deliveryDate).getTime() <= Date.now()) {
      toast.error("Delivery date must be in the future.");
      return;
    }
    if (!form.messageTitle.trim()) {
      toast.error("Message title is required.");
      return;
    }
    if (!form.messageBody.trim()) {
      toast.error("Message body is required.");
      return;
    }

    setSubmitting(true);

    try {
      // Encrypt message title (stored as encryptedAssetName)
      const encryptedTitle = await encryptData(form.messageTitle.trim(), masterPassword);

      // Encrypt message body (stored as encryptedPayload)
      const encryptedBody = await encryptData(form.messageBody.trim(), masterPassword);

      // Encrypt recipient email (stored as encryptedHeirEmail)
      const encryptedEmail = await encryptData(
        form.recipientEmail.trim().toLowerCase(),
        masterPassword
      );

      // Encrypt capsule metadata (recipientName, milestone, includeVideoNote)
      const capsuleMeta = JSON.stringify({
        recipientName: form.recipientName.trim(),
        milestone: form.milestone,
        includeVideoNote: form.includeVideoNote,
        type: "TIME_CAPSULE",
      });
      const encryptedMeta = await encryptData(capsuleMeta, masterPassword);

      // Store in DynamoDB via Vault model
      await client.models.Vault.create({
        encryptedAssetName: JSON.stringify({
          ciphertext: encryptedTitle.ciphertext,
          iv: encryptedTitle.iv,
          salt: encryptedTitle.salt,
        }),
        encryptedPayload: encryptedBody.ciphertext,
        iv: encryptedBody.iv,
        salt: encryptedBody.salt,
        encryptedHeirEmail: JSON.stringify({
          ciphertext: encryptedEmail.ciphertext,
          iv: encryptedEmail.iv,
          salt: encryptedEmail.salt,
        }),
        heartbeatIntervalDays: 365, // Not used for scheduled, but required field
        lastHeartbeat: new Date().toISOString(),
        status: "ACTIVE",
        gracePeriodDays: 0,
        triggerType: "SCHEDULED_DATE",
        scheduledTriggerDate: form.deliveryDate,
        remindersSent: 0,
        // Store capsule metadata in encryptedFileKeys field
        encryptedFileKeys: JSON.stringify({
          ciphertext: encryptedMeta.ciphertext,
          iv: encryptedMeta.iv,
          salt: encryptedMeta.salt,
        }),
      } as any);

      toast.success("Time capsule created! Message encrypted & scheduled.");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchCapsules();
    } catch (err) {
      console.error("Failed to create time capsule:", err);
      toast.error("Failed to create time capsule. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete Handler ───────────────────────────────────────────────────── */

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this time capsule? This cannot be undone.")) return;

    try {
      await client.models.Vault.delete({ id });
      setCapsules((prev) => prev.filter((c) => c.id !== id));
      toast.success("Time capsule deleted.");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete time capsule.");
    }
  };

  /* ─── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Time Capsule Messages</h2>
            <p className="text-sm text-slate-400">
              Encrypted messages for life's biggest milestones
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-gold flex items-center gap-2 text-sm"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              New Capsule
            </>
          )}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card border-gold/20 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <Send className="w-5 h-5 text-gold" />
            <h3 className="text-base font-semibold text-slate-100">
              Create Time Capsule Message
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient Name */}
            <div>
              <label htmlFor="tc-recipient-name" className="label">
                Recipient Name
              </label>
              <input
                id="tc-recipient-name"
                type="text"
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                placeholder="e.g., My daughter Sarah"
                className="input-field"
              />
            </div>

            {/* Recipient Email */}
            <div>
              <label htmlFor="tc-recipient-email" className="label">
                Recipient Email
              </label>
              <input
                id="tc-recipient-email"
                type="email"
                value={form.recipientEmail}
                onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                placeholder="recipient@example.com"
                className="input-field"
              />
              <p className="text-xs text-slate-600 mt-1">
                🔒 Encrypted locally — the server never sees this.
              </p>
            </div>

            {/* Milestone Selector */}
            <div>
              <label htmlFor="tc-milestone" className="label">
                Milestone / Occasion
              </label>
              <select
                id="tc-milestone"
                value={form.milestone}
                onChange={(e) => setForm({ ...form, milestone: e.target.value as Milestone })}
                className="input-field"
              >
                {MILESTONES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Date */}
            <div>
              <label htmlFor="tc-delivery-date" className="label">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Delivery Date
              </label>
              <input
                id="tc-delivery-date"
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                className="input-field"
              />
            </div>

            {/* Message Title */}
            <div>
              <label htmlFor="tc-title" className="label">
                Message Title
              </label>
              <input
                id="tc-title"
                type="text"
                value={form.messageTitle}
                onChange={(e) => setForm({ ...form, messageTitle: e.target.value })}
                placeholder="e.g., To my daughter on her wedding day"
                className="input-field"
              />
            </div>

            {/* Message Body */}
            <div>
              <label htmlFor="tc-body" className="label">
                Message Body
              </label>
              <textarea
                id="tc-body"
                value={form.messageBody}
                onChange={(e) => setForm({ ...form, messageBody: e.target.value })}
                placeholder="Write your heartfelt message here..."
                className="input-field min-h-[160px] resize-y"
                rows={6}
              />
              <p className="text-xs text-slate-600 mt-1">
                🔒 End-to-end encrypted. Only decryptable with your master password.
              </p>
            </div>

            {/* Video Note Option */}
            <div className="flex items-center gap-3 p-3 bg-navy-950 rounded-lg border border-navy-700">
              <input
                id="tc-video-note"
                type="checkbox"
                checked={form.includeVideoNote}
                onChange={(e) => setForm({ ...form, includeVideoNote: e.target.checked })}
                className="w-4 h-4 rounded border-navy-600 text-gold focus:ring-gold/30"
              />
              <label htmlFor="tc-video-note" className="text-sm text-slate-300 cursor-pointer">
                📹 I want to record a video message too (use Video Recorder in vault)
              </label>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Seal Time Capsule
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setShowForm(false);
                }}
                className="btn-outline text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Capsules List */}
      {loading ? (
        <div className="card text-center py-12">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading time capsules...</p>
        </div>
      ) : capsules.length === 0 && !showForm ? (
        <div className="card text-center py-12">
          <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No time capsules yet.</p>
          <p className="text-sm text-slate-500">
            Create your first encrypted message for a future milestone.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {capsules.map((capsule) => {
            const config = MILESTONE_CONFIG[capsule.milestone] || MILESTONE_CONFIG["Custom Date"];
            const IconComponent = config.icon;
            const countdown = getCountdown(capsule.deliveryDate);
            const isViewing = viewingId === capsule.id;

            return (
              <div
                key={capsule.id}
                className="card border-navy-700 hover:border-gold/20 transition-all duration-300 animate-slide-up"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Milestone Icon */}
                  <div
                    className={`w-12 h-12 rounded-full ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}
                  >
                    <IconComponent className={`w-6 h-6 ${config.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-100 truncate">
                        {capsule.messageTitle}
                      </h3>
                      {/* Milestone Badge */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}
                      >
                        {capsule.milestone}
                      </span>
                      {/* Status Badge */}
                      {capsule.status === "Delivered" ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Delivered
                        </span>
                      ) : (
                        <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/20">
                          Scheduled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap mt-1">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        To: {capsule.recipientName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(capsule.deliveryDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-gold/70">
                        <Clock className="w-3 h-3" />
                        {countdown}
                      </span>
                    </div>

                    {/* Expanded Message View */}
                    {isViewing && (
                      <div className="mt-3 p-4 bg-navy-950 border border-gold/20 rounded-lg animate-fade-in">
                        <p className="text-xs text-gold mb-2 font-medium">
                          🔓 Decrypted Message:
                        </p>
                        <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-sans leading-relaxed">
                          {capsule.messageBody}
                        </pre>
                        {capsule.includeVideoNote && (
                          <p className="text-xs text-slate-500 mt-3 italic">
                            📹 Video message also planned — use Video Recorder to attach.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewingId(isViewing ? null : capsule.id)}
                      className="btn-outline flex items-center gap-1.5 text-xs"
                      title={isViewing ? "Hide message" : "View message"}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isViewing ? "Hide" : "View"}
                    </button>
                    <button
                      onClick={() => handleDelete(capsule.id)}
                      className="btn-danger flex items-center gap-1.5 text-xs"
                      title="Delete capsule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
