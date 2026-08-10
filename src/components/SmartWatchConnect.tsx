import { useState } from "react";
import { Watch, Heart, Bluetooth, Wifi, Activity, Zap, Info } from "lucide-react";

interface SmartWatchConnectProps {
  onHeartbeatDetected?: () => void;
}

interface DeviceInfo {
  name: string;
  icon: string;
  id: string;
}

const SUPPORTED_DEVICES: DeviceInfo[] = [
  { name: "Apple Watch", icon: "⌚", id: "apple-watch" },
  { name: "Google Pixel Watch", icon: "⌚", id: "pixel-watch" },
  { name: "Fitbit", icon: "⌚", id: "fitbit" },
  { name: "Samsung Galaxy Watch", icon: "⌚", id: "galaxy-watch" },
];

export function SmartWatchConnect({ onHeartbeatDetected: _onHeartbeatDetected }: SmartWatchConnectProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [escalationDays, setEscalationDays] = useState(3);

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-700/50 border border-slate-600">
              <Watch className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-100">Wearable Connection</h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                  BETA
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-sm text-slate-400">Not Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators — show honest defaults */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400">Last Heartbeat</span>
            </div>
            <p className="text-sm font-medium text-slate-500">No data</p>
          </div>
          <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400">Days Since Signal</span>
            </div>
            <p className="text-sm font-medium text-slate-500">N/A</p>
          </div>
          <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400">Connection Health</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <p className="text-sm font-medium text-slate-500">Offline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Device Button */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 text-center">
        <button
          onClick={() => setShowInfo(true)}
          className="btn-gold flex items-center gap-2 mx-auto text-sm"
        >
          <Bluetooth className="w-4 h-4" />
          Connect Device
        </button>
        <p className="text-xs text-slate-500 mt-3 max-w-md mx-auto">
          This feature requires a compatible smartwatch and browser with Web Bluetooth support (Chrome/Edge on Android). Coming soon for iOS.
        </p>

        {showInfo && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 text-left animate-fade-in">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Beta Feature</p>
              <p className="text-xs text-slate-400 mt-1">
                Smartwatch integration requires a compatible device and the Aeterna mobile app (coming soon).
                This feature is in beta.
              </p>
              <button
                onClick={() => setShowInfo(false)}
                className="text-xs text-slate-500 hover:text-slate-300 mt-2 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-gold" />
          <h3 className="text-md font-semibold text-slate-100">How It Works</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Your smartwatch heartbeat data acts as automatic proof of life. No button needed.
        </p>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          When available, Aeterna will monitor heartbeat data from your wearable device via the Web Bluetooth API
          (Chrome/Edge) or Health Connect API (Android). If no heartbeat signal is received within your
          configured threshold, the escalation protocol begins — just like the manual Dead Man's Switch,
          but fully automatic.
        </p>
      </div>

      {/* Supported Devices */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bluetooth className="w-5 h-5 text-gold" />
          <h3 className="text-md font-semibold text-slate-100">Supported Devices</h3>
          <span className="text-[10px] bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-600/30">
            Coming Soon
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUPPORTED_DEVICES.map((device) => (
            <div
              key={device.id}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-navy-900/50 border-navy-700 text-slate-500"
            >
              <span className="text-2xl opacity-50">{device.icon}</span>
              <span className="text-xs font-medium text-center">{device.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-gold" />
          <h3 className="text-md font-semibold text-slate-100">Passive Check-In Settings</h3>
        </div>

        {/* Enable Toggle — disabled since no device connected */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-200 font-medium">Enable Passive Check-In</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically confirm proof-of-life via wearable heartbeat data
            </p>
          </div>
          <button
            disabled
            className="relative w-12 h-6 rounded-full transition-all bg-navy-600 opacity-50 cursor-not-allowed"
            aria-label="Toggle passive check-in"
            role="switch"
            aria-checked={false}
          >
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform translate-x-0" />
          </button>
        </div>

        {/* Escalation Days Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-200 font-medium">Escalation Threshold</p>
            <span className="text-sm font-semibold text-gold">{escalationDays} day{escalationDays !== 1 ? "s" : ""}</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Trigger escalation if no heartbeat data received for this many days
          </p>
          <input
            type="range"
            min={1}
            max={7}
            value={escalationDays}
            onChange={(e) => setEscalationDays(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-navy-600 accent-gold"
            disabled
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>1 day</span>
            <span>4 days</span>
            <span>7 days</span>
          </div>
        </div>
      </div>

      {/* Connection Method Info */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700/50 p-5">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Connection Method:</span> This feature will use the
          Web Bluetooth API (supported in Chrome, Edge, and Opera) for direct device communication, or
          the Health Connect API on Android for background health data access. Apple HealthKit integration
          requires a native iOS companion app. Device pairing is not yet available — this is a planned feature.
        </p>
      </div>
    </div>
  );
}
