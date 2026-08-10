import type { Handler } from "aws-lambda";
import {
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({});
const TABLE_NAME = process.env.VAULT_TABLE_NAME || "";

interface VaultRecord {
  id: string;
  owner: string;
  triggerType: "HEARTBEAT" | "SCHEDULED_DATE";
  heartbeatIntervalDays: number;
  gracePeriodDays: number;
  lastHeartbeat: string;
  scheduledTriggerDate: string | null;
  remindersSent: number;
  status: "ACTIVE" | "GRACE_PERIOD";
}

/**
 * Dead Man's Switch — Emergency Escalation System
 *
 * Runs daily via EventBridge cron schedule.
 * Scans all ACTIVE and GRACE_PERIOD vaults and applies escalation logic:
 *
 * ACTIVE + SCHEDULED_DATE: triggers if today >= scheduledTriggerDate
 * ACTIVE + HEARTBEAT: moves to GRACE_PERIOD or TRIGGERED based on elapsed days
 * GRACE_PERIOD: sends reminders (max 3) or triggers if grace period expires
 *
 * Reminder schedule during grace period:
 *   - Reminder 1: Day 1 of grace period
 *   - Reminder 2: Midpoint of grace period
 *   - Reminder 3: 1 day before trigger
 */
export const handler: Handler = async () => {
  // ADMIN FALLBACK: If a vault triggers and has 0 beneficiaries,
  // after 45 days unclaimed, notify admin at yadakrishna245@gmail.com
  // with user email, vault count, and account creation date.
  // Admin then handles per Unclaimed Estate Policy.

  console.log("🫀 Heartbeat Monitor: Starting emergency escalation check...");
  console.log(`📋 Table: ${TABLE_NAME}`);

  if (!TABLE_NAME) {
    console.error("❌ VAULT_TABLE_NAME environment variable not set.");
    return { statusCode: 500, body: "Missing table configuration" };
  }

  try {
    // Scan for all ACTIVE and GRACE_PERIOD vaults
    const scanResult = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#status = :active OR #status = :grace",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":active": { S: "ACTIVE" },
          ":grace": { S: "GRACE_PERIOD" },
        },
      })
    );

    const items = scanResult.Items || [];
    console.log(
      `📊 Found ${items.length} vault(s) to check (ACTIVE + GRACE_PERIOD).`
    );

    let triggeredCount = 0;
    let graceCount = 0;
    let reminderCount = 0;

    for (const item of items) {
      const vault: VaultRecord = {
        id: item.id?.S || "",
        owner: item.owner?.S || "",
        triggerType:
          (item.triggerType?.S as "HEARTBEAT" | "SCHEDULED_DATE") || "HEARTBEAT",
        heartbeatIntervalDays: parseInt(
          item.heartbeatIntervalDays?.N || "30",
          10
        ),
        gracePeriodDays: parseInt(item.gracePeriodDays?.N || "7", 10),
        lastHeartbeat: item.lastHeartbeat?.S || "",
        scheduledTriggerDate: item.scheduledTriggerDate?.S || null,
        remindersSent: parseInt(item.remindersSent?.N || "0", 10),
        status: (item.status?.S as "ACTIVE" | "GRACE_PERIOD") || "ACTIVE",
      };

      console.log(
        `\n  🔍 Vault ${vault.id} | Status: ${vault.status} | Type: ${vault.triggerType}`
      );

      if (vault.status === "ACTIVE") {
        // ─── ACTIVE vault processing ───────────────────────────────
        if (vault.triggerType === "SCHEDULED_DATE") {
          await processScheduledVault(vault);
          if (await wasTriggered(vault)) triggeredCount++;
        } else {
          // HEARTBEAT type
          const result = await processHeartbeatVault(vault);
          if (result === "TRIGGERED") triggeredCount++;
          else if (result === "GRACE_PERIOD") {
            graceCount++;
            reminderCount++;
          }
        }
      } else if (vault.status === "GRACE_PERIOD") {
        // ─── GRACE_PERIOD vault processing ─────────────────────────
        const result = await processGracePeriodVault(vault);
        if (result === "TRIGGERED") triggeredCount++;
        else if (result === "REMINDER_SENT") reminderCount++;
      }
    }

    const summary = {
      totalChecked: items.length,
      triggered: triggeredCount,
      movedToGrace: graceCount,
      remindersSent: reminderCount,
      timestamp: new Date().toISOString(),
    };

    console.log(`\n✅ Escalation check complete:`, JSON.stringify(summary));
    return { statusCode: 200, body: JSON.stringify(summary) };
  } catch (error) {
    console.error("❌ Heartbeat Monitor error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Heartbeat monitor failed" }),
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE vault — SCHEDULED_DATE trigger type
// ═══════════════════════════════════════════════════════════════════════════════
async function processScheduledVault(vault: VaultRecord): Promise<void> {
  if (!vault.scheduledTriggerDate) {
    console.log(
      `  ⚠️  Vault ${vault.id} is SCHEDULED_DATE type but has no scheduledTriggerDate. Skipping.`
    );
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const triggerDate = new Date(vault.scheduledTriggerDate);
  triggerDate.setHours(0, 0, 0, 0);

  if (today >= triggerDate) {
    console.log(
      `  🎯 SCHEDULED TRIGGER: Vault ${vault.id} — scheduled date ${vault.scheduledTriggerDate} has arrived.`
    );
    await updateVaultStatus(vault.id, "TRIGGERED");
    await logSendNotification(
      vault.id,
      vault.owner,
      "TRIGGER",
      "Scheduled date reached — vault has been triggered."
    );
  } else {
    const daysRemaining = Math.ceil(
      (triggerDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(
      `  ⏳ Vault ${vault.id}: ${daysRemaining} day(s) until scheduled trigger.`
    );
  }
}

async function wasTriggered(vault: VaultRecord): Promise<boolean> {
  if (!vault.scheduledTriggerDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const triggerDate = new Date(vault.scheduledTriggerDate);
  triggerDate.setHours(0, 0, 0, 0);
  return today >= triggerDate;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE vault — HEARTBEAT trigger type
// ═══════════════════════════════════════════════════════════════════════════════
async function processHeartbeatVault(
  vault: VaultRecord
): Promise<"TRIGGERED" | "GRACE_PERIOD" | "OK"> {
  const daysSinceHeartbeat = calculateDaysSince(vault.lastHeartbeat);
  const { heartbeatIntervalDays, gracePeriodDays } = vault;
  const totalDeadline = heartbeatIntervalDays + gracePeriodDays;

  console.log(
    `  📅 Days since heartbeat: ${daysSinceHeartbeat.toFixed(1)} | ` +
      `Interval: ${heartbeatIntervalDays} | Grace: ${gracePeriodDays} | ` +
      `Total deadline: ${totalDeadline}`
  );

  if (daysSinceHeartbeat > totalDeadline) {
    // Past grace period — TRIGGER immediately
    console.log(
      `  🚨 TRIGGERING vault ${vault.id} — exceeded grace period by ` +
        `${(daysSinceHeartbeat - totalDeadline).toFixed(1)} days.`
    );
    await updateVaultStatus(vault.id, "TRIGGERED");
    await logSendNotification(
      vault.id,
      vault.owner,
      "TRIGGER",
      "Owner missed heartbeat and grace period expired. Vault triggered — notifying all beneficiaries."
    );
    return "TRIGGERED";
  } else if (daysSinceHeartbeat > heartbeatIntervalDays) {
    // In grace period — move to GRACE_PERIOD status
    const daysIntoGrace = daysSinceHeartbeat - heartbeatIntervalDays;
    console.log(
      `  ⚠️  Moving vault ${vault.id} to GRACE_PERIOD — ` +
        `${daysIntoGrace.toFixed(1)} day(s) into grace period.`
    );
    await updateVaultToGracePeriod(vault.id, vault.remindersSent + 1);
    await logSendNotification(
      vault.id,
      vault.owner,
      "REMINDER",
      `Grace period started. Reminder #1 sent. ${gracePeriodDays - daysIntoGrace} days remaining before trigger.`
    );
    return "GRACE_PERIOD";
  }

  console.log(`  ✅ Vault ${vault.id}: Heartbeat OK.`);
  return "OK";
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRACE_PERIOD vault processing
// ═══════════════════════════════════════════════════════════════════════════════
async function processGracePeriodVault(
  vault: VaultRecord
): Promise<"TRIGGERED" | "REMINDER_SENT" | "OK"> {
  const daysSinceHeartbeat = calculateDaysSince(vault.lastHeartbeat);
  const { heartbeatIntervalDays, gracePeriodDays, remindersSent } = vault;
  const totalDeadline = heartbeatIntervalDays + gracePeriodDays;
  const daysIntoGrace = daysSinceHeartbeat - heartbeatIntervalDays;

  console.log(
    `  📅 Grace period: ${daysIntoGrace.toFixed(1)}/${gracePeriodDays} days | ` +
      `Reminders sent: ${remindersSent}/3`
  );

  // Check if grace period has expired
  if (daysSinceHeartbeat > totalDeadline) {
    console.log(
      `  🚨 TRIGGERING vault ${vault.id} — grace period expired.`
    );
    await updateVaultStatus(vault.id, "TRIGGERED");
    await logSendNotification(
      vault.id,
      vault.owner,
      "TRIGGER",
      "Grace period expired. Final trigger — notifying all beneficiaries."
    );
    return "TRIGGERED";
  }

  // Determine if a reminder should be sent (max 3)
  if (remindersSent >= 3) {
    console.log(
      `  ℹ️  Vault ${vault.id}: All 3 reminders already sent. Waiting for grace period to expire.`
    );
    return "OK";
  }

  const shouldSendReminder = shouldSendReminderNow(
    daysIntoGrace,
    gracePeriodDays,
    remindersSent
  );

  if (shouldSendReminder) {
    const newReminderCount = remindersSent + 1;
    console.log(
      `  📧 Sending reminder #${newReminderCount} for vault ${vault.id}.`
    );
    await incrementReminders(vault.id, newReminderCount);
    await logSendNotification(
      vault.id,
      vault.owner,
      "REMINDER",
      `Reminder #${newReminderCount} of 3. ` +
        `${(gracePeriodDays - daysIntoGrace).toFixed(1)} days remaining before vault triggers.`
    );
    return "REMINDER_SENT";
  }

  console.log(`  ⏳ Vault ${vault.id}: No reminder due today.`);
  return "OK";
}

// ═══════════════════════════════════════════════════════════════════════════════
// Reminder scheduling logic
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Reminder schedule during grace period:
 *   - Reminder 1: Day 1 of grace period (daysIntoGrace >= 1)
 *   - Reminder 2: Midpoint of grace period (daysIntoGrace >= gracePeriodDays / 2)
 *   - Reminder 3: 1 day before trigger (daysIntoGrace >= gracePeriodDays - 1)
 */
function shouldSendReminderNow(
  daysIntoGrace: number,
  gracePeriodDays: number,
  remindersSent: number
): boolean {
  const midpoint = gracePeriodDays / 2;
  const finalDay = gracePeriodDays - 1;

  switch (remindersSent) {
    case 0:
      // Reminder 1: Day 1 of grace period
      return daysIntoGrace >= 1;
    case 1:
      // Reminder 2: Midpoint of grace period
      return daysIntoGrace >= midpoint;
    case 2:
      // Reminder 3: 1 day before trigger
      return daysIntoGrace >= finalDay;
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DynamoDB update helpers
// ═══════════════════════════════════════════════════════════════════════════════
async function updateVaultStatus(
  vaultId: string,
  status: string
): Promise<void> {
  await dynamodb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { id: { S: vaultId } },
      UpdateExpression: "SET #status = :status, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":status": { S: status },
        ":now": { S: new Date().toISOString() },
      },
    })
  );
}

async function updateVaultToGracePeriod(
  vaultId: string,
  newReminderCount: number
): Promise<void> {
  await dynamodb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { id: { S: vaultId } },
      UpdateExpression:
        "SET #status = :grace, #remindersSent = :reminders, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#status": "status",
        "#remindersSent": "remindersSent",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":grace": { S: "GRACE_PERIOD" },
        ":reminders": { N: String(newReminderCount) },
        ":now": { S: new Date().toISOString() },
      },
    })
  );
}

