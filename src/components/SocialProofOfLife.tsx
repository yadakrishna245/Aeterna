import { useState } from "react";
import {
  Globe,
  Activity,
  Wifi,
  WifiOff,
  Shield,
  Info,
  Code,
  Briefcase,
} from "lucide-react";

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
}

export function SocialProofOfLife() {
  const [platforms] = useState<SocialPlatform[]>([
    { id: "twitter", name: "Twitter / X", icon: <Globe className="w-5 h-5" />, color: "#1da1f2", connected: false },
    { id: "instagram", name: "Instagram", icon: <Globe className="w-5 h-5" />, color: "#e1306c", connected: false },
    { id: "github", name: "GitHub", icon: <Code className="w-5 h-5" />, color: "#f0f6fc", connected: false },
    { id: "linkedin", name: "LinkedIn", icon: <Briefcase className="w-5 h-5" />, color: "#0a66c2", connected: false },
  ]);

  const [inactivityDays, setInactivityDays] = useState(30);

  const connectedCount = platforms.filter((p) => p.connected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center">
          <Activity className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Social Proof of Life</h2>
          <p className="text-xs text-slate-400">Passive heartbeat via social media activity</p>
        </div>
        <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20 font-medium">
          COMING SOON
        </span>
      </div>

      {/* OAuth Required Notice */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300 font-medium mb-1">Feature Not Yet Available</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              This feature requires OAuth integration (coming in future update).
              Once available, connecting your social accounts will allow Aeterna to passively detect activity as proof of life.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-slate-200 mb-2">How it will work</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you post or interact on connected platforms, Aeterna will automatically record a heartbeat.
              This means you won't have to manually check in — your normal social media usage will keep
              your dead man's switch alive.
            </p>
          </div>
        </div>
      </div>

      {/* Status card — honest default state */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <div>
              <p className="text-sm text-slate-300">Last social activity detected</p>
              <p className="text-lg font-semibold text-slate-500">No data — not connected</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Connected platforms</p>
            <p className="text-2xl font-bold text-slate-100">{connectedCount}/4</p>
          </div>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-gold" />
          Accounts
        </h3>
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform.id} className="flex items-center justify-between p-3 bg-navy-900/50 border border-navy-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center opacity-50" style={{ backgroundColor: platform.color + "15", color: platform.color }}>
                  {platform.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{platform.name}</p>
                  <p className="text-xs text-slate-500">Not connected</p>
                </div>
              </div>
              <button
                disabled
                className="relative w-11 h-6 rounded-full bg-navy-600 opacity-50 cursor-not-allowed"
                aria-label={`Toggle ${platform.name}`}
              >
                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-0" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-red-400" />
          Inactivity Threshold
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Consider inactive after <span className="text-gold font-semibold">{inactivityDays} days</span> of no social activity
        </p>
        <input
          type="range"
          min="3"
          max="90"
          value={inactivityDays}
          onChange={(e) => setInactivityDays(Number(e.target.value))}
          className="w-full accent-gold"
          disabled
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>3 days</span>
          <span>90 days</span>
        </div>
        <p className="text-xs text-slate-500 mt-2 italic">
          This setting will be configurable once OAuth integration is available.
        </p>
      </div>
    </div>
  );
}
