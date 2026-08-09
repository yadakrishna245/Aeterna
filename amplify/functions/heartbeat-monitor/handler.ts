import type { Handler } from "aws-lambda";
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({});

// The table name is injected via environment variable by Amplify
const TABLE_NAME = process.env.VAULT_TABLE_NAME || "";

interface VaultRecord {
  id: string;
  owner: string;
  assetName: string;
  heirEmail: string;
  heartbeatIntervalDays: number;
  lastHeartbeat: string;
  status: string;
}

/**
 * Dead Man's Switch — Heartbeat Monitor
 *
 * Runs daily via EventBridge cron schedule.
 * Scans all ACTIVE vaults and checks if the owner has missed their heartbeat.
 * If days since last heartbeat > heartbeatIntervalDays, the vault status is
 * changed to TRIGGERED and an alert is logged (email integration as next step).
 */
export const handler: Handler = async () => {
  console.log("🫀 Heartbeat Monitor: Starting daily check...");
  console.log(`📋 Table: ${TABLE_NAME}`);

  if (!TABLE_NAME) {
    console.error("❌ VAULT_TABLE_NAME environment variable not set.");
    return {
      statusCode: 500,
      body: "Missing table configuration",
    };
  }

  try {
    // Scan for all ACTIVE vaults
    const scanResult = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#status = :active",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":active": { S: "ACTIVE" },
        },
      })
    );

    const items = scanResult.Items || [];
    console.log(`📊 Found ${items.length} active vault(s) to check.`);

    let triggeredCount = 0;

    for (const item of items) {
      const vault: VaultRecord = {
        id: item.id?.S || "",
        owner: item.owner?.S || "",
        assetName: item.assetName?.S || "",
        heirEmail: item.heirEmail?.S || "",
        heartbeatIntervalDays: parseInt(item.heartbeatIntervalDays?.N || "30", 10),
        lastHeartbeat: item.lastHeartbeat?.S || "",
        status: item.status?.S || "ACTIVE",
      };

      // Calculate days since last heartbeat
      const lastBeatDate = new Date(vault.lastHeartbeat).getTime();
      const now = Date.now();
      const daysSinceHeartbeat = (now - lastBeatDate) / (1000 * 60 * 60 * 24);

      console.log(
        `  🔍 Vault "${vault.assetName}" (${vault.id}): ` +
        `${daysSinceHeartbeat.toFixed(1)} days since last heartbeat ` +
        `(threshold: ${vault.heartbeatIntervalDays} days)`
      );

      // Check if heartbeat has expired
      if (daysSinceHeartbeat > vault.heartbeatIntervalDays) {
        console.log(
          `  ⚠️  TRIGGERING vault "${vault.assetName}" — ` +
          `owner missed heartbeat by ${(daysSinceHeartbeat - vault.heartbeatIntervalDays).toFixed(1)} days`
        );

        // Update vault status to TRIGGERED
        await dynamodb.send(
          new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: {
              id: { S: vault.id },
            },
            UpdateExpression: "SET #status = :triggered",
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":triggered": { S: "TRIGGERED" },
            },
          })
        );

        // TODO: Integrate with Amazon SES to send notification email
        // For now, log the trigger event
        console.log(
          `  📧 TRIGGER ALERT: Send email to ${vault.heirEmail} ` +
          `for asset "${vault.assetName}" owned by ${vault.owner}`
        );

        triggeredCount++;
      }
    }

    const summary = {
      totalChecked: items.length,
      triggered: triggeredCount,
      timestamp: new Date().toISOString(),
    };

    console.log(`\n✅ Heartbeat check complete:`, JSON.stringify(summary));

    return {
      statusCode: 200,
      body: JSON.stringify(summary),
    };
  } catch (error) {
    console.error("❌ Heartbeat Monitor error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Heartbeat monitor failed" }),
    };
  }
};
