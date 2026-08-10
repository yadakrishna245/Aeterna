import { useState, useEffect, useCallback } from "react";
import { Watch, Heart, Bluetooth, Wifi, Activity, Zap } from "lucide-react";

interface SmartWatchConnectProps {
  onHeartbeatDetected?: () => void;
}

interface DeviceInfo {
  name: string;
  icon: string;
  id: string;
}

interface ConnectionState {
  connected: boolean;
  deviceName: string | null;
  lastHeartbeat: string | null;
  enabled: boolean;
  escalationDays: number;
}

const SUPPORTED_DEVICES: DeviceInfo[] = [
  { name: "Apple Watch", icon: "⌚", id: "apple-watch" },
  { name: "Google Pixel Watch", icon: "⌚", id: "pixel-watch" },
  { name: "Fitbit", icon: "⌚", id: "fitbit" },
  { name: "Samsung Galaxy Watch", icon: "⌚", id: "galaxy-watch" },
];

const STORAGE_KEY = "aeterna-smartwatch-connection";

function getStoredState(): ConnectionState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  return {
    connected: false,
    deviceName: null,
    lastHeartbeat: null,
    enabled: false,
    escalationDays: 3,
  };
}

function getDaysSinceLastSignal(lastHeartbeat: string | null): number | null {
  if (!lastHeartbeat) return null;
  const last = new Date(lastHeartbeat).getTime();
  const now = Date.now();
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}

