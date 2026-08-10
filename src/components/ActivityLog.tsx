import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import {
  HeartPulse,
  Plus,
  Trash2,
  Eye,
  UserPlus,
  LogIn,
  Activity,
} from "lucide-react";

const client = generateClient<Schema>();

// ─── Helper: Log an activity entry ─────────────────────────────────────────────
export async function logActivity(action: string, metadata?: string) {
  try {
    await client.models.ActivityLog.create({
      action,
      timestamp: new Date().toISOString(),
      metadata: metadata || undefined,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

// ─── Helper: Format relative time ──────────────────────────────────────────────
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Helper: Get icon and label for action type ─────────────────────────────────
function getActionConfig(action: string) {
  switch (action) {
    case "CHECK_IN":
      return {
        icon: HeartPulse,
        label: "Checked in — confirmed alive",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    case "VAULT_CREATED":
      return {
        icon: Plus,
        label: "New vault created",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };
    case "VAULT_DELETED":
      return {
        icon: Trash2,
        label: "Vault deleted",
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
      };
    case "VAULT_DECRYPTED":
      return {
        icon: Eye,
        label: "Vault decrypted & viewed",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    case "BENEFICIARY_ADDED":
      return {
        icon: UserPlus,
        label: "Beneficiary added",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      };
    case "LOGIN":
      return {
        icon: LogIn,
        label: "Logged in",
        color: "text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
      };
    default:
      return {
        icon: Activity,
        label: action.replace(/_/g, " ").toLowerCase(),
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
      };
  }
}

// ─── ActivityLog Component ──────────────────────────────────────────────────────
export function ActivityLog() {
  const [entries, setEntries] = useState<Schema["ActivityLog"]["type"][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const { data } = await client.models.ActivityLog.list({
        limit: 50,
      });
      // Sort by timestamp descending (most recent first)
      const sorted = (data || []).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setEntries(sorted);
    } catch (err) {
      console.error("Failed to fetch activity log:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Loading activity...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No activity recorded yet.</p>
        <p className="text-slate-500 text-xs mt-1">
          Actions like check-ins, vault operations, and logins will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, index) => {
        const config = getActionConfig(entry.action);
        const Icon = config.icon;
        const isLast = index === entries.length - 1;

        return (
          <div key={entry.id} className="flex gap-4 group">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full ${config.bg} border ${config.border} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-navy-700 min-h-[24px]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? "" : ""} flex-1 min-w-0`}>
              <p className="text-sm text-slate-200 font-medium leading-tight">
                {config.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatRelativeTime(entry.timestamp)}
              </p>
              {entry.metadata && (
                <p className="text-xs text-slate-600 mt-1 font-mono truncate">
                  {entry.metadata}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
