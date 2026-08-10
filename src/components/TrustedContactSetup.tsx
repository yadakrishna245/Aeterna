import { useState, useEffect, useCallback } from "react";
import { UserPlus, Mail, Send, Bell, Info, Trash2, Users, CheckCircle } from "lucide-react";
import { useToast } from "./Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Relationship = "Friend" | "Colleague" | "Doctor" | "Lawyer" | "Neighbor";

interface AwarenessContact {
  id: string;
  name: string;
  email: string;
  relationship: Relationship;
  message: string;
  status: "Pending" | "Notified";
  addedAt: string;
}

const STORAGE_KEY = "aeterna_awareness_contacts";
const MAX_CONTACTS = 3;
const RELATIONSHIPS: Relationship[] = ["Friend", "Colleague", "Doctor", "Lawyer", "Neighbor"];

function getDefaultMessage(name: string): string {
  return `Hi ${name}, I'm using Aeterna (a digital estate planner) to protect my digital assets. If something ever happens to me, please let my family know to check their email for instructions from Aeterna. You don't need to do anything else — this is just in case.`;
}

function loadContacts(): AwarenessContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted data — start fresh
  }
  return [];
}

function saveContacts(contacts: AwarenessContact[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrustedContactSetup() {
  const [contacts, setContacts] = useState<AwarenessContact[]>(() => loadContacts());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("Friend");
  const [message, setMessage] = useState("");

  const toast = useToast();

  // Update message template when name changes
  useEffect(() => {
    if (name.trim()) {
      setMessage(getDefaultMessage(name.trim()));
    } else {
      setMessage("");
    }
  }, [name]);

  // Persist to localStorage whenever contacts change
  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  const resetForm = useCallback(() => {
    setName("");
    setEmail("");
    setRelationship("Friend");
    setMessage("");
    setShowForm(false);
  }, []);

  const handleAddContact = useCallback(() => {
    if (!name.trim() || !email.trim()) {
      toast.warning("Please fill in name and email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (contacts.length >= MAX_CONTACTS) {
      toast.warning(`Maximum ${MAX_CONTACTS} awareness contacts allowed.`);
      return;
    }
    // Check duplicate email
    if (contacts.some((c) => c.email.toLowerCase() === email.trim().toLowerCase())) {
      toast.warning("This email is already in your awareness contacts.");
      return;
    }

    const newContact: AwarenessContact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      relationship,
      message: message || getDefaultMessage(name.trim()),
      status: "Pending",
      addedAt: new Date().toISOString(),
    };

    setContacts((prev) => [...prev, newContact]);
    toast.success(`${newContact.name} added as awareness contact.`);
    resetForm();
  }, [name, email, relationship, message, contacts, toast, resetForm]);

  const handleSendNotification = useCallback(
    (contactId: string) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, status: "Notified" as const } : c))
      );
      toast.info("Notification will be sent via email");
    },
    [toast]
  );

  const handleRemoveContact = useCallback(
    (contactId: string) => {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      toast.success("Contact removed.");
    },
    [toast]
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-blue-300 font-medium mb-1">Awareness Contacts</p>
          <p className="text-xs text-slate-400">
            These people will be made aware that you use Aeterna — they are NOT heirs and don't get
            access to anything. They just know to alert your family if something happens to you.
          </p>
        </div>
      </div>

      {/* Existing Contacts List */}
      {contacts.length > 0 && (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-4 p-4 bg-navy-800/50 border border-navy-700 rounded-lg"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-100 truncate">{contact.name}</p>
                  <span className="text-[10px] bg-navy-700 text-slate-400 px-1.5 py-0.5 rounded border border-navy-600">
                    {contact.relationship}
                  </span>
                  {contact.status === "Notified" ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Notified
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5">
                      <Bell className="w-2.5 h-2.5" />
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {contact.email}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {contact.status === "Pending" && (
                  <button
                    onClick={() => handleSendNotification(contact.id)}
                    className="btn-gold flex items-center gap-1.5 text-xs px-3 py-1.5"
                    title="Send awareness email"
                  >
                    <Send className="w-3 h-3" />
                    Notify
                  </button>
                )}
                <button
                  onClick={() => handleRemoveContact(contact.id)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                  title="Remove contact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Form */}
      {showForm ? (
        <div className="p-5 bg-navy-800/30 border border-navy-700 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-slate-100">Add Awareness Contact</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Contact Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Relationship</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as Relationship)}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Message to Send</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 resize-none"
              placeholder="Enter the name above to auto-generate a message..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAddContact}
              className="btn-gold flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Contact
            </button>
            <button
              onClick={resetForm}
              className="btn-outline text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (contacts.length >= MAX_CONTACTS) {
              toast.warning(`Maximum ${MAX_CONTACTS} awareness contacts allowed.`);
              return;
            }
            setShowForm(true);
          }}
          className="btn-gold flex items-center gap-2 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Awareness Contact
          <span className="text-xs opacity-70">({contacts.length}/{MAX_CONTACTS})</span>
        </button>
      )}
    </div>
  );
}
