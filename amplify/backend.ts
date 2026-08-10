import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { heartbeatMonitor } from "./functions/heartbeat-monitor/resource";
import { sendNotification } from "./functions/send-notification/resource";

const backend = defineBackend({
  auth,
  data,
  heartbeatMonitor,
  sendNotification,
});