export function SmartWatchConnect({ onHeartbeatDetected }: SmartWatchConnectProps) {
  const [state, setState] = useState<ConnectionState>(getStoredState);
  const [pairing, setPairing] = useState(false);
  const [pairingStep, setPairingStep] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Simulate periodic heartbeat detection when connected & enabled
  useEffect(() => {
    if (!state.connected || !state.enabled) return;

    const interval = setInterval(() => {
      const now = new Date().toISOString();
      setState((prev) => ({ ...prev, lastHeartbeat: now }));
      onHeartbeatDetected?.();
    }, 60000); // simulate heartbeat every 60s

    return () => clearInterval(interval);
  }, [state.connected, state.enabled, onHeartbeatDetected]);

  const handleConnect = useCallback(
    (device: DeviceInfo) => {
      setSelectedDevice(device);
      setPairing(true);
      setPairingStep(1);

      // Simulate pairing animation steps
      setTimeout(() => setPairingStep(2), 1500);
      setTimeout(() => setPairingStep(3), 3000);
      setTimeout(() => {
        const now = new Date().toISOString();
        setState((prev) => ({
          ...prev,
          connected: true,
          deviceName: device.name,
          lastHeartbeat: now,
          enabled: true,
        }));
        setPairing(false);
        setPairingStep(0);
        setSelectedDevice(null);
        onHeartbeatDetected?.();
      }, 4500);
    },
    [onHeartbeatDetected]
  );

  const handleDisconnect = () => {
    setState((prev) => ({
      ...prev,
      connected: false,
      deviceName: null,
      lastHeartbeat: null,
      enabled: false,
    }));
  };

  const toggleEnabled = () => {
    setState((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const setEscalationDays = (days: number) => {
    setState((prev) => ({ ...prev, escalationDays: days }));
  };

  const daysSinceSignal = getDaysSinceLastSignal(state.lastHeartbeat);
  const connectionHealthy = state.connected && daysSinceSignal !== null && daysSinceSignal < state.escalationDays;

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                state.connected
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-slate-700/50 border border-slate-600"
              }`}
            >
              <Watch className={`w-6 h-6 ${state.connected ? "text-emerald-400" : "text-slate-500"}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Wearable Connection</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    state.connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                  }`}
                />
                <span className={`text-sm ${state.connected ? "text-emerald-400" : "text-red-400"}`}>
                  {state.connected ? `Connected to ${state.deviceName}` : "Not Connected"}
                </span>
              </div>
            </div>
          </div>
          {state.connected && (
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Status Indicators */}
        {state.connected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-gold" />
                <span className="text-xs text-slate-400">Last Heartbeat</span>
              </div>
              <p className="text-sm font-medium text-slate-100">
                {state.lastHeartbeat
                  ? new Date(state.lastHeartbeat).toLocaleString()
                  : "No data"}
              </p>
            </div>
            <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-gold" />
                <span className="text-xs text-slate-400">Days Since Signal</span>
              </div>
              <p className="text-sm font-medium text-slate-100">
                {daysSinceSignal !== null ? `${daysSinceSignal} day${daysSinceSignal !== 1 ? "s" : ""}` : "—"}
              </p>
            </div>
            <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-gold" />
                <span className="text-xs text-slate-400">Connection Health</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${connectionHealthy ? "bg-emerald-400" : "bg-red-400"}`}
                />
                <p className={`text-sm font-medium ${connectionHealthy ? "text-emerald-400" : "text-red-400"}`}>
                  {connectionHealthy ? "Healthy" : "Needs Attention"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pairing Animation Overlay */}
      {pairing && (
        <div className="bg-navy-800 rounded-xl border border-gold/30 p-8 text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-gold/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-gold/50 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-gold/10 border border-gold flex items-center justify-center">
              <Bluetooth className="w-6 h-6 text-gold" />
            </div>
          </div>
          <p className="text-slate-100 font-medium mb-2">
            {pairingStep === 1 && "Searching for device..."}
            {pairingStep === 2 && `Found ${selectedDevice?.name}! Pairing...`}
            {pairingStep === 3 && "Establishing secure connection..."}
          </p>
          <p className="text-xs text-slate-500">
            {pairingStep === 1 && "Scanning for nearby Bluetooth devices"}
            {pairingStep === 2 && "Exchanging encryption keys"}
            {pairingStep === 3 && "Setting up heartbeat monitoring channel"}
          </p>
          <div className="mt-4 flex justify-center gap-1.5">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  pairingStep >= step ? "bg-gold" : "bg-navy-600"
                }`}
              />
            ))}
          </div>
        </div>
      )}

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
          When enabled, Aeterna monitors heartbeat data from your wearable device via the Web Bluetooth API
          (Chrome/Edge) or Health Connect API (Android). If no heartbeat signal is received within your
          configured threshold, the escalation protocol begins — just like the manual Dead Man's Switch,
          but fully automatic.
        </p>
      </div>

      {/* Supported Devices & Connect */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bluetooth className="w-5 h-5 text-gold" />
          <h3 className="text-md font-semibold text-slate-100">Supported Devices</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUPPORTED_DEVICES.map((device) => (
            <button
              key={device.id}
              onClick={() => !state.connected && !pairing && handleConnect(device)}
              disabled={state.connected || pairing}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                state.connected && state.deviceName === device.name
                  ? "bg-gold/10 border-gold/40 text-gold"
                  : state.connected || pairing
                  ? "bg-navy-900/50 border-navy-700 text-slate-600 cursor-not-allowed"
                  : "bg-navy-900/50 border-navy-700 text-slate-300 hover:border-gold/40 hover:bg-gold/5 cursor-pointer"
              }`}
            >
              <span className="text-2xl">{device.icon}</span>
              <span className="text-xs font-medium text-center">{device.name}</span>
              {state.connected && state.deviceName === device.name && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              )}
            </button>
          ))}
        </div>
        {!state.connected && !pairing && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            Click a device to begin simulated pairing. Real Bluetooth pairing requires a native companion app.
          </p>
        )}
      </div>

      {/* Configuration */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-gold" />
          <h3 className="text-md font-semibold text-slate-100">Passive Check-In Settings</h3>
        </div>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-200 font-medium">Enable Passive Check-In</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically confirm proof-of-life via wearable heartbeat data
            </p>
          </div>
          <button
            onClick={toggleEnabled}
            disabled={!state.connected}
            className={`relative w-12 h-6 rounded-full transition-all ${
              state.enabled ? "bg-gold" : "bg-navy-600"
            } ${!state.connected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            aria-label="Toggle passive check-in"
            role="switch"
            aria-checked={state.enabled}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                state.enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Escalation Days Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-200 font-medium">Escalation Threshold</p>
            <span className="text-sm font-semibold text-gold">{state.escalationDays} day{state.escalationDays !== 1 ? "s" : ""}</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Trigger escalation if no heartbeat data received for this many days
          </p>
          <input
            type="range"
            min={1}
            max={7}
            value={state.escalationDays}
            onChange={(e) => setEscalationDays(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-navy-600 accent-gold"
            disabled={!state.connected}
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
          <span className="text-slate-400 font-medium">Connection Method:</span> This feature uses the
          Web Bluetooth API (supported in Chrome, Edge, and Opera) for direct device communication, or
          the Health Connect API on Android for background health data access. Apple HealthKit integration
          requires a native iOS companion app. The current UI demonstrates the full workflow — actual
          device communication is stubbed for the web demo.
        </p>
      </div>
    </div>
  );
}