async function incrementReminders(
  vaultId: string,
  newReminderCount: number
): Promise<void> {
  await dynamodb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { id: { S: vaultId } },
      UpdateExpression: "SET #remindersSent = :reminders, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#remindersSent": "remindersSent",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":reminders": { N: String(newReminderCount) },
        ":now": { S: new Date().toISOString() },
      },
    })
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════════════════════════════════════════
function calculateDaysSince(dateString: string): number {
  const date = new Date(dateString).getTime();
  const now = Date.now();
  return (now - date) / (1000 * 60 * 60 * 24);
}

/**
 * Stub for SES email sending — logs the notification intent.
 * In production, this would invoke the send-notification Lambda function.
 */
async function logSendNotification(
  vaultId: string,
  owner: string,
  type: "REMINDER" | "TRIGGER",
  message: string
): Promise<void> {
  const notification = {
    type,
    vaultId,
    owner,
    message,
    timestamp: new Date().toISOString(),
  };

  if (type === "TRIGGER") {
    console.log(
      `  📧 [SES STUB] FINAL TRIGGER NOTIFICATION — All beneficiaries will be notified.`
    );
    console.log(`     Payload:`, JSON.stringify(notification));
    // TODO: Invoke send-notification Lambda for each beneficiary
    // await invokeSendNotification({ recipientEmail, subject, htmlBody, textBody });
  } else {
    console.log(
      `  📧 [SES STUB] REMINDER EMAIL — Owner will be reminded to check in.`
    );
    console.log(`     Payload:`, JSON.stringify(notification));
    // TODO: Invoke send-notification Lambda for vault owner
    // await invokeSendNotification({ recipientEmail: ownerEmail, subject, htmlBody, textBody });
  }
}
