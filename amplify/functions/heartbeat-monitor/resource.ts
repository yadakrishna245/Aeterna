import { defineFunction } from "@aws-amplify/backend";

export const heartbeatMonitor = defineFunction({
  name: "heartbeat-monitor",
  schedule: "every day",
  entry: "./handler.ts",
  timeoutSeconds: 300,
  memoryMB: 256,
});
